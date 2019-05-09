Router.route('login', {
    path: '/login',
    template: 'login'
});

Template.login.events({
    'submit #loginForm': function (event) {
        event.preventDefault();

        var userField = Template.instance().$('.js-user'),
            passField = Template.instance().$('.js-pass'),
            user = userField.find('input').val(),
            pass = passField.find('input').val();

        userField.removeClass('has-error');
        passField.removeClass('has-error');

        var authenticate = true;

        if (!user) {
            userField.addClass('has-error');
            authenticate = false;
        }

        if (!pass) {
            passField.addClass('has-error');
            authenticate = false;
        }

        if (!authenticate) return;

        Meteor.loginWithPassword(user, pass, function (err) {
            if (err) {
                if (err.error === 403) return notificationArea.error('Benutzername oder Passwort nicht korrekt.');
                return notificationArea.error('Ein Fehler ist aufgetretetn.');
            }
            Router.go('index');
        });
    }
});