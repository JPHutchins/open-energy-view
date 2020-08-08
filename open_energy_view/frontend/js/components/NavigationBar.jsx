import React from "react";
import { withRouter } from "react-router-dom";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import AuthService from "../api/AuthService";

const NavigationBar = (props) => {
  const handleLogout = () => {
    AuthService.logOut()
      .then(props.history.push("/login"))
      .then(props.restrictView());
  };

  const sourceList = props.sources
    ? props.sources.map((source, i) => {
        return (
          <NavDropdown.Item
            onClick={() => handleSelect(source)}
            key={i}
          >
            {source.title}
          </NavDropdown.Item>
        );
      })
    : [];

  const handleAddNew = () => {
    props.sourceRegistration()
  };

  const handleSelect = (selectedItem) => {
    props.restrictView(selectedItem);
    props.history.push("/")
  };

  const loggedInItems = (
    <>
      <NavDropdown title="My Data" id="basic-nav-dropdown">
        {sourceList}
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={handleAddNew}>Add New</NavDropdown.Item>
      </NavDropdown>
      <NavDropdown title="My Account" id="basic-nav-dropdown">
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
      </NavDropdown>
    </>
  );

  const menuItems = props.loggedIn ? loggedInItems : <></>;

  return (
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand>Open Energy View</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">{menuItems}</Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default withRouter(NavigationBar);
