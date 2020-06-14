import axios from "axios";
import React from "react";
import { Either } from "ramda-fantasy";
import { attemptP, fork, and, value, chain, parallel } from "fluture";
import AuthService from "./AuthService";
import { map, compose } from "ramda";
import { fromJS as toImmutableJSfromJS } from "immutable";
import EnergyDisplay from "../components/EnergyDisplay";
import { EnergyHistory } from "../data-structures/EnergyHistory";

export const addPgeSource = (regInfo) => {
  return axios.post("/api/add/pge", regInfo, AuthService.getAuthHeader());
};

export const getData = (source) => {
  return axios.post(
    "/api/data",
    { source: source },
    AuthService.getAuthHeader()
  );
};

export const getSourcesF = () => {
  return attemptP(() =>
    axios.post("/api/sources", {}, AuthService.getAuthHeader())
  );
};

export const getHours = (source) => {
  return axios.post(
    "/api/hours",
    { source: source },
    AuthService.getAuthHeader()
  );
};

export const getPartitionOptions = (source) => {
  return axios.post(
    "/api/partitionOptions",
    { source: source },
    AuthService.getAuthHeader()
  );
};

export const parseHourResponse = (res) => {
  const database = res.data.database.split(",");
  console.log(res)
  return {
    friendlyName: res.data.friendlyName,
    lastUpdate: res.data.lastUpdate,
    partitionOptions: res.data.partitionOptions,
    database: database.map((x) => makeChartJsDatabase(x)),
  };
};

const makeChartJsDatabase = (x) => {
  const secondsInHour = 3600;
  const msInSeconds = 1000;
  return {
    x: x.slice(0, 6) * secondsInHour * msInSeconds,
    y: parseInt(x.slice(6)),
  };
};

const makeSources = (energyHistoryInstance) => {
  return {
    title: energyHistoryInstance.friendlyName,
    component: <EnergyDisplay tester={energyHistoryInstance} />,
  };
};

const sourcesF = getSourcesF().pipe(map((x) => x.data));

const partitionScheme = Either.Right([
  { name: "Night", start: 1, color: "#FF0000" },
  { name: "Day", start: 7, color: "#00FF00" },
  { name: "Evening", start: 18, color: "#0000FF" },
]);

export const theFuture = sourcesF
  .pipe(map((x) => x.map(getEnergyHistory)))
  .pipe(chain(parallel(10)))
  .pipe(map(map(parseHourResponse)))
  .pipe(map(map((x) => new EnergyHistory(x))))
  .pipe(map(map(makeSources)));

export const getHoursF = (source) => {
  return attemptP(() =>
    axios.post("/api/hours", { source: source }, AuthService.getAuthHeader())
  );
};

export const getEnergyHistory = (source) => {
  return attemptP(() =>
    axios.post(
      "/api/energyHistory",
      { source: source },
      AuthService.getAuthHeader()
    )
  );
};

export const getDatabase = getHoursF(
  getSourcesF().pipe(map((x) => console.log(x)))
);

export const future = () => {
  return getSourcesF().pipe(fork(() => console.log("error"))(console.log));
};
