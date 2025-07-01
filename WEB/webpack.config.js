const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    assetModuleFilename: 'images/[hash][ext][query]'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        oneOf: [
          {
            // 如果图片小于 4kb，转为 base64
            resourceQuery: /inline/,
            type: 'asset/inline'
          },
          {
            // 其他情况下使用文件
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 4 * 1024 // 4kb
              }
            },
            generator: {
              filename: 'images/[hash][ext][query]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    }),
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    hot: true,
    historyApiFallback: true,
    proxy: [{
      context: ['/api'],
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      proxyTimeout: 300000,
      timeout: 300000,
      onError: (err, req, res) => {
        console.error('代理错误:', err);
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('代理请求:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('代理响应:', proxyRes.statusCode, req.url);
      },
      headers: {
        'Connection': 'keep-alive'
      }
    }]
  }
}; 