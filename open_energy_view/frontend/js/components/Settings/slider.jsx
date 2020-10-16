// Adapted from react-compound-slider demos by Steve Hall
// https://github.com/sghall/react-compound-slider

import React, { Fragment } from "react";
import PropTypes from "prop-types";
import ColorPicker from "./ColorPicker";
import { idToIndex } from "./functions";

// *******************************************************
// RAIL
// *******************************************************
const railOuterStyle = {
  position: "absolute",
  width: "100%",
  height: 42,
  transform: "translate(0%, -50%)",
  cursor: "pointer",
};

const railInnerStyle = (color) => ({
  position: "absolute",
  width: "100%",
  height: 14,
  transform: "translate(0%, -50%)",
  pointerEvents: "none",
  backgroundColor: color,
});

export function SliderRail({ getRailProps, color }) {
  return (
    <Fragment>
      <div style={railOuterStyle} {...getRailProps()} />
      <div style={railInnerStyle(color)} />
    </Fragment>
  );
}

const hoverHandlePopup = (
  percent,
  setEdit,
  setCurrentHandle,
  addPartition,
  id
) => (
  <>
    <div
      style={{
        left: `${percent}%`,
        position: "absolute",
        transform: "translate(-16px, 40px)",
        transformOrigin: "bottom left",
        zIndex: 14,
        padding: "5px",
        backgroundColor: "#5f5566",
        color: "white",
        cursor: "pointer",
        paddingLeft: 10,
        paddingRight: 10,
      }}
      onClick={() => {
        setEdit(id);
        setCurrentHandle(null);
      }}
    >
      Edit
    </div>
    <div
      style={{
        left: `${percent}%`,
        position: "absolute",
        transform: "translate(32px, 40px)",
        transformOrigin: "bottom left",
        zIndex: 14,
        padding: "5px",
        backgroundColor: "#5f5566",
        color: "white",
        cursor: "pointer",
        paddingLeft: 10,
        paddingRight: 10,
      }}
      onClick={() => {
        addPartition(idToIndex(id));
      }}
    >
      Add
    </div>
  </>
);

const editMenu = (
  percent,
  setEdit,
  updatePartitions,
  id,
  partitions,
  removePartition,
  name
) => (
  <div
    style={{
      left: `${Math.min(
        percent,
        ((window.innerWidth - 250) / window.innerWidth) * 100
      )}%`,
      position: "absolute",
      transform: "translate(0px, 45px)",
      zIndex: 15,
      width: 240,
      height: "auto",
      boxShadow: "0px 0px 5px -3px",
      backgroundColor: "white",
    }}
  >
    <div
      style={{
        position: "absolute",
        right: 5,
        top: 5,
        width: "auto",
        height: 20,
        border: "none",
        color: "gray",
        fontSize: "12px",
        cursor: "pointer",
      }}
      onClick={() => setEdit(null)}
    >Close</div>
    <div style={{ margin: "0 auto", width: 225 }}>
      Edit Time Period
    </div>
    <hr/>
    <div style={{ margin: "10px", width: 225, display: "grid", gridTemplateColumns: "auto auto", alignItems: "start" }}>
      <label>Name: </label>
      <input
        style={{
          textAlign: "left",
          backgroundColor: "transparent",
          width: "100%"
        }}
        id="changeName"
        type="text"
        placeholder={name || ""}
        onChange={(e) => updatePartitions("name", e.currentTarget.value, id)}
      />
      
    </div>
    <div
      style={{
        width: "225px",
        margin: "0 auto",
      }}
    >
      <ColorPicker
        handleId={id}
        updatePartitions={updatePartitions}
        partitions={partitions}
      />
    </div>
    <div
      style={{
        width: "auto",
        margin: "10px",
        border: "none",
        textAlign: "center",
        color: "white",
        backgroundColor: "#5f5566",
        cursor: "pointer",
      }}
      onClick={(e) => {
        e.stopPropagation();
        removePartition(idToIndex(id));
        setEdit(null);
      }}
    >
      Remove This Period
    </div>
  </div>
);

SliderRail.propTypes = {
  getRailProps: PropTypes.func.isRequired,
};

// *******************************************************
// HANDLE COMPONENT
// *******************************************************
export function Handle({
  domain: [min, max],
  handle: { id, value, percent },
  disabled,
  getHandleProps,
  updatePartitions,
  partitions,
  name,
  currentHandle,
  setCurrentHandle,
  edit,
  setEdit,
  addPartition,
  removePartition,
}) {
  return (
    <Fragment>
      <div
        onMouseEnter={() => setCurrentHandle(id)}
        onMouseLeave={() => setCurrentHandle(null)}
        style={{
          left: `${percent}%`,
          position: "absolute",
          transform: "translate(-50%, -50%)",
          WebkitTapHighlightColor: "rgba(0,0,0,0)",
          zIndex: 5,
          width: 28,
          height: 42,
          cursor: "pointer",
          backgroundColor: "none",
        }}
        {...getHandleProps(id)}
      >
        {id === currentHandle &&
          hoverHandlePopup(
            percent,
            setEdit,
            setCurrentHandle,
            addPartition,
            id
          )}
      </div>

      <div
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{
          left: `${percent}%`,
          position: "absolute",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
          width: 24,
          height: 24,
          backgroundColor: disabled ? "#666" : "#ffffff",
          border: "solid",
          borderColor: "#5f5566",
        }}
      />
      <div
        role="current-time-period-label"
        aria-valuenow={name}
        style={{
          left: `${percent}%`,
          position: "absolute",
          transform: "translate(4px, -32px) rotate(-45deg) ",
          transformOrigin: "bottom left",
          zIndex: 15,
        }}
      >
        {name}
      </div>
      {id === edit &&
        editMenu(
          percent,
          setEdit,
          updatePartitions,
          id,
          partitions,
          removePartition,
          name
        )}
    </Fragment>
  );
}

Handle.propTypes = {
  domain: PropTypes.array.isRequired,
  handle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired,
  }).isRequired,
  getHandleProps: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

Handle.defaultProps = {
  disabled: false,
};

// *******************************************************
// KEYBOARD HANDLE COMPONENT
// Uses a button to allow keyboard events
// *******************************************************
export function KeyboardHandle({
  domain: [min, max],
  handle: { id, value, percent },
  disabled,
  getHandleProps,
}) {
  return (
    <button
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      style={{
        left: `${percent}%`,
        position: "absolute",
        transform: "translate(-50%, -50%)",
        zIndex: 2,
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: disabled ? "#666" : "#ffc400",
      }}
      {...getHandleProps(id)}
    />
  );
}

KeyboardHandle.propTypes = {
  domain: PropTypes.array.isRequired,
  handle: PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired,
  }).isRequired,
  getHandleProps: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

KeyboardHandle.defaultProps = {
  disabled: false,
};

// *******************************************************
// TRACK COMPONENT
// *******************************************************
export function Track({ source, target, getTrackProps, disabled, color }) {
  return (
    <div
      style={{
        position: "absolute",
        transform: "translate(0%, -50%)",
        height: 14,
        zIndex: 1,
        backgroundColor: disabled ? "#999" : color,
        borderRadius: 7,
        cursor: "pointer",
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {...getTrackProps()}
    />
  );
}

Track.propTypes = {
  source: PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired,
  }).isRequired,
  target: PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired,
  }).isRequired,
  getTrackProps: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

Track.defaultProps = {
  disabled: false,
};

// *******************************************************
// TICK COMPONENT
// *******************************************************
export function Tick({ tick, count, format }) {
  return (
    <div>
      <div
        style={{
          position: "absolute",
          marginTop: 14,
          width: 1,
          height: 5,
          backgroundColor: "rgb(200,200,200)",
          left: `${tick.percent}%`,
        }}
      />
      <div
        style={{
          position: "absolute",
          marginTop: 22,
          fontSize: 10,
          textAlign: "center",
          marginLeft: `${-(100 / count) / 2}%`,
          width: `${100 / count}%`,
          left: `${tick.percent}%`,
        }}
      >
        {format(tick.value)}
      </div>
    </div>
  );
}

Tick.propTypes = {
  tick: PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired,
  }).isRequired,
  count: PropTypes.number.isRequired,
  format: PropTypes.func.isRequired,
};

Tick.defaultProps = {
  format: (d) => d,
};
