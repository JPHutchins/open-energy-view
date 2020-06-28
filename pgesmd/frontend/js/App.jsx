import React, { useState } from "react";
import cookie from "react-cookies";
import SourceTabs from "./components/SourceTabs";
import Login from "./components/Login";
import NavigationBar from "./components/NavigationBar";
import UserRegistration from "./components/UserRegistration";
import { Route, Switch, Redirect } from "react-router-dom";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import DataLoader from "./components/DataLoader";
import TestResults from "./components/TestResults";
import { HashRouter as Router } from "react-router-dom";
import { fork, value } from "fluture";
import { theFuture } from "./api/DatabaseService";

const App = () => {
  const [view, setView] = useState(<Redirect to="/login" />);

  const restrictView = () => {
    if (cookie.load("logged_in")) {
      setView(<DataLoader />);
      theFuture.pipe(
        fork((x) => setView(<div>{JSON.stringify(x)}</div>))((x) =>
          setView(<SourceTabs sources={x} />)
        )
      );
    } else {
      setView(<Redirect to="/login" />);
    }
  };

  return (
    <Router>
      <NavigationBar callback={restrictView} />
      <Switch>
        <Route path="/test" component={TestResults} />
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
      <footer>Copyright 2020 J.P. Hutchins. All Rights Reserved.</footer>
    </Router>
  );
};

export default App;
