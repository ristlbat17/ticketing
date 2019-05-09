Meteor.startup(function () {
    var admin = Meteor.users.findOne({'profile.admin': true});

    if (!admin) {
        Accounts.createUser({
            username: 'admin',
            password: '123456',
            profile: {
                name: 'Administrator',
                admin: true
            }
        });
    }

    var config = Config.findOne();

    if (!config) {
        Config.insert({
            priorities: {
                high: 60,
                normal: 60 * 4,
                low: 60 * 8
            }
        });
    }
});