Meteor.methods({
    'createNewUser': function (username, name, password) {
        Accounts.createUser({
            username: username,
            password: password,
            profile: {
                name: name
            }
        });
    },
    'setUserPassword': function (userId, password) {
        Accounts.setPassword(userId, password);
    }
});