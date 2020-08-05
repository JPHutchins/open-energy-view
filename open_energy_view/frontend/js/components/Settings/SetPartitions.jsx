import React from "react";
import { Slider, Rail, Handles, Tracks, Ticks } from "react-compound-slider";
import { SliderRail, Handle, Track, Tick } from "./slider";
import { useState } from "react";
import { idToIndex } from "./functions";
import { to12Hour } from "../../functions/to12Hour";
import { Button } from "react-bootstrap";

// TODO: display all-time day average as preview?

const sliderStyle = {
  position: "relative",
  width: "100%",
};
const domain = [0, 23];

const SetPartitions = ({ existingPartitionOptions, restrictView }) => {
  const [currentHandle, setCurrentHandle] = useState(null);
  const [edit, hookSetEdit] = useState(null);
  const [partitions, setPartitions] = useState(existingPartitionOptions.value);

  const addPartition = (afterIndex) => {
    const updatedPartitions = Object.assign([], partitions);
    updatedPartitions.splice(afterIndex + 1, 0, {
      name: `Period ${afterIndex + 2}`,
      start: partitions[afterIndex].start + 1,
      color: "#D3D3D3",
    });
    setPartitions(updatedPartitions);
  };

  const removePartition = (index) => {
    if (partitions.length === 1) return;
    const updatedPartitions = Object.assign([], partitions);
    updatedPartitions.splice(index, 1);
    if (updatedPartitions.length === 1) {
      updatedPartitions[0].start = 0;
    }
    setPartitions(updatedPartitions);
  };

  const updatePartitions = (prop, newValue, handleId) => {
    const partitionIndex = idToIndex(handleId);
    const updatedPartition = {
      ...partitions[partitionIndex],
      [prop]: newValue,
    };
    const updatedPartitions = Object.assign([], partitions);
    updatedPartitions[partitionIndex] = updatedPartition;
    setPartitions(updatedPartitions);
  };

  const updateStartPoints = (newStartPoints) => {
    const updatedPartitions = Object.assign([], partitions).map((x, i) => ({
      ...x,
      start: newStartPoints[i],
    }));
    if (updatedPartitions.length === 1) {
      updatedPartitions[0].start = 0;
    }
    setPartitions(updatedPartitions);
  };

  const setEdit = (id) => {
    hookSetEdit(id === edit ? null : id);
  };

  // Adapted from react-compound-slider demos by Steve Hall
  // https://github.com/sghall/react-compound-slider

  return (
    <div>
      <Slider
        mode={2}
        step={1}
        domain={domain}
        rootStyle={sliderStyle}
        onChange={updateStartPoints}
        values={partitions.map((x) => x.start)}
      >
        <Rail>
          {({ getRailProps }) => (
            <SliderRail
              getRailProps={getRailProps}
              color={partitions[partitions.length - 1].color}
            />
          )}
        </Rail>
        <Handles>
          {({ handles, getHandleProps }) => (
            <div className="slider-handles">
              {handles.map((handle) => (
                <Handle
                  key={handle.id}
                  handle={handle}
                  domain={domain}
                  getHandleProps={getHandleProps}
                  updatePartitions={updatePartitions}
                  partitions={partitions}
                  name={partitions[idToIndex(handle.id)].name}
                  currentHandle={currentHandle}
                  setCurrentHandle={setCurrentHandle}
                  edit={edit}
                  setEdit={setEdit}
                  addPartition={addPartition}
                  removePartition={removePartition}
                />
              ))}
            </div>
          )}
        </Handles>
        <Tracks left={false} right={false}>
          {({ tracks, getTrackProps }) => (
            <div className="slider-tracks">
              {tracks.map(({ id, source, target }) => (
                <Track
                  key={id}
                  source={source}
                  target={target}
                  getTrackProps={getTrackProps}
                  color={partitions[idToIndex(id)].color}
                />
              ))}
            </div>
          )}
        </Tracks>
        <Ticks count={24}>
          {({ ticks }) => (
            <div className="slider-ticks">
              {ticks.map((tick) => (
                <Tick
                  key={tick.id}
                  tick={tick}
                  count={ticks.length}
                  format={to12Hour}
                />
              ))}
            </div>
          )}
        </Ticks>
      </Slider>
      <Button onClick={() => restrictView(null, partitions)} style={{ marginTop: "80px", width: "auto" }}>
        Save and Reload with Updated Time Periods
      </Button>
    </div>
  );
};
export default SetPartitions;
