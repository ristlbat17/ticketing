Template.ticketList.onCreated(function () {
    Session.setDefault('ticketSort', 'deadline');
    Session.setDefault('ticketSortOrder', 'asc');
});

Template.ticketList.onRendered(function () {
    $('#ticket-search').val(Session.get('ticketFilter'));
});

Template.ticketList.helpers({
    tickets: function () {
        var query = {};
        var ticketFilter = Session.get('ticketFilter'),
            drillLocationFilter = Session.get('drillLocationFilter'),
            currentView = Session.get('Tickelist');
            sort = Session.get('ticketSort'),
            order = Session.get('ticketSortOrder');
        if (!!ticketFilter && currentView == "current") {
            query.$or = [
                {
                    creator: new RegExp(ticketFilter, 'ig')
                },
                {
                    location: new RegExp(ticketFilter, 'ig')
                },
                {
                    triageName: new RegExp(ticketFilter, 'ig')
                },
                {
                    messenger: new RegExp(ticketFilter, 'ig')
                },
                {
                    description: new RegExp(ticketFilter, 'ig')
                }
            ];
        }
        if(drillLocationFilter && currentView == "archive"){
            locationAndDrillNames = drillLocationFilter.toString().split(',')
            query.$or = [
                {
                    location: {
                        $in: locationAndDrillNames
                    }
                },
                {
                    drill: {
                        $in: locationAndDrillNames
                    }
                }

            ]
        }

        return Tickets.find(query, { sort: { [sort]: order === 'asc' ? 1 : -1 } });
    },
    getSortClass: function (sort) {
        var actualSort = Session.get('ticketSort'),
            actualOrder = Session.get('ticketSortOrder');

        if (actualSort !== sort) {
            return '';
        }
        return `ordered ${actualOrder}`;
    },
    ticketDue: function (ticket) {
        if (ticket.completedAt) return '';
        return moment().isAfter(moment(ticket.deadline)) ? 'danger' : '';
    },
    getLocation: function (id) {
        return Locations.findOne({ _id: id }).name
    },
    getTriage: function (id) {
        return Meteor.users.findOne({ _id: id }).profile.name
    },
    formatDate: function (date) {
        return moment(date).format('DD.MM.YYYY HH:mm');
    },
    getState: function (ticket) {
        if (ticket.completedAt) return 'Geschlossen';
        if (ticket.actions && ticket.actions.length) return 'Bearbeitung';
        return 'Offen';
    },
    description: function (ticket) {
        return ticket.description.truncate(250, true);
    }
});

Template.ticketList.events({
    'click [data-sort]': function (event, template) {
        var actualSort = Session.get('ticketSort'),
            actualOrder = Session.get('ticketSortOrder'),
            newSort = event.currentTarget.dataset.sort;

        if (actualSort === newSort) {
            Session.set('ticketSortOrder', actualOrder === 'desc' ? 'asc' : 'desc');
            return;
        }
        Session.set('ticketSort', newSort);
        Session.set('ticketSortOrder', 'asc');
    },
    'click tbody tr, click .ticket': function (event, template) {
        Router.go('ticketDetail', { id: event.currentTarget.dataset.id }, {});
    }
});
