import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Button } from '@material-ui/core';
import { Form, Input, message } from 'antd';
import { Divider } from 'semantic-ui-react';
import { Link, withRouter } from 'react-router-dom';
import 'antd/dist/antd.css';
import 'semantic-ui-css/semantic.min.css';
import axios from 'axios';

const Register = ({ history }) => {
	const classes = useStyle();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [username, setUsername] = useState('');
	const [name, setName] = useState('');
	const [surname, setSurname] = useState('');
	const [phone, setPhone] = useState(0);

	const RegisterHandle = () => {
        
        const key = 'updatable';
        message.loading({ content: 'Registering...', key });
        if(password.length < 6) {
            message.error({ content: `Password must be minimum 6 characters!`, key, duration: 2 });
        } else {
            axios({
                method: 'post',
                url: "https://us-central1-socialony.cloudfunctions.net/api/signup",
                data: {
                    email,
                    password,
                    username,
                    name,
                    surname,
                    phone				
                },
                headers: {
                    "Content-Type": "application/json"
                }
            })
            .then(() => {
                history.push('/login')
                message.success({ content: 'Registered!', key, duration: 2 });
            })
            .catch((error) => {
                console.log(error);
                message.error({ content: `This Email, Username or Phone may be taken!`, key, duration: 2 });
            });
        }

	}

	return (
		<div>
			<Grid container className={classes.root}>
				<Grid item xs={1} lg={3} />
				<Grid item xs={10} lg={6}>
					<Typography variant="body1" align="center" className={classes.register}>
						Register
					</Typography>
					<Divider />
					<Form className={classes.form} onFinish={RegisterHandle}>
						<Form.Item
							className={classes.formInput}
							label="Email"
							rules={[
								{
									required: true,
									message: 'Please Input Your Email!',
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
							rules={[
								{
									required: true,
									message: 'Please Input Your Password!',
								}
							]}
						>
							<Input.Password 
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</Form.Item>

						<Form.Item
							className={classes.formInput}
							label="Username"
							rules={[
								{
									required: true,
									message: 'Please Input Your Username!',
								},
							]}
						>
							<Input 
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>
						</Form.Item>

						<Form.Item
							className={classes.formInput}
							label="First Name"
							rules={[
								{
									required: true,
									message: 'Please Input Your First Name!',
								},
							]}
						>
							<Input 
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</Form.Item>

						<Form.Item
							className={classes.formInput}
							label="Last Name"
							rules={[
								{
									required: true,
									message: 'Please Input Your Last Name!',
								},
							]}
						>
							<Input 
								type="text"
								value={surname}
								onChange={(e) => setSurname(e.target.value)}
							/>
						</Form.Item>

						<Form.Item
							className={classes.formInput}
							label="Phone"
							rules={[
								{
									required: true,
									message: 'Please Input Your Phone Number!',
								},
							]}
						>
							<Input 
								type="text"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
							/>
						</Form.Item>

						<Form.Item className={classes.button}>						
							<Button variant="contained" size="medium" color="primary" type="submit">
								Register
							</Button>
						</Form.Item>
					</Form>
					<Divider horizontal>OR</Divider>
					<Typography align="center" varianth="body1" className={classes.link}>
						<Link to="/login">
							Already have an account? Login
						</Link>
					</Typography>
				</Grid>
				<Grid item xs={1} lg={3} />
			</Grid>
		</div>
	)
}

export default withRouter(Register)

const useStyle = makeStyles((themes) => ({
	root: {
		paddingTop: "50px",
		paddingBottom: "70px"
	},
	register: {
		fontSize: "2rem",
		color: "#555555",
		fontWeight: "700"
	},
	button: {
		textAlign: "end"
	},
	form: {
		paddingTop: "30px"
	},
	link: {
		marginTop: "10px",
		fontSize: "1.3rem"
	}
}))