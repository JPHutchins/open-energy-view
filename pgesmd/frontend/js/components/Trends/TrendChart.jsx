import React from "react";
//import Worker from "./trend.worker.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns/esm";
import { makeTrendDescription, calculateTrend } from "./functions";
import { useEffect } from "react";
import { useState } from "react";
import Loader from "react-loader-spinner";

const TrendChart = ({
  getArrayArgs,
  getRollingArrayArgs,
  rollingLabel = "Average",
  title,
  cacheKey,
  cachePrefix,
  order,
  setTrendingDescription = () => null,
  hideRawData = true,
  showXAxesLabels = true,
  replaceXAxesLabels,
  widthClass = "wide-228",
  squareClass = "square-228",
}) => {
  const [showLine, setShowLine] = useState(false);
  const [workerData, setWorkerData] = useState({
    trendPercent: 0,
    trendPoints: [],
    rawData: null,
    rollingData: [{}],
  });
  const { trendPercent, trendPoints, rawData, rollingData } = workerData;

  cacheKey = `${cachePrefix}${cacheKey}`;

  useEffect(() => {
    const trendWorker = new Worker("./trend.worker.js", { type: "module" });
    let timeoutInstance = "";
    trendWorker.onmessage = (e) => {
      timeoutInstance = setTimeout(
        () =>
          setWorkerData({
            trendPercent: e.data.trendPercent,
            trendPoints: e.data.trendPoints,
            rawData: e.data.rawData,
            rollingData: e.data.rollingData,
          }),
        order * 100
      );
      if (e.data.trendPercent === 0)
        setTrendingDescription({ upDownFlat: "flat" });
      else if (e.data.trendPercent > 0)
        setTrendingDescription({ upDownFlat: "up" });
      else if (e.data.trendPercent < 0)
        setTrendingDescription({ upDownFlat: "down" });
      trendWorker.terminate();
      localStorage.setItem(cacheKey, JSON.stringify(e.data));
    };
    const cache = localStorage.getItem(cacheKey);
    trendWorker.postMessage({ getArrayArgs, getRollingArrayArgs, cache });

    return () => {
      trendWorker.terminate();
      clearTimeout(timeoutInstance)
    }
  }, []);

  const greenOrOrange = trendPercent <= 0 ? "green" : "orange";

  const dataToUseForTrend = rawData ? rawData : rollingData;
  const trendData = [
    { x: dataToUseForTrend[0].x, y: trendPoints[0] },
    {
      x: dataToUseForTrend[dataToUseForTrend.length - 1].x,
      y: trendPoints[1],
    },
  ];

  const datasets = [
    {
      data: trendData,
      type: "line",
      label: "Trend",
      borderColor: greenOrOrange,
      fill: false,
      pointRadius: 3,
      hoverRadius: 6,
    },
    {
      data: rollingData,
      label: rollingLabel,
      borderColor: "#5f5566",
      pointBackgroundColor: "gray",
      showLine: showLine,
      fill: false,
      hoverRadius: 6,
    },
    {
      data: rawData,
      type: "scatter",
      label: "Readings",
      hidden: hideRawData,
      hoverRadius: 6,
    },
  ];

  if (!rawData) datasets.pop();

  const data = {
    datasets: datasets,
  };

  const tooltipLabel = (tooltipItems) => {
    const labels = data.datasets.map((x) => x.label);
    const label = labels[tooltipItems.datasetIndex];
    return `${Math.round(tooltipItems.yLabel)} ${label} Whs`;
  };

  const tooltipTitle = (tooltipItems) => {
    const date = new Date(tooltipItems[0].label);
    if (tooltipItems[0].datasetIndex === 0) {
      return format(date, "eeee, MMM do, ha");
    }
  };

  const afterFit = showXAxesLabels
    ? (scaleInstance) => (scaleInstance.height = 50)
    : (scaleInstance) => (scaleInstance.height = 0);

  const options = {
    animation: {
      duration: 500,
    },
    legend: {
      display: true,
      position: "top",
      labels: {
        boxWidth: 10,
        fontSize: 10,
      },
    },
    hover: {
      mode: "nearest",
      intersect: true,
      onHover: (e, elem) => {
        if (!elem) return setShowLine(false);
        if (!elem[0]) return setShowLine(false);
        if (elem[0]._datasetIndex === 1) {
          setShowLine(true);
        }
      },
    },
    tooltips: {
      callbacks: {
        label: tooltipLabel,
        title: tooltipTitle,
      },
    },
    responsiveness: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 3,
      },
    },
    scales: {
      xAxes: [
        {
          afterFit: afterFit,
          gridLines: {
            display: false,
          },
          type: "time",
        },
      ],
      yAxes: [
        {
          ticks: {
            min: 0,
            maxTicksLimit: 5,
          },
        },
      ],
    },
  };

  const content =
    rollingData.length > 1 ? (
      <div className={`pattern-flex-1 ${widthClass}`}>
        <h4>{title}</h4>
        <div className="info-details">{makeTrendDescription(trendPercent)}</div>
        <div className={`pattern-chartJS-box ${squareClass}`}>
          <Line data={data} options={options} />
        </div>
        {replaceXAxesLabels}
      </div>
    ) : (
      <div className={`pattern-flex-1 ${widthClass}`}>
        <h4>{title}</h4>
        <div className="info-details">loading...</div>
        <div className={`pattern-chartJS-box ${squareClass}`}>
          <Line data={data} options={options} />
        </div>
      </div>
    );

  return content;
};
export default TrendChart;
