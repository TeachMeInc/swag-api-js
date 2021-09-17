module.exports = {
    version: '2.0.7',
    themes: {
      'shockwave': {
        apiRoot: 'https://swag-services.shockwave.com'
      },
      'addictinggames': {
        apiRoot: 'https://swag-services.addictinggames.com'
      }
    },
    providers: {
      'default': {
        root: 'https://www.addictinggames.com',
        current: '/ag-auth/current',
        login: '/ag-auth/login',
        logout: '/ag-auth/logout',
        create: '/ag-auth/create'
      },
      'shockwave': {
        root: 'https://www.shockwave.com',
        current: '/shockwave-auth/current',
        login: '/shockwave-auth/login',
        logout: '/shockwave-auth/logout',
        create: '/shockwave-auth/create'
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
