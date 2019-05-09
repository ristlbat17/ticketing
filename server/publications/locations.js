Meteor.publish('locations', function (drillFilter) {
    var query = {};
    if (drillFilter) {
        query = {
            drill: drillFilter
        };
    }
    return Locations.find(query);
});