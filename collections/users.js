function isAdmin(userId) {
    var user = Meteor.users.findOne(userId);
    return user.profile && user.profile.admin;
}

Meteor.users.allow({
    insert: isAdmin,
    update: isAdmin,
    remove: isAdmin
});