import React, { useState, useRef, useEffect } from 'react';
import { Grid, Typography, Card, CardActions, CardHeader, CardContent, Avatar, IconButton, } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import FavoriteIcon from '@material-ui/icons/Favorite';
import DeleteIcon from '@material-ui/icons/Delete';
import CommentIcon from '@material-ui/icons/Comment';
import { makeStyles } from '@material-ui/core/styles';
import { Icon, Input } from 'semantic-ui-react';
import { useSelector, useDispatch } from 'react-redux';
import { getIsLogged, getUser } from '../features/userSlice';
import { refresh } from '../features/status';
import { Link, withRouter } from 'react-router-dom';
import { Menu, Dropdown, message } from 'antd';
import axios from 'axios';

const Post = ({ post, history, showCommentProp }) => {
	const classes = useStyle();
    const dispatch = useDispatch();
	const isLogged = useSelector(getIsLogged);
	const loggedUser = useSelector(getUser);
    const [comment, setComment] = useState('');
    const [showComment, setShowComment] = useState(false);
    const [showLikes, setShowLikes] = useState(false);
    const likesCountRef = useRef();
    const likeRef = useRef();
    let isLiked = false;
    let isOwner = false;

    if(loggedUser && post) {
        isOwner = post.userId === loggedUser.userId ? true:false;
    }

    post.likes.map((like) => {
        if(like.userId === loggedUser.userId) {
            isLiked = true; 
        }
        return isLiked
    })

    useEffect(() => {
        document.addEventListener('click', (e) => {
            if(!likeRef.current?.contains(e.target) && !likesCountRef.current?.contains(e.target)) {
                setShowLikes(false);
            }
        });
    }, [])

	const likeHandler = () => {
        if(!isLogged){
            history.push('/login')
        } else {
            let url;
            if(isLiked){
                url = `https://us-central1-socialony.cloudfunctions.net/api/post/${post.postId}/unlike`
            } else {
                url = `https://us-central1-socialony.cloudfunctions.net/api/post/${post.postId}/like`
            }
            axios({
                method: 'post',
                url,
                data: {
                    userId: loggedUser.userId
                },
                headers: {
                    "Content-Type": "application/json"
                }
            }).then(() => {
                dispatch(refresh());
            })
            .catch((err) => {
                console.log(err)
                dispatch(refresh());
            });
        }
	}

	const commentHandler = () => {
        const key = 'updatable';
        message.loading({ content: 'Comment Posting...', key });
        if(!isLogged){
            history.push('/login')
        } else {
            if(comment) {
                axios({
                    method: 'post',
                    url: `https://us-central1-socialony.cloudfunctions.net/api/post/${post.postId}/comment`,
                    data: {
                        userId: loggedUser.userId,
                        content: comment
                    },headers: {
                        "Content-Type": "application/json"
                    }
                }).then(() => {
                    message.success({ content: 'Comment Posted!', key, duration: 2 });
                    setComment('');
                    dispatch(refresh());
                })
                .catch((err) => console.log(err));
            } else {
                message.error({ content: 'Empty Comment Cant Be Posted!', key, duration: 2 });
            }
        }
    }
    
    const deletePost = () => {
        const key = 'updatable';
        message.loading({ content: 'Post Deleting...', key });
        axios({
            method: 'delete',
            url: `https://us-central1-socialony.cloudfunctions.net/api/post/${post.postId}`,
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then((e) => {
            dispatch(refresh())
            message.success({ content: 'Post Deleted', key, duration: 2 });
        })
        .catch((e) => console.log(e));
    };

    const RenderComments = () => {
        return post?.comments?.map((comment, index) => {
            return (
                <Grid item container xs={12} className={classes.eachcomment} key={index}>
                    <Grid item xs={2} md={1}>
                        <Link to={`/user/${comment.userId}`}>
                            <Avatar 
                                src={comment.imageUrl}
                                className={classes.commentimg} 
                            />
                        </Link>
                    </Grid>
                    <Grid item container direction="column" xs={10} md={11} className={classes.eachcommentbody}>
                        <Link to={`/user/${comment.userId}`}>
                            <Typography variant="h6">
                                {`${comment.name} ${comment.surname}`}
                            </Typography>
                        </Link>
                        <Typography variant="body1">
                            {comment.content}   
                        </Typography>
                    </Grid>
                </Grid>
            )
        })
    };

    const RenderLikes = () => {
        return post?.likes?.map((like, index) => {
            return (
                <Link to={`/user/${like.userId}`} className={classes.likecontainer} key={index}>
                    <Grid item container alignItems="center">
                        <Avatar 
                            src={like.userData?.imageUrl}
                            className={classes.likeimg}
                        />
                        <Typography variant="body1">
                            {like.userData?.name} {like.userData?.surname}
                        </Typography>
                    </Grid>
                </Link> 
            )
        })
    }

    const cardAction = () => {
        if(isOwner) {
            return (
                <IconButton aria-label="settings" className={classes.buttonsettings}>
                    <Dropdown overlay={
                        <Menu>
                            <Menu.Item>
                                <div rel="noopener noreferrer" className={classes.deleteicon} onClick={deletePost}>
                                    <DeleteIcon /> Delete This Post 
                                </div>
                            </Menu.Item>
                        </Menu>
                    } placement="bottomLeft">
                        <MoreVertIcon />
                    </Dropdown>
                </IconButton>
            )
        }
    }

	return (
		<Card className={classes.card}>
            <CardHeader
                avatar={
                    <Link to={`/user/${post?.userId}`}>
                        <Avatar 
                            src={post?.imageUrl}
                        />
                    </Link>
                }
                action={cardAction()}
                title={
                    <Link to={`/user/${post?.userId}`}>
                        <span className={classes.postowner}>    
                            {`${post?.name} ${post?.surname}`}
                        </span>
                    </Link>
                }
                subheader={<span className={classes.postdate}>{post?.createdAt}</span>}
            />
			
			<CardContent className={classes.cardcontent}>
				<Typography variant="body1" color="textSecondary" component="p" className={classes.content}>
					{post?.content}
				</Typography>
			</CardContent>
			<CardActions disableSpacing>
				<Grid container>
					<Grid item xs={12} lg={"auto"} className={classes.cardbutton}>
						<span>
                            <IconButton aria-label="like" style={{ padding: "10px"}} onClick={likeHandler}>
                                <FavoriteIcon style={{color: isLiked ? "red":"rgba(0, 0, 0, 0.54)"}}/>
                            </IconButton>					
                            <span 
                                onClick={() => setShowLikes(!showLikes)} 
                                ref={likesCountRef}
                                className={classes.likescountspan}                            
                            >
                                {post?.likesCount}
                            </span>
						</span>
						<span>
                            <IconButton aria-label="comment" style={{ padding: "10px", color: "rgba(0, 0, 0, 0.54)"}} 
                                onClick={() => setShowComment(!showComment)}
                            >
                                <CommentIcon />
                            </IconButton>								
							{post?.commentsCount}
						</span>
					</Grid>
					<Grid item xs={12} lg={true}>
                        {isLogged && (
                            <Input 
                                className={classes.comment} 
                                icon={
                                    <Icon 
                                        onClick={commentHandler}
                                        name='paper plane' 
                                        inverted 
                                        circular 
                                        link 
                                    />
                                } 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)} 
                                placeholder='Comment...' 
                            />
                        )}
					</Grid>
				</Grid>			
			</CardActions>
            {showCommentProp ? (
                <React.Fragment>
                    <Grid item container xs={12} className={classes.commentwindow} style={{display: !showComment ? 'flex':'none'}}>
                        {RenderComments()}
                    </Grid>
                </React.Fragment>
            ):(
                <Grid item container xs={12} className={classes.commentwindow} style={{display: showComment ? 'flex':'none'}}>
                    {RenderComments()}
                </Grid>
            )}

            <Grid container item xs={10} lg={6} className={classes.postlikes} style={{ display: showLikes ? 'block':'none' }} ref={likeRef}>
                <Typography variant="h6" className={classes.liketitle}>Users that liked this post</Typography>
                {RenderLikes()}
            </Grid>            
		</Card>
	)
}

export default withRouter(Post)

const useStyle = makeStyles(() => ({
	card: {
        overflow: "inherit",
        position: "relative",
		width: "100%",
		marginBottom: "25px"
    },
    likeimg: {
        marginRight: "15px"
    },
	comment: {
        width: "100%",
        "& input:focus" : {
            background: "whitesmoke !important"
        },
        "& input": {
            border: "none !important",
		}
	},
	content: {
		padding: "0 20px"
	},
	cardbutton: {
		marginRight: "10px"
	},
    commentwindow: {
        padding: "5px 10px",
        position: "relative"
    },
    commentimg: {
        marginTop: "15px",
        marginLeft: "auto",
        marginRight: "auto",
        height: "30px",
        width: "30px"
    },
    commenttime: {
        width: "max-content",
        marginLeft: "auto",
    },
    eachcomment: {
        borderRadius: "10px",
        backgroundColor: "whitesmoke",
        marginBottom: "10px"
    },
    eachcommentbody: {
        padding: "10px",
    },
    cardcontent: {
        paddingTop: "0",
        paddingBottom: "5px"
    },
    deleteicon: {
        display: "flex",
        alignItems: "center",
        padding: "2px 5px",
        "& svg": {
            marginRight: "10px"
        }
    },
    postlikes: {
        overflowY: "auto",
        maxHeight: "400px",
        bottom: "50%",
        left: "10%",
        backgroundColor: "white",
        boxShadow: "0px 0px 3px 0.5px rgba(0,0,0,0.75)",
        borderRadius: "5px",
        zIndex: "55",
        position: "absolute"
    },
    likecontainer: {
        display: "flex",
        padding: "10px 15px",
        width: "100%",
        "&:hover": {
            backgroundColor: "#efefef"
        }
    },
    likescountspan: {
        cursor: "pointer",
    },
    liketitle: {
        padding: "10px 15px",
        borderBottom: "2px solid #ededed"
    }
}))