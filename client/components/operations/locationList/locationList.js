Template.locationList.onCreated(function () {
    Session.setDefault('locationSort', 'name');
    Session.setDefault('locationSortOrder', 'asc');
    Session.setDefault('locationLimit', '');
});

Template.locationList.helpers({
    locations: function () {
        var query = {};
        var searchFilter = Session.get('searchFilter'),
            sort = Session.get('locationSort'),
            order = Session.get('locationSortOrder'),
            numberOfBundlesToShow = parseInt(Session.get('locationLimit'));

        if (!!searchFilter) {
            query.$or = [
                {
                    name: new RegExp(searchFilter, 'ig')
                }
            ];
        }
        var options = {
            sort: { [sort]: order === 'asc' ? 1 : -1 }
        }
        if (!!numberOfBundlesToShow) {
            options.limit = numberOfBundlesToShow
        }
        return Locations.find(query, options);
    }
})

Template.locationRow.onCreated(function () {
    var that = this;
    this.lastLocationCheck = new ReactiveVar(new Date());
    Meteor.setInterval(function () {
        that.lastLocationCheck.set(new Date());
        enableTooltips();
    }, 1000);
})

Template.locationRow.onRendered(() => {
    enableTooltips();
})

Template.locationRow.helpers({
    'getLocationStatus': function (establishment) {

        Template.instance().lastLocationCheck.get();
        if (establishment.closed)
            return " Verlassen";

        else if (establishment.radio.timestamp && establishment.location.timestamp)
            return " Standort bezogen"

        else if (!establishment.radio.timestamp && establishment.location.timestamp)
            return " Verbindungskontrolle SE 240 durchführen"

        else
            return " Standort beziehen"
    },

    'getDeltabox': (timestamp, deadline, comment, glyphicon, text) => {
        Template.instance().lastLocationCheck.get();
        if (!timestamp && !deadline) {
            return Spacebars.SafeString('-');
        }
        if (!timestamp) {
            var deltaToGo = moment.duration(moment(deadline) - moment());
            var config = Config.findOne();
            var showWarningGettingBelowMinutes = config ? config.priorities.bundleWarningMinutes : 60
            var labelClass = "";
            if (deltaToGo.asMinutes() < 0) {
                labelClass = "label label-danger label-as-badge";
            }
            else if (deltaToGo.asMinutes() < showWarningGettingBelowMinutes) {
                labelClass = "label label-warning label-as-badge";
            }

            var tooltip = 'data-toggle="tooltip" data-placement="top" title="Deadline: ' + moment(deadline).format("DD.MM.YYYY HH:mm") + '" ';
            var delta = deltaToGo.locale("de").humanize(true)
            return Spacebars.SafeString('<span class="' + labelClass + '" ' + tooltip + '><i class="' + glyphicon + '"></i>'
                + text + " " + delta + '</span>');

        }
        else {
            var deltaAchieved = moment.duration(moment(deadline) - moment(timestamp));
            var labelClass = deltaAchieved.asMinutes() < 0 ? "glyphicon glyphicon-remove text-danger" : "glyphicon glyphicon-ok text-success"
            var tooltip = 'data-toggle="tooltip" data-placement="top" title="Kommentar: ' + comment + '" ';

            var delta = deltaAchieved.locale("de").format("dd[d] hh[h] mm[min]")
            return Spacebars.SafeString('<span ' + tooltip + '><i class="'
                + labelClass + '"></i> ' + text + " " + delta + '</span>');
        }

    },
    getActiveEstablishment: (location) => {
        return getActiveEstablishment(location);
    }
})


Template.editLocationStatus.onCreated(function () {
    this.currentLocation = new ReactiveVar();
});

Template.editLocationStatus.onRendered(function () {
    enableDateTimePickers();
});

Template.editLocationStatus.events({
    'show.bs.modal #editLocationStatus': function (event, template) {
        var locationId = $(event.relatedTarget).attr('data-id')
        template.currentLocation.set(locationId);
        var activeEstablisment = getActiveEstablishment(getLocation());
        if (!activeEstablisment) {
            setTimeout(() => {
                var notificationArea = $(event.target).find('.notification-area');
                notificationArea.error("Es wurde kein Bezug aktivert, daher kann der Status nicht geändert werden.")
            }, 500)
        }
    },
    'submit #editLocationEstablishment': function (event, template) {
        event.preventDefault();
        var locationTimestamp = convertDateToIsoString(template.$('#timestampLocation').val()),
            locationComment = template.$('#commentLocation').val(),
            radioTimestamp = convertDateToIsoString(template.$('#timestampRadio').val()),
            radioComment = template.$('#commentRadio').val(),
            closed = template.$('#closed:checked').val() == "on" ? true : false,
            number = template.$('#establishmentNumber').val();
        var locationId = template.currentLocation.get();

        Meteor.call('updateLocationEstablishment', locationId, number, locationTimestamp, locationComment, radioTimestamp, radioComment, closed, function (error, result) {
            if (error) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Bündel gespeichert.");
            template.$('.modal').modal('hide');
        });
    }
});

Template.editLocationStatus.helpers({
    isClosed: function (closed) {
        return closed ? "checked" : "";
    },
    hasReachedDeadline: function (deadline, timestamp) {
        return timestamp <= deadline;
    },
    canBeClosed: function (controlledTimestamp) {
        return controlledTimestamp != undefined ? "" : "disabled"
    },
    establishment: function (location) {
        var location = getLocation();
        if (!location) return;
        return getActiveEstablishment(location);
    }
})

function getLocation() {
    return Locations.findOne({ _id: Template.instance().currentLocation.get() });
}

function enableDateTimePickers() {
    $('.datetimepicker').datetimepicker({
        format: "DD.MM.YYYY HH:mm"
    });
}
function getActiveEstablishment(location) {

    var establishment = location.establishments.find((establishment) => {
        return establishment.active == true;
    })

    if (deadlineNotDefined(establishment))
        return undefined;
    else
        return establishment;
}

function deadlineNotDefined(establishment) {
    return !(establishment) ||
        ((!_.has(establishment, ("radio")) || !establishment.radio.deadline) &&
            (!_.has(establishment, ("location")) || !establishment.location.deadline));
}

function convertDateToIsoString(dateString) {
    if (!dateString) return "";
    return moment(dateString, "DD.MM.YYYY HH:mm").format();
}

function enableTooltips() {
    $('[data-toggle=tooltip]').tooltip();
}