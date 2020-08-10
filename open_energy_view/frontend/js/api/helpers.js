import { map, compose } from "ramda";
import { calculatePassiveUse } from "../data-structures/helpers/calculatePassiveUse";
import { zipPassiveCalculation } from "../data-structures/helpers/zipPassiveCalculation";
import Either from "ramda-fantasy/src/Either";
import { defaultPartitions } from "../data-structures/helpers/defaultPartitions";
import { meanOf } from "../functions/meanOf";
import { tabulatePartitionSums } from "../functions/tabulatePartitionSums";
import { calculateSpikeUse } from "../data-structures/helpers/calculateSpikeUse";

export const parseHourResponse = (partitions) => (res) => {
  const parseDatabaseResponse = compose(map(formatPGEHourDB), (x) =>
    x.split(",")
  );

  let partitionOptions = res.data.partitionOptions
    ? Either.Right(res.data.partitionOptions)
    : Either.Right(defaultPartitions);

  if (partitions) {
    partitionOptions = Either.Right(partitions);
  }

  const responseString = res.data.useLocalStorage
    ? getLocalStorage(res.data.email, res.data.friendlyName)
    : updateLocalStorage(
        res.data.email,
        res.data.friendlyName,
        res.data.database,
        res.data.lastUpdate
      );

  const energyHistoryString = sliceEnergyHistoryStringFromResponse(
    responseString
  );

  const data = parseDatabaseResponse(energyHistoryString);
  const passiveUse = calculatePassiveUse(data);
  const spikes = calculateSpikeUse(data);
  const energyHistoryDatabase = zipPassiveCalculation(
    data,
    passiveUse.value,
    spikes
  );
  const partitionSums = tabulatePartitionSums(
    energyHistoryDatabase,
    partitionOptions
  );
  const hourlyMean = meanOf(data.map((x) => x.total));

  return {
    utility: res.data.utility,
    interval: res.data.interval,
    friendlyName: res.data.friendlyName,
    lastUpdate: res.data.lastUpdate,
    email: res.data.email,
    hourlyMean,
    partitionOptions,
    partitionSums,
    database: energyHistoryDatabase,
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

export const getLocalStorage = (email, source) => {
  return localStorage.getItem(`${email}${source}`);
};

const updateLocalStorage = (email, source, energyHistoryString, lastUpdate) => {
  const keyString = `${email}${source}`;
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).slice(0, keyString.length) === keyString) {
      localStorage.removeItem(localStorage.key(i));
    }
  }

  const lastUpdatePadded = JSON.stringify(lastUpdate).padStart(13, "0");
  const prefixedEnergyHistoryString = `${lastUpdatePadded}${energyHistoryString}`;

  localStorage.setItem(`${email}${source}`, prefixedEnergyHistoryString);
  return prefixedEnergyHistoryString;
};

const sliceEnergyHistoryString = (updateOrData) => (response) => {
  const LENGTH_OF_MS_TIMESTAMP = 13;
  if (updateOrData === "update")
    return response.slice(0, LENGTH_OF_MS_TIMESTAMP);
  if (updateOrData === "data") return response.slice(LENGTH_OF_MS_TIMESTAMP);
};
export const sliceLastUpdateFromResponse = sliceEnergyHistoryString("update");
const sliceEnergyHistoryStringFromResponse = sliceEnergyHistoryString("data");
