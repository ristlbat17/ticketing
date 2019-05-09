notificationArea = {
    info: function (message, modal) {
        modal = modal || false;
        ClientNotifications.insert({
            message: message,
            type: 'info',
            modal: modal
        });
    },
    warning: function (message, modal) {
        modal = modal || false;
        ClientNotifications.insert({
            message: message,
            type: 'warning',
            modal: modal
        });
    },
    success: function (message, modal) {
        modal = modal || false;
        ClientNotifications.insert({
            message: message,
            type: 'success',
            modal: modal
        });
    },
    error: function (message, modal) {
        modal = modal || false;
        ClientNotifications.insert({
            message: message,
            type: 'danger',
            modal: modal
        });
    }
};

Template.notificationArea.helpers({
    notifications: function () {
        var tpl = Template.instance();
        if (tpl.data && tpl.data.modal) {
            return ClientNotifications.find({modal: true});
        } else {
            return ClientNotifications.find({$or: [{modal: false}, {modal: {$exists: false}}]});
        }
    }
});

Template.notification.onRendered(function () {
    var notification = this.$('.notification').addClass('show');

    Meteor.setTimeout(function () {
        notification.removeClass('show');
        Meteor.setTimeout(function () {
            ClientNotifications.remove(notification.data('id'));
        }, 200);
    }, 2500);
});