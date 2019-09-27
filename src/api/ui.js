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

  events: {
    UI_EVENT: 'UI_EVENT',
    UI_ERROR: 'UI_ERROR'
  },

  templates: {
    'dialog': require('../templates/api/dialog.handlebars'),
    'dialogScore': require('../templates/api/dialog-scores.handlebars'),
    'dialogDailyScore': require('../templates/api/dialog-daily-scores.handlebars'),
    'dialogScoreConfirmation': require('../templates/api/dialog-score-confirmation.handlebars'),
    'dataScore': require('../templates/api/data-scores.handlebars'),
    'dataScoreContext': require('../templates/api/data-score-context.handlebars'),
    'dataDailyScoreContext': require('../templates/api/data-daily-scores-context.handlebars'),
    'dialogAchievements': require('../templates/api/dialog-achievements.handlebars'),
    'dataAchievements': require('../templates/api/data-achievements.handlebars'),
    'dialogWeeklyScores': require('../templates/api/dialog-weeklyscores.handlebars'),
    'dataWeeklyScores': require('../templates/api/data-weeklyscores.handlebars')
  },

  dialogMethods: {
    'scores': 'renderScoresDialog',
    'dailyscores': 'renderDailyScoresDialog',
    'scoreconfirmation': 'renderScoreConfirmationDialog',
    'achievements': 'renderAchievementsDialog',
    'weeklyscores': 'renderWeeklyScoresDialog'
  },

  defaultDialogTitles: {
    'scores': 'Best Scores',
    'dailyscores': 'Best Daily Scores',
    'scoreconfirmation': 'Score Submitted',
    'weeklyscores': 'Your Best Scores This Week',
    'achievements': 'Your Achievements'
  },

  dialogRenderingOptions: {
    'scoreconfirmation': {
      default: {width: 0.60, height: 0.40},
      mobileBreakpoint: {width: 0.90, height: 0.40}
    }
  },

  renderDialog: function(type, options) {
    var self = this;
    var dialogOptions = _.extend({
        theme: session.theme,
        header: {
            backButton: true
        },
        title: options && options.title || self.defaultDialogTitles[type]
    }, options);

    var progressDialog = self.templates['dialog'](dialogOptions);
    this.cleanStage();
    session.wrapper.insertAdjacentHTML('afterbegin', progressDialog);
    var dialogEl = document.getElementById('swag-dialog');
    dialogEl.dataset['dialog'] = type;
    this.positionDialog(dialogEl, this.dialogRenderingOptions[type]);

    if(self.dialogMethods[type]) {
        return self[self.dialogMethods[type]](dialogOptions)
            .then(function() {
                document.getElementById('swag-dialog-wrapper').addEventListener('click', function(event) {
                    event.stopPropagation();
                });
                document.getElementById('swag-dialog-wrapper').addEventListener('mouseup', function(event) {
                    event.stopPropagation();
                });
                document.getElementById('swag-dialog-wrapper').addEventListener('mousedown', function(event) {
                    event.stopPropagation();
                });
                document.getElementById('swag-dialog-wrapper').addEventListener('pointerdown', function(event) {
                    event.stopPropagation();
                });
                document.getElementById('swag-dialog-wrapper').addEventListener('pointerup', function(event) {
                    event.stopPropagation();
                });

                var backBtn = session.wrapper.querySelectorAll('div[data-action="back"]');
                _.each(backBtn, function(el) {
                    el.addEventListener('click', function(event) {
                        self.onCloseDialog(event);
                    }, true);
                });

            });
    } else {
      this.emit(self.events.UI_ERROR, config.events.INVALID_DIALOG_TYPE);
    }

  },

  renderScoresDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');
    options = options || {};

    return data.getScoreCategories()
      .then(function(categories) {

        var scoreDialog = self.templates['dialogScore']({
          levels: categories
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var periodSelector = document.getElementById('swag-data-view-period');
        var dataTableCont = document.getElementById('swag-data-table');
        var contextCont = document.getElementById('swag-score-context');

        if(options.period && periodSelector) {
          periodSelector.value = options.period;
        }

        if(categories.length <= 1) {
          levelSelector.style.display = 'none';
        }

        if(options.level_key && levelSelector) {
          levelSelector.value = options.level_key;
        }

        var scoreMethod = function(level_key, period) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');

        var scoresContextOptions = {
          level_key: level_key,
          period: period
        };

        var scoresOptions = {
          type: 'standard',
          level_key: level_key,
          period: period
        };

        if(options.value_formatter) {
          scoresContextOptions.value_formatter = options.value_formatter;
          scoresOptions.value_formatter = options.value_formatter;
        }

        return Promise.all([
          data.getScoresContext(scoresContextOptions),
          data.getScores(scoresOptions)
        ])
          .then(function(values) {

            var scoresContext = values[0];
            var scores = values[1];

            var selectedCategory = _.find(categories, function(category) {
              return level_key === category.level_key;
            });

            var formatted = self.templates['dataScore']({
              category: selectedCategory,
              scores: scores
            });

            dataTableCont.innerHTML = formatted;

            var contextFormatted = self.templates['dataScoreContext']({
              context: scoresContext
            });

            contextCont.innerHTML = contextFormatted;

          })
          .finally(function() {
            contentEl.classList.remove('loading');
          });
        };

        levelSelector.addEventListener('change', function() {
          return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value,
            periodSelector.options[periodSelector.selectedIndex].value);
        }, true);

        periodSelector.addEventListener('change', function() {
          return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value,
            periodSelector.options[periodSelector.selectedIndex].value);
        }, true);

        return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value, periodSelector.options[periodSelector.selectedIndex].value);

      });
  },

  renderDailyScoresDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    return Promise.all([data.getDays(), data.getScoreCategories()])
      .then(function(values) {

        var days = values[0];
        var categories = values[1];

        var scoreDialog = self.templates['dialogDailyScore']({
          days: days,
          levels: categories
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var daySelector = document.getElementById('swag-data-view-day');
        var dataTableCont = document.getElementById('swag-data-table');
        var contextCont = document.getElementById('swag-score-context');

        if(options.day) {
          daySelector.value = options.day;
        }

        if(categories.length <= 1) {
          levelSelector.style.display = 'none';
        }

        if(options.level_key) {
          levelSelector.value = options.level_key;
        }

        var scoreMethod = function(day, level_key) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');

          var scoresContextOptions = {
            level_key: level_key,
            period: 'alltime',
            day: day
          };

          var scoresOptions = {
            type: 'daily',
            level_key: level_key,
            period: 'alltime', //daily scores are always displayed as all time
            day: day
          };

          if(options.value_formatter) {
            scoresContextOptions.value_formatter = options.value_formatter;
            scoresOptions.value_formatter = options.value_formatter;
          }

          return Promise.all([
            data.getScoresContext(scoresContextOptions),
            data.getScores(scoresOptions)
          ])
          .then(function(values) {

            var scoresContext = values[0];
            var scores = values[1];

            var selectedCategory = _.find(categories, function(category) {
              return level_key === category.level_key;
            });

            var formatted = self.templates['dataScore']({
              category: selectedCategory,
              scores: scores
            });

            dataTableCont.innerHTML = formatted;

            var contextFormatted = self.templates['dataDailyScoreContext']({
              context: scoresContext
            });

            contextCont.innerHTML = contextFormatted;
          })
          .finally(function() {
            contentEl.classList.remove('loading');
          });
        };

        daySelector.addEventListener('change', function() {
          return scoreMethod(daySelector.options[daySelector.selectedIndex].value,
            levelSelector.options[levelSelector.selectedIndex].value);
        }, true);

        levelSelector.addEventListener('change', function() {
          return scoreMethod(daySelector.options[daySelector.selectedIndex].value,
            levelSelector.options[levelSelector.selectedIndex].value);
        }, true);

        return scoreMethod(daySelector.options[daySelector.selectedIndex].value, levelSelector.options[levelSelector.selectedIndex].value);

      });
  },

  renderScoreConfirmationDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');
    var scoreConfirmationDialog = self.templates['dialogScoreConfirmation'](options);
    contentEl.classList.remove('loading');
    contentEl.innerHTML = scoreConfirmationDialog;
    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  renderAchievementsDialog: function(options) {

    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    var achievementsDialog = self.templates['dialogAchievements']();
    contentEl.innerHTML = achievementsDialog;

    var dataTableCont = document.getElementById('swag-data');

    var achievementsMethod = function() {
      dataTableCont.innerHTML = '';
      contentEl.classList.add('loading');
      return data.getUserAchievements()
      .then(function(achievements) {
        var formatted = self.templates['dataAchievements']({
          achievements: achievements
        });
        dataTableCont.innerHTML = formatted;
      })
      .finally(function() {
        contentEl.classList.remove('loading');
      });
    };

    return achievementsMethod();

  },

  renderWeeklyScoresDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    return data.getScoreCategories()
      .then(function(categories) {

        var scoreDialog = self.templates['dialogWeeklyScores']({
          levels: categories,
          title: options.title
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var dataTableCont = document.getElementById('swag-data');

        var scoreMethod = function(level_key) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');

          var scoresOptions = {
            type: 'weekly',
            level_key: level_key
          };

          if(options.value_formatter) {
            scoresOptions.value_formatter = options.value_formatter;
          }

          return data.getScores(scoresOptions)
          .then(function(scores) {
            var formatted = self.templates['dataWeeklyScores']({
              weeklyscores: scores
            });
            dataTableCont.innerHTML = formatted;
          })
          .finally(function() {
            contentEl.classList.remove('loading');
          });
        };

        levelSelector.addEventListener('change', function() {
          return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value);
        }, true);

        if(categories[0]) {
          return scoreMethod(levelSelector.options[0].value);
        }

      });
  },

  // UI Rendering
  resizeToContainer: function(element, container) {
    var max = 100;
    var attempts = 0;
    element.style.fontSize = null;
    var size = parseInt(window.getComputedStyle(element).fontSize);
    while(element.offsetHeight > container.offsetHeight && attempts < max && size > 0) {
      attempts++;
      size = Math.floor(size * 0.98);
      element.style.fontSize = size + 'px';
    }
  },

  positionDialog: function(element, options) {
    var self = this;
    var contentContainers = element.getElementsByClassName('swag-dialog-content');
    var breakpoint = utils.getBreakpoint();

    var mobileBreakpoint = (breakpoint && _.includes(['phone','phablet'], breakpoint.name));
    var fillSize = mobileBreakpoint
      ? { width: 0.90, height: 0.80}
      : { width: 0.96, height: 0.90};

    if(options && options.default && options.default.width && options.default.height) {
      fillSize = mobileBreakpoint
        ? { width: options.mobileBreakpoint.width, height: options.mobileBreakpoint.height }
        : { width: options.default.width, height: options.default.height };
    }

    utils.applyBreakpointClass();

    var width = session.wrapper.offsetWidth * fillSize.width;
    var height = session.wrapper.offsetHeight * fillSize.height;

    var top = (session.wrapper.offsetHeight - height) / 2;
    var left = (session.wrapper.offsetWidth - width) / 2;

    utils.debug('positionDialog');
    utils.debug('positionDialog :::: wrapper', session.wrapper);
    utils.debug('positionDialog :::: wrapper - width', session.wrapper.offsetWidth);
    utils.debug('positionDialog :::: wrapper - height', session.wrapper.offsetHeight);

    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.top = top + 'px';
    element.style.left = left + 'px';
  },

  resize: function() {
    var self = this;
    utils.debug('resize');
    var elems = session.wrapper.getElementsByClassName('swag-dialog');
    _.each(elems, function(elem) {
      var options = self.dialogRenderingOptions[elem.dataset.dialog] || {};
      self.positionDialog(elem, options);
    });
  },

  cleanStage: function() {
    var elems = session.wrapper.getElementsByClassName('swag-dialog-wrapper');
    _.each(elems, function(elem) {
      elem.parentNode.removeChild(elem);
    });
  },

  populateLevelSelect: function(domId) {
    var self = this;
    return data.getScoreCategories()
      .then(function(categories) {
        var levelSelect = document.getElementById(domId);
        if(levelSelect) {
          categories.map(function(category) {
            var opt = document.createElement('option');
            opt.value= category.level_key;
            opt.innerHTML = category.name;
            levelSelect.appendChild(opt);
          });
        }
      });
  },

  populateDaySelect: function(domId, limit) {
    var self = this;
    return data.getDays(limit)
      .then(function(days) {
        var daySelect = document.getElementById(domId);
        if(daySelect) {
          days.map(function(day) {
            var opt = document.createElement('option');
            opt.value= day;
            opt.innerHTML = day;
            daySelect.appendChild(opt);
          });
        }
      });
  },

  populateAchievementSelect: function(domId) {
    var self = this;
    return data.getAchievementCategories()
      .then(function(categories) {
        var achievementSelect = document.getElementById(domId);
          categories.map(function(category) {
            var opt = document.createElement('option');
            opt.value= category.achievement_key;
            opt.innerHTML = category.name;
            achievementSelect.appendChild(opt);
          });
      });
  },

  startGame: function() {
    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  endGame: function() {
    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  showAd: function() {
    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  getBrandingLogo: function() {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.onload = function() {
        resolve(img);
      };
      //TODO: use appropriate logo for given context
      img.src = config.resourceRoot + 'shockwave-logo.svg';
    });
  },

  onCloseDialog: function(event) {
    var self = this;
    event.preventDefault();
    this.cleanStage();
    this.emit(self.events.UI_EVENT, config.events.DIALOG_CLOSED);
  }
};

module.exports = _.extend(ui, methods);
