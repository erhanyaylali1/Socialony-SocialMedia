import React,{ useEffect } from 'react';
import { Grid, Typography, Avatar } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { Link, withRouter } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getIsLogged, getNotifications } from '../features/userSlice';
import { Icon } from 'semantic-ui-react'
import axios from 'axios';
import { Empty } from 'antd';

const Notifications = (props) => {

    const classes = useStyle();
    const isLogged = useSelector(getIsLogged);
    const notifications = useSelector(getNotifications);

    if(!isLogged) props.history.push('/');

    useEffect(() => {
        setTimeout(function () {
            const triggerIds = [];
            if(notifications){
                notifications.forEach((item) => {
                    if(item.read === "False") {
                        triggerIds.push(item.triggerId)
                    }
                })             
                if(triggerIds.length){
                    axios({
                        method: 'post',
                        url: `https://us-central1-socialony.cloudfunctions.net/api/notifications`,
                        data: {
                            triggerIds
                        }
                    }).catch((err) => {
                        console.log(err);
                    })
                }
            }
        }, 2000)
    },[notifications]);

    const renderNotifications = () => {
        if(notifications.length) {
            return notifications.map((item, index) => {
                return (
                    <Grid item container xs={12} justify="center" 
                        className={classes.each} key={index} 
                        
                    >
                        <Grid item container xs={2} lg={1}>
                            <Link to={`/user/${item.senderId}`}>
                                <Avatar 
                                    src={item.imageUrl}
                                />
                            </Link>
                        </Grid>
                        <Grid item container xs={10} lg={11}>
                            <Typography variant="body1" className={classes.sender}>
                                {item.type === "Follow" ? (
                                    <Link to={`/user/${item.senderId}`}>
                                        {`${item.name} ${item.surname}`} 
                                        {renderAction(item.type)}
                                        <small className={classes.time}>{item.createdAt}</small>
                                    </Link>
                                ):(
                                    <Link to={`/post/${item.postId}`}>
                                        {`${item.name} ${item.surname}`} 
                                        {renderAction(item.type)}
                                        <small className={classes.time}>{item.createdAt}</small>
                                    </Link>
                                )}
                            </Typography>
                            {item.read === "False" && <Icon className={`circle ${classes.notread}`} />}
                        </Grid>
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
                                No Notifications 
                            </span>
                        }
                    />
                </Grid>
            )
        }
    }

    const renderAction = (type) => {
        if(type === "Like") return ' liked your post.'
        else if(type === "Comment") return ' send a comment to your post.'
        else return ' has followed you.'
    }
    
    return (
        <Grid container>
            <Grid item xs={1} lg={3} />
            <Grid item container xs={10} lg={5} className={classes.root}>
                <Typography variant="h5" className={classes.title}><NotificationsNoneIcon />Notifications</Typography>
                {renderNotifications()}
            </Grid>
            <Grid item xs={1} lg={3} />
        </Grid>
    )
}

export default withRouter(Notifications)


const useStyle = makeStyles((theme) => ({
    root: {
        marginTop: "40px",
        backgroundColor: "#fff",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "1px 1px 5px 0px rgb(0 0 0 / 75%)"
    },
    title: {
        padding: "10px 15px",
        borderBottom: "1px solid rgba(30,30,30,0.3)",
        width: "100%",
        color: "#454545",
        marginBottom: "10px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        "& svg": {
            marginRight: "8px",
            fontSize: "25px"
        }
    },
    sender: {
        marginLeft: "15px",
        display: "flex",
        alignItems: "center",
        "& p": {
            marginLeft: "auto",
            width: "max-content",
            alignSelf: "flex-end"
        },
    },
    time: {
        marginLeft: "15px",
    },
    each: {
        display: "flex",
        width: "100%",
        padding: "15px",
        position: "relative",
        borderRadius: "5px",
        "&:hover": {
            backgroundColor: "#eee"
        },
    },
    notread: {
        position: "absolute",
        right: "10px",
        top: "25px",
        color: "#4977bd"
    }
}))