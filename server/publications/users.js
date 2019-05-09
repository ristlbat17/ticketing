Meteor.publish('users', function () {
    return Meteor.users.find({$or: [{'profile.admin': false}, {'profile.admin': {$exists: false}}]});
});