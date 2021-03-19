import React,{ useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getUser, getIsLogged } from '../features/userSlice';
import { Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { Empty, Input, message, BackTop, Button as Btn } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import { Button } from 'semantic-ui-react';
import Post from './Post';
import { getRefresh } from '../features/status';
import { Link } from 'react-router-dom';
import CircularProgress from '@material-ui/core/CircularProgress';
const { TextArea } = Input;

const Index = () => {

	const classes = useStyles();
	const user = useSelector(getUser);
	const isLogged = useSelector(getIsLogged);
    const refresh = useSelector(getRefresh);
	const [posts, setPosts] = useState(null);
	const [newPost, setNewPost] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if(isLogged){
            axios({
                method: 'get',
                url: `https://us-central1-socialony.cloudfunctions.net/api/user/${user.userId}/home`,
			}).then((res) => setPosts(res.data))
			.then(() => {
				setIsLoading(false);
			})
            .catch((err) => {
                console.log(err)}
			);
		}
	},[newPost, isLogged, user.userId, refresh]);


	const SubmitNewPost = (e) => {
        const key = 'updatable';
        message.loading({ content: 'Sending New Post...', key });
		e.preventDefault();
        if(newPost === ''){
            message.error({ content: 'Empty Post Can Not Be Shared!', key, duration: 2 });
        } else {
            if(isLogged){
                axios({
                    method: 'post',
                    url: "https://us-central1-socialony.cloudfunctions.net/api/post",
                    data: {
                        userId: user.userId,
                        content: newPost
                    },
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).then((e) => {
                    setNewPost('');
                    message.success({ content: 'New Post Sent!', key, duration: 2 });
                })
                .catch((err) => console.log(err));
            }
        }		
	}


	const RenderPosts = () => {
		if(posts) {
            if(posts.length){
                return posts.map((post, index) => (
                    <Post 
                        key={index}
                        post={post}
                    />
                ))
            } else {
                return (
                    <Grid item container justify="center" xs={12}>
                        <Empty
                            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                            imageStyle={{
                                height: 60,
                            }}
                            description={
                                <span>
                                    Looks Like You Dont Follow Anyone.
                                    You Can Search or Follow Users on Search Bar.
                                </span>
                            }
                        />
                    </Grid>
                )
            }
			
		}
	}
	
    return (
		<div>
			<Grid container >
				<Grid item xs={1} lg={3} />
				<Grid item container xs={10} lg={6} className={classes.root}>
					<Grid item xs={12} className={classes.salude}>
						<Typography variant="h4" align="center">
							{isLogged ? `Welcome ${user.credentials.name}` : 'LOGIN PLEASE'}
						</Typography>
					</Grid>
					<Grid item container xs={12} className={classes.newpostdiv}>
						{isLogged ? (
							<React.Fragment>
								<Grid item xs={12} lg={12}>
									<TextArea 
                                        placeholder="Enter Your Thoughts..."
										className={classes.newpost}
										value={newPost}
										onChange={(e) => setNewPost(e.target.value)}
										rows={4} 
									/>
								</Grid>
								<Grid item container justify="flex-end" xs={12} className={classes.inputButtons}>
									<Button color="facebook" onClick={SubmitNewPost}>Send</Button>
								</Grid>
							</React.Fragment>
						):(<React.Fragment></React.Fragment>)}
					</Grid>
					<Grid item container xs={12} className={classes.posts}>
						<Grid item container xs={12} justify="center" style={{ display: isLoading ? (isLogged ? 'flex' : 'none' ):'none'}}>
							<CircularProgress />
						</Grid>
						{isLogged ? 
							<React.Fragment>
								{RenderPosts()}
								<BackTop>
									<Btn shape="circle" icon={<ArrowUpOutlined />}></Btn>
								</BackTop>
							</React.Fragment>
						:(
                            <Grid item container xs={12} justify="center">
                                <Link to="/login">
                                    <Button variant="contained" color="facebook">LOGIN</Button>
                                </Link>
                            </Grid>
                        )}		
					</Grid>
					
				</Grid>
				<Grid item xs={1} lg={3} />
			</Grid>
		</div>
	)
}

export default Index


const useStyles = makeStyles({
	root: {
		paddingTop: "40px"
	},
	salude : {
		marginBottom: "30px"
	},
	newpostdiv: {
		marginBottom: "10px"
	},
	newpost: {
		border: "none !important",	
		padding: "20px",
		backgroundColor: "transparent",
		borderRadius: "5px",
		boxShadow: "1px 1px 5px 0px rgb(0 0 0 / 75%)"
		
	},
	inputButtons: {
		"& button": {
			marginTop: "10px !important"
		}
	},
	posts: {
		paddingTop: "35px"
	}
});