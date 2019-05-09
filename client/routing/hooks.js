Router.onBeforeAction(function () {
    Session.set('currentRoute', this.route._path.substring(1));
    this.next();
});

Router.onBeforeAction(function () {
    if (!Meteor.loggingIn() && !Meteor.user()) {
        Router.go('login');
    } else {
        this.next();
    }
}, {
    except: ['login']
});

Router.onBeforeAction(function () {
    if (Meteor.user()) {
        Router.go('index');
    } else {
        this.next();
    }
}, {
    only: ['login']
});