Tickets = new Meteor.Collection('tickets');
TicketNotifications = new Meteor.Collection('ticketNotifications');

function loggedIn(userId) {
    return !!userId;
}

Tickets.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});

TicketNotifications.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});

Tickets.after.insert(ticketUpdated);
Tickets.after.update(ticketUpdated);

function ticketUpdated(userId, doc, fieldNames, modifier, options) {
    if (doc.completedAt) {
        return;
    }
    var alreadyInserted = TicketNotifications.find({ userId: userId, triage: doc.triage }).fetch();
    if (alreadyInserted.length) {
        return;
    }
    TicketNotifications.insert({
        userId: userId,
        triage: doc.triage
    }, function (err, id) {
        Meteor.setTimeout(function () {
            TicketNotifications.remove({ _id: id });
        }, 1000);
    });
};
    