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
import axios from "axios";
import { Button } from "react-bootstrap"
import Privacy from "./components/Privacy"

const App = () => {
  const [loggedIn, setLoggedIn] = useState(cookie.load("logged_in"));
  const [view, setView] = useState(<Redirect to="/login" />);
  const [sources, setSources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    restrictView();
  }, [loggedIn, selectedResource, sources, selectedTab, loading]);

  const restrictView = (
    selectedItem = null,
    partitionUpdate = null,
    loading = false,
    removeSource = null
  ) => {
    if (removeSource) {
      setSources(sources.filter((s) => s.title !== removeSource));
      if (sources.length === 1)
        return setView(<SourceRegistration restrictView={restrictView} />);
      setSelectedResource(selectedResource - 1);
    }

    if (loading) {
      const checkAgain = () => {
        axios.post("/api/web/task", {taskId: loading.taskId}).then((res) => {
          if (res.status === 200) {
            setLoading({
              ...loading,
              button: (
                <Button onClick={() => window.location.reload()}>
                  Complete! Reload Now
                </Button>
              ),
            });
          }
          if (res.status === 202) {
            setLoading(loading);
            setTimeout(checkAgain, 5000);
          }
        });
      };
      checkAgain();
    }

    const energyView = (
      <ViewTabs
        key={
          sources.length
            ? sources.reduce(
              (acc, x) => acc + x.title + x.component.startDate,
              ""
            )
            : "empty"
        }
        setSources={setSources}
        setView={setView}
        sources={sources}
        energyDisplayItem={sources[selectedResource] ? sources[selectedResource] : sources[0]}
        setSelectedTab={setSelectedTab}
        selectedTab={selectedTab}
        restrictView={restrictView}
      />
    );

    if (!cookie.load("logged_in")) {
      AuthService.refreshToken().then(restrictView);
    }

    if (sources.length > 0 && !partitionUpdate && !loading) {
      return setView(energyView);
    }

    setView(<DataLoader />);

    getData(partitionUpdate).pipe(
      fork((e) =>
        handleErrors(e).then(
          () => restrictView(selectedItem, partitionUpdate),
          (component) => setView(component)
        )
      )((energyHistorySources) => {
        if (energyHistorySources.length === 0) {
          return setView(<SourceRegistration restrictView={restrictView} />);
        }
        const selectedEnergyHistory = selectEnergyHistory(
          energyHistorySources,
          selectedItem
        );
        const initView =
          energyHistorySources.length > 0 ? (
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
        sourceRegistration={sourceRegistration}
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        setView={setView}
        setSources={setSources}
        setSelectedResource={setSelectedResource}
        setSelectedTab={setSelectedTab}
        setLoading={setLoading}
        sources={sources}
        restrictView={restrictView}
        loading={loading}
      />
      <Switch>
        <Route path="/login">{bypassLogin()}</Route>
        <Route path="/pge_oauth">
          <AddOAuthSource restrictView={restrictView} />
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
        <Route exact path="/privacy" component={Privacy}/>
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
