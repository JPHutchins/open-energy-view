export function getPromise() {
  return new Promise(function(resolve, reject) {
    const request = new XMLHttpRequest();
    request.open("GET", "/data/json");
    request.onreadystatechange = function() {
      if (
        request.readyState === XMLHttpRequest.DONE &&
        request.status === 200
      ) {
        try {
          resolve(JSON.parse(request.responseText));
        } catch (e) {
          reject(e);
        }
      }
    };
    request.send();
  });
}

export function makeOptions(data, callback, database, chart) {
  const type = data[0].type;

  let xLabelOffset = 0;
  if (chart) {
    switch (type) {
      case "hour" || "month":
        break;
      default:
        const xScale = chart.scales["x-axis-0"];
        xLabelOffset =
          (xScale.getPixelForTick(1) - xScale.getPixelForTick(0)) / 2;
    }
  }
  const unit = {
    hour: "hour",
    part: "day",
    day: "day",
    week: "month",
    month: "month"
  };
  const displayFormats = {
    hour: {
      hour: "hA"
    },
    part: {
      day: "dddd"
    },
    day: {
      day: "M/D"
    },
    week: {
      month: "MMMM"
    },
    month: {
      month: "MMMM YYYY"
    }
  };
  const options = {
    maintainAspectRatio: false,
    responsiveness: true,
    onClick: (event, array) => callback(array[0]._index),
    legend: {
      display: false
    },
    scales: {
      xAxes: [
        {
          type: "time",
          bounds: "ticks",
          ticks: {
            beginAtZero: true,
            labelOffset: xLabelOffset,
            min: data[0].interval_start,
            max: data[data.length - 1].interval_end - 1000
          },
          time: {
            unit: unit[type],
            displayFormats: displayFormats[type]
          },
          offset: false,
          gridLines: {
            offsetGridLines: false
          }
        }
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            min: 0,
            // suggestedMax: database.get("info").get("max_watt_hour")
            suggestedMax: 5000
          }
        }
      ]
    }
  };
  return options;
}

export function getDataNow() {
  const request = new XMLHttpRequest();
  request.open("GET", "/data/json/now", false);
  request.send(null);
  if (request.status === 200) {
    try {
      return JSON.parse(request.responseText);
    } catch (e) {
      console.log(e);
    }
  }
}

export async function getCompleteData() {
  let response = await fetch("/data/json");
  let data = await response.json();
  return data;
}

function getEnergyHistory(promise) {
  promise()
    .then(function(text) {
      return text;
    })
    .catch(function(err) {
      console.log(err);
    });
}

export function add(x, y) {
  return x + y;
}
