Router.route('profile', {
    path: '/profile',
    template: 'profile'
});

Template.profile.events({
    'click .js-password-save': function (event, template) {
        event.preventDefault();

        var oldPwFieldGroup = template.$('.js-old-password').removeClass('has-error'),
            pwFieldGroup = template.$('.js-password').removeClass('has-error'),
            pwConfirmFieldGroup = template.$('.js-password-confirm').removeClass('has-error'),
            oldPw = template.$('#oldPassword'),
            pw = template.$('#password'),
            pwConfirm = template.$('#passwordConfirm'),
            save = true;

        if (!oldPw.val()) {
            save = false;
            oldPwFieldGroup.addClass('has-error');
        }

        if (!pw.val()) {
            save = false;
            pwFieldGroup.addClass('has-error');
        }

        if (!pwConfirm.val()) {
            save = false;
            pwConfirmFieldGroup.addClass('has-error');
        }

        if (pw.val() !== pwConfirm.val()) {
            save = false;
            pwFieldGroup.addClass('has-error');
            pwConfirmFieldGroup.addClass('has-error');
            notificationArea.warning("Passwörter stimmen nicht überein.")
        }

        if (!save) return;

        Accounts.changePassword(oldPw.val(), pw.val(), function (err) {
            if (err && err.error === 403) {
                return notificationArea.error("Altes Passwort stimmt nicht.");
            }
            if (err) return notificationArea.error("Es ist ein Fehler aufgetreten.");
            notificationArea.success("Passwort erfolgreich geändert.");
            pw.val('');
            oldPw.val('');
            pwConfirm.val('');
            oldPwFieldGroup.removeClass('has-error');
            pwFieldGroup.removeClass('has-error');
            pwConfirmFieldGroup.removeClass('has-error');
        });
    }
});