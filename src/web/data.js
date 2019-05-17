'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var config = require('../config');
var utils = utils = require('../utils');
var session = require('../session');
var data = require('../data');

var methods = {};

module.exports = _.extend(data, methods);
