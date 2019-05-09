Meteor.publish('ticketsDue', function (onlyMine) {
    var query = {$or: [{'completedAt': null}, {'completedAt': {$exists: false}}]};
    if (onlyMine) {
        query = {
            $and: [
                query,
                {triage: this.userId}
            ]
        };
    }
    return Tickets.find(query);
});

Meteor.publish('ticketsDone', function () {
    return Tickets.find({'completedAt': {$ne: null}});
});

Meteor.publish('tickets', function () {
    return Tickets.find();
});

Meteor.publish('ticketDoneCount', function () {
    Counts.publish(this, 'ticketDoneCount', Tickets.find({'completedAt': {$ne: null}}));
});

Meteor.publish('ticketDueCount', function () {
    Counts.publish(this, 'ticketDueCount', Tickets.find({$or: [{'completedAt': null}, {'completedAt': {$exists: false}}]}));
});

Meteor.publish('ticketNotifications', function () {
    return TicketNotifications.find(); 
});