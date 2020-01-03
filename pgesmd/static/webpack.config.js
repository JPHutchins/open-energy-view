const webpack = require("webpack");
const config = {
  entry: ["babel-polyfill", __dirname + "/js/index.jsx"],
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".js", ".jsx", ".css", ".ts", ".tsx"]
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader"
          }
        ]
      },
      {
        test: /\.tsx?$/,
        loader: "babel-loader",
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/react",
              "@babel/typescript",
              ["@babel/env", { modules: false }]
            ]
          }
        }
      }
    ]
  }
};
module.exports = config;
