import { Session } from 'meteor/session'

Template.newTicket.onCreated(function () {
    var drill = (Drills.find({}, { sort: { 'active': -1 } }).fetch() || [])[0];
    this.selectedDrill = new ReactiveVar(drill ? drill._id : undefined);
});

Template.newTicket.onRendered(function () {
    var that = this;
    that.ticketForm = new FormValidator('#newTicketForm');
    $('#newTicket')
        .on('hidden.bs.modal', function () {
            that.ticketForm.reset();

        })
        .on('shown.bs.modal', function () {           
            var lastCreator =  Session.get('lastCreator');
            if (lastCreator) {
                $('#creator', this).val(lastCreator);
                $('#messenger', this).focus();
            }
            else {
                $('#creator', this).focus();
            }

        });
});

Template.newTicket.helpers({
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

Template.newTicket.events({
    'change #drill': function (event, template) {
        template.selectedDrill.set(template.$('#drill option:selected').data('drill-id'));
    },
    'change #location': function (event, template) {
        var ticket = template.ticketForm.data;
        var location = Locations.findOne({ name: ticket.location });
        if (ticket.messenger == "") {
            template.$('#messenger').val(location.responsiblePerson);
        }

        if (ticket.phone == "") {
            template.$('#phone').val(location.contactNumberResonsiblePerson);
        }

        console.log(template)
    },
    'submit #newTicketForm': function (event, template) {
        event.preventDefault();
        if (!template.ticketForm.validate()) return;

        var ticket = template.ticketForm.data;

        Session.set('lastCreator', ticket.creator);

        Meteor.call('getConfig', function (err, config) {
            ticket.actions = [];
            ticket.deadline = moment().add(config.priorities[ticket.priority], 'm').toDate();
            ticket.created = moment().toDate();
            ticket.triageName = Meteor.users.findOne({ _id: ticket.triage }).profile.name;
            Tickets.insert(ticket, function (err) {
                if (err) {
                    console.error(err);
                    return notificationArea.error("Es ist ein Fehler aufgetreten.");
                }
                notificationArea.success("Ticket gespeichert.");
                template.$('.modal').modal('hide');
            });
        });
    }
});