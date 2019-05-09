LocationHistory = new Meteor.Collection('locationHistory');

function isAdmin(userId) {
    var user = Meteor.users.findOne(userId);
    return user.profile && user.profile.admin;
}

function loggedIn(userId) {
    return !!userId;
}

LocationHistory.allow({
    insert: loggedIn,
    update: isAdmin,
    remove: isAdmin
})