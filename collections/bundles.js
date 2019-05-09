Bundles = new Meteor.Collection('bundles');

function isAdmin(userId) {
    var user = Meteor.users.findOne(userId);
    return user.profile && user.profile.admin;
}

function loggedIn(userId) {
    return !!userId;
}

Bundles.allow({
    insert: isAdmin,
    update: loggedIn,
    remove: isAdmin
});