const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production';

var env = isProduction ? 'production' : 'development';
console.log('using config: ' + path.join(__dirname, 'src', 'config.' + env));

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
        alias: {
            config: path.join(__dirname, 'src', 'config.' + env)
        },
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
                        presets: ['@babel/env']
                    }
                }
            },
            {
              test:/\.(s*)css$/,
              use: [
                MiniCssExtractPlugin.loader,
                { loader: 'css-loader', options: { url: false, sourceMap: true } },
                { loader: 'postcss-loader', options: { sourceMap: true } },
                { loader: 'sass-loader', options: { sourceMap: true } }
              ]
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
        }),
        new CopyPlugin({
          patterns: [
            { from: path.join(__dirname, 'styles/images/'), to: path.join(__dirname, './dist/images') }
          ]
        })
    ]
};
