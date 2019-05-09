'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var config = require('config');
var elementResizeEvent = require('element-resize-event');
var session = require('session');
var data = require('data');
var ui = require('ui');
var utils = require('utils');

// -----------------------------------------------------------------------------

function SWAGAPI(options) {
  var self = this;
  this._options = _.pick(options, ['wrapper','api_key']);
  this._init();
  Emitter(this);

  ui.on('UI_EVENT', function(event) {
    self.emit(event, {type: event});
  });

  ui.on('UI_ERROR', function(event) {
    self._emitError(event);
  });

  ui.on('DATA_ERROR', function(event) {
    self._emitError(event);
  });

  data.on('DATA_EVENT', function(event) {
    self.emit(event, {type: event});
  });

  data.on('DATA_ERROR', function(event) {
    self._emitError(event);
  });

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

  getScoreCategories: function() {
    return data.getScoreCategories();
  },

  getDays: function(limit) {
    return data.getDays(limit);
  },

  getScores: function(options) {
    return data.getScores(options);
  },

  postScore: function(level_key, value) {
    return data.postScore(level_key, value);
  },

  postDailyScore: function(day, level_key, value) {
    return data.postDailyScore(day, level_key, value);
  },

  getAchievementCategories: function() {
    return data.getAchievementCategories();
  },

  postAchievement: function(achievement_key) {
    return data.postAchievement(achievement_key);
  },

  getUserAchievements: function() {
    return data.getUserAchievements();
  },

  postDatastore: function(key, value) {
    return data.postDatastore(key, value);
  },

  getUserDatastore: function() {
    return data.getUserDatastore();
  },

  populateLevelSelect: function(domId) {
    return ui.populateLevelSelect(domId);
  },

  populateDaySelect: function(domId, limit) {
    return ui.populateDaySelect(domId, limit);
  },

  populateAchievementSelect: function(domId) {
    return ui.populateAchievementSelect(domId);
  },

  getCurrentEntity: function() {
    return session.entity;
  },

  showDialog: function(type, options) {
    return ui.renderDialog(type, options);
  },

  isSubscriber: function() {
    return data.isSubscriber();
  },

  hasDailyScore: function(level_key) {
    return data.hasDailyScore(level_key);
  },

  getCurrentDay: function() {
    return data.getCurrentDay();
  },

  // ---------------------------------------------------------------------------

  _init: function() {
    var self = this;
    session.api_key = this._options.api_key;
    session.wrapper = this._options.wrapper;
    session.wrapper.classList.add('swag-wrapper');
    session.theme = this._options.theme || 'shockwave';

    elementResizeEvent(session.wrapper, function() {
      ui.resize();
    });
  },

  _emitError: function(errorType) {
    this.emit(this.ERROR, { type: errorType });
  },

  _parseUrlOptions: function(prop) {
    var params = {};
    if(window.location.href.indexOf('?') === -1) {
      return params;
    }
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );
    definitions.forEach( function( val, key ) {
      var parts = val.split( '=', 2 );
      params[ parts[ 0 ] ] = parts[ 1 ];
    } );
    return ( prop && prop in params ) ? params[ prop ] : params;
  }

};

_.extend(SWAGAPI.prototype, methods);

module.exports = SWAGAPI;
