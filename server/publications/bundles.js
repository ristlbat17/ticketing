Meteor.publish('bundles', function (drillFilter) {
    var query = {};
    if (drillFilter) {
        query = {
            drill: drillFilter
        };
    }
    return Bundles.find(query);
});
