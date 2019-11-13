function findEspiIndex(dates, date) {
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
    start: findEspiIndex(dates, startDate) + 1,
    end: findEspiIndex(dates, endDate)
  };
  return result;
}
  
function previousInterval(interval, chart, dates, lookup) {
  var startDate = chart.data.datasets[0].data[0]["x"];
  var firstEntry = chart.data.db_info.first_entry * 1000;

  var start = Math.max(firstEntry, moment(startDate).add(-1, interval).valueOf());
  var end = moment(start).add(1, interval).valueOf();
  
  start = findEspiIndex(dates, start);
  end = findEspiIndex(dates, end);

  var result = {
    start: start,
    end: end
  };
  return result;
}

function nextInterval(interval, chart, dates, lookup) {
  var startDate = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1]["x"];
  var lastEntry = chart.data.db_info.last_entry * 1000;

  var end = Math.min(lastEntry, moment(startDate).add(1, interval).valueOf());
  var start = moment(end).add(-1, interval).valueOf();

  start = findEspiIndex(dates, start) + 1;
  end = findEspiIndex(dates, end) + 1;
  
  var result = {
    start: start,
    end: end
  };
  return result;
}

function displayDates(i, j) {
  document.getElementById("firstChartDate").innerHTML = info[i].date;
  document.getElementById("lastChartDate").innerHTML = info[j].date;
}

function displayDates2(i, j) {
  document.getElementById("firstChartDate").innerHTML = info[i].date;
  document.getElementById("lastChartDate").innerHTML = info[j].date;
}

function getLatestWeeksData(part_data, db_info) {
  var i = part_data.length - 1;
  while (moment(part_data[i]["x"]).format('dddd') != 'Friday') {
    i--;
  };
  end = i + 1;
  start = findEspiIndex(dates, moment(part_data[end]["x"]).add(-1, "w").valueOf());
  var result = {
    start: start,
    end: end
  };
  return result;
}

function getCurrentWeeksData(part_data, current_moment) {
  i = findEspiIndex(dates, current_moment);
  while (moment(part_data[i]["x"]).format('dddd') != 'Saturday') {
    i++;
  };
  end = i;
  start = findEspiIndex(dates, moment(part_data[end]["x"]).add(-1, "w").valueOf());
  var result = {
    start: start,
    end: end
  };
  return result;
}