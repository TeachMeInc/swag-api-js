const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const _ = require('lodash');
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    context: __dirname,
    devtool: 'source-map',
    entry: [
        './styles/main.scss',
        './src/index.js'
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
                        presets: ['env']
                    }
                }
            },
            {
              test:/\.(s*)css$/,
              use: ExtractTextPlugin.extract({
                  fallback: 'style-loader',
                  use: ['css-loader', 'postcss-loader', 'sass-loader']
              })
            },
            { test: /\.(png|woff|woff2|eot|ttf|svg|htc)$/, use: 'file-loader' },
            { test: /\.json$/, loader: 'json-loader' },
            { test: /\.handlebars$/, loader: "handlebars-loader" }
        ]
    },
    output: {
        library: 'SWAGAPI',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        path: path.join(__dirname, '/dist'),
        filename: 'swag-api.js',
        pathinfo: true
    },
    plugins: [
        new UglifyJsPlugin({uglifyOptions: { compress: true, mangle: true} }),
        new ExtractTextPlugin('swag-api.css')
    ]
};
