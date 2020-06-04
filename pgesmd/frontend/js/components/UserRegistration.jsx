import React, { useState } from "react";
import { withRouter, Link } from "react-router-dom";
import cookie from "react-cookies"
import { Form, Button } from "react-bootstrap";
import AuthService from "../api/AuthService";

const UserRegistration = props => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [emailTaken, setEmailTaken] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (password != passwordConf) {
      setPasswordMismatch(
        <Form.Text className="bad-creds">
          Confirmation password must match initial password.
        </Form.Text>
      );
      return;
    }
    const credentials = { email: email, password: password };
    AuthService.register(credentials).then(res => {
      if (res.status === 403) {
        setEmailTaken(
          <Form.Text>
            E-mail already registered. <Link to="/login">Login instead?</Link>
          </Form.Text>
        );
      } else {
        cookie.save("logged_in", true, { maxAge: 900 });
        props.callback();
        props.history.push("/");
      }
    });
  }

  return (
    <div className="register-box">
      <Form onSubmit={handleSubmit}>
        <Form.Text className="form-title">Register</Form.Text>
        <hr />
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            className="login-form"
            type="email"
            placeholder="Enter email"
            onChange={e => setEmail(e.target.value)}
          />
          {emailTaken}
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            className="login-form"
            type="password"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
          />
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            className="login-form"
            type="password"
            placeholder="Re-enter Password"
            onChange={e => setPasswordConf(e.target.value)}
          />
          {passwordMismatch}
        </Form.Group>
        <Button variant="primary" type="submit">
          Submit
        </Button>
        <hr />
      </Form>
    </div>
  );
};

export default withRouter(UserRegistration);
