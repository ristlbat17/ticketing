Config = new Meteor.Collection('config');

function isAdmin(userId) {
    var user = Meteor.users.findOne(userId);
    return user.profile && user.profile.admin;
}

Config.allow({
    update: isAdmin
});