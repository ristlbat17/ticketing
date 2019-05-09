Meteor.publish('bundleHistory',function() {
    return BundleHistory.find({});
});
