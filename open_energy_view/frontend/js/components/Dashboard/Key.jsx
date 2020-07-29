import React from "react";
import { to12Hour } from "../../functions/to12Hour";
import { editHsl } from "../../functions/editHsl";

const Key = ({ energyHistory }) => {
  const formatPartitions = (partitionOptions, numberOfAppended) => {
    return partitionOptions.map((part, i) => {
      const legend = (
        <div
          style={{
            height: 15,
            width: 15,
            margin: "2px 10px 2px 5px",
            backgroundColor: part.color,
          }}
        />
      );
      const start = part.start != null ? `: ${to12Hour(part.start)} - `: "";
      const endH =
        i < partitionOptions.length - 1 - numberOfAppended
          ? partitionOptions[i + 1].start
          : partitionOptions[0].start;
      const end = part.start != null ? to12Hour(endH) : "";
      return (
        <div key={part.name} style={{ display: "flex", alignItems: "center" }}>
          {legend} {part.name}{start}{end}
        </div>
      );
    });
  };

  const appendedParts = energyHistory.partitionOptions.value.concat([
    {
      name: "Passive",
      start: null,
      color: editHsl("hsl(275, 9%, 37%)", { s: (s) => 0, l: (l) => 85 }),
    },
    {
      name: "Appliance",
      start: null,
      color: editHsl("hsl(275, 9%, 37%)", {
        s: (s) => Math.min(100, s * 2),
        l: (l) => (l + 200) / 3,
      }),
    },
  ]);

  const keyList = formatPartitions(appendedParts, 2);

  return (
    <div className="key dev-border">
      {keyList}
    </div>
  );
};
export default Key;
