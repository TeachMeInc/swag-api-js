'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var config = require('config');
var session = require('session');
var utils = require('utils');

// -----------------------------------------------------------------------------

function SWAGWEB(options) {
  var self = this;
  this._init();
  Emitter(this);
};

var methods = {
};

_.extend(SWAGWEB.prototype, methods);

module.exports = SWAGWEB;
