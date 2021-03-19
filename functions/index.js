const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require('express');
const firebase = require('firebase');
const cors = require('cors');

const firebaseConfig = {
    apiKey: "AIzaSyBIx9cMuT2QGpen69G8CS_RvUfuAhOV7Bw",
    authDomain: "socialony.firebaseapp.com",
    projectId: "socialony",
    storageBucket: "socialony.appspot.com",
    messagingSenderId: "12629594156",
    appId: "1:12629594156:web:e8fca32ef819721e608189",
    measurementId: "G-TR03GHN2HR"
};

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

admin.initializeApp();
const app = express();
firebase.initializeApp(firebaseConfig);
const db = admin.firestore();
app.use(cors(corsOptions));
app.use(express.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// ASYNC FOREACH FUNCTION 
const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}


// SIGN UP
// EMAIL, PASSWORD, USERNAME, NAME, SURNAME, PHONE
app.post('/signup', (req, res, next) => {    

    const newUser = {
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        name: req.body.name[0].toUpperCase() + req.body.name.substr(1),
        surname: req.body.surname[0].toUpperCase() + req.body.surname.substr(1),
        phone: req.body.phone,
        followersCount: 0,
        followsCount: 0,
        createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'}),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/socialony.appspot.com/o/no-img.png?alt=media&token=d7d666ee-60dd-4487-ba4b-ef76e961fe4b`
    };

    db.collection('users')
        .get()
        .then((data) => {
            data.forEach((doc) => { 
                if(doc.data().username === newUser.username){
                    return res.status(500).send("This username is already taken.");
                } else if(doc.data().phone === newUser.phone){
                    return res.status(500).send("This phone is already taken.");
                }
            })
        })
        .then(() => {
            firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            .then((data) => {
                db.collection('users')
                .doc(data.user.uid)
                .set(newUser);
                return res.status(201).json({ message: `User ${data.user.uid} signed up successfully.` });
            })
            .catch((err) => {
                return res.status(500).send(err.message);
            });
        })

   
});

// LOGIN
// EMAIL, PASSWORD
app.post('/login', (req, res, next) => {
    const userData = {};
    firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password)
    .then((data) => {
        return data.user.uid;
    })
    .then((userId) => {
        db.collection("users")
        .doc(userId)
        .get()
        .then((doc) => {
            userData.credentials = doc.data();
            userData.userId = doc.id;
            return (doc.id)
        })
        .then((userId) => {
            db.collection('follows')
            .where('followerId','==',userId)
            .get()
            .then(async(docs) =>{
                const ids = []
                for await(let doc of docs.docs){
                    ids.push(doc.data().userId)
                };
                userData.follows = ids;
            })
            .then(async() => {
                db.collection('follows')
                .where('userId','==',userId)
                .get()
                .then(async(docs) =>{
                    const ids = []
                    for await(let doc of docs.docs){
                        ids.push(doc.data().followerId)
                    };
                    userData.followers = ids;
                })
                .then(() => res.status(201).json(userData));
            })
            
        })
        .catch((err) => res.status(501).json({ error: err.message }))
    })
    .catch((err) => {
        return res.status(501).json({ error: err.message });    
    })
});

// LOGOUT
app.post('/logout', (req, res, next) => {
    firebase.auth().signOut();
    return res.status(201).json({ message: "Signed Out Succesfully!" });
})

// ADD USER DETAIL
// BIO, WEBSITE, LOCATION
app.post('/user/:userId/add-detail', (req, res, next) => {
    
    const userDetails = {
        bio: req.body.bio,
        website: req.body.website,
        location: req.body.location
    };
    
    db.collection('users').doc(req.params.userId).update(userDetails)
    .then(() => {
        return res.json({ message: "Details Added Successfully."});
    })
    .catch((err) => {
        return res.status(500).json({ error: err.message })
    })
});

// GET USER DETAILS
app.get('/user/:userId', async(req, res, next) => {

    let userData = {};

    db.collection('users').doc(req.params.userId).get()
    .then((user) => {
        userData.credentials = user.data();
        userData.userId = user.id;
    })
    .then(async() => {
        let UserPosts = [];
        await db.collection('posts').where('userId', '==', req.params.userId).get()
        .then(async(posts) => {
            await asyncForEach(posts.docs, async (post) => {
                const likesArr = [];
                const commentsArr = [];
                await db.collection('posts').doc(post.id).collection('likes').get()
                .then(async(likes) => {
                    await asyncForEach(likes.docs, async(like) => {
                        await db.collection('users').doc(like.data().userId).get()
                        .then((user) => likesArr.push({...like.data(), likeId: like.id, userData: user.data()}))
                    })
                })
                await db.collection('posts').doc(post.id).collection('comments').get()
                .then(async(comments) => {
                    await asyncForEach(comments.docs, async(comment) => {
                        commentsArr.push({...comment.data(), commentId: comment.id});
                    })
                })                    
                UserPosts.push({...post.data(),postId: post.id,likes: likesArr, comments: commentsArr})
            })
            userData.posts = UserPosts;
        })
        .then(async() => {
            await db.collection('follows').where('followerId', '==', req.params.userId).get()
            .then(async(follows) => {
                userData.credentials.followsCount = follows.size;
                userData.credentials.follows = [];
                await asyncForEach(follows.docs, async(follow) => {
                    await db.collection('users').doc(follow.data().userId).get()
                    .then((user) => userData.credentials.follows.push({ ...user.data(), userId: user.id }))
                })
            })
            await db.collection('follows').where('userId', '==', req.params.userId).get()
            .then(async(followers) => {
                userData.credentials.followersCount = followers.size
                userData.credentials.followers = [];
                await asyncForEach(followers.docs, async(follower) => {
                    await db.collection('users').doc(follower.data().followerId).get()
                    .then((user) => userData.credentials.followers.push({ ...user.data(), userId: user.id }))
                })
            })
        })
        .then(() => {
            function sortByKey(array, key) {
                return array.sort(function(a, b) {
                    var x = a[key]; var y = b[key];
                    return ((x > y) ? -1 : ((x < y) ? 1 : 0));
                });
            }
            userData.posts = sortByKey(userData.posts, "createdAt");
        })
        .then(() => res.status(201).json(userData))
    })
});

// GET USER FOLLOWS
app.get('/user/:userId/follows', (req, res, next) => {
    const userData = {}
    const userId = req.params.userId;

    db.collection("users")
    .doc(userId)
    .get()
    .then((doc) => {
        userData.credentials = doc.data();
        userData.userId = doc.id;
        return (doc.id)
    })
    .then((userId) => {
        db.collection('follows')
        .where('followerId','==',userId)
        .get()
        .then(async(docs) =>{
            const ids = []
            for await(let doc of docs.docs){
                ids.push(doc.data().userId)
            };
            userData.follows = ids;
        })
        .then(async() => {
            db.collection('follows')
            .where('userId','==',userId)
            .get()
            .then(async(docs) =>{
                const ids = []
                for await(let doc of docs.docs){
                    ids.push(doc.data().followerId)
                };
                userData.followers = ids;
            })
            .then(() => res.status(201).json(userData));
        })
        
    })
    .catch((err) => res.status(501).json({ error: err.message }))
})

// GET FOLLOWED USERS POSTS
app.get('/user/:userId/home', async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader("Access-Control-Allow-Origin", "*");
    const userIds = [];
    const UserPosts = [];
    userIds.push(req.params.userId);

    db.collection('follows')
    .where('followerId','==', req.params.userId)
    .get()
    .then((users) => users.forEach((user) => userIds.push(user.data().userId)))
    .then(async() => {
        await asyncForEach(userIds, async(userId) => {
            await db.collection('posts').where('userId','==',userId).get()
            .then(async(posts) => {
                await asyncForEach(posts.docs, async (post) => {
                    const likesArr = [];
                    const commentsArr = [];
                    await db.collection('posts').doc(post.id).collection('likes').get()
                    .then(async(likes) => {
                        await asyncForEach(likes.docs, async(like) => { 
                            await db.collection('users').doc(like.data().userId).get()
                            .then((user) => likesArr.push({...like.data(), likeId: like.id, userData: user.data()}))                         
                        })
                    })
                    await db.collection('posts').doc(post.id).collection('comments').get()
                    .then(async(comments) => {
                        await asyncForEach(comments.docs, async(comment) => {
                            commentsArr.push({...comment.data(), commentId: comment.id});
                        })
                    })                    
                    UserPosts.push({...post.data(),postId: post.id,likes: likesArr, comments: commentsArr})
                })
            })
        })
    })
    .then(() => {
        function sortByKey(array, key) {
            return array.sort(function(a, b) {
                var x = a[key]; var y = b[key];
                return ((x > y) ? -1 : ((x < y) ? 1 : 0));
            });
        }
        res.status(201).json(sortByKey(UserPosts, 'createdAt'));
    })
    .catch((err) => res.status(400).json({ error: err.message }));

})

// FOLLOW A USER
// FOLLOWERID
app.post('/user/:userId/follow', (req, res, next) => {   
    db.collection('follows')
        .where('followerId','==',req.body.followerId)
        .where('userId', '==', req.params.userId)
        .get()
        .then((docs) => {
            if(!docs.empty) return res.status(500).json({ error: "This User Already Followed!" });
            const newFollowing = {
                followerId: req.body.followerId,
                userId: req.params.userId,
                createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'})
            }
            db.collection('follows')
                .add(newFollowing)
                .then(() => res.json({ message: "User Successfully Followed!" }));
        })
        .catch((err) => res.json({ error: err.message }))
})

// UNFOLLOW A USER
// FOLLOWERID
app.post('/user/:userId/unfollow', (req, res, next) => {
    db.collection('follows')
    .where('followerId','==',req.body.followerId)
    .where('userId','==', req.params.userId)
    .get()
    .then((docs) => {
        if(docs.empty) return res.status(500).json({ error: "This User Not Following!" })
        let id;
        docs.forEach((doc) => id = doc.id);
        db.collection('follows')
        .doc(id)
        .delete()
        .then(() => res.status(201).json({ message: "User Unfollowed!" }))
        .catch((err) => res.status(500).json({ error: err.message }))
    })
    .catch((err) => res.status(500).json({ error: err.message }))
})

// POST USER IMAGE
app.post('/user/:userId/image', (req, res, next) => {

    
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
    const { v4: uuidV4 } = require('uuid');

  
    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};
    let generatedToken = uuidV4();

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
          return res.status(400).json({ error: "Wrong file type submitted" });
        }
        const imageExtension = filename.split(".")[filename.split(".").length - 1];
        imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath));
      });

    busboy.on('finish', () => {
        admin.storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype,
                    firebaseStorageDownloadTokens: generatedToken,
                },
            },
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
            db.collection('users').doc(req.params.userId).update({ imageUrl });
            return imageUrl;
        })
        .then(async(imageUrl) => {
            await db.collection('posts').where('userId','==', req.params.userId).get()
            .then(async(posts) => {
                await asyncForEach(posts.docs, async(post) => {
                    db.collection('posts').doc(post.id).update({ imageUrl })
                })
            })
            return imageUrl;
        })
        .then(async(imageUrl) => {
            await db.collection('posts').get()
            .then(async(posts) => {
                await asyncForEach(posts.docs, async(post) => {
                    await db.collection('posts').doc(post.id).collection('comments').where('userId','==',req.params.userId).get()
                    .then(async(comments) => {
                        await asyncForEach(comments.docs,(comment) => {
                            db.collection('posts').doc(post.id).collection('comments').doc(comment.id).update({ imageUrl })
                        })
                    })
                })
            })
            return imageUrl
        })
        .then(async(imageUrl) => {
            await db.collection('notifications').where('senderId','==',req.params.userId).get()
            .then(async(items) => {
                asyncForEach(items.docs, (item) => db.collection('notifications').doc(item.id).update({ imageUrl }))
            })
        })
        .then((imageUrl) => {
            return res.json({ message: "Image Uploaded Succesfully.", imageUrl });
        })
        .catch((err) => {
            return res.status(500).json({ error: err.message });
        })
    })
    
    busboy.end(req.rawBody);  
});

// CREATE A POST
// USERID, CONTENT
app.post('/post', (req, res, next) => {

    if(req.method !== "POST"){
        return res.status(400).json({ error: "Method not allowed." });
    } else {
        db.collection('users')
            .doc(req.body.userId)
            .get()
            .then((doc) => {
                const newPost = {
                    content: req.body.content,
                    userId: req.body.userId,
                    createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'}),
                    likesCount: 0,
                    commentsCount: 0,
                    imageUrl: doc.data().imageUrl,
                    name: doc.data().name,
                    surname: doc.data().surname,
                };
                db.collection('posts')
                .add(newPost)
                .then(() => res.json({ message: "Post Succesfully Created." }));
            })
            .catch((err) => {
                return res.json(err);
            })
    }
});

// GET A POST
app.get('/post/:postId', (req, res, next ) => {

    let postData = {};
    const selectedPost = db.collection('posts').doc(req.params.postId);

    selectedPost
    .get()
    .then(async (doc) => {
        if(!doc.exists) return res.status(404).json({ error: "Post not found." });
        
        postData = doc.data();
        postData.postId = doc.id;
        postData.likes = [];
        await selectedPost.collection('likes').get()
        .then(async(likes) => {
            await asyncForEach(likes.docs, async(like) => {
                await db.collection('users').doc(like.data().userId).get()
                .then((user) => postData.likes.push({ ...like.data(), likedId: like.id, userData: user.data() }))
            })
        });
        postData.comments = [];
        await selectedPost.collection('comments').get()
        .then(async(comments) => {
            await asyncForEach(comments.docs, (comment) => postData.comments.push(comment.data()))
        });      
    })
    .then(() => res.status(201).json(postData))
    .catch((err) => res.status(500).json({ message: err.message }))
});

// DELETE A POST
app.delete('/post/:postId', (req, res, next) => {
    db.collection('posts')
    .doc(req.params.postId)
    .delete()
    .then(() => res.json({ message: "Post Deleted!" }))
    .catch((err) => res.json({ error: err.message })); 
})

// LIKE A POST
// userId
app.post('/post/:postId/like', (req, res, next) => {

    const selectedPost = db.collection('posts').doc(req.params.postId);

    selectedPost
    .collection('likes')
    .where('userId','==', req.body.userId)
    .get()
    .then((items) => {
        if(!items.empty) res.status(400).json({ message: "Post Already Liked!" })
        else {
            const newLike = {
                createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'}),
                userId: req.body.userId
            }
            selectedPost
            .collection('likes')
            .add(newLike)
            .then(() => {
                selectedPost.get()
                .then((doc) => doc.data().likesCount + 1)
                .then((likesCount) => {
                    selectedPost.update({ likesCount })
                })
                .then(() => res.json({ message: "Post Liked!" }))
            })
            .catch((err) => res.json({ error: err.message }));
        }
    })
});

// UNLIKE A POST
// userId
app.post('/post/:postId/unlike',(req, res, next) => {
    const selectedPost = db.collection('posts').doc(req.params.postId);

    selectedPost
    .collection('likes')
    .where('userId','==', req.body.userId)
    .get()
    .then((items) => {
        if(items.empty) res.status(400).json({ message: "Post Already Not Liked!" })
        else {
            let id;
            items.forEach((item) => {
                id = item.id;
            })
            selectedPost
            .collection('likes')
            .doc(id)
            .delete()
            .then(
                selectedPost.get().then((doc) => doc.data().likesCount -1)
                .then((likesCount) => {
                    selectedPost.update({ likesCount })
                })
                .then(() => res.status(201).json({ message: "Post Unliked!" }))
                .catch((err) => res.status(400).json({ err: err.message }))
            )
        }
    })
    .catch((err) => res.json({ err: err.message }))
});

// POST A COMMENT TO A POST
// userId, content
app.post('/post/:postId/comment', (req, res, next) => {

    const newComment = {
        userId: req.body.userId,
        createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'}),
        content: req.body.content
    };


    db.collection('users').doc(req.body.userId).get()
    .then((doc) => {
        newComment.name = doc.data().name;
        newComment.surname = doc.data().surname;
        newComment.imageUrl = doc.data().imageUrl
    }).then(() => {

        const selectedPost = db.collection('posts').doc(req.params.postId);

        selectedPost
        .collection('comments')
        .add(newComment)
        .then(() => {
            selectedPost.get()
            .then((doc) => doc.data().commentsCount + 1)
            .then((commentsCount) => {
                selectedPost.update({ commentsCount })
            })
            .then(() => res.json({ message: "Comment Posted!" }))
            .catch((err) => res.status(400).json({ error: err.message }));
        })
        .catch((err) => res.json({ error: err.message }));
    })
    

    

});

// GET NOTIFICATION
// userId
app.get('/notifications/:userId', (req, res, next) => {
    const notificationsArr = [];
    db.collection('notifications').where('recieverId','==',req.params.userId).orderBy('createdAt','desc').get()
    .then((notifications) => {
        notifications.forEach((notification) => notificationsArr.push(notification.data()))
    })
    .then(() => res.status(201).json(notificationsArr))
    .catch((err) => res.status(400).json({ error: err.message }));    
})

// MARK NOTIFICATION AS READ
// notifications[]
app.post('/notifications', async(req, res, next) => {
    await req.body.triggerIds.forEach((id) => {
        db.collection('notifications').doc(id).update({ read: "True"})
    })
    return res.status(201).json({ message: "Notifications Are Marked as Read!" });
})

// Search user
app.get('/search/:key', (req, res, next) => {

    const results = [];
    db
    .collection('users')
    .where('name','>=', req.params.key[0].toUpperCase() + req.params.key.substr(1))
    .where('name', '<=', req.params.key[0].toUpperCase() + req.params.key.substr(1) + '\uf8ff')
    .limit(5)
    .get()
    .then((docs) => {
        docs.forEach((doc) => {
            results.push({id: doc.id, name: doc.data().name, surname: doc.data().surname, imageUrl: doc.data().imageUrl });
        })
    })
    .then(() => res.json(results))
    .catch((err) => res.status(500).json({ error: err.message }))
})

// GET MESSAGEBOX
app.get('/chat/:userId', (req, res, next) => {

    const messagesArr = [];
    db.collection('chat')
    .where('users','array-contains', req.params.userId)
    .orderBy('lastMessageTime','desc')
    .get()
    .then(async(docs) => {
        await asyncForEach(docs.docs, async(doc) => {
            const chatArr = {};
            chatArr.messages = []
            await db.collection(`chat/${doc.id}/messages`)
            .orderBy('createdAt','asc')
            .get()
            .then((messages) => {
                asyncForEach(messages.docs, (message) => {
                    chatArr.messages.push(message.data())
                })
            })
            let otherId;
            await db.collection('chat').doc(doc.id).get()
            .then((doc) => otherId = doc.data().users.filter((id) => id !== req.params.userId))
            .then(async () => {
                await db.collection('users').doc(otherId[0]).get()
                .then((doc) => {
                    chatArr.name = doc.data().name;
                    chatArr.imageUrl = doc.data().imageUrl;
                    chatArr.id = doc.id;
                })
            })
            .then(() => messagesArr.push(chatArr))
            
        })
    })
    .then(() => res.json(messagesArr))
})

// SEND A MESSAGE
// SENDERID, RECIEVERID, CONTENT
app.post('/chat/message', (req, res, next) => {
    const list = [[req.body.senderId, req.body.recieverId],[req.body.recieverId, req.body.senderId]]
    db.collection('chat')
    .where('users', '==', list[1])
    .get()
    .then((chats) => {
        if(chats.empty) {   
            db.collection('chat')
            .where('users', '==', list[0])
            .get()
            .then((chats2) => {
                if(chats2.empty) {
                    const newChat = {
                        lastMessageTime: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'}),
                        users: [req.body.senderId, req.body.recieverId]
                    }
                    let id;
                    db.collection('chat').add(newChat).then((doc) => id = doc.id);
                    db.collection('users').doc(req.body.senderId).get()
                    .then((doc) => {
                        const newMessage = {
                            name: doc.data().name,
                            imageUrl: doc.data().imageUrl,
                            content: req.body.content,
                            sender: doc.id,
                            createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'})
                        }
                        return newMessage
                    })
                    .then((newMessage) => {
                        db.collection('chat').doc(id).collection('messages').add(newMessage);
                    })
                    .then(() => res.json({ message: "Message Sent!" }))
                } else {
                    chats2.forEach((chat) => {
                        db.collection('users').doc(req.body.senderId).get()
                        .then((doc) => {
                            const newMessage = {
                                name: doc.data().name,
                                imageUrl: doc.data().imageUrl,
                                content: req.body.content,
                                sender: doc.id,
                                createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'})
                            }
                            return newMessage;
                        })
                        .then((newMessage) => {
                            db.collection('chat').doc(chat.id.toString()).collection('messages').add(newMessage);
                            db.collection('chat').doc(chat.id.toString()).update({ lastMessageTime: newMessage.createdAt })
                        })
                        .then(() => res.json({ message: "Message Sent!" }))
                    })
                }
            })
        } else {
            chats.forEach((chat) => {
                db.collection('users').doc(req.body.senderId).get()
                .then((doc) => {
                    const newMessage = {
                        name: doc.data().name,
                        imageUrl: doc.data().imageUrl,
                        content: req.body.content,
                        sender: doc.id,
                        createdAt: new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'})
                    }
                    return newMessage;
                })
                .then((newMessage) => {
                    db.collection('chat').doc(chat.id.toString()).collection('messages').add(newMessage);
                    db.collection('chat').doc(chat.id.toString()).update({ lastMessageTime: newMessage.createdAt })
                })
                .then(() => res.json({ message: "Message Sent!" }))
            })
        }
    })
})

//GET MESSAGE NOTIFICATIONS
app.get('/chat/notifications/:userId', (req, res, next) => {
    const notifications = [];
    db.collection('chatnotifications').where('recieverId','==', req.params.userId).where('read','==','False').get()
    .then(async (items) => {
        await asyncForEach(items.docs, async(item) => {
            notifications.push(item.data());
        })
    })
    .then(() => res.status(201).json(notifications))
    .catch((err) => res.status(400).json(err));
})

// MARK MESSAGE NOTIFICATIONS AS READ
// triggerIds[]
app.post('/chat/notifications', async(req, res, next) => {
    console.log(req.body.triggerIds);
    if(req.body.triggerIds){
        await asyncForEach(req.body.triggerIds, async(id) => {
            await db.collection('chatnotifications').doc(id).update({ read: "True"})
        })
        return res.status(201).send("Messages Succesfully Marked as Read");
    }
    return res.status(500).send("No Trigger Id");
})



exports.api = functions.https.onRequest(app);


// DATABASE TRIGGERS FOR NOTIFICATIONS

exports.createMessageNotification = functions.firestore.document('chat/{chatId}/messages/{id}')
.onCreate(async (snapshot, context) => {
    let chatNotification = {};
    chatNotification.type = "Message";
    chatNotification.createadAt = new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'});
    chatNotification.read = "False";
    chatNotification.triggerId = snapshot.id;
    chatNotification.senderId = snapshot.data().sender;

    await db.collection('chat').doc(context.params.chatId).get()
    .then((chat) => {
        if(chat.data().users[0] === chatNotification.senderId) chatNotification.recieverId = chat.data().users[1]
        else chatNotification.recieverId = chat.data().users[0]
        })
    

    return db.doc(`/chatnotifications/${snapshot.id}`).set(chatNotification)
    .catch((err) => console.log(err));
})

exports.createLikeNotifications = functions.firestore.document('posts/{postId}/likes/{likeId}')
.onCreate(async (snapshot, context) => {
    let likeNotification = {};
    likeNotification.type = "Like";
    likeNotification.createdAt = new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'})
    likeNotification.read = "False";
    likeNotification.triggerId = snapshot.id;
    likeNotification.postId = context.params.postId;
    
    await db.collection('posts').doc(context.params.postId).get()
    .then((post) => likeNotification.recieverId = post.data().userId);
    await db.collection('posts').doc(context.params.postId).collection('likes').doc(context.params.likeId).get()
    .then((like) => likeNotification.senderId = like.data().userId );
    await db.collection('users').doc(likeNotification.senderId).get()
    .then((user) => {
        likeNotification.name = user.data().name;
        likeNotification.surname = user.data().surname;
        likeNotification.imageUrl = user.data().imageUrl;    
    })
    if(likeNotification.recieverId === likeNotification.senderId) {
        return
    } else {
        return db.doc(`/notifications/${snapshot.id}`).set(likeNotification)
        .catch((err) => console.log(err));
    }
})

exports.deleteLikeNotification = functions.firestore.document('posts/{postId}/likes/{likeId}')
.onDelete((snapshot) => {
    db.collection('notifications')
        .doc(snapshot.id)
        .delete()
        .then(() => { return; })
        .catch((err) => console.log(err));
})

exports.createCommentNotifications = functions.firestore.document('posts/{postId}/comments/{commentId}')
.onCreate(async (snapshot, context) => {
    let commentNotification = {};
    commentNotification.type = "Comment";
    commentNotification.createdAt = new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'})
    commentNotification.read = "False";
    commentNotification.triggerId = snapshot.id;
    commentNotification.postId = context.params.postId;

    await db.collection('posts').doc(context.params.postId).get()
    .then((post) => commentNotification.recieverId = post.data().userId);  
    await db.collection('posts').doc(context.params.postId).collection('comments').doc(context.params.commentId).get()
    .then((comment) => commentNotification.senderId = comment.data().userId );
    await db.collection('users').doc(commentNotification.senderId).get()
    .then((user) => {
        commentNotification.name = user.data().name;
        commentNotification.surname = user.data().surname;
        commentNotification.imageUrl = user.data().imageUrl;    
    })
    
    if(commentNotification.recieverId === commentNotification.senderId) {
        return
    } else {
        return db.doc(`/notifications/${snapshot.id}`).set(commentNotification)
        .catch((err) => console.log(err));
    }    
})

exports.deleteCommentNotification = functions.firestore.document('posts/{postId}/comments/{commentId}')
.onDelete((snapshot) => {
    db.collection('notifications')
        .doc(snapshot.id)
        .delete()
        .then(() => { return; })
        .catch((err) => console.log(err));
})

exports.createFollowNotification = functions.firestore.document('follows/{id}')
.onCreate(async (snapshot) => {
    let followNotification = {};
    followNotification.type = "Follow";
    followNotification.createdAt = new Date().toLocaleString('tr-TR', {timeZone:'Europe/Istanbul'});
    followNotification.read = "False";
    followNotification.triggerId = snapshot.id;

    await db.collection('follows').doc(snapshot.id).get()
    .then((follow) => {
        followNotification.recieverId = follow.data().userId;
        followNotification.senderId = follow.data().followerId;
    })
    await db.collection('users').doc(followNotification.senderId).get()
    .then((user) => {
        followNotification.name = user.data().name;
        followNotification.surname = user.data().surname;
        followNotification.imageUrl = user.data().imageUrl;    
    })

    if(followNotification.recieverId === followNotification.senderId) {
        return
    } else {
        return db.doc(`/notifications/${snapshot.id}`).set(followNotification)
        .catch((err) => console.log(err))
    }        
})

exports.deleteFollowNotification = functions.firestore.document('follows/{id}')
.onDelete((snapshot) => {
    db.collection('notifications')
        .doc(snapshot.id)
        .delete()
        .then(() => { return; })
        .catch((err) => console.log(err));
})