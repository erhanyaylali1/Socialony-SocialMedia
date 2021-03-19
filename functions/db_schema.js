export const db = {

    users: [
        {
            email: '',
            username: '',
            name: '',
            surname: '',
            phone: '',
            password: '',
            createdAt: '',
            imageUrl: '',
            bio : '',
            location : '',
            website : ''
        },
    ],

    posts: [
        {
            content: '',
            createdAt: '',
            likesCount: '',
            commentsCount: '',
            userId: '',
            name: '',
            surname: '',
            likes: [

            ],
            comments: [

            ]
        }
    ],

    follows: [
        {
            createdAt: '',
            followerId: '',
            userId: '',
        }
    ],

    notifications: [
        {
            reciepent: '',
            sender: '',
            read: 'true | false',
            postId: '',
            type: 'like | comment | follow',
            createdAt: '',
            userId: '',
            name: '',
            surname: '',
            imageUrl: ''
        }
    ],


}

