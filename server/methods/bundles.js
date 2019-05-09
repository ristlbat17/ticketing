Meteor.methods({
    'setEstablishmentDeadlines': function (bundleId, establishmentNumber, shf, tbz) {
        var user = Meteor.users.findOne(this.userId);
        if (!user.profile) {
            throw new Meteor.Error(403, "not authorized to do that");
        }

        var number = parseInt(establishmentNumber);
        Bundles.update(
            { "_id": bundleId, "establishments.establishmentNumber": number },
            {
                "$set": {
                    'establishments.$.shf.deadline': shf,
                    'establishments.$.tbz.deadline': tbz,
                }
            }
        );

    },
    'updateBundleEstablishment': function (bundleId, establishmentNumber, shfTimestamp, shfComment, tbzTimestamp, tbzComment, closed) {
        var user = Meteor.users.findOne(this.userId);
        if (!user.profile) {
            throw new Meteor.Error(403, "not authorized to do that");
        }
        var number = parseInt(establishmentNumber);

        Bundles.update(
            {
                "_id": bundleId,
                establishments: {
                    $elemMatch: {
                        establishmentNumber: { $eq: number }
                    }
                }
            },
            {
                $set: {
                    'establishments.$.shf.timestamp': shfTimestamp,
                    'establishments.$.shf.comment': shfComment,
                    'establishments.$.tbz.timestamp': tbzTimestamp,
                    'establishments.$.tbz.comment': tbzComment,
                    'establishments.$.closed': closed
                }
            }
        );

        writeHistoryEntry(user,bundleId, establishmentNumber, "updated establishment");

    },
    'setActiveBundleEstabilshment': function (bundleId, establishmentNumber) {
        var user = Meteor.users.findOne(this.userId);
        if (!user.profile || !user.profile.admin) {
            throw new Meteor.Error(403, "not authorized to do that");
        }

        Bundles.findOne({ _id: bundleId }).establishments.forEach(establishment => {
            // loop through all values because of https://jira.mongodb.org/browse/SERVER-1243
            Bundles.update({
                _id: bundleId, establishments: {
                    $elemMatch: {
                        establishmentNumber: { $eq: establishment.establishmentNumber }
                    }
                }
            }, { $set: { 'establishments.$.active': false } });

        });

        Bundles.update(
            {
                "_id": bundleId,
                establishments: {
                    $elemMatch: {
                        establishmentNumber: { $eq: establishmentNumber }
                    }
                }
            }, { $set: { 'establishments.$.active': true } });
    }
});

function writeHistoryEntry(user,bundleId, establishmentNumber, changeType) {
    var bundle = Bundles.findOne({ _id: bundleId })
    var establiement = bundle.establishments.find(est => est.establishmentNumber == establishmentNumber);
    var drill = Drills.findOne({_id:bundle.drill});
    BundleHistory.insert({
        timestamp: moment().format(),
        user: user.username,
        changeType: changeType,
        drill: drill.name,
        bundle: bundle.name,
        establishmentNumber: establishmentNumber,
        shf_Timestamp: establiement.shf.timestamp,
        shf_Deadline: establiement.shf.deadline,
        shf_Comment: establiement.shf.comment,
        tbz_Timestamp: establiement.tbz.timestamp,
        tbz_Deadline: establiement.tbz.deadline,
        tbz_Comment: establiement.tbz.comment,
        closed: establiement.closed
    })
}