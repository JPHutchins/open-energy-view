import React from "react";
import { sub, set, getYear, isBefore } from "date-fns";
import { meanOf } from "../../functions/meanOf";
import { endOf } from "../../functions/endOf";
import TrendChart from "./TrendChart";
import { extract } from "../../functions/extract";
import { groupBy } from "../../functions/groupBy";

//TODO: loading spinner and/or send every calculateTrend call to webworkers
const Trends = ({ energyHistory }) => {
  const dateMostRecent = energyHistory.lastDate;
  const dateFourWeeksAgo = endOf("day")(sub(dateMostRecent, { days: 28 }));
  const sliceRecent = energyHistory
    .slice(dateFourWeeksAgo, dateMostRecent)
    .toJS();

  const yearOfFirstDate = getYear(energyHistory.firstDate);
  const tryFirstYear = set(dateMostRecent, { year: yearOfFirstDate });
  const dateMostYearsAgo = isBefore(tryFirstYear, energyHistory.firstDate)
    ? set(dateMostRecent, { year: yearOfFirstDate + 1 })
    : tryFirstYear;
  const sliceLongterm = energyHistory
    .slice(dateMostYearsAgo, dateMostRecent)
    .toJS();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "10px",
        position: "relative",
        margin: "auto",
        width: "100%",
      }}
    >
      <h1>{`${energyHistory.friendlyName} Energy Usage Trends`}</h1>
      <h2>Recent Trends</h2>
      <div className="day-week-pattern space-around">
        <TrendChart
          getArrayArgs={[sliceRecent, "total"]}
          getRollingArrayArgs={[sliceRecent, "total", "day"]}
          title="Total Use"
          cacheKey="trend1"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={0}
        />
        <TrendChart
          getArrayArgs={[sliceRecent, "active"]}
          getRollingArrayArgs={[sliceRecent, "active", "day"]}
          title="Active Use"
          cacheKey="trend2"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={1}
        />
        <TrendChart
          getRollingArrayArgs={[sliceRecent, "passive", "day"]}
          title="Passive Use"
          cacheKey="trend3"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={2}
        />
        <TrendChart
          getRollingArrayArgs={[sliceRecent, "spike", "day"]}
          title="Appliance Use"
          cacheKey="trend4"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={3}
        />
      </div>
      <h2>Longterm Trends</h2>
      <div className="day-week-pattern space-around">
        <TrendChart
          getArrayArgs={[sliceLongterm, "total"]}
          getRollingArrayArgs={[sliceLongterm, "total", "month"]}
          title="Total Use"
          cacheKey="trend5"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={4}
          hideRawData={false}
        />
        <TrendChart
          getArrayArgs={[sliceLongterm, "active"]}
          getRollingArrayArgs={[sliceLongterm, "active", "month"]}
          title="Active Use"
          cacheKey="trend6"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={5}
          hideRawData={false}
        />
        <TrendChart
          getArrayArgs={[sliceLongterm, "passive"]}
          getRollingArrayArgs={[sliceLongterm, "passive", "month"]}
          title="Passive Use"
          cacheKey="trend7"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={6}
          hideRawData={false}
        />
        <TrendChart
          getRollingArrayArgs={[sliceLongterm, "spike", "month"]}
          title="Appliance Use"
          cacheKey="trend8"
          cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
          order={7}
        />
      </div>
    </div>
  );
};
export default Trends;
