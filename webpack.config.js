const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/index.html'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '@utils': path.resolve(__dirname, 'src/utils/')
    },
    fallback: {
      "buffer": require.resolve('buffer/'),
      "stream": require.resolve('stream-browserify'),
      "util": require.resolve('util/'),
      "assert": require.resolve('assert/'),
      "process": require.resolve('process/browser'),
      "crypto": require.resolve('crypto-browserify'),
      "https": require.resolve('https-browserify'),
      "http": require.resolve('stream-http'),
      "os": require.resolve('os-browserify/browser'),
      "url": require.resolve('url/'),
      "zlib": require.resolve('browserify-zlib'),
      "path": require.resolve('path-browserify')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    })
  ],
  optimization: {
    minimize: true,
  }
};
