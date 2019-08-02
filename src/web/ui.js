'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var config = require('../config');
var elementResizeEvent = require('element-resize-event');
var utils = utils = require('../utils');
var ui = require('../ui.js');
var data = require('../data.js');
var session = require('../session.js');

var methods = {

  renderTokenBalance: function(options) {
    if(options.el) {
      return data.getTokenBalance()
        .then(function(result) {
          options.el.innerHTML = result.total_tokens;
        });
    } else {
      console.log('SWAGWEB :::: ERROR :::: You must use a valid el in options.el');
    }
  },

  renderFriendsSection: function(options) {
    var promise = new Promise(function(resolve, reject) {
      if(options.el) {
        options.el.innerHTML = '<div>Friends tab will be displayed here once it is hooked up in the API</div>';
      } else {
        console.log('SWAGWEB :::: ERROR :::: You must use a valid el in options.el');
        reject();
      }
      resolve();
    });
    return promise;
  },

  renderScoresSection: function(options) {
    var promise = new Promise(function(resolve, reject) {
      if(options.el && options.keyword) {
        options.el.innerHTML = [
          '<div>',
          'High Scores tab for ',
          options.keyword,
          ' will be displayed here once it is hooked up in the WEB API',
          '</div>'
        ].join('');
      } else {
        console.log('SWAGWEB :::: ERROR :::: You must use a valid el in options.el');
        reject();
      }
      resolve();
    });
    return promise;
  },

  resize: function() {
  }
};

module.exports = _.extend(ui, methods);
