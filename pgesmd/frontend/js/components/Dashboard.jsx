import React from "react";
import EnergyChart from "./History/EnergyChart";
import { EnergyHistory } from "../data-structures/EnergyHistory";
import { sub, add, getYear, isBefore, set } from "date-fns";
import { endOf } from "../functions/endOf";
import { startOf } from "../functions/startOf";
import AnnualTrend from "./History/AnnualTrend";
import MiniPie from "./History/MiniPie";
import TrendChart from "./Trends/TrendChart";
import Trendline from "./History/Trendline";
import PatternDay from "./Patterns/PatternDay";
import { groupBy } from "../functions/groupBy";

const Dashboard = ({ energyHistory }) => {
  const latestWeek = new EnergyHistory(
    energyHistory.response,
    {
      start: startOf("day")(
        add(endOf("day")(sub(energyHistory.lastDate, { weeks: 1 })), {
          hours: 1,
        })
      ),
      end: energyHistory.lastDate,
    },
    "Custom Range"
  );
  latestWeek.chartOptions.scales.yAxes[0].ticks.suggestedMax = 1000;
  latestWeek.chartOptions.scales.yAxes[0].ticks.maxTicksLimit = 4;

  const latestMonth = new EnergyHistory(
    energyHistory.response,
    {
      start: startOf("day")(
        add(endOf("day")(sub(energyHistory.lastDate, { weeks: 4 })), {
          hours: 1,
        })
      ),
      end: energyHistory.lastDate,
    },
    "Custom Range"
  );

  const complete = new EnergyHistory(
    energyHistory.response,
    { start: energyHistory.firstDate, end: energyHistory.lastDate },
    "Complete"
  );
  complete.chartOptions.scales.yAxes[0].ticks.suggestedMax = 1000;
  complete.chartOptions.scales.yAxes[0].ticks.maxTicksLimit = 4;
  complete.chartOptions.scales.xAxes[0].scaleLabel.display = false;
  const colors = ["red", "green", "blue"];
  complete.data.datasets.map((x, i) => {
    x.type = "line";
    if (i === 0) x.fill = true;
    if (i === 1) x.fill = false;
    if (i === 2) x.fill = "-1";
    x.pointRadius = 0;
    x.borderColor = colors[i];
    return x;
  });

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
  const sliceLongTerm = energyHistory
    .slice(dateMostYearsAgo, dateMostRecent)
    .toJS();

  const getMeans = (groups, type, hoursInEachGroup) => {
    const sums = groups.reduce((acc, day) => {
      for (let hour = 0; hour < day.size; hour++) {
        acc[hour] += day.get(hour).get(type);
      }
      return acc;
    }, new Array(hoursInEachGroup).fill(0));
    const means = sums.map((x) => x / groups.length);
    return means;
  };

  const dayGroups = groupBy("day")(energyHistory.database);
  const yLabelWidth = 50;
  const dayTotals = getMeans(dayGroups, "total", 24).slice(0, 24);

  return (
    <div className="main-tab-box">
      <h1>{energyHistory.friendlyName} Dashboard</h1>
      <div className="dash-primary-row space-around">
        <div className="short-stack">
          <div className="narrow-row">
            <AnnualTrend energyHistory={latestMonth} />
            <Trendline
              energyHistory={latestMonth}
              activeOrPassive="active"
              name="Active Use"
              customPeriodName="past 4 weeks"
            />
            <Trendline
              energyHistory={latestMonth}
              activeOrPassive="passive"
              name="Passive Use"
              customPeriodName="past 4 weeks"
            />
          </div>
          <EnergyChart energyHistory={latestWeek} />
        </div>
      </div>
      <div className="dash-primary-row space-around">
        <div>
          <div className="short-stack">
            <h4>Your normal usage each day</h4>
            <PatternDay
              energyHistory={latestWeek}
              dayTotals={dayTotals}
              yLabelWidth={yLabelWidth}
              showLegend={false}
            />
          </div>
        </div>
        <div>
          <MiniPie energyHistory={latestWeek} />
        </div>
        <div>
          <ul>
            <li>Energy is used most intensely in the evenings</li>
            <li>Overall, passive use accounts for the most energy</li>
            <li>
              Energy use is trending up year over year mostly due to increase
              passive use
            </li>
          </ul>
        </div>
      </div>
      <div className="dash-primary-row space-around">
        <div className="narrow-row space-around">
          <EnergyChart energyHistory={complete} />
          <TrendChart
            getArrayArgs={[sliceLongTerm, "total"]}
            getRollingArrayArgs={[sliceLongTerm, "total", "month"]}
            title="Total Use"
            cacheKey="trend5" // this needs to be title + args
            order={0}
          />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
