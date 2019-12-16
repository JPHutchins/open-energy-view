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

export function makeOptions(type) {
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
    scales: {
      xAxes: [
        {
          type: "time",
          bounds: "ticks",
          time: {
            unit: unit[type],
            displayFormats: displayFormats[type]
          },
          offset: false
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
