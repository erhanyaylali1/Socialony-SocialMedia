import React,{ useState, useEffect } from 'react';
import { Grid, Typography, Button, CircularProgress, List, ListItem, ListItemText, Avatar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter, Link } from 'react-router-dom';
import Post from './Post';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { getIsLogged, getUser, setImageUrl, setUpdatedUser } from '../features/userSlice';
import { getRefresh, setActiveChatIndex, refresh as setRefresh } from '../features/status';
import { message, Input } from 'antd';
import EditIcon from '@material-ui/icons/Edit';
import { Modal, Button as Btn, Icon } from 'semantic-ui-react';


const User = (props) => {

    const classes = useStyle();
    const dispatch = useDispatch();
    const isLogged = useSelector(getIsLogged);
    const loggedUser = useSelector(getUser);
    const refresh = useSelector(getRefresh);
    const [user, setUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [open, setOpen] = useState(false);
    const [openFollowsModal, setOpenFollowsModal] = useState(false);
    const [openFollowersModal, setOpenFollowersModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 
    
    const profileId = props.match.params.userId
    const isUserFollow = loggedUser?.follows?.includes(profileId) ? true:false;
    const isFollowBack = loggedUser?.followers?.includes(profileId) ? true:false;
    const isOwn = loggedUser?.userId === profileId ? true:false;


    useEffect(() => {
        axios({
            method: 'get',
            url: `https://us-central1-socialony.cloudfunctions.net/api/user/${profileId}`,
        }).then((res) => setUser(res.data))
        .then(() => setIsLoading(false))
        .catch((err) => console.log(err))
    },[profileId, refresh]);

    const RenderPosts = () => {
        if(user) {
            return user.posts.map((post, index) => (
                <Post 
                    key={index}
                    user={user?.credentials}
                    post={post}
                />
            ))
        }
    }

    const followUser = () => {
        const key = 'updatable';
        message.loading({ content: 'Following...', key });
        const url = `https://us-central1-socialony.cloudfunctions.net/api/user/${profileId}/${isUserFollow ? 'unfollow':'follow'}`;
        axios({
            method: 'post',
            url,
            data: {
                followerId: loggedUser.userId
            }
        })
        .then(() => {
            message.success({ content: `User ${!isUserFollow ? 'Followed!':'Unfollowed!'}`, key, duration: 2 });
        })
        .then(() => {
            axios({
                method: 'get',
                url: `https://us-central1-socialony.cloudfunctions.net/api/user/${loggedUser.userId}/follows`,
            })
            .then((newUser) => dispatch(setUpdatedUser(newUser.data)))
            .then(() => dispatch(setRefresh()))
        })
        .catch((err) => console.log(err));
    }

    const sendNewMessage = () => {
        const key = 'updatable';
        message.loading({ content: 'Sending...', key });
        axios({
            method: 'post',
            url: `https://us-central1-socialony.cloudfunctions.net/api/chat/message`,
            data: {
                senderId: loggedUser.userId,
                recieverId: profileId,
                content: newMessage
            }
        }).then(() => {     
            message.success({ content: `Message Sent!'`, key, duration: 2 });
        })
        .then(() => {       
            dispatch(setActiveChatIndex(0));
            setOpen(false);
            setNewMessage('');  
        })
        .then((() => {
            props.history.push('/messages');
        }))
        .catch((err) => {
            axios({
                method: 'post',
                url: `https://us-central1-socialony.cloudfunctions.net/api/chat/message`,
                data: {
                    senderId: loggedUser.userId,
                    recieverId: profileId,
                    content: newMessage
                }
            })
            .then(() => message.success({ content: `Message Sent!'`, key, duration: 2 }))
            .then(() => {       
                dispatch(setActiveChatIndex(0));
                setOpen(false);
                setNewMessage('');  
            })
            .then((() => {
                props.history.push('/messages');
            }))
            .catch((err) => console.log(err));
        });
    }

    const imageUpload = (e) => {
        const key = 'updatable';
        message.loading({ content: 'Image Uploading...', key });
        const image = e.target.files[0];
        const formData = new FormData();
        formData.append('image', image, image.name)
        axios.post(`https://us-central1-socialony.cloudfunctions.net/api/user/${profileId}/image`,formData)
        .then((respond) => {
            message.success({ content: 'Image Uploaded!', key, duration: 2 });
            dispatch(setImageUrl(respond.data.imageUrl));
            dispatch(setRefresh());
        })
        .catch((e) => {
            console.log(e);
            message.error({ content: 'Image Could Not Uploaded!', key, duration: 2 });
        });
    }

    const renderButtons = () => {
        if(!isLogged){
            
        } else {
            if(loggedUser.userId === profileId) {
                return <React.Fragment></React.Fragment>
            }
            return (
                <React.Fragment>
                    <Grid item xs={6} className={classes.buttongrid} onClick={followUser}>
                        <Button variant="contained" color="primary">{!isUserFollow ? 'Follow':'Unfollow'}</Button>
                    </Grid>
                    <Grid item xs={6} className={classes.buttongrid}>
                        <Modal
                            onClose={() => setOpen(false)}
                            onOpen={() => setOpen(true)}
                            open={open}
                            trigger={<Button variant="contained" color="primary">Message</Button>}
                        >
                            <Modal.Header>Send a new Message</Modal.Header>
                            <Modal.Content image>
                                <Input 
                                    placeholder="New Message"
                                    value={newMessage}
                                    onInput={(e) => setNewMessage(e.target.value)}
                                />
                            </Modal.Content>
                            <Modal.Actions>
                                <Btn color='black' onClick={() => setOpen(false)}>
                                    Back
                                </Btn>
                                <Btn
                                    onClick={sendNewMessage}
                                    positive
                                >
                                    Send
                                </Btn>
                            </Modal.Actions>
                        </Modal>
                    </Grid>	
                </React.Fragment>
            )
        } 
    }

    const renderFollows = () => {
        if(user) {
            return user.credentials.follows.map((follow, index) => {
                return (
                    <Grid item container xs={12} lg={6} key={index} onClick={() => setOpenFollowsModal(false)}>
                        <Link to={`/user/${follow.userId}`} className={classes.modalitem}>
                            <ListItem button>
                                <Avatar 
                                    src={follow.imageUrl}
                                />
                                <ListItemText className={classes.followsName}>
                                    {follow.name} {follow.surname}
                                </ListItemText>
                            </ListItem>
                        </Link>
                    </Grid>
                )
            })
        }
    }

    const renderFollowers = () => {
        if(user) {
            return user.credentials.followers.map((follow, index) => {
                return (
                    <Grid item container xs={12} lg={6} key={index} onClick={() => setOpenFollowersModal(false)}>
                        <Link to={`/user/${follow.userId}`} className={classes.modalitem}>
                            <ListItem button>
                                <Avatar 
                                    src={follow.imageUrl}
                                />
                                <ListItemText className={classes.followsName}>
                                    {follow.name} {follow.surname}
                                </ListItemText>
                            </ListItem>
                        </Link>
                    </Grid>
                )
            })
        }
    }

    return (
        <Grid container className={classes.root}>
            <Grid item xs={1} lg={2} />
            <Grid item xs={10} lg={8}>
                <Grid container className={classes.pageheader} alignItems="center" spacing={2}>
                    <Grid item xs={12} lg={2} className={classes.leftheader}>
                        <img 
                            className={classes.profilepicture}
                            src={user?.credentials.imageUrl}
                            alt="pp"
                        />
                        {isOwn && (
                            <React.Fragment>
                                <input type="file" id="imageInput" onChange={imageUpload} hidden="hidden"/>
                                <EditIcon className={classes.editpp} onClick={() => document.getElementById('imageInput').click()} />
                            </React.Fragment>
                        )}
                        
                    </Grid>
                    <Grid item container xs={12} lg={4} justify="center" alignItems="center" direction="column">
                        <Typography variant="body1" align="center" className={classes.name}>
                            {user?.credentials.name} {user?.credentials.surname}
                        </Typography> 
                        <Typography variant="subtitle1" className={classes.isFollows}>
                            {isFollowBack && 'Follows You'}
                        </Typography>
                    </Grid>
                    <Grid item container justify="center" alignItems="center" xs={12} lg={6} spacing={2}>
                        <Grid item xs={4} lg={2} className={classes.followdiv}>
                            <Modal
                                open={openFollowsModal}
                                onClose={() => setOpenFollowsModal(false)}
                                onOpen={() => setOpenFollowsModal(true)}
                                trigger={<p className={classes.stats}>{user?.credentials.followsCount}</p>}
                            >
                                <Modal.Header className={classes.modalheader}>
                                    {user?.credentials.name} {user?.credentials.surname}'s Follows
                                    <Icon className="close" onClick={() => setOpenFollowsModal(false)}/>
                                </Modal.Header>
                                <Modal.Content image scrolling> 
                                    <List style={{ width: "100%" }}>
                                        <Grid container>
                                            {renderFollows()}
                                        </Grid>
                                    </List>
                                </Modal.Content>
                            </Modal>
                            
                            <p className={classes.label}>Follows</p>
                        </Grid>
                        <Grid item xs={4} lg={2}>
                            <Modal
                                open={openFollowersModal}
                                onClose={() => setOpenFollowersModal(false)}
                                onOpen={() => setOpenFollowersModal(true)}
                                trigger={<p className={classes.stats}>{user?.credentials.followersCount}</p>}
                            >
                                <Modal.Header className={classes.modalheader}>
                                    {user?.credentials.name} {user?.credentials.surname}'s Followers
                                    <Icon className="close" onClick={() => setOpenFollowersModal(false)}/>
                                </Modal.Header>
                                <Modal.Content image scrolling> 
                                    <List style={{ width: "100%" }}>
                                        <Grid container>
                                            {renderFollowers()}
                                        </Grid>
                                    </List>
                                </Modal.Content>
                            </Modal>
                            <p className={classes.label}>Followers</p>
                        </Grid>
                        <Grid item xs={4} lg={2}>
                            <p className={classes.stats}>{user?.posts.length}</p>
                            <p className={classes.label}>Posts</p>
                        </Grid>
                        <Grid item container xs={12} lg={6} spacing={2}>
                            {renderButtons()}
                        </Grid>
                        
                    </Grid>
                </Grid>
                <Grid container justify="center">
                    <Grid item container lg={8}>
                        <Grid item container xs={12} justify="center" style={{ display: isLoading ? 'flex':'none'}}>
							<CircularProgress />
						</Grid>
                        {RenderPosts()}
                    </Grid>					
                </Grid>
            </Grid>
            <Grid item xs={1} lg={2} />
        </Grid>
    )
}

export default withRouter(User);

const useStyle = makeStyles((theme) => ({
    root: {
        paddingTop: "90px",
        paddingBottom: "60px"
    },
    pageheader: {
        padding: "15px",
        backgroundColor: "#333",
        borderRadius: "5px",
        marginBottom: "50px"
    },
    leftheader: {
        position: "relative",
        height: "max-content",
        marginBottom: "20px",
    },
    profilepicture: {
        width: "110px",
        height: "110px",
        position: "absolute",
        bottom: "-100%",
        left: "0",
        right: "0",
        marginLeft: "auto",
        marginRight: "auto", 
        objectFit: "cover",
        objectPosition: "center center",
        borderRadius: "50%",
        border: "2px solid #fff",
        backgroundColor: "white"
    },
    name: {
        fontSize: "2rem !important",
        fontFamily: "Lato,'Helvetica Neue',Arial,Helvetica,sans-serif",
        fontWeight: "bolder",
        color: "#fff",
        marginLeft: '10px'
    },
    stats: {
        fontSize: "1.5rem !important",
        fontFamily: "Lato,'Helvetica Neue',Arial,Helvetica,sans-serif",
        fontWeight: "400",
        marginBottom: "0 !important",
        textAlign: "center",
        color: "#fff",
        cursor: "pointer"
    },
    label: {
        fontSize: "1rem",
        fontFamily: "Lato,'Helvetica Neue',Arial,Helvetica,sans-serif",
        fontWeight: "700",
        textAlign: "center",
        color: "#fff"
    },
    buttongrid: {
        display: "grid"
    },
    isFollows: {
        color: "whitesmoke"
    },
    editpp: {
        position: "absolute",
        color: "white",
        right: "0",
        cursor: "pointer"
    },
    followsName: {
        marginLeft: "20px",
        "& span" : {
            fontSize: "1.3rem",
        }
    },
    modalitem: {
        width: "100%",
        color: "black"
    },
    modalheader: {
        padding: "15px 20px !important",
        display: "flex !important",
        alignItems: "center",
        "& i": {
            marginLeft: "auto",
            cursor: "pointer"
        }
    }
    
}))