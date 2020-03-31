import React, { useState } from "react";
import cookie from "react-cookies";
import SourceTabs from "./components/SourceTabs";
import Login from "./components/Login";
import NavigationBar from "./components/NavigationBar";
import UserRegistration from "./components/UserRegistration";
import { withRouter, Route, Switch, Redirect } from "react-router-dom";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

const testing = true;

const App = props => {
  const [view, setView] = useState(<Redirect to="/login" />);

  const restrictView = () => {
    if (cookie.load("logged_in")) {
      setView(<SourceTabs />);
    } else {
      setView(<Redirect to="/login" />);
    }
  };

  return (
    <>
      <NavigationBar callback={restrictView} />
      <Switch>
        <Route path="/login">
          <Login callback={restrictView} />
        </Route>
        <Route exact path="/">
          {view}
        </Route>
        <Route exact path="/create_account">
          <UserRegistration callback={restrictView} />
        </Route>
      </Switch>
    </>
  );
};

export default withRouter(App);
