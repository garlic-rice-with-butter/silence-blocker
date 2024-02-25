const path = require('path');

module.exports = {
  entry: './src/index.js',
  target: "web",
  output: {
    path: path.resolve(__dirname, 'dist/src'),
    filename: 'compiled.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  resolve: {
    fallback: {
      fs: false,
      os: require.resolve("os-browserify/browser"),
    }
  }
};

