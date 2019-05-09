Meteor.publish('drills', function () {
    return Drills.find();
});