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
      },
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
      <h3>Accounts Successfully Linked</h3>
      <div style={{ fontSize: "10pt", color: "gray" }}>
        Complete adding your utility below.
      </div>
      <hr />
      <h4>Name your meters</h4>
      <div style={{ fontSize: "10pt", color: "gray" }}>
        Below is the list of meters that will be synced with Open Energy View.
        Please provide a descriptive nickname for each one so that you can
        easily identify them. This nickname will be stored on our servers and
        can be changed later. Any service address displayed below will not be
        saved on our servers unless you include it in the nickname.
      </div>
      <br />
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
        <hr />
        <h4>Synchronize your data</h4>
        <div style={{ fontSize: "10pt", color: "gray" }}>
          Click "Save All" to synchronize your utility data with Open Energy
          View. This process may take a few minutes to fetch all of your
          historical data so you should click the "reload button" in the upper
          right corner when prompted. After synchronizing, your data will be
          updated every day.
        </div>
        <br />
        <Button variant="primary" type="submit">
          Save All
        </Button>
        <hr />
      </Form>
    </div>
  );

  return loading ? loading : nameSource;
};

export default withRouter(AddOAuthSource);
