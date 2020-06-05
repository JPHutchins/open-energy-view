import React, { useState } from "react";
import cookie from "react-cookies";
import SourceTabs from "./components/SourceTabs";
import Login from "./components/Login";
import NavigationBar from "./components/NavigationBar";
import UserRegistration from "./components/UserRegistration";
import SourceRegistration from "./components/SourceRegistration";
//import EnergyHistory from "./components/EnergyHistory";
import { EnergyHistory } from "./data-structures/EnergyHistory";
import EnergyDisplay from "./components/EnergyDisplay";
import { withRouter, Route, Switch, Redirect } from "react-router-dom";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { fetchData, fetchHours } from "./FunctionComps";
import DataLoader from "./components/DataLoader";
import TestResults from "./components/TestResults";
import { HashRouter as Router } from "react-router-dom";
import { startOfDay, endOfDay } from "date-fns";
import { Either } from "ramda-fantasy";

const testing = true;

const App = (props) => {
  const [view, setView] = useState(<Redirect to="/login" />);

  const restrictView = () => {
    if (cookie.load("logged_in")) {
      setView(<DataLoader />);

      Promise.allSettled([fetchHours("PG&E")]).then((p) => {
        p = p.map((res) => res.value);

        const partitionScheme = Either.Right([
          { name: "Night", start: 1, color: "#FF0000" },
          { name: "Day", start: 7, color: "#00FF00" },
          { name: "Evening", start: 18, color: "#0000FF" },
        ]);

        const tester = new EnergyHistory(p[0], partitionScheme);

        const sources = [
          //   {
          //     title: "PG&E",
          //     component: <EnergyHistory database={p[0]} />,
          //   },
          {
            title: "Functional",
            component: <EnergyDisplay tester={tester} />,
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
