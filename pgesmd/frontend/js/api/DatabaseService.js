import axios from "axios";
import React from "react";
import {
  attemptP,
  fork,
  and,
  value,
  chain,
  parallel,
  reject,
  encase,
} from "fluture";
import AuthService from "./AuthService";
import { map, compose, mean } from "ramda";
import EnergyDisplay from "../components/EnergyDisplay";
import { EnergyHistory } from "../data-structures/EnergyHistory";
import SourceRegistration from "../components/SourceRegistration";
import { fromJS as toImmutableJSfromJS } from "immutable";
import { calculatePassiveUse } from "../data-structures/helpers/calculatePassiveUse";
import { zipPassiveCalculation } from "../data-structures/helpers/zipPassiveCalculation";
import { extract } from "../functions/extract";
import Either from "ramda-fantasy/src/Either";
import { defaultPartitions } from "../data-structures/helpers/defaultPartitions";
import { meanOf } from "../functions/meanOf";

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
  const parseDatabaseResponse = compose(
    toImmutableJSfromJS,
    map(formatPGEHourDB),
    (x) => x.split(",")
  );

  const data = parseDatabaseResponse(res.data.database);
  const passiveUse = calculatePassiveUse(data);
  const zipped = zipPassiveCalculation(data, passiveUse.value);
  const partitionOptions = res.data.partitionOptions
    ? Either.Right(res.data.partitionOptions)
    : Either.Right(defaultPartitions);

  return {
    utility: res.data.utility,
    interval: res.data.interval,
    friendlyName: res.data.friendlyName,
    lastUpdate: res.data.lastUpdate,
    hourlyMean: meanOf(extract("total")(data)),
    partitionOptions: partitionOptions,
    database: zipped,
  };
};

const formatPGEHourDB = (data) => {
  const secondsInHour = 3600;
  const msInSeconds = 1000;
  //TODO - validate input and fork

  return {
    x: data.slice(0, 6) * secondsInHour * msInSeconds,
    total: parseInt(data.slice(6)),
  };
};

const makeSources = (energyHistoryInstance) => {
  return {
    title: energyHistoryInstance.friendlyName,
    component: <EnergyDisplay energyHistoryInstance={energyHistoryInstance} />,
  };
};

const addNewSourceTab = (x) => {
  x.push({ title: "Add New Source", component: <SourceRegistration /> });
  return x;
};

const sourcesF = getSourcesF().pipe(map((x) => x.data));

export const theFuture = sourcesF
  .pipe(map((x) => x.map(getEnergyHistory)))
  .pipe(chain(parallel(10)))
  .pipe(map(map(parseHourResponse)))
  .pipe(map(map((x) => new EnergyHistory(x))))
  .pipe(map(map(makeSources)))
  .pipe(map(addNewSourceTab));

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
