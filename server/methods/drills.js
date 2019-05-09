Meteor.methods({
    'setDrillActive': function (id) {
        var user = Meteor.users.findOne(this.userId);
        if (!user.profile || !user.profile.admin) {
            throw new Meteor.Error(403, "not authorized to do that");
        }

        Drills.update({_id: {$ne: id}}, {$set: {active: false}}, {multi: true});
        Drills.update({_id: id}, {$set: {active: true}});
    }
});