import { fastRollingMean } from "../../functions/fastRollingMean";
import { rolling } from "../../functions/rolling";
import { makeFillWindow } from "../../functions/makeFillWindow";
import { standardDeviationOf } from "../../functions/standardDeviationOf";
import { meanOf } from "../../functions/meanOf";

export function calculateSpikeUse(zippedDatabase) {
  const WINDOW = WINDOW; //hours
  const rawHours = zippedDatabase.map((x) => x.get("active")).toArray();

  const fillWindow = makeFillWindow(WINDOW)(rawHours);

  const rMeanRaw = fastRollingMean(WINDOW)(rawHours);
  const rMean = fillWindow(meanOf)(rMeanRaw);

  const _rStdRaw = rolling(standardDeviationOf, 24*28, rawHours);
  const _rStd = fillWindow(standardDeviationOf)(_rStdRaw);

  const spikes = new Array(rawHours.length).fill(0);
  for (let i = 0; i < rawHours.length; i++) {
    const wattHours = rawHours[i];
    const mean = rMean[i];
    const std = _rStd[i];

    if (wattHours > mean + std) {
      spikes[i] = wattHours - mean;
    }
  }
  
  return spikes;
}
