import React, { useState, useEffect } from "react";
import cookie from "react-cookies";
import { Form, Button, DropdownButton, Dropdown } from "react-bootstrap";
import { addPgeSource } from "../api/DatabaseService";

const SourceRegistration = ({ history, restrictView }) => {
  const [form, setForm] = useState("");
  const [name, setName] = useState("");
  const [thirdPartyId, setThirdPartyId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [utility, setUtility] = useState("Utility Company");

  // TODO: server will respond 500 on failing UniqueConstraint for
  // "Provider ID" (third party ID) or name - update UI on promise reject

  const handleSubmit = (e) => {
    e.preventDefault();
    const regInfo = {
      name: name,
      thirdPartyId: thirdPartyId,
      clientId: clientId,
      clientSecret: clientSecret,
    };
    addPgeSource(regInfo).then(() => {
      restrictView();
      history.push("/");
    });
  };

  const handleUtilityOAuth = (e) => {
    e.preventDefault();
    if (utility === "Pacific Gas & Electric") {
      location.href = "/api/utility/pge/oauth_portal"
    }
  };

  const initialForm = (
    <div className="register-box">
      <Form.Text className="form-title">Add New Data Source</Form.Text>
      <hr />
      <DropdownButton
        onSelect={(e) => showPge(e)}
        id="dropdown-basic-button"
        title="Select Source"
      >
        <Dropdown.Item eventKey="pge">PG&E</Dropdown.Item>
      </DropdownButton>
    </div>
  );

  const selfAccess = <div className="register-box">
    <Form style={{ maxWidth: "450px" }} onSubmit={handleSubmit}>
      <h4>Add Custom Source </h4>
      <div style={{ fontSize: "8pt", color: "gray" }}>This is mostly unimplemented. After adding a source below
      (enter 555 for Third-Party ID, Client ID, and Client Secret),
      you can upload your own ESPI XML from the new resource's Settings page.</div>
      <Form.Group controlId="formPge">
        <Form.Label>Name</Form.Label>
        <Form.Control
          className="login-form"
          type="text"
          placeholder="Name, like PG&E or Home PG&E"
          onChange={(e) => setName(e.target.value)}
        />
        <Form.Label>Third-Party ID</Form.Label>
        <Form.Control
          className="login-form"
          type="text"
          placeholder="Third-Party ID"
          onChange={(e) => setThirdPartyId(e.target.value)}
        />
        <Form.Label>Client ID</Form.Label>
        <Form.Control
          className="login-form"
          type="text"
          placeholder="Client ID"
          onChange={(e) => setClientId(e.target.value)}
        />
        <Form.Label>Client Secret</Form.Label>
        <Form.Control
          className="login-form"
          type="text"
          placeholder="Client Secret"
          onChange={(e) => setClientSecret(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" type="submit">
        Add Source
    </Button>
      <hr />
    </Form>
  </div>

  return (
    <>
      <div className="register-box">
        <Form style={{ maxWidth: "450px" }} onSubmit={handleUtilityOAuth}>
          <Form.Group controlId="formPgeOAuth">
            <h3>Add Your Utility</h3>
            <div style={{ fontSize: "10pt", color: "gray" }}>Authorize your utility company to share your home energy data.
            You will need the login information for your utilities. It is the
            same login that you would use to pay your bill online.</div>
            <hr/>
            <h4>Select your utility company</h4>
            <DropdownButton title={utility} onSelect={setUtility}>
              <Dropdown.Item eventKey="Pacific Gas & Electric">Pacific Gas & Electric</Dropdown.Item>
              </DropdownButton>
              <hr/>
            <h4>Link your account</h4>
            <Button variant="primary" type="submit">Authorize</Button>
          </Form.Group>
        </Form>
      </div>
      {selfAccess}
    </>
  );
};

export default SourceRegistration;
