import React from "react";
import { ChromePicker } from "react-color";
import { useState } from "react";
import { idToIndex } from "./functions";

const ColorPicker = ({ updatePartitions, handleId, partitions }) => {
  const [color, setColor] = useState(partitions[idToIndex(handleId)].color);

  const handleColorChange = (color) => {
    const hslString = `hsl(${Math.round(color.hsl.h)}, ${Math.round(
      color.hsl.s * 100
    )}%, ${Math.round(color.hsl.l * 100)}%)`;
    setColor(hslString);
    updatePartitions("color", hslString, handleId);
  };

  return (
    <div className="color-picker">
      <div className="color-picker__popover">
        <ChromePicker
          styles={{
            backgroundColor: "transparent",
            default: { picker: { boxShadow: "none" } },
          }}
          color={color}
          onChange={handleColorChange}
        />
      </div>
    </div>
  );
};
export default ColorPicker;
