Router.route('ticketDetail', {
    path: '/detail/:id',
    template: 'ticketDetail',
    waitOn: function () {
        return [
            Meteor.subscribe('users'),
            Meteor.subscribe('locations'),
            Meteor.subscribe('tickets'),
            Meteor.subscribe('drills'),
            Meteor.subscribe('ticketNotifications')
        ];
    }
});

Template.ticketDetail.onCreated(function () {
    var ticket = Tickets.findOne({ _id: Router.current().params['id'] });
    this.ticket = ticket;
    this.selectedDrill = new ReactiveVar(ticket.drill);
});

Template.ticketDetail.onRendered(function () {
    var that = this;
    that.ticketForm = new FormValidator('#editTicketForm');
    $('#editTicket').on('hidden.bs.modal', function () {
        that.ticketForm.resetState();
    });
});

Template.ticketDetail.events({
    'change #drill': function (event, template) {
        template.selectedDrill.set(template.$('#drill option:selected').data('drill-id'));
    },
    'show.bs.modal #editTicket': function (event, template) {
        template.$('#drill').change();
    },
    'shown.bs.modal #editTicket': function (event, template) {
        template.$('#location').val(template.ticket.location);
    },
    'hidden.bs.modal #editTicket': function (event, template) {
        var ticket = Tickets.findOne({ _id: Router.current().params['id'] });
        template.selectedDrill.set(ticket.drill);
    },
    'click #editTicketBtn': function (event, template) {
        var ticket = Tickets.findOne({ _id: Router.current().params['id'] });

        template.$('#drill').val(ticket.drill);
        template.$('#triage option[value="' + ticket.triage + '"]').attr('selected', 'selected');
        template.$('#location').val(ticket.location);
        template.$('#priority').val(ticket.priority);
    },
    'submit #editTicketForm': function (event, template) {
        event.preventDefault();
        if (!template.ticketForm.validate()) return;

        Meteor.call('getConfig', function (err, config) {
            var ticket = template.ticketForm.data;
            ticket.triageName = Meteor.users.findOne({ _id: ticket.triage }).profile.name;
            if (ticket.priority !== template.ticket.priority) {
                Meteor.call('getConfig', function (err, config) {
                    ticket.deadline = moment(template.ticket.created).add(config.priorities[ticket.priority], 'm').toDate();
                    updateTicket(ticket, template);
                });
            } else {
                updateTicket(ticket, template);
            }
        });
    }
});

Template.ticketDetail.helpers({
    ticket: function () {
        return Tickets.findOne({ _id: Router.current().params['id'] });
    },
    getLocation: function (id) {
        return Locations.findOne({ _id: id }).name;
    },
    getTriage: function (id) {
        return Meteor.users.findOne({ _id: id }).profile.name;
    },
    getDrill: function (id) {
        return Drills.findOne({ _id: id }).name;
    },
    getPriority: function (prio) {
        switch (prio) {
            case 'low':
                return 'Niedrig';
            case 'normal':
                return 'Normal';
            case 'high':
                return 'Hoch';
        }
    },
    formatDate: function (date) {
        return moment(date).format('DD.MM.YYYY HH:mm');
    },
    getState: function (ticket) {
        if (ticket.completedAt) return 'Geschlossen';
        if (ticket.actions && ticket.actions.length) return 'Bearbeitung';
        return 'Offen';
    },
    locations: function () {
        return Locations.find({ drill: Template.instance().selectedDrill.get() });
    },
    users: function () {
        return Meteor.users.find();
    },
    drills: function () {
        return Drills.find({}, { sort: { 'active': -1 } });
    }
});

Template.ticketOperations.helpers({
    users: function () {
        return Meteor.users.find();
    }

});

function checkActionIsValid(template) {
    var actionText = template.$('#newAction'),
        editor = template.$('#editor');

    if (!(actionText.val() && editor.val())) {
        return false
    }
    return true;
}

function checkTriageIsValid(template) {
    var newTriage = template.$('#newTriage');
    return newTriage.val();
}


function updateTicketWithAction(template, completed, err) {

    var actionText = template.$('#newAction'),
        editor = template.$('#editor');
    var updateQuery = {};

    if (!completed) {
        updateQuery.$unset = { completedAt: completed };
    }
    else {
        updateQuery.$set = { completedAt: completed };
    }

    updateQuery.$push = {
        'actions': {
            text: actionText.val(),
            editor: editor.val(),
            created: new Date()
        }
    }
    notificationArea.success("Aktion hinzugefügt.");
    Tickets.update({ _id: template.data._id }, updateQuery, err);

}

function updateTicketWithTriage(template, err) {
    var newTriage = template.$('#newTriage');
    var query = {};
    if (newTriage.val()) {
        query.$set = {
            'triage': newTriage.val(),
            'triageName': Meteor.users.findOne({ _id: newTriage.val() }).profile.name
        };
    }
    notificationArea.success("Ticket verschoben.");
    Tickets.update({ _id: template.data._id }, query, err);
}


Template.ticketOperations.events({
    'click #saveNewAction': function (event, template) {
        var actionText = template.$('#newAction'),
            newTriage = template.$('#newTriage'),
            editor = template.$('#editor'),
            query = {};

        var errorHandler = function (err) {
            if (err) {
                console.error(err);
                return notificationArea.error("Es ist ein Fehler beim Abschliessen aufgetreten.");
            }
            newTriage.val('');
            editor.val('');
            actionText.val('');
        };

        if (checkActionIsValid(template) && checkTriageIsValid(template)) {

            updateTicketWithAction(template, '', errorHandler);
            updateTicketWithTriage(template, errorHandler);
        }
        else if (checkActionIsValid(template)) {

            updateTicketWithAction(template, '', errorHandler);
        }
        else if (checkTriageIsValid(template)) {
            updateTicketWithTriage(template, errorHandler);
        }
        else {
            return notificationArea.warning('Aktionstext mit Bearbeiter oder neue Triage muss ausgefüllt sein');
        }

    },
    'click #closeTicket': function (event, template) {

        if (!checkActionIsValid(template)) {
            return notificationArea.warning('Aktionstext mit Bearbeiter eingeben, um ein Ticket zu schliessen');
        }
        updateTicketWithAction(template, moment().toDate(), function (err) {
            if (err) {
                console.error(err);
                return notificationArea.error("Es ist ein Fehler beim Abschliessen aufgetreten.");
            }
            notificationArea.success("Ticket abgeschlossen.");
            window.history.back();
        });
    },
    'click #reopenTicket': function (event, template) {

        if (!checkActionIsValid(template)) {
            return notificationArea.warning('Aktionstext mit Bearbeiter eingeben, um ein Ticket zu wiedereröffnen');
        }
        updateTicketWithAction(template, '', function (err) {
            if (err) {
                console.error(err);
                return notificationArea.error("Es ist ein Fehler beim Abschliessen aufgetreten.");
            }
            notificationArea.success("Ticket wieder geöffnet.");
            window.history.back();
        });
    }
});

Template.ticketAction.helpers({
    formatDate: function (date) {
        return moment(date).format('DD.MM.YYYY HH:mm');
    }
});

function updateTicket(ticket, template) {
    Tickets.update({ _id: Router.current().params['id'] }, { $set: ticket }, function (err) {
        if (err) {
            console.error(err);
            return notificationArea.error("Es ist ein Fehler aufgetreten.");
        }
        $.extend(true, template.ticket, ticket);
        notificationArea.success("Ticket gespeichert.");
        template.$('.modal').modal('hide');
    });
}