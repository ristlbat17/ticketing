Meteor.methods({
    'getConfig': function () {
        var config = Config.findOne();
        return config;
    }
});