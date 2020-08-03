import React from "react";

const ErrorDialog = ({ error }) => {
    return (
        <div
            style={{
                padding: "10px",
                position: "relative",
                margin: "auto",
                width: "400x",
                height: "auto"
            }}
        >
            <h1>Oops, something went wrong!</h1>
            <h4>{error.message}</h4>
            {error.stack.split(" at ").map((x, i) => {
                if (i) return <p>    at {x}</p>
            })}
        </div>
    );
};

export default ErrorDialog;
