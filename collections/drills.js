Drills = new Meteor.Collection('drills');

function isAdmin(userId) {
    var user = Meteor.users.findOne(userId);
    return user.profile && user.profile.admin;
}

Drills.allow({
    insert: isAdmin,
    update: isAdmin,
    remove: isAdmin
});