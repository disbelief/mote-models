const path = require('path');

module.exports = {
  entry: './index.esnext.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname)
  },
  mode: 'production',
  target: 'node',
  optimization: {
    minimize: true
  },
  performance: {
    hints: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        },
        exclude: [/node_modules/]
      }
    ]
  }
};
