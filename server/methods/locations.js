Meteor.methods({
    'setEstablishmentDeadlinesLocations': function (locationId, establishmentNumber, location, radio) {
        var user = Meteor.users.findOne(this.userId);
        if (!user.profile) {
            throw new Meteor.Error(403, "not authorized to do that");
        }
        Locations.update(
            { "_id": locationId, "establishments.establishmentNumber": establishmentNumber },
            {
                "$set": {
                    'establishments.$.location.deadline': location,
                    'establishments.$.radio.deadline': radio,
                }
            }
        );
    },
    'updateLocationEstablishment': function (locationId, establishmentNumber, locationTimestamp, locationComment, radioTimestamp, radioComment, closed) {
        var user = Meteor.users.findOne(this.userId);
        if (!user.profile) {
            throw new Meteor.Error(403, "not authorized to do that");
        }

        var number = parseInt(establishmentNumber);

        Locations.update(
            {
                "_id": locationId,  
                establishments: {
                    $elemMatch: {
                        establishmentNumber: { $eq: number }
                    }
                }
            },
            {
                $set: {
                    'establishments.$.location.timestamp': locationTimestamp,
                    'establishments.$.location.comment': locationComment,
                    'establishments.$.radio.timestamp': radioTimestamp,
                    'establishments.$.radio.comment': radioComment,
                    'establishments.$.closed': closed
                }
            }
        );

        writeHistoryEntry(user,locationId, establishmentNumber, "updated establishment");
    },
    'setActiveLocationEstabilshment': function (locationId, establishmentNumber) {
        var user = Meteor.users.findOne(this.userId);
        if (!user.profile || !user.profile.admin) {
            throw new Meteor.Error(403, "not authorized to do that");
        }

        Locations.findOne({_id: locationId}).establishments.forEach(establishment => {
            // loop through all values because of https://jira.mongodb.org/browse/SERVER-1243
            Locations.update({
                _id: locationId, establishments: {
                    $elemMatch: {
                        establishmentNumber: { $eq: establishment.establishmentNumber }
                    }
                }
            }, { $set: { 'establishments.$.active': false } });
    
        });

        Locations.update(
            {
                "_id": locationId,  
                establishments: {
                    $elemMatch: {
                        establishmentNumber: { $eq: establishmentNumber }
                    }
                }
            }, { $set: { 'establishments.$.active': true } });
    }
});

function writeHistoryEntry(user,locationId, establishmentNumber, changeType) {
    var location = Locations.findOne({ _id: locationId })
    var establiement = location.establishments.find(est => est.establishmentNumber == establishmentNumber);
    var drill = Drills.findOne({_id:location.drill});
    LocationHistory.insert({
        timestamp: moment().format(),
        user: user.username,
        changeType: changeType,
        drill: drill.name,
        location: location.name,
        establishmentNumber: establishmentNumber,
        location_Timestamp: establiement.location.timestamp,
        location_Deadline: establiement.location.deadline,
        location_Comment: establiement.location.comment,
        radio_Timestamp: establiement.radio.timestamp,
        radio_Deadline: establiement.radio.deadline,
        radio_Comment: establiement.radio.comment,
        closed: establiement.closed
    })
}