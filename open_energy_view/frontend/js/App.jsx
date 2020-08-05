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
import { getData } from "./api/DatabaseService";
import SourceRegistration from "./components/SourceRegistration";
import { useEffect } from "react";
import AddOAuthSource from "./components/AddOAuthSource"
import { handleErrors } from "./api/handleErrors"

const App = () => {
  const [loggedIn, setLoggedIn] = useState(cookie.load("logged_in"));
  const [view, setView] = useState(<Redirect to="/" />);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    restrictView();
  }, []);

  const restrictView = (selectedItem = null, partitionUpdate = null) => {
    //if (cookie.load("csrf_access_token")) cookie.save("logged_in", "csrf", { maxAge: 900 });
    setLoggedIn(cookie.load("logged_in"));

    if (cookie.load("logged_in")) {
      setView(<DataLoader />);
      getData(partitionUpdate).pipe(
        fork(
          (e) => handleErrors(e).then(
            () => restrictView(selectedItem, partitionUpdate),
            (component) => setView(component)))
          ((x) => {
            setSources(x);
            selectedItem = selectedItem ? selectedItem : x[0];

            const initView = selectedItem ? (
              <ViewTabs
                energyDisplayItem={selectedItem}
                restrictView={restrictView}
              />
            ) : (
                <SourceRegistration restrictView={restrictView} />
              );
            setView(initView);
          })

      )
    } else {
      setView(<Redirect to="/login" />);
    }
  };

  const sourceRegistration = () => {
    if (!loggedIn) setView(<Redirect to="/login" />);
    setView(<SourceRegistration restrictView={restrictView} />);
  };

  const bypassLogin = () => {
    if (loggedIn) return view;
    return <Login callback={restrictView} />;
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
        <Route path="/pge_oauth" component={AddOAuthSource} />
        <Route path="/test" component={TestResults} />
        <Route path="/login">{bypassLogin()}</Route>
        <Route exact path="/">{view}</Route>
        <Route exact path="/create_account">
          <UserRegistration callback={restrictView} />
        </Route>
      </Switch>
      <footer>Copyright 2020 J.P. Hutchins. All Rights Reserved.</footer>
    </Router>
  );
};

export default App;
