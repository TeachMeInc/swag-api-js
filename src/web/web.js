'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var elementResizeEvent = require('element-resize-event');
var config = require('config');
var session = require('session');
var utils = require('utils');
var data = require('./data');
var ui = require('./ui');

// -----------------------------------------------------------------------------

function SWAGWEB(options) {
  var self = this;
  this._options = _.pick(options, ['theme']);
  this._init();
  Emitter(this);
};

var methods = {

  // Interface -----------------------------------------------------------------

  startSession: function() {
    var self = this;
    utils.debug('start session');
    return data.getEntity()
      .then(function() {
        utils.debug('session ready');
        self.emit(config.events.SESSION_READY, { session_ready: true });
      });
  },

  getCurrentEntity: function() {
    return session.entity;
  },

  renderTokenBalance: function(options) {
    return ui.renderTokenBalance(options);
  },

  renderFriendsSection: function(options) {
    return ui.renderFriendsSection(options);
  },

  renderScoresSection: function(options) {
    return ui.renderScoresSection(options);
  },

  // ---------------------------------------------------------------------------

  _init: function() {
    var self = this;
    session.theme = this._options.theme || 'shockwave';
    elementResizeEvent(document.body, function() {
      ui.resize();
    });
  }

};

_.extend(SWAGWEB.prototype, methods);

module.exports = SWAGWEB;
