import React from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { Icon } from 'semantic-ui-react'

const Footer = () => {
	const classes = useStyles();
	return (
		<Grid container justify="center" className={classes.root}>
			<Grid xs={3} md={2} item className={classes.items}>
				<a href="mailto:erhanyaylali9@gmail.com" className={classes.button} >
					<Icon name='mail' /> 
					<p>GMAIL</p>
				</a>
			</Grid>
			<Grid xs={3} md={2} item className={classes.items}> 
				<a href="https://www.linkedin.com/in/erhanyaylali/" className={classes.button} >
					<Icon name='linkedin' /> 
					<p>LinkedIn</p>
				</a>
			</Grid>
			<Grid xs={3} md={2} item className={classes.items}>
				<a href="https://github.com/erhanyaylali1/" className={classes.button} >
					<Icon name='github' /> 
					<p>Github</p>
				</a>
			</Grid>
			<Grid xs={3} md={2} item className={classes.items}>
				<a href="https://www.instagram.com/erhanyaylali/" className={classes.button} >
					<Icon name='instagram' />
					<p>Instagram</p>
				</a>
			</Grid>
		</Grid>
	)
}

export default Footer


const useStyles = makeStyles((theme) => ({
	root: {
		padding: "10px",
		height: "5vh",
		maxHeight: "5vh",
		backgroundColor: "#3D138D"
	},
	button: {
		color: "white",
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "center",
		"&:hover":{
			color: "#FFAA15"
		}
	},
	items: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: 0
	}
}));