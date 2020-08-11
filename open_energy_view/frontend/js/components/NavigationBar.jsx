import React from "react";
import { withRouter } from "react-router-dom";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import AuthService from "../api/AuthService";
import { mdiGamepadCircleOutline } from "@mdi/js";
import Icon from "@mdi/react";
import DataLoader from "./DataLoader";
import cookie from "react-cookies"

const NavigationBar = (props) => {
  const handleLogout = () => {
    AuthService.logOut().then(() => {
      props.setSources([]);
      props.history.push("/login");
    });
    props.setLoggedIn(false);
    props.setView(<DataLoader />);
    props.setSelectedResource(0);
    props.setSelectedTab(0);
    props.setLoading(0);
  };

  const sourceList = props.sources
    ? props.sources.map((source, i) => {
        return (
          <NavDropdown.Item onClick={() => handleSelect(source)} key={i}>
            {source.title}
          </NavDropdown.Item>
        );
      })
    : [];

  const handleAddNew = () => {
    props.sourceRegistration();
  };

  const handleSelect = (selectedItem) => {
    props.setSelectedResource(
      props.sources.reduce(
        (acc, x, i) => (x.title === selectedItem.title ? i : acc),
        0
      )
    );
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

  const loadingStatus = () => {
    if (props.loading && props.loading.button) {
      return props.loading.button;
    }
    if (props.loading && props.loading.name) {
      return (
        <div style={{ display: "flex", flexDirection: "row" }}>
          {`Loading data for ${props.loading.name}  `}
          <Icon
            className="sidebar-icon rotate"
            color="white"
            height="25px"
            path={mdiGamepadCircleOutline}
          />
        </div>
      );
    }
  };

  return (
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand>Open Energy View</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">{menuItems}</Nav>
      </Navbar.Collapse>
      <Nav.Item className="loading-historical">{loadingStatus()}</Nav.Item>
      <Nav.Item>
        <Nav.Link
          className="navbar-link"
          href="https://github.com/JPHutchins/open-energy-view"
          target="_blank"
        >
          About{" "}
        </Nav.Link>
      </Nav.Item>
    </Navbar>
  );
};

export default withRouter(NavigationBar);
