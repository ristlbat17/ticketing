BundleHistory = new Meteor.Collection('bundleHistory');

function isAdmin(userId) {
    var user = Meteor.users.findOne(userId);
    return user.profile && user.profile.admin;
}

function loggedIn(userId) {
    return !!userId;
}

BundleHistory.allow({
    insert: loggedIn,
    update: isAdmin,
    remove: isAdmin
})