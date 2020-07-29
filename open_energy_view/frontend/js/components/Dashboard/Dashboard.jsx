import React from "react";
import EnergyChart from "../History/EnergyChart";
import { EnergyHistory } from "../../data-structures/EnergyHistory";
import { sub, add, getYear, isBefore, set } from "date-fns";
import { endOf } from "../../functions/endOf";
import { startOf } from "../../functions/startOf";
import AnnualTrend from "../History/AnnualTrend";
import MiniPie from "../History/MiniPie";
import TrendChart from "../Trends/TrendChart";
import Trendline from "../History/Trendline";
import PatternDay from "../Patterns/PatternDay";
import { groupBy } from "../../functions/groupBy";
import "./Dashboard.css";
import CompleteHistoryLine from "./CompleteHistoryLine";
import Insights from "./Insights";
import Key from "./Key";
import { useState } from "react";

const Dashboard = ({ energyHistory }) => {
  const [mostIntensePart, setMostIntensePart] = useState("");
  const [mostUsedPart, setMostUsedPart] = useState("");
  const [trendingDescription, setTrendingDescription] = useState("");

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
  const recentDayGroups = dayGroups.slice(
    dayGroups.length - 28,
    dayGroups.length
  );
  const yLabelWidth = 50;
  const dayTotals = getMeans(dayGroups, "total", 24).slice(0, 24);
  const recentDayTotals = getMeans(recentDayGroups, "total", 24).slice(0, 24);

  return (
    <div className="main-tab-box">
      <h1>{energyHistory.friendlyName} Dashboard</h1>
      <hr />
      <div className="dashboard-container columns dev-border">
        <div className="recent dev-border">
          <div className="annual-trend dev-border">
            <AnnualTrend energyHistory={latestMonth} />
          </div>
          <div className="active-trend dev-border">
            <Trendline
              bigStyle={true}
              energyHistory={latestMonth}
              activeOrPassive="active"
              name="Active Trend"
              customPeriodName="past 4 weeks"
            />
          </div>
          <div className="passive-trend dev-border">
            <Trendline
              bigStyle={true}
              energyHistory={latestMonth}
              activeOrPassive="passive"
              name="Passive Trend"
              customPeriodName="past 4 weeks"
            />
          </div>
          <div className="week dev-border">
            <EnergyChart
              energyHistory={latestWeek}
              labelAxes={false}
              yTicksLimit={4}
            />
          </div>
        </div>
        <div className="pie dev-border">
          <MiniPie
            energyHistory={latestWeek}
            setMostIntensePart={setMostIntensePart}
            setMostUsedPart={setMostUsedPart}
          />
        </div>
        <Key energyHistory={energyHistory} />
        <Insights
          mostIntensePart={mostIntensePart}
          mostUsedPart={mostUsedPart}
          trendingDescription={trendingDescription}
        />
        <div className="day dev-border">
          <PatternDay
            energyHistory={latestWeek}
            dayTotals={dayTotals}
            recentDayTotals={recentDayTotals}
            yLabelWidth={yLabelWidth}
            showLegend={true}
            displayGridLines={false}
            title={"Daily Pattern"}
          />
        </div>
        <div className="complete dev-border">
          <CompleteHistoryLine
            energyHistory={complete}
            labelAxes={false}
            xTicksLimit={8}
            yTicksLimit={4}
          />
        </div>
        <div className="trend dev-border">
          <TrendChart
            getArrayArgs={[sliceLongTerm, "total"]}
            getRollingArrayArgs={[sliceLongTerm, "total", "month"]}
            title="Total Use"
            cacheKey="trend5" // this needs to be title + args
            cachePrefix={`${energyHistory.email}${energyHistory.friendlyName}`}
            order={0}
            setTrendingDescription={setTrendingDescription}
            hideRawData={false}
            widthClass={""}
            squareClass={""}
            showXAxesLabels={false}
            replaceXAxesLabels={
              <div className="pattern-week-labels-container">
                <div className="label-complete-history">
                  <div>
                    Past {Math.round(sliceLongTerm.length / 24 / 365)} year
                    {sliceLongTerm.length > 12 ? "s" : ""}
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
