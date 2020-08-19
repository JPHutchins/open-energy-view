import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import AuthService from "../api/AuthService";
import axios from "axios";
import DataLoader from "./DataLoader";

const AddOAuthSource = (props) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { location, history, restrictView } = props;

  const params = new URLSearchParams(location.search);
  const payload = params.get("payload");
  const usage_points = JSON.parse(params.get("usage_points"));
  // TODO: handle multiple usage points

  // TODO: server will respond 500 on failing UniqueConstraint for
  // "Provider ID" (third party ID) or name - update UI on promise reject

  const handleSubmit = (e) => {
    e.preventDefault();
    const regInfo = {
      params: {
        payload: payload,
        name: name,
        usage_point: usage_points.electricity[0],
      }
    };
    axios
      .get("/api/web/add/pge_oauth", regInfo, AuthService.getAuthHeader())
      .then((res) => {
        setTimeout(() => {
          restrictView("last", null, {
            name,
            taskId: res.data,
          });
          history.push("/");
        }, 5000);
      });
    setLoading(<DataLoader />);
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

  return loading ? loading : nameSource;
};

export default withRouter(AddOAuthSource);
