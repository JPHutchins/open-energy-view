import React, { useState } from "react";
import cookie from "react-cookies";
import SourceTabs from "./components/SourceTabs";
import Login from "./components/Login";
import NavigationBar from "./components/NavigationBar";
import UserRegistration from "./components/UserRegistration";
import SourceRegistration from "./components/SourceRegistration";
import EnergyHistory from "./components/EnergyHistory";
import EnergyDisplay from "./components/EnergyDisplay";
import { withRouter, Route, Switch, Redirect } from "react-router-dom";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { fetchData, fetchHours } from "./FunctionComps";
import DataLoader from "./components/DataLoader";

const testing = true;

const App = (props) => {
  const [view, setView] = useState(<Redirect to="/login" />);

  const restrictView = () => {
    if (cookie.load("logged_in")) {
      setView(<DataLoader />);

      Promise.allSettled([fetchHours("PG&E")]).then((p) => {
        p = p.map((res) => res.value)
        const sources = [
        //   {
        //     title: "PG&E",
        //     component: <EnergyHistory database={p[0]} />,
        //   },
          {
            title: "Functional",
            component: <EnergyDisplay database={p[0]} />,
          },
          {
            title: "Add New Source",
            component: <SourceRegistration />,
          },
        ];
        setView(<SourceTabs sources={sources} />);
      });
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
      <footer>Copyright 2020 J.P. Hutchins. All Rights Reserved.</footer>
    </>
  );
};

export default withRouter(App);
