Template.header.onCreated(function () {
    Meteor.subscribe('ticketDoneCount');
    Meteor.subscribe('ticketDueCount');
    // Meteor.subscribe('deadlineMissedCount');
    // Meteor.subscribe('deadlineWarningCount');
});

Template.header.onRendered(function () {
    this.$('#time').text(moment().format('DD.MM.YY HH:mm'));
    setInterval(function () {
        $('#time').text(moment().format('DD.MM.YY HH:mm'));
    }, 60000);
});

Template.header.helpers({
    dueCount: function () {
        return 0
    },
    doneCount: function () {
        return 0
    }
});

Template.header.events({
    'click .js-logout': function (event) {
        event.preventDefault();

        Meteor.logout(function (err) {
            if (err) {
                return notificationArea.error('Ein Fehler ist aufgetretetn.');
            }
            Router.go('login');
        });
    },
    'click .glyphicon-menu-hamburger': function (event, template) {
        template.$('.mobile-nav').addClass('open');
    },
    'click .close-nav': function (event, template) {
        template.$('.mobile-nav').removeClass('open');
    },
    'click .mobile-nav a': function (event, template) {
        template.$('.mobile-nav').removeClass('open');
    }
});