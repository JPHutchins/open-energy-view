import React from "react";
import { withRouter } from "react-router-dom";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import AuthService from "../service/AuthService";
import DataRegistrationModal from "./DataRegistrationModal";

const NavigationBar = props => {
  const handleLogout = () => {
    AuthService.logOut()
      .then(props.history.push("/login"))
      .then(props.callback());
  };

  return (
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand href="#home">Energy History</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <NavDropdown title="My Account" id="basic-nav-dropdown">
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default withRouter(NavigationBar);
