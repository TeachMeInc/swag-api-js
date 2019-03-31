'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var config = require('config');
var elementResizeEvent = require('element-resize-event');
var utils = utils = require('utils');
var data = require('data');
var session = require('session');

var templates = {
  'dialog': require('templates/dialog.handlebars'),
  'dialogScore': require('templates/dialog-scores.handlebars'),
  'dialogDailyScore': require('templates/dialog-daily-scores.handlebars'),
  'dataScore': require('templates/data-scores.handlebars'),
  'dataScoreContext': require('templates/data-score-context.handlebars'),
  'dialogAchievements': require('templates/dialog-achievements.handlebars'),
  'dataAchievements': require('templates/data-achievements.handlebars'),
  'dialogWeeklyScores': require('templates/dialog-weeklyscores.handlebars'),
  'dataWeeklyScores': require('templates/data-weeklyscores.handlebars')
};

var dialogMethods = {
  'highscore': 'renderScoresDialog', // TODO: Remove this deprecated type
  'scores': 'renderScoresDialog',
  'dailyscores': 'renderDailyScoresDialog',
  'achievements': 'renderAchievementsDialog',
  'weeklyscores': 'renderWeeklyScoresDialog'
};

var defaultDialogTitles = {
  'scores': 'Best Scores',
  'dailyscores': 'Best Daily Scores',
  'weeklyscores': 'Your Best Scores This Week',
  'achievements': 'Your Achievements'
};

var events = {
  UI_EVENT: 'UI_EVENT',
  UI_ERROR: 'UI_ERROR'
};

var methods = {
  renderDialog: function(type, options) {
    var self = this;
    var dialogOptions = _.extend({
        theme: session.theme,
        header: {
            backButton: true
        },
        title: options && options.title || defaultDialogTitles[type]
    }, options);

    var progressDialog = templates['dialog'](dialogOptions);
    this.cleanStage();
    session.wrapper.insertAdjacentHTML('afterbegin', progressDialog);
    var dialogEl = document.getElementById('swag-dialog');
    this.positionDialog(dialogEl);

    var backBtn = session.wrapper.querySelectorAll('div[data-action="back"]');
    _.each(backBtn, function(el) {
        el.addEventListener('click', function(event) {
            self.onCloseDialog(event);
        }, true);
    });

    if(dialogMethods[type]) {
        return self[dialogMethods[type]](dialogOptions)
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
            });
    } else {
      this.emit(events.UI_ERROR, config.events.INVALID_DIALOG_TYPE);
    }

  },

  renderScoresDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    return data.getScoreCategories()
      .then(function(categories) {

        var scoreDialog = templates['dialogScore']({
          levels: categories
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var periodSelector = document.getElementById('swag-data-view-period');
        var dataTableCont = document.getElementById('swag-data-table');
        var contextCont = document.getElementById('swag-score-context');

        if(options.period) {
          periodSelector.value = options.period;
        }

        if(options.level_key) {
          levelSelector.value = options.level_key;
        }

        var scoreMethod = function(level_key, period) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');


        return Promise.all([
          data.getScoresContext({
            level_key: level_key,
            period: period
          }),
          data.getScores({
              type: 'standard',
              level_key: level_key,
              period: period
          })
        ])
          .then(function(values) {

            var scoresContext = values[0];
            var scores = values[1];

            var selectedCategory = _.find(categories, function(category) {
              return level_key === category.level_key;
            });

            var formatted = templates['dataScore']({
              category: selectedCategory,
              scores: scores
            });

            dataTableCont.innerHTML = formatted;

            var contextFormatted = templates['dataScoreContext']({
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

        return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value, periodSelector.options[levelSelector.selectedIndex].value);

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

        var scoreDialog = templates['dialogDailyScore']({
          days: days,
          levels: categories
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var daySelector = document.getElementById('swag-data-view-day');
        var periodSelector = document.getElementById('swag-data-view-period');
        var dataTableCont = document.getElementById('swag-data-table');

        if(options.day) {
          daySelector.value = options.day;
        }

        if(options.period) {
          periodSelector.value = options.period;
        }

        if(options.level_key) {
          levelSelector.value = options.level_key;
        }

        var scoreMethod = function(day, level_key, period) {
          console.log(day);
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');
          return data.getScores({
            type: 'daily',
            level_key: level_key,
            period: period,
            day: day
          })
          .then(function(scores) {
            var selectedCategory = _.find(categories, function(category) {
              return level_key === category.level_key;
            });
            var formatted = templates['dataScore']({
              category: selectedCategory,
              scores: scores
            });
            dataTableCont.innerHTML = formatted;
          })
          .finally(function() {
            contentEl.classList.remove('loading');
          });
        };

        daySelector.addEventListener('change', function() {
          return scoreMethod(daySelector.options[daySelector.selectedIndex].value,
            levelSelector.options[levelSelector.selectedIndex].value,
            periodSelector.options[periodSelector.selectedIndex].value);
        }, true);

        levelSelector.addEventListener('change', function() {
          return scoreMethod(daySelector.options[daySelector.selectedIndex].value,
            levelSelector.options[levelSelector.selectedIndex].value,
            periodSelector.options[periodSelector.selectedIndex].value);
        }, true);

        periodSelector.addEventListener('change', function() {
          return scoreMethod(daySelector.options[daySelector.selectedIndex].value,
            levelSelector.options[levelSelector.selectedIndex].value,
            periodSelector.options[periodSelector.selectedIndex].value);
        }, true);

        return scoreMethod(daySelector.options[daySelector.selectedIndex].value, levelSelector.options[levelSelector.selectedIndex].value, periodSelector.options[levelSelector.selectedIndex].value);

      });
  },

  renderAchievementsDialog: function(options) {

    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    var achievementsDialog = templates['dialogAchievements']();
    contentEl.innerHTML = achievementsDialog;

    var dataTableCont = document.getElementById('swag-data');

    var achievementsMethod = function() {
      dataTableCont.innerHTML = '';
      contentEl.classList.add('loading');
      return data.getUserAchievements()
      .then(function(achievements) {
        var formatted = templates['dataAchievements']({
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

        var scoreDialog = templates['dialogWeeklyScores']({
          levels: categories,
          title: options.title
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var dataTableCont = document.getElementById('swag-data');

        var scoreMethod = function(level_key) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');
          return data.getScores({
            type: 'weekly',
            level_key: level_key
          })
          .then(function(scores) {
            var formatted = templates['dataWeeklyScores']({
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

  positionDialog: function(element) {
    var self = this;
    var contentContainers = element.getElementsByClassName('swag-dialog-content');
    var width = session.wrapper.offsetWidth * 0.80;
    var height = session.wrapper.offsetHeight * 0.80;
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
      self.positionDialog(elem);
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

  onCloseDialog: function(event) {
    event.preventDefault();
    this.cleanStage();
    this.emit(events.UI_EVENT, config.events.DIALOG_CLOSED);
  }
};

module.exports = Emitter(methods);
