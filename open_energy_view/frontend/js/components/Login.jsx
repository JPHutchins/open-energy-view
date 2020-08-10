import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import cookie from "react-cookies";
import AuthService from "../api/AuthService";
import { withRouter, Link } from "react-router-dom";

const Login = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [badCreds, setBadCreds] = useState("");
  const [loginDisabled, setLoginDisabled] = useState(false);

  const googleAuth = () => {
    location.href = "/api/oauth/google"
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoginDisabled(true);
    const credentials = { email: email, password: password };
    AuthService.login(credentials).then((res) => {
      if (res.status === 401) {
        setBadCreds("Incorrect email and/or password.");
        setLoginDisabled(false);
      } else {
        props.callback();
        props.history.push("/");
      }
    });
  }

  function handleDemo(e) {
    const credentials = { email: "jph@demo.com", password: "demo" };
    setLoginDisabled(true);
    AuthService.login(credentials).then((res) => {
      if (res.status === 401) {
        setLoginDisabled(false);
        throw Error("That's weird, the demo credentials are missing.");
      } else {
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
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            className="login-form"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        <Form.Text className="bad-creds">{badCreds}</Form.Text>
        <Button
          disabled={loginDisabled}
          className="login-submit-button"
          variant="primary"
          type="submit"
        >
          Login
        </Button>
        <hr />
        <div onClick={googleAuth} id="google-sign-in"></div>
        <hr />
        <Form.Text className="default-text">
          No account? <Link to="/create_account">Register now!</Link>
          <br />
          <hr />
          <Button
            disabled={loginDisabled}
            variant="primary"
            className="login-submit-button"
            onClick={handleDemo}
          >
            Try the demo account
          </Button>
        </Form.Text>
      </Form>
    </div>
  );
};

export default withRouter(Login);
