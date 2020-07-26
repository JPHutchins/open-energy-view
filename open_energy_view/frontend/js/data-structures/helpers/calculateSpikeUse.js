import { fastRollingMean } from "../../functions/fastRollingMean";
import { rolling } from "../../functions/rolling";
import { makeFillWindow } from "../../functions/makeFillWindow";
import { standardDeviationOf } from "../../functions/standardDeviationOf";
import { meanOf } from "../../functions/meanOf";

export function calculateSpikeUse(zippedDatabase) {
  const WINDOW = 48; //hours
  const rawHours = zippedDatabase.map((x) => x.get("active")).toArray();

  const fillWindow = makeFillWindow(WINDOW)(rawHours);
  const fillWindowS = makeFillWindow(24*14)(rawHours)

  const rMeanRaw = fastRollingMean(WINDOW)(rawHours);
  const rMean = fillWindow(meanOf)(rMeanRaw);

  const _rStdRaw = rolling(standardDeviationOf, 24*14, rawHours);
  const _rStd = fillWindowS(standardDeviationOf)(_rStdRaw);

  const spikes = new Array(rawHours.length).fill(0);
  for (let i = 0; i < rawHours.length; i++) {
    const wattHours = rawHours[i];
    const mean = rMean[i];
    const std = _rStd[i];

    if (wattHours > mean + 2*std) {
      spikes[i] = wattHours - mean;
    }
  }
  
  return spikes;
}
