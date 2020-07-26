const webpack = require("webpack");
const WorkerPlugin = require('worker-plugin');

const config = {
  entry: ["babel-polyfill", __dirname + "/js/index.jsx"],
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".js", ".jsx", ".css", ".ts", ".tsx"],
  },
  plugins: [
    new WorkerPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/react",
              ["@babel/env", { modules: false }],
            ],
          },
        },
      },
    ],
  },
};
module.exports = config;
