import axios from "axios";
import React from "react";
import { attemptP, chain, parallel, mapRej, encaseP } from "fluture";
import cookie from "react-cookies";
import AuthService from "./AuthService";
import { map } from "ramda";
import EnergyDisplay from "../components/History/EnergyDisplay";
import { EnergyHistory } from "../data-structures/EnergyHistory";
import { parseHourResponse } from "./helpers";
import { getLocalStorage } from "./helpers";
import { sliceLastUpdateFromResponse } from "./helpers";
import SourceRegistration from "../components/SourceRegistration";

export const addCustomSource = (regInfo) => {
  return axios.post(
    "/api/web/add/custom-source",
    regInfo,
    AuthService.getAuthHeader()
  );
};

export const getPartitionOptions = (source) => {
  return axios.post(
    "/api/web/partition-options",
    { source: source },
    AuthService.getAuthHeader()
  );
};

const makeSources = (energyHistoryInstance) => {
  return {
    title: energyHistoryInstance.friendlyName,
    component: <EnergyDisplay energyHistoryInstance={energyHistoryInstance} />,
    currentTab: 0,
  };
};

export const requestSources = () => {
  return attemptP(() => {
    if (cookie.load("csrf_access_token")) {
      return axios.post("/api/web/sources", {}, AuthService.getAuthHeader());
    } else {
      return Promise.reject("No token available.")
    }
  });
};

export const getHourlyData = (source) => {
  const email = cookie.load("logged_in");
  const localStorageString = getLocalStorage(email, source);
  const lastUpdate = localStorageString
    ? sliceLastUpdateFromResponse(localStorageString)
    : null;

  return attemptP(() =>
    axios.post(
      "/api/web/data/hours",
      { source, lastUpdate },
      AuthService.getAuthHeader()
    )
  );
};

const refreshToken = () => {
  return encaseP(AuthService.refreshToken)();
};

export const getData = (partitions) => {
  return requestSources()
    .pipe(mapRej(refreshToken))
    .pipe(requestSources)
    .pipe(map((x) => x.data))
    .pipe(map(map(getHourlyData)))
    .pipe(chain(parallel(10)))
    .pipe(map(map(parseHourResponse(partitions))))
    .pipe(map(map((x) => new EnergyHistory(x))))
    .pipe(map(map(makeSources)));
};
