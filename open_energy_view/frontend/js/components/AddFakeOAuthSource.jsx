import React, { useState, useEffect } from "react";
import { Redirect, withRouter } from "react-router-dom";
import cookie from "react-cookies";
import { Form, Button, DropdownButton, Dropdown } from "react-bootstrap";
import AuthService from "../api/AuthService";
import axios from "axios";
import ViewTabs from "./ViewTabs";

const AddFakeOAuthSource = (props) => {
  const [name, setName] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [receivedInitialData, setReceivedInitialData] = useState(false)
  const { history, restrictView } = props;

  // TODO: server will respond 500 on failing UniqueConstraint for
  // "Provider ID" (third party ID) or name - update UI on promise reject

  const handleSubmit = (e) => {
    e.preventDefault();
    const regInfo = {
      name: name,
    };
    axios
      .post("/api/web/add/fake_oauth", regInfo, AuthService.getAuthHeader())
      .then((res) => {
        console.log(history)
        console.log(res);
        restrictView("last");
        history.push("/")
      });
  };

  const nameSource = (
    <div className="register-box">
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formPge">
          <Form.Label>Name</Form.Label>
          <Form.Control
            className="login-form"
            type="text"
            placeholder="Name, like PG&E or Home PG&E"
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Add Source
        </Button>
        <hr />
      </Form>
    </div>
  );

  return  (
  
    nameSource
  );
};

export default withRouter(AddFakeOAuthSource);
