Meteor.publish('config', function () {
    return Config.find();
});