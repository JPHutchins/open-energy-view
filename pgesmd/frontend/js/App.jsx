import React from "react";
import {
  Navbar,
  Nav,
  NavDropdown,
  Form,
  FormControl,
  Button
} from "react-bootstrap";
import EnergyHistory from "./components/energyHistory";

export default class App extends React.Component {
  render() {
    return (
      <>
        <Navbar bg='dark' variant="dark">
          <Navbar.Brand href="#home">Energy Monitor</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link>History</Nav.Link>
              <Nav.Link>Insights</Nav.Link>
            </Nav>
            <Form inline>
              <FormControl
                type="text"
                placeholder="Questions"
                className="mr-sm-2"
              />
              <Button variant="outline-success">Search</Button>
            </Form>
          </Navbar.Collapse>
        </Navbar>
        <EnergyHistory />
      </>
    );
  }
}
