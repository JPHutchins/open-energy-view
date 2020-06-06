export const testPerformance = (props) => {
  console.log(partitionScheme);
  console.log(props.database.last());
  const start = startOf("day")(new Date(props.database.last().get("x")));
  const end = endOf("day")(start);
  const test = new EnergyHistory(props.database, partitionScheme, {
    start: start,
    end: end,
  });
  console.log(test);
  console.log(test.prev());
  console.log(test.prev().prev());

  console.log(props);
  let input = Array.from({ length: 2000 }, () =>
    Math.floor(Math.random() * 1000)
  );

  var t0 = performance.now();
  var result = sumPartitions(partitionScheme)(props.database);
  var t1 = performance.now();
  console.log(
    "sumPartitions() took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = fastRollingMean(14, input);
  var t1 = performance.now();
  console.log(
    "fastRollingMean() took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = rolling(meanOf, 14, input);
  var t1 = performance.now();
  console.log(
    "rolling(mean) took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = rolling(standardDeviationOf, 14, input).slice(13);
  var t1 = performance.now();
  console.log(
    "rolling(standardDeviationOf) took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  var result = standardDeviationOf(input);
  var t1 = performance.now();
  console.log(
    "Took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  const colors = makeColorsArray(partitionScheme)(props.database.slice(-24));
  console.log(colors.toArray());
  //.slice(-720, -696)
  console.log(input);
  input = minOfEachDay(groupByDay(props.database));
  console.log(extract("y")(input));

  const makeCalculateBackgroundMetric = (window, database) => {
    return compose(
      chain(makeFillWindow(window)(database)(meanOf)),
      map(fastRollingMean(window)),
      chain(removeOutliers(window))
    );
  };

  var time = Either.Right(extract("x")(input));

  var t0 = performance.now();
  //   var result = Either.Right(extract('y')(input))
  //     .chain(removeOutliers(14))
  //     .chain(fastRollingMean(14))
  //     .chain(makeFillWindow(14)(extract('y')(input))(meanOf));

  //   var result = zipWith((x, y) => ({x: x, y: y}), time.value, result.value)
  var result = calculatePassiveUse(props.database);
  console.log(result[result.length - 30]); // {x: 1586761200000, y: 1204.923469387756}
  console.log(result);

  var t1 = performance.now();
  console.log(
    "removeOutliers() & average took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  const calculateBG = makeCalculateBackgroundMetric(14, extract("y")(input));
  console.log(calculateBG);
  console.log(calculateBG(Either.Right(extract("y")(input))));

  var t0 = performance.now();
  var result = removeOutliers(input, 14);
  var t1 = performance.now();
  console.log(
    "removeOutliers() took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  var t0 = performance.now();
  result = groupByDay(props.database);
  var t1 = performance.now();
  console.log(
    "Took",
    (t1 - t0).toFixed(4),
    "milliseconds to generate:",
    result
  );

  //   for (const day of result) {
  //     console.log("------------------------------------");
  //     for (const hour of day) {
  //       console.log(moment(hour.get("x")).toString(), hour.get("y"));
  //     }
  //   }
};
