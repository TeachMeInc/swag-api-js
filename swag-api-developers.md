# SWAG API DEVELOPERS GUIDE

Include the following files:

```
<script type="text/javascript" src="https://swagapi.shockwave.com/dist/swag-api.js">
<link rel="stylesheet" type="text/css" href="https://swagapi.shockwave.com/dist/swag-api.css">
```

## Score Configuration

Each type of score for your game can be configured individually. Expressed in JSON, a score configuration is in the following format:

```
{
  game: String,
  name: String,
  level_key: String,
  value_name: String,
  value_type: String,
  value_formatter: String,
  order: Number,
  reverse: Boolean,
  mode: String
}
```
| attribute     | required |default| type | description  |
| ------------- | ------------- | ----- | ------ | ------ |
|game|y|-|String|api key of your game
|name|y|-|String|Display name for the score *eg. 'Level 1'*
|level_key|y|-|String|reference key for this level *eg. 'level1'*
|value_name|n|-|String|Name for the score values *eg. 'Fastest Time'*
|value_type|n|"number"|String|The type of value (number, time)
|value_formatter|n|"default"|String|The type of formatter to use for this value (see Formatters)
|order|n|-|Number|The display order of this level
|reverse|n|false|Boolean|if true, minimum scores value are used for api score calculations
|mode|n|"default"|String| Scores with mode of `first` will only display the first score for a day in the leaderboards

These configurations are loaded into our highscore system to facilitate the specific needs of each type of score for your game.

<div class="page-break"></div>

## Formatters

Define a value_formatter in score configuration or as a parameter in api methods to format values.

### Number Formatters

No special number formatters are currently available.  Let us know if there is a format you'd like to see.

### Time Formatters

| formatter     | example output|
| ------------- | ------------- |
|default|00:01:05.5
|shortDuration|1m 5.5s
|longDuration|1 minute, 5.5 seconds
|seconds|65.5s
|ms|65500

<div class="page-break"></div>

## Connecting to the API

SWAGPI will be accessible as a global

```
  var api = SWAGAPI.getInstance({
    wrapper: wrapper,
    api_key: '5c6c3c056917a692f96f9651',
    theme: 'shockwave',
    debug: true
  });
```

##### API options:

| option        | type           | description  |
| ------------- | ------------- | ----- |
|wrapper|domElement|the domElement containing the game
|api_key|String|unique identifier for the game
|theme|String|set the theme for api ui elements
|debug|boolean|enable debug console messages

 The client must use the `startSession` method to start using the api and wait for the promise to resolve or the SESSION_READY event before using any other api calls.

Using promise:
```
  return api.startSession()
    .then(function() {
        //do stuff
    });
```

Using event listener:
```
  api.on('SESSION_READY', function() {
    //do stuff
  });
```

<div class="page-break"></div>

## Using the API

####  API Methods:

All methods return promises (except showDialog)

| method        | parameters           |  description |
| ------------- | ------------- | ----- |
| startSession| - | Used start an api session.  The client must wait for the promise to resolve or the SESSION_READY event before using any other api calls.
|getScoreCategories| - | Returns a json array of highscore categories associated with this game
|getScores| see getScores options | Returns a json array of scores based on the options objects
|postScore| level_key, value | Post the score `value` for the `level_key` for the current user.
|getDailyScores| level_key, value | Returns a json array of scores based on the options objects
|postDailyScore| day, level_key, value | Post the score `value` for the `level_key` and `day` for the current user.
|getAchievementCategories| - | Return a json array of achievements associated with this game
|postAchievement| achievement_key | Post an achievement `achievement_key` for the current user
|getUserAchievements| - | Return a list of all achievements by the current user for this game
|postDatastore| key, value | Post a `value` to `key`.  If 'key' exists for this user, it will be overwritten.
|getUserDatastore| - | Returns a json array of all data store objects associated with this user
|showDialog | type | display a dialog of type `scores`, `dailyscores` `achievements` or `weeklyscores` (see dialog options for more information)
|isSubscriber| - | returns true if the current user is a subscriber
|hasDailyScore|level_key| returns true if the current user has submitted a score today

<div class="page-break"></div>

Note: The following methods will be deprecated in an upcoming version

| deprecated    | replace with
| ------------- | -------------
|getHighScoreCategories| getScoreCategories
|getHighScores| getScores
|postHighscore| postScore
|showDialog("highscore")|showDialog("scores")

<div class="page-break"></div>

### showDialog options


example:
```
api.showDialog('scores', {
    title: 'Best Scores',
    level_key: 'level1',
    period: 'alltime',
    value_formatter: ''
});
```

The following options are available:

| option        | description |
| ------------- | ------------|
| title | Overrides the title in the dialog |
| level_key | Sets the default level_key in the select |
| period | Sets the default period in the select  |
| value_formatter | Overrides the formatter used in the score config |

### getScores options

The following options are available:

| option        | required           |  description |
| ------------- | ------------- | ----- |
|level_key|yes|The level to retrieve scores for.
|type|no|String, _default:_ `"standard"`, _values:_ `"standard", "weekly"`
|period|no|String, _default:_ `"alltime"`, _values:_ `"daily", "weekly", "monthly", "alltime"`
|current_user|no|boolean, _default:_ `false`.  If true, only get scores for current user
|target_date|no| epoch time or ISO Date string in format YYYY-MM-DD. Use this date as the base for date ranges eg. "daily", "weekly"
|useDaily|no|boolean, use score 'day' instead of score post date
|value_formatter|no|Format scores using specified formatter

Example (scores this week on level1 for the current user):

```
return api.getScores({
  type: 'weekly',
  level_key: 'level1',
  current_user: true
})
  .then(function(scores) {
    //do something
  });
```

<div class="page-break"></div>

###  API Events:

| event        | description |
| ------------- | ------------- |
| SESSION_READY | The api is ready to use
| ERROR | An api error has occurred
| DIALOG_CLOSED | The active dialog has closed

### Demo

There is a simple demo of the api at:

http://swagapi.shockwave.com/demo.html (view source)


## Developing and Using Locally

For now you will need to edit your etc\hosts file.

On Windows you can find at c:windows\system32\drivers\etc\host

and add the following line

```
127.0.0.1			local.shockwave.com
```

Install http-server

```
npm install -g http-server
```

Launch a local web server where your index.html is

```
http-server -p 8888
```

You can either be logged into shockwave.com or as a guest when testing.

To get an API key or anything else, please contact your support at Addicting Games.

launch your game with

```
http://local.shockwave.com:8888
```

VERSION 1.0
