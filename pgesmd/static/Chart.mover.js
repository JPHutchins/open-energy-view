const intervalMap = {
  day: 86400000,
  week: 604800000
}

function findIndex(dates, date) {
  let start = 0, end = dates.length-1, mid = 0;

  while (start <= end) {
    mid = Math.floor((start + end) / 2);
    if (dates[mid] === date) return mid;  
    else if (dates[mid] < date) start = mid + 1;
    else end = mid - 1;
  }
  return mid;
}

function getSlicePoints(startId, endId) {
  var startDate = moment(document.getElementById(startId).value).valueOf();
  var endDate = moment(document.getElementById(endId).value).valueOf();
  var result = {
    start: findIndex(dates, startDate) + 1, // TZ and DST issues?
    end: findIndex(dates, endDate)
  };
  return result;
}
  
function previousInterval(interval, chart, dates, lookup) {
  intv = intervalMap[interval];
  var startDate = chart.data.datasets[0].data[0]["x"];
  var result = {
    start: findIndex(dates, startDate - intv),
    end: lookup[startDate]
  };
  return result;
}

function nextInterval(interval, chart, dates, lookup) {
  intv = intervalMap[interval];
  var startDate = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1]["x"];
  var result = {
    start: lookup[startDate] + 1,
    end: findIndex(dates, startDate + intv) + 1
  };
  return result;
}