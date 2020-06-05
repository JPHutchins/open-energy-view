export const chartOptions = {
    maintainAspectRatio: false,
    responsiveness: true,
    legend: {
      display: false,
    },
    scales: {
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Time Interval",
          },
          type: "time",
          bounds: "ticks",
          ticks: {
            beginAtZero: true,
            // labelOffset: xLabelOffset,
            // min: data[0].interval_start,
            // max: data[data.length - 1].interval_end - 1000,
          },
          time: {
            displayFormats: {
              hour: "hA",
              day: "M/D",
            },
          },
          offset:true,
          gridLines: {
            offsetGridLines: true,
          },
          barThickness: "flex",
        },
      ],
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Average Watts of Electricity",
          },
          ticks: {
            beginAtZero: true,
            min: 0,
            // suggestedMax: database.get("info").get("max_watt_hour")
            suggestedMax: 5000,
          },
        },
      ],
    },
  };