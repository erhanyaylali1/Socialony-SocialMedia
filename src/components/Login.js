import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Button } from '@material-ui/core';
import { Form, Input, message } from 'antd';
import { Divider } from 'semantic-ui-react';
import { Link, withRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, getIsLogged } from '../features/userSlice';
import 'antd/dist/antd.css';
import 'semantic-ui-css/semantic.min.css';
import axios from 'axios';

const Login = ({history}) => {
	const classes = useStyles();
    const dispatch = useDispatch();
	const isLogged = useSelector(getIsLogged);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

    useEffect(() => {
        if(isLogged) history.push('/');
    },[isLogged, history])

	const onFinish = () => {
        const key = 'updatable';
        message.loading({ content: 'Logging In...', key });
		axios({
            method: 'post',
            url: "https://us-central1-socialony.cloudfunctions.net/api/login",
            data: {
                email,
                password
            }
        })
        .then((user) => {
			dispatch(login(user.data));
		})
		.then(() => {
			history.push('/');
            message.success({ content: 'Logged In!', key, duration: 2 });
		})
        .catch((err) => {
            console.log(err);
        });
    };


	return (
		<div>
			<Grid container className={classes.root}>
				<Grid item xs={1} lg={3}/>
				<Grid item xs={10} lg={6}>
					<Typography variant="body1" align="center" className={classes.login}>
						Login
					</Typography>
					<Divider />
					<Form
                        name="basic"
                        className={classes.form}
                        onFinish={onFinish}
                    >
                        <Form.Item
                            className={classes.formInput}
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your email!',
                                },
                            ]}
                        >
                            <Input 
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
                        </Form.Item>

                        <Form.Item
                            className={classes.formInput}
                            label="Password"
                            name="password"
                            rules={[
                            {
                                required: true,
                                message: 'Please input your password!',
                            },
                            ]}
                        >
                            <Input.Password 
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
                        </Form.Item>

                        <Form.Item className={classes.button}>
                            <Button color="primary" variant="contained" type="submit">
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
					<Divider horizontal>OR</Divider>
					<Typography align="center" varianth="body1" className={classes.register}>
						New To Socialony?
					</Typography>
					<Typography align="center" varianth="body1" className={classes.link}>
						<Link to="/register">
							Create an Account
						</Link>
					</Typography>
				</Grid>
				<Grid item xs={1} lg={3}/>
			</Grid>
		</div>
	)
}

export default withRouter(Login)


const useStyles = makeStyles((theme) => ({
	root: {
		paddingTop: "50px"
	},
	formInput: {
		marginBottom: "25px"
	},
	login: {
		fontSize: "2rem",
		color: "#555555",
		fontWeight: "700"
	},
	form: {
		paddingTop: "15px"
	},
	button: {
		textAlign: "end"
	},
	register: {
		marginTop: "30px",
		fontSize: "1.5rem"
	},
	link: {
		marginTop: "10px",
		fontSize: "1.3rem"
	}
}));