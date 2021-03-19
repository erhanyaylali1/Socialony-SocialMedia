import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Post from './Post';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { getRefresh } from '../features/status';

const PostPage = (props) => {
	const classes = useStyle();
	const refresh = useSelector(getRefresh)
	const [post, setPost] = useState(null);
	

	useEffect(() => {
		axios({
			method: 'get',
			url: `https://us-central1-socialony.cloudfunctions.net/api/post/${props.match.params.postId}`,
		})
		.then((res) => setPost(res.data))
	},[refresh, props.match.params.postId])


	return (
		<Grid container>
			<Grid item xs={1} lg={3} />
			<Grid item container xs={10} lg={6} className={classes.root}>
				{post && (
					<Post post={post} showCommentProp/>
				)}
			</Grid>
			<Grid item xs={1} lg={3}/>
		</Grid>
	)
}

export default withRouter(PostPage)

const useStyle = makeStyles({
	root: {
		paddingTop: "50px"
	}
})