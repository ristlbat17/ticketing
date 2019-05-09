Locations = new Meteor.Collection('locations');

function isAdmin(userId) {
    var user = Meteor.users.findOne(userId);
    return user.profile && user.profile.admin;
}

Locations.allow({
    insert: isAdmin,
    update: isAdmin,
    remove: isAdmin
});