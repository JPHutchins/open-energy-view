import React from "react";
import Trendline from "./Trendline";
import MiniPie from "./MiniPie";
import PartRadio from "./PartRadio";
import PartDropdown from "./PartDropdown";
import ViewTotal from "./ViewTotal";
import CarbonFootprint from "./CarbonFootprint";
import "../../css/App.css";
import SeasonalYoY from "./SeasonalYoY";
import { sum } from "ramda";

const RightBar = ({ energyHistory }) => {
  //   getData = (datasets, index) => {
  //     if (!datasets) return undefined;
  //     return datasets[index].data;
  //   };

  //   adjustForBaseline = () => {
  //     const data = getData(data, 0);
  //     if (!data) return undefined;

  //     const dataB = getData(data, 1);
  //     if (!dataB) return undefined;

  //     let output = [];

  //     for (let i = 0; i < data.length; i++) {
  //       output.push({
  //         x: data[i].x,
  //         y: data[i].y - data[i].baseline,
  //       });
  //     }

  //     return output;
  //   };

  return (
    <div className="right-bar">
      <ViewTotal energyHistory={energyHistory} />
      <CarbonFootprint energyHistory={energyHistory} />
      <SeasonalYoY energyHistory={energyHistory} />
      {/* <
      <div>
        <div className="kilowatt-hour">Activities</div>
        <MiniPie data={pieData} options={pieOptions} />
        <PartDropdown
          handleClick={handlePartPieView}
          defaultValue={defaultValue}
          selected={selectedPartPieView}
        />
      </div>
      <div>
        <Trendline
          data={getData(data, 0)}
          database={database}
          name="Active Use"
          range={range}
          baseline={false}
        />
      </div>
      <div>
        <Trendline
          data={getData(data, 0)}
          database={database}
          name="Background"
          range={range}
          baseline={true}
        />
      </div> */}
    </div>
  );
};
export default RightBar;
