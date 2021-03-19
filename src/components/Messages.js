import React,{ useRef, useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Avatar, Typography, IconButton, CircularProgress } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { Icon, Input } from 'semantic-ui-react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { useDispatch, useSelector } from 'react-redux';
import { getIsNavbarOpen, setActiveChatIndex, getActiveIndex } from '../features/status';
import { getUser, getIsLogged, getMessages } from '../features/userSlice';
import { Link, withRouter } from 'react-router-dom';
import { message, Menu, Dropdown, Empty } from 'antd';
import axios from 'axios';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import './styles.css';

const Messages = (props) => {

	const classes = useStyle();
	const left = useRef();
	const right = useRef();
	const messagesEndRef = useRef();
	const chatBoxRef = useRef();
    const dispatch = useDispatch();
    const user = useSelector(getUser);
    const isLogged = useSelector(getIsLogged);
    const isOpen = useSelector(getIsNavbarOpen);
    const activeIndex = useSelector(getActiveIndex);
    const messagesNotification = useSelector(getMessages);
    const [messages, setMessages] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [refresh, setRefresh] = useState(false);
	const [width, setWindowWidth] = useState(0);


	if(!isLogged) props.history.push('/');

	useEffect(() => {
		if(left.current && right.current) {
			if(width < 450){			
				left.current.style.display = "flex";
				right.current.style.display = "none";
			} else {
				left.current.style.display = "flex";
				right.current.style.display = "flex";
			}
		}
	},[width, left.current, right.current]);

    useEffect(() => {
        if(isLogged){
            axios({
                method: 'get',
                url: `https://us-central1-socialony.cloudfunctions.net/api/chat/${user.userId}`,
            }).then((res) => {
                setMessages(res.data);
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });              
            })
            .catch((err) => console.log(err));
        }
    },[newMessage, activeIndex, isLogged, user.userId]);

	useEffect(() => { 
		updateDimensions();
		window.addEventListener("resize", updateDimensions);
		return () => 
		  window.removeEventListener("resize",updateDimensions);
	}, []);

	const updateDimensions = () => {
		const width = window.innerWidth;
		setWindowWidth(width);
	};

	const openChat = async(rank) => {
        const parent = document.getElementById("chatHeader");
        parent.childNodes.forEach((node, index) => {
            if(index !== activeIndex) {
                node.classList.remove('activeMessageUser');
            } else {
                node.classList.add('activeMessageUser');
            }
        })
		if(width < 450) {
			if(left.current && right.current) {
				left.current.style.display = "none";
				right.current.style.display = "flex";
			}
		}
	};

	const back = () => {
		if(left.current && right.current){
			left.current.style.display = "flex";
			right.current.style.display = "none";
		}
	};

    const sentMessage = (e) => {
		e.preventDefault();
		if(newMessage) {
			axios({
				method: 'post',
				url: `https://us-central1-socialony.cloudfunctions.net/api/chat/message`,
				data: {
					senderId: user.userId,
					recieverId: messages[activeIndex].id,
					content: newMessage
				}
			}).then(() => setRefresh(!refresh))
			.then(() => dispatch(setActiveChatIndex(0)))
			.catch((err) => console.log(err));
			setNewMessage('');  
		} else {
			message.error({ content: 'Empty Message Cant Be Sent!', duration: 2 });
		}
    };

    const MarkAsRead = (id) => {
        axios({
            method: "post",
            url: `https://us-central1-socialony.cloudfunctions.net/api/chat/notifications`,
            data: {
                triggerIds: [id]
            }
        })
        .catch((err) => console.log(err));
    }

    const renderHeaders = () => {
		if(messages){
			if(messages.length) {
				return  messages.map((message, index) => {
                    let isNotRead = false;
                    let triggerId = ''
                    if(messagesNotification){
                        messagesNotification.forEach((item) => {
                            if(item.senderId === message.id) {
                                isNotRead = true;
                                triggerId = item.triggerId;
                            }
                        })
                    }
					return (
						<Grid key={index} container item alignItems="center" 
							className={`${classes.each} ${activeIndex === index ? 'activeMessageUser':''}`} 
							onClick={()=>{
                                if(isNotRead) MarkAsRead(triggerId);
								dispatch(setActiveChatIndex(index));
								openChat();
							}}
						>
							<Link to={`/user/${message.id}`}>
								<Avatar
									className={classes.chatavatar}
									src={message.imageUrl}
									alt="user pp"
								/>
							</Link>
							<Typography variant="h6">{message.name}</Typography>
                            {isNotRead ? (<FiberManualRecordIcon 
                                style={{ marginLeft: "auto", color: "#d54b4b" }}
                            />):(<React.Fragment></React.Fragment>)}
						</Grid>
					)
				})
			} else {
				return (
					<Grid container item justify="center">
						<Empty
							image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
							imageStyle={{
								height: 60,
							}}
							description={
								<span>
									No Message 
								</span>
							}
						/>
					</Grid>
				)
			}
		} else {
			return (
				<Grid item container xs={12} justify="center" style={{ paddingTop: "50px" }}>
					<CircularProgress />
				</Grid>
			)
		}
    };

    const renderMessages = () => {
        if(activeIndex !== null){
            return messages[activeIndex]?.messages.map((message, index) => {
                return (
                    <Grid item container lg={12} className={classes.message} key={index}
                        style={{ justifyContent: message.sender === user.userId ? 'flex-end':'flex-start' }}
                    >
                        <div style={{ 
                            borderTopLeftRadius: message.sender === user.userId ? '15px':'0',
                            borderTopRightRadius: message.sender === user.userId ? '0':'15px',
                        }}>
                            <Typography variant="body1">
                                {message.content}
                            </Typography>
                            <Typography variant="button" align="right">{message.createdAt}</Typography>
                        </div>
                    </Grid>		
                )
            })
        }        
	};
	
	const goToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<Grid container className={classes.root} style={{ height: isOpen ? "79vh":"92vh" }}>
			<Grid item container xs={12} lg={12} className={classes.main}  style={{ height: isOpen ? "79vh":"92vh" }}>
				<Grid item container xs={12} lg={4} className={classes.left} ref={left}>
					<Grid container item className={classes.header}>
						<Avatar
							className={classes.headeravatar}
							src={user?.credentials?.imageUrl}
                            alt="user pp"
						/>
						<Grid>
							<Typography variant="h5" style={{ fontWeight: "bolder" }}>{`${user.credentials?.name} ${user.credentials?.surname}`}</Typography>
							<Typography variant="body1">
								Online
							</Typography>
						</Grid>
					</Grid>
					<Grid container item className={classes.title}>
						<Typography variant="h5" style={{ fontWeight: "bolder" }}>Conversations</Typography>	
					</Grid>
					<Grid container item direction="column" className={classes.chats} id="chatHeader">
                        {renderHeaders()}
					</Grid>
				</Grid>
				{messages && (
					<Grid item container xs={12} lg={8} className={classes.right} ref={right}>
						<Grid item container justify="flex-start" alignItems="center" className={classes.messageheader}>
							{width < 450 && (   
								<ArrowBackIcon 
									className={classes.backicon} 
									onClick={back}
								/>
							)}
							<Typography variant="h5">{messages[activeIndex]?.name}</Typography>
							<IconButton aria-label="settings" className={classes.headersettings}>
								<Dropdown overlay={
									<Menu>
										<Menu.Item>
											<Link to={`/user/${messages[activeIndex]?.id}`} rel="noopener noreferrer" className={classes.deleteicon}>
												See {messages[activeIndex]?.name}'s Profile 
											</Link>
										</Menu.Item>
									</Menu>
								} placement="bottomLeft">
									<MoreVertIcon />
								</Dropdown>
							</IconButton>
						</Grid>
						<Grid item container className={classes.chatmessages}>
							<Grid item container className={classes.input}>
								<form onSubmit={sentMessage}>
									<Input
										fluid
										value={newMessage}
										icon={<Icon name='send' inverted circular link 
											onClick={sentMessage}
										/>}
										onChange={(e) => setNewMessage(e.target.value)}
										placeholder='Send...'
									/>
								</form>
							</Grid>
							<IconButton className={classes.goToBottom} onClick={goToBottom}>
								<ArrowDownwardIcon />
							</IconButton>
							<Grid item container className={classes.messages} style={{ maxHeight: isOpen ? "60vh":"72vh" }} ref={chatBoxRef}>
								{ activeIndex !== null && renderMessages() }		
								<div ref={messagesEndRef} />														
							</Grid> 
						</Grid>
					</Grid>
				)}
			</Grid>
		</Grid>

	)
}

export default withRouter(Messages)


const useStyle = makeStyles((theme) => ({
	
	root: {
		paddingTop: "0px",
	},
	left: {
		backgroundColor: "#ffffff",
		padding: "0px",
		flexDirection: "column",
		flex: "1",
	},
	right: {
		display: "none",
		backgroundColor: "#eceef1",
		flexDirection: "column",
		padding: "10px 20px 5px 20px"
	},
	headeravatar: {
		height: "60px",
		width: "60px",
		marginRight: "20px"
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		padding: "30px 30px 10px 30px",
		height: "15vh"
	},
	chatavatar: {
		height: "40px",
		width: "40px",
		marginRight: "5px"
	},
	chats: {
		maxHeight: "67vh",
		flexDirection: "row",
		overflowY: "scroll",
        alignItems: "flex-start",
	},
	title: {
		padding: "20px",
		paddingBottom: "0",
		height: "10vh",
        borderBottom: "2px solid #efefef"
	}, 
	each: {
		cursor: "pointer",
		padding: "10px 30px",
        borderBottom: "1px solid #efefef",
        height: "fit-content",
        justifyContent: "flex-start",
		"& h6": {
			marginLeft: "15px",
			fontSize: "1.5rem !important"
		},
		"&:hover": {
			backgroundColor: "#f0f3f7",
            paddingLeft: "40px"
		}
	},
	messageheader: {
		padding: "5px 0 10px 10px",
		borderBottom: "1px solid #c7c7c7"
	},
	backicon: {
		marginRight: "20px"
	},
	headersettings: {
		marginLeft: "auto",
	},
	chatmessages: {
		flex: "1",
		position: "relative",
		alignContent: "flex-end",
		flexDirection: "column-reverse"
	},
	input: {
		padding: "5px 10px 5px 10px",
		flex: 0.1,
		alignItems: "center",
		"& form": {
			width: "100%",
		},
		"& input": {
			borderRadius: "20px !important",
			paddingRight: "90px !important",
			paddingLeft: "20px !important",
			backgroundColor: "transparent !important",
			height: "40px",
		},
		"& button": {
			position: "absolute",
			right: "-3px",
			height: "40px",
			borderRadius: "20px !important"
		}
	},
	messages: {
		maxHeight: "60vh",
		overflowY: "scroll",
		
        "&::-webkit-scrollbar": {
			display: "none !important"
		}
	},
	message: {
		height: "fit-content",
		marginBottom: "20px",
        display: "flex",
		padding: "0 10px",
		"&::-webkit-scrollbar" : {
			display: "none"
		},
		"& div": {
			display: "flex",
			flexDirection: "column",
			backgroundColor: "#fff",
			height: "fit-content",
			padding: "10px 15px 2px 15px",
			borderRadius: "15px",
		}
	},
	goToBottom: {
		width: "fit-content",
		position: "absolute",
		bottom: "10vh"
	},
    deleteicon: {
        display: "flex",
        alignItems: "center",
        padding: "2px 5px",
        "& svg": {
            marginRight: "10px"
        }
    }
}))