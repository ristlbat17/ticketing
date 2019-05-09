Meteor.publish('locationHistory',function() {
    return LocationHistory.find({});
});
