Router.route('index', {
    path: '/',
    template: 'index',
    waitOn: function () {
        return [
            Meteor.subscribe('users'),
            Meteor.subscribe('locations'),
            Meteor.subscribe('drills'),
            Meteor.subscribe('ticketNotifications')
        ];
    }
});

Template.index.onCreated(function () {
    var instance = this;
    Session.setDefault('indexFilterOwn', true);
    Session.setDefault('ticketFilter');
    Session.set('Tickelist',"current");

    instance.autorun(function () {
        instance.subscribe('ticketsDue', Session.get('indexFilterOwn'));
    });

    if (notify.isSupported) {
        var user = Meteor.user();
        notify.config({autoClose: 3000});
        if (!user.profile.hideNotifications && notify.permissionLevel() === notify.PERMISSION_DEFAULT) {
            notify.requestPermission();
        }

        instance.autorun(function () {
            var notifications = TicketNotifications.find().fetch();
            if (notifications.length) {
                var notification = notifications[0];
                if (!user.profile.hideNotifications &&
                    [notify.PERMISSION_DEFAULT, notify.PERMISSION_DENIED].indexOf(notify.permissionLevel()) === -1 &&
                    user._id !== notification.userId &&
                    notification.triage === user._id) {
                    notify.createNotification('Ticketing', {
                        body: 'Ein neues Ticket wurde dir zugewiesen, oder ein zugewiesenes bearbeitet.',
                        icon: {
                            x16: '/img/badge_16.ico',
                            x32: '/img/badge_32.png'
                        }
                    });
                }
            }
        })
    }
});

Template.index.onRendered(function () {
    if (Session.get('indexFilterOwn')) {
        this.$('.mine').parent().addClass('active');
    } else {
        this.$('.all').parent().addClass('active');
    }
});

Template.index.events({
    'change .mine, change .all': function (event, template) {
        Session.set('indexFilterOwn', $(event.target).is('.mine'));
    },
    'click #btn-clear-search': function (event, template) {
        template.$('#ticket-search').val('').keyup();
    },
    'keyup #ticket-search': function (event, template) {
        Session.set('ticketFilter', event.currentTarget.value);
    }
});
