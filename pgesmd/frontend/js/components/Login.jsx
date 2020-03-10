import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    console.log(email, password);
    let token = await fetch("/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username: email, password: password })
    })
      .then(response => response)
      .then(data => {
        return data.json();
      })
      .catch(e => {
        console.error(e);
      });
    console.log(token.access_token);
    fetch("/testauth", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "JWT " + token.access_token
      }
    })
      .then(response => response.body)
      .then(body => {
        console.log(body.getReader());
      })
      .catch(e => {
        console.error(e);
      });
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Email address</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          onChange={e => setEmail(e.target.value)}
        />
        <Form.Text className="text-muted">
          We'll never share your email with anyone else.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="formBasicPassword">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Submit
      </Button>
    </Form>
  );
};

export default Login;
