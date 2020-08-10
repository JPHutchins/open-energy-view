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
import AddOAuthSource from "./components/AddOAuthSource";
import AddFakeOAuthSource from "./components/AddFakeOAuthSource";
import { handleErrors } from "./api/handleErrors";
import AuthService from "./api/AuthService";

const App = () => {
  const [loggedIn, setLoggedIn] = useState(cookie.load("logged_in"));
  const [view, setView] = useState(<Redirect to="/login" />);
  const [sources, setSources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    restrictView();
  }, [loggedIn, selectedResource, sources, selectedTab]);

  const restrictView = (selectedItem = null, partitionUpdate = null) => {
    console.log("Running restrict view")
    const energyView = (
      <ViewTabs
        key={Math.random()}
        setSources={setSources}
        sources={sources}
        energyDisplayItem={sources[selectedResource]}
        setSelectedTab={setSelectedTab}
        selectedTab={selectedTab}
        restrictView={restrictView}
      />
    );

    if (!cookie.load("logged_in")) {
      AuthService.refreshToken().then(restrictView);
    }

    if (sources.length > 0 && partitionUpdate === null)
      return setView(energyView);

    setView(<DataLoader />);

    getData(partitionUpdate).pipe(
      fork((e) =>
        handleErrors(e).then(
          () => restrictView(selectedItem, partitionUpdate),
          (component) => setView(component)
        )
      )((energyHistorySources) => {
        const selectedEnergyHistory = selectEnergyHistory(
          energyHistorySources,
          selectedItem
        );
        const initView = selectedEnergyHistory ? (
          energyView
        ) : (
          <SourceRegistration restrictView={restrictView} />
        );
        setSources(energyHistorySources);
        setView(initView);
        setLoggedIn(cookie.load("logged_in"));
      })
    );
  };

  const selectEnergyHistory = (energyHistorySources, selectedItem) => {
    let selectedEnergyHistory = selectedItem;
    if (selectedItem === "last") {
      selectedEnergyHistory =
        energyHistorySources[energyHistorySources.length - 1];
    } else if (selectedItem === null) {
      selectedEnergyHistory = energyHistorySources[0];
    }
    return selectedEnergyHistory;
  };

  const sourceRegistration = () => {
    if (!loggedIn) setView(<Redirect to="/login" />);
    setView(<SourceRegistration restrictView={restrictView} />);
  };

  const bypassLogin = () => {
    if (cookie.load("logged_in")) return view;
    return <Login callback={restrictView} />;
  };

  return (
    <Router>
      <NavigationBar
        //restrictView={restrictView}
        sourceRegistration={sourceRegistration}
        loggedIn={loggedIn}
        sources={sources}
        setSelectedResource={setSelectedResource}
        restrictView={restrictView}
      />
      <Switch>
        <Route path="/login">{bypassLogin()}</Route>
        <Route path="/pge_oauth">
          <AddOAuthSource />{" "}
        </Route>
        <Route path="/fake_oauth">
          <AddFakeOAuthSource restrictView={restrictView} />
        </Route>
        <Route path="/test" component={TestResults} />
        <Route exact path="/">
          {view}
        </Route>
        <Route exact path="/create_account">
          <UserRegistration callback={restrictView} />
        </Route>
        <Route><Redirect to="/login" /></Route>
      </Switch>
      <footer>Copyright 2020 J.P. Hutchins. All Rights Reserved.</footer>
    </Router>
  );
};

export default App;
