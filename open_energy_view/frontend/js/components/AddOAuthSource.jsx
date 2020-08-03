import React, { useState, useEffect } from "react";
import cookie from "react-cookies";
import { Form, Button, DropdownButton, Dropdown } from "react-bootstrap";
import AuthService from "../api/AuthService";
import axios from "axios";

const AddOAuthSource = (props) => {
    const [name, setName] = useState("");
    const { location, history, restrictView } = props
    console.log(location)
    console.log(props)
    const params = new URLSearchParams(location.search);
    const payload = params.get("payload");
    const usage_points = JSON.parse(params.get("usage_points"))
    // TODO: handle multiple usage points
    console.log(payload, usage_points)



    // TODO: server will respond 500 on failing UniqueConstraint for
    // "Provider ID" (third party ID) or name - update UI on promise reject

    const handleSubmit = (e) => {
        e.preventDefault();
        const regInfo = {
            payload: payload,
            name: name,
            usage_point: usage_points.electricity[0]
        };
        axios.post("/api/web/add/pge_oauth", regInfo, AuthService.getAuthHeader()).then(() => {
            restrictView();
            history.push("/");
        });
    };

    return (
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
};

export default AddOAuthSource;
