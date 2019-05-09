Meteor.methods({
    'deleteEverything': function () {
        var user = Meteor.users.findOne(this.userId);
        if (!user) {
            return;
        }
        if (!user.profile || !user.profile.admin) {
            throw new Meteor.Error(403, "not authorized to do that");
        }

        Drills.remove({});
        Locations.remove({});
        Tickets.remove({});
        Config.remove({});
        Bundles.remove({});
        BundleHistory.remove({});
        LocationHistory.remove({});
        Config.insert({
            priorities: {
                high: 60,
                normal: 60 * 4,
                low: 60 * 8,
                bundleWarningMinutes: 60
            }
        });
        Meteor.users.remove({_id: {$ne: this.userId}});
        Accounts.setPassword(this.userId, '123456');
    }
});