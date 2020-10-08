import React, { useState, useEffect } from "react";
import cookie from "react-cookies";
import { Form, Button, DropdownButton, Dropdown } from "react-bootstrap";
import { addCustomSource } from "../api/DatabaseService";

const SourceRegistration = ({ history, restrictView }) => {
  const [form, setForm] = useState("");
  const [name, setName] = useState("");
  const [thirdPartyId, setThirdPartyId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [utility, setUtility] = useState("Utility Company");
  const [displayCustomSourceOption, setDisplayCustomSourceOption] = useState(
    false
  );

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
    addCustomSource(regInfo).then(() => {
      restrictView("last");
      history.push("/");
    });
  };

  const handleUtilityOAuth = (e) => {
    e.preventDefault();
    if (utility === "Pacific Gas & Electric") {
      location.href = "/api/utility/pge/oauth_portal";
    }
    if (utility === "Fake Utility") {
      location.href = "/api/utility/fake/redirect_uri";
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

  const selfAccess = (
    <Form style={{ maxWidth: "450px" }} onSubmit={handleSubmit}>
      <div style={{ fontSize: "8pt", color: "gray" }}>
        This is mostly unimplemented. After adding a source below (enter 555 for
        Third-Party ID, Client ID, and Client Secret), you can upload your own
        ESPI XML from the new resource's Settings page.
      </div>
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
  );

  return (
    <>
      <div className="register-box">
        <Form style={{ maxWidth: "450px" }} onSubmit={handleUtilityOAuth}>
          <Form.Group controlId="formPgeOAuth">
            <h3>Add Your Utilities</h3>
            <hr />
            <h4>Select your utility company</h4>
            <div style={{ fontSize: "10pt", color: "gray" }}>
              If your utility company is not listed below please visit{" "}
              <a href="https://github.com/JPHutchins/open-energy-view">
                the Github
              </a>{" "}
              and open an issue requesting integration of your utility.
            </div>
            <br />
            <DropdownButton title={utility} onSelect={setUtility}>
              <Dropdown.Item eventKey="Pacific Gas & Electric">
                Pacific Gas & Electric
              </Dropdown.Item>
              <Dropdown.Item eventKey="Fake Utility">
                Fake Utility
              </Dropdown.Item>
            </DropdownButton>
            <hr />
            <h4>Link your accounts</h4>
            <div style={{ fontSize: "10pt", color: "gray" }}>
              Click "Authorize" to go to your utility company's login page where
              you will confirm that you want to grant Open Energy View access to
              your energy usage data.
            </div>
            <br />
            <Button
              variant="primary"
              type="submit"
              style={{ width: "100%" }}
              disabled={utility === "Utility Company"}
            >
              Authorize
            </Button>
            <hr />
            <h4>Privacy</h4>
            <div style={{ fontSize: "10pt", color: "gray" }}>
              Your utility company may provide Open Energy View with your
              service addresses. We will not store these addresses on our
              servers but we will display them to you to help you to identify
              and name your meters. Please{" "}
              <a href="/#/privacy" target="_blank">
                click here to read our Privacy Policy
              </a>
              .
            </div>
          </Form.Group>
        </Form>
      </div>
      <div className="register-box">
        <h4
          onClick={() =>
            setDisplayCustomSourceOption(!displayCustomSourceOption)
          }
          className="hover-pointer"
        >
          Add Custom Source{" "}
        </h4>
        {displayCustomSourceOption && selfAccess}
      </div>
    </>
  );
};

export default SourceRegistration;
