import React, { useState } from "react";
import cookie from "react-cookies";
import ViewTabs from "./components/ViewTabs";
import Login from "./components/Login";
import NavigationBar from "./components/NavigationBar";
import UserRegistration from "./components/UserRegistration";
import { Route, Switch, Redirect } from "react-router-dom";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import DataLoader from "./components/DataLoader";
import TestResults from "./components/TestResults";
import { HashRouter as Router } from "react-router-dom";
import { fork } from "fluture";
import { theFuture } from "./api/DatabaseService";
import SourceRegistration from "./components/SourceRegistration";

const App = () => {
  const [view, setView] = useState(<Redirect to="/login" />);
  const [sources, setSources] = useState([]);
  const [loggedIn, setLoggedIn] = useState(cookie.load("logged_in"));

  const restrictView = (selectedItem = null) => {
    setLoggedIn(cookie.load("logged_in"));

    if (cookie.load("logged_in")) {
      setView(<DataLoader />);
      theFuture.pipe(
        fork((x) => setView(<div>{JSON.stringify(x)}</div>))((x) => {
          setSources(x);
          selectedItem = selectedItem ? selectedItem : x[0];
          setView(<ViewTabs energyDisplayItem={selectedItem} />);
        })
      );
    } else {
      setView(<Redirect to="/login" />);
    }
  };

  const sourceRegistration = () => {
    if (!loggedIn) setView(<Redirect to="/login" />);

    setView(<SourceRegistration />);
  };

  return (
    <Router>
      <NavigationBar
        restrictView={restrictView}
        sourceRegistration={sourceRegistration}
        loggedIn={loggedIn}
        sources={sources}
      />
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
