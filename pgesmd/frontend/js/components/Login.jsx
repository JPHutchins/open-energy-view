import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import cookie from "react-cookies";
import AuthService from "../api/AuthService";
import { withRouter, Link } from "react-router-dom";

const Login = props => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [badCreds, setBadCreds] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const credentials = { email: email, password: password };
    AuthService.login(credentials).then(res => {
      if (res.status === 401) {
        setBadCreds("Incorrect email and/or password.");
      } else {
        cookie.save("logged_in", true, { maxAge: 900 });
        props.callback();
        props.history.push("/");
      }
    });
  }

  function handleDemo(e) {
    const creds = { email: "jph@demo.com", password: "password" };
    AuthService.login(creds).then(res => {
      if (res.status === 401) {
        throw Error("That's weird, the demo credentials are missing.");
      } else {
        cookie.save("logged_in", true, { maxAge: 900 });
        props.callback();
        props.history.push("/");
      }
    });
  }

  return (
    <div className="login-box">
      <Form onSubmit={handleSubmit}>
        <Form.Text className="form-title">Login</Form.Text>
        <hr />
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            className="login-form"
            type="email"
            placeholder="Enter email"
            onChange={e => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            className="login-form"
            type="password"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
          />
        </Form.Group>
        <Form.Text className="bad-creds">{badCreds}</Form.Text>
        <Button variant="primary" type="submit">
          Submit
        </Button>
        <hr />
        <Form.Text className="default-text">
          No account? <Link to="/create_account">Register now!</Link>
          <br />
          <a className="demo-link" onClick={handleDemo}>
            Or use the demo
          </a>
        </Form.Text>
      </Form>
    </div>
  );
};

export default withRouter(Login);
