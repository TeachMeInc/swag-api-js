module.exports = {
    version: '2.0.7',
    themes: {
      'shockwave': {
        apiRoot: 'http://local.shockwave.com:8888'
      },
      'addictinggames': {
        apiRoot: 'http://local.addictinggames.com:8888'
      }
    },
    providers: {
      'default': {
        root: 'https://www.addictinggames.com',
        current: '/ag-auth/current',
        login: '/ag-auth/login',
        logout: '/ag-auth/logout',
        create: '/ag-auth/create'
      }
    },
    resourceRoot: 'https://swagapi.shockwave.com/dist/',
    events: {
      API_COMMUNICATION_ERROR: 'API_COMMUNICATION_ERROR',
      SESSION_READY: 'SESSION_READY',
      DIALOG_CLOSED: 'DIALOG_CLOSED',
      INVALID_DIALOG_TYPE: 'INVALID_DIALOG_TYPE',
      ERROR: 'ERROR',
      INVALID_MESSAGE: 'INVALID MESSAGE'
    }
};
