UI.registerHelper('routeState', function (route) {
    return Session.equals('currentRoute', route) ? 'active' : '';
});