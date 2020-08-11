'use strict';

var config = require('../config');
var utils = utils = require('../utils');
var session = require('../session');
var data = require('../data');

var methods = {

  apiMethods: Object.assign(data.apiMethods, {
    'postScore': '/v1/score',
    'postDailyScore': '/v1/dailyscore',
    'postAchievement': '/v1/achievement',
    'postDatastore': '/v1/datastore'
  }),

  postScore: function(level_key, value, options) {
    var self = this;
    var body = {
      game: session.api_key,
      level_key: level_key,
      value: value
    };

    if(options && options.meta) {
      body.meta = options.meta;
    }

    var urlParamsString = self.buildUrlParamString(body);
    return this.postAPIData({
      method: self.apiMethods['postScore'],
      body: body,
      params: urlParamsString
    });
  },

  postDailyScore: function(day, level_key, value, options) {
    var self = this;
    var body = {
      game: session.api_key,
      day: day,
      level_key: level_key,
      value: value
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this.postAPIData({
      method: self.apiMethods['postDailyScore'],
      body: body,
      params: urlParamsString
    });
  },

  postAchievement: function(achievement_key) {
    var self = this;
    var body = {
      game: session.api_key,
      achievement_key: achievement_key
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this.postAPIData({
      method: self.apiMethods['postAchievement'],
      body: body,
      params: urlParamsString
    });
  },

  postDatastore: function(key, value) {
    var self = this;

    var body = {
      game: session.api_key,
      key: key,
      value: value
    };

    var urlParamsString = self.buildUrlParamString(body);

    return this.postAPIData({
      method: self.apiMethods['postDatastore'],
      body: body,
      params: urlParamsString
    });
  },

  postExternalMessage: function(message) {
    if(message && message.type) {
      if(window && window.top) {
        var messageData = { type, data } = message;
        window.top.postMessage(messageData, '*');
      }
    } else {
      self.emit(events.DATA_ERROR, config.events.INVALID_MESSAGE);
      return;
    }

  }

};

module.exports = Object.assign(data, methods);
