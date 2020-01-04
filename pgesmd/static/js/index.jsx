import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./App";
import "../css/App.css";
import configureStore from "./configureStore";

const store = configureStore();

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
