'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var config = require('../config');
var utils = utils = require('../utils');
var session = require('../session');
var data = require('../data');

var methods = {

  apiMethods: _.extend(data.apiMethods, {
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

  postAPIData: function(options) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', encodeURI(session.apiRoot + options.method), true);
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.withCredentials = true;
      xhr.onload = function() {
        var response = xhr.status === 200
          ? JSON.parse(xhr.response)
          : null;
        if(response && !response.error) {
          resolve(response);
        } else {
          self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject(response);
        }
      };
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 0) {
          self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject();
        }
      };
      xhr.onError = function() {
        self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
        reject();
      };
      xhr.send(JSON.stringify(options.body));
    });
    return promise;
  },

  postExternalMessage: function(message) {
    if(message && message.type) {
      if(window && window.top) {
        window.top.postMessage(_.pick(message,['type','data']), '*');
      }
    } else {
      self.emit(events.DATA_ERROR, config.events.INVALID_MESSAGE);
      return;
    }

  }

};

module.exports = _.extend(data, methods);
