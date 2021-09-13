const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    context: __dirname,
    devtool: 'source-map',
    entry: [
        './styles/main.scss',
        './src/api/index.js'
    ],
    stats: {
      warnings: false
    },
    resolve: {
        modules: [
            path.join(__dirname, "src"),
            "node_modules"
        ]
    },
    node: {
        fs: "empty"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
              test:/\.(s*)css$/,
              use: [
                { loader: MiniCssExtractPlugin.loader },
                { loader: 'css-loader', options: { url: true, sourceMap: true } },
                { loader: 'postcss-loader', options: { sourceMap: true } },
                { loader: 'sass-loader', options: { sourceMap: true } }
              ]

            },
            {
              test: /\.(png|woff|woff2|eot|ttf|svg|htc|gif)$/,
              use: {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]',
                  outputPath: 'images'
                }
              }
            },
            { test: /\.json$/, loader: 'json-loader' },
            { test: /\.handlebars$/, loader: "handlebars-loader" }
        ]
    },
    output: {
        library: 'SWAGAPI',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        path: path.join(__dirname, './dist/'),
        filename: 'swag-api.js',
        pathinfo: true
    },
    plugins: [
        new UglifyJsPlugin({uglifyOptions: { compress: true, mangle: true} }),
        new MiniCssExtractPlugin({
          filename: 'swag-api.css'
        })
    ]
};
