import {getDampingMatches} from "../dampingMatches.js"


Template.bundleList.onCreated(function () {
    Session.setDefault('bundleSort', 'name');
    Session.setDefault('bundleSortOrder', 'asc');
    Session.setDefault('bundleLimit', '');
});

Template.bundleList.helpers({
    bundles: function () {
        var query = {};

        var searchFilter = Session.get('searchFilter'),
            sort = Session.get('bundleSort'),
            order = Session.get('bundleSortOrder'),
            numberOfBundlesToShow = parseInt(Session.get('bundleLimit'));

        if (!!searchFilter) {
            query.$or = [
                {
                    name: new RegExp(searchFilter, 'ig')
                },
                {
                    locationA: new RegExp(searchFilter, 'ig')
                },
                {
                    locationB: new RegExp(searchFilter, 'ig')
                }
            ];
        }
        var options = {
            sort: { [sort]: order === 'asc' ? 1 : -1 }
        }
        if (!!numberOfBundlesToShow) {
            options.limit = numberOfBundlesToShow
        }
        return Bundles.find(query, options).fetch()
    },
    getSortClass: function (sort) {
        var actualSort = Session.get('bundleSort'),
            actualOrder = Session.get('bundleSortOrder');

        if (actualSort !== sort) {
            return '';
        }
        return `ordered ${actualOrder}`;
    }
});

Template.bundleList.events({
    'click [data-sort]': function (event) {
        var actualSort = Session.get('bundleSort'),
            actualOrder = Session.get('bundleSortOrder'),
            newSort = event.currentTarget.dataset.sort;

        if (actualSort === newSort) {
            Session.set('bundleSortOrder', actualOrder === 'desc' ? 'asc' : 'desc');
            return;
        }
        Session.set('bundleSort', newSort);
        Session.set('bundleSortOrder', 'asc');
    }
});

Template.bundleRow.onCreated(function () {
    var that = this;
    this.lastCheck = new ReactiveVar(new Date());
    Meteor.setInterval(function () {
        that.lastCheck.set(new Date());
        enableTooltips();
    }, 1000);
});

Template.bundleRow.onRendered(() => {
    enableTooltips();
})

Template.bundleRow.events({
    'click .e-link': function (event, template) {
        event.preventDefault();
        Router.go('bundleDetail', { id: template.data._id }, {});
    }
});

Template.bundleRow.helpers({   
    
    getLatestDamping: function (bundle, direction) {
        var measurementMatches = [];
        measurementMatches = getDampingMatches(bundle);
        if (measurementMatches){
            if (direction === "AtoB") {                 
                return `${measurementMatches[0].AtoBDamping}`;
            } else {
                return `${measurementMatches[0].BtoADamping}`;
            }
        }
        
    },
    isLate: function (bundle, direction) {
        /*Template.instance().lastCheck.get();
        var opposite = direction === 'AtoB' ? 'BtoA' : 'AtoB';
        var directionLevels = bundle.levels
            .filter(o => o.direction === direction)
            .sort((a, b) => b.date - a.date);
        var oppositeLevels = bundle.levels
            .filter(o => o.direction === opposite)
            .sort((a, b) => b.date - a.date);

        if (!directionLevels.length || !oppositeLevels.length) {
            return;
        }

        if (moment(directionLevels[0].date).diff(oppositeLevels[0].date, 'minutes') < -15) {
            var oppositeLocation = opposite ? bundle.location : bundle.location;
            var location = opposite ? bundle.location : bundle.location;
            return Spacebars.SafeString('class="danger" data-toggle="tooltip" data-placement="top" title="Seit mehr als 15min keine Meldung erhalten, obwohl ' + oppositeLocation
                + ' gemeldet hat. Bitte Standort ' + location + '  für neue Pegelwerte anrufen"');
        }*/
        

        var directionMeasurements = getMeasurementsForLocation(bundle, direction === 'AtoB' ? bundle.locationA : bundle.locationB);
        var oppositeMeasurements = getMeasurementsForLocation(bundle, direction === 'AtoB' ? bundle.locationB : bundle.locationA);
        if (!directionMeasurements.length || !oppositeMeasurements.length) {
            return;
        }
        console.log(moment(directionMeasurements[0].date).diff(oppositeMeasurements[0].date));
        if (moment(directionMeasurements[0].date).diff(oppositeMeasurements[0].date, 'minutes') < -15) {
            var oppositeLocation = direction === 'AtoB' ? bundle.locationB : bundle.locationA;
            var location = direction === 'AtoB' ? bundle.locationA : bundle.locationB;
            return Spacebars.SafeString('class="danger" data-toggle="tooltip" data-placement="top" title="Seit mehr als 15min keine Meldung erhalten, obwohl ' + oppositeLocation
                + ' gemeldet hat. Bitte Standort ' + location + '  für neue Pegelwerte anrufen"');
        }


        return;
    },
    getDirection: function (bundle, direction) {
        if (direction === 'AtoB') {
            return `${bundle.locationA} \u{02192} ${bundle.locationB}`;
        } else {
            return `${bundle.locationB} \u{02192} ${bundle.locationA}`;
        }
    },
    'getBundleStatus': (establishment) => {
        Template.instance().lastCheck.get();

        if (establishment.closed)
            return " Bündel getrennt";

        else if (establishment.shf.timestamp && establishment.tbz.timestamp)
            return " Bündel geschlossen"

        else if (!establishment.tbz.timestamp && establishment.shf.timestamp)
            return " TBZ erreichen"

        else
            return " SHF erreichen"
    },

    'getDeltabox': (timestamp, deadline, comment, glyphicon, text) => {
        Template.instance().lastCheck.get();
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
    getActiveEstablishment: (bundle) => {
        Template.instance().lastCheck.get();
        return getActiveEstablishment(bundle);
    }
});

Template.newBundleLevel.onCreated(function () {
    this.selectedBundle = new ReactiveVar();
    this.selectedDate = new Date();
});

Template.newBundleLevel.helpers({
    bundles: function () {
        return Bundles.find({}, { sort: { name: 1 } });
    },
    selectedBundle: function () {
        return Template.instance().selectedBundle.get();
    },
    getDirections: function (bundle) {
        var bundle = Template.instance().selectedBundle.get();
        return [
            {
                name: `${bundle.locationA} \u{02192} ${bundle.locationB}`,
                value: 'AtoB'
            },
            {
                name: `${bundle.locationB} \u{02192} ${bundle.locationA}`,
                value: 'BtoA'
            }
        ];
    }
});

Template.newBundleLevel.events({
    'show.bs.modal #newLevel': function (event, template) {
        template.$('#bundle').change();
        setTimeout(() => {
            enableDateTimePickers();
        }, 200);

    },
    'change #bundle': function (event, template) {
        var bundle = Bundles.findOne({ _id: event.currentTarget.value })
        enableDateTimePickers();
        template.selectedBundle.set(bundle);

    },
    'submit #newLevelForm': function (event, template) {
        event.preventDefault();

        var bundle = template.selectedBundle.get(),
            selectedDate = convertDateToIsoString(template.$('#bundleDate').val()),
            locationSelection = template.$('input:radio[name=location]:checked').val(),
            txValue = parseInt(template.$('#txValue').val());
            rxValue = parseInt(template.$('#rxValue').val());
        save = true;

        if (!txValue || !rxValue ){
            return notificationArea.error("Bitte RX/TX Werte eingeben", true);
        }
        if (!locationSelection){
            return notificationArea.error("Bitte Standort auswählen", true);
        }

        if (rxValue > 22 || rxValue < -99 || txValue > 22 || txValue < -99){
            return notificationArea.error("RX/TX Werte müssen zwischen +22 und -99 sein.", true);
        }


        if (!selectedDate) {
            selectedDate = new Date();
        }

        if (!save) {
            return;
        }
  

        Bundles.update({ _id: bundle._id }, {
            $push: {
                measurements: {
                    id: Random.id(),
                    date: selectedDate,
                    location: locationSelection === "A" ? bundle.locationA : bundle.locationB,
                    rxValue: rxValue,
                    txValue: txValue
                }
            }
        }, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Wert gespeichert.");
            template.selectedBundle.set();
            template.$('.modal').modal('hide');
        });

    },
    'hidden.bs.modal #newLevel': function (event, template) {
        template.$('.form-group').removeClass('has-error has-success');
    }
});

Template.editBundleStatus.onCreated(function () {
    this.currentBundle = new ReactiveVar();
});

Template.editBundleStatus.onRendered(function () {
    enableDateTimePickers();
});

Template.editBundleStatus.events({
    'show.bs.modal #editBundleStatus': function (event, template) {
        var bundleId = $(event.relatedTarget).attr('data-id')
        template.currentBundle.set(bundleId);
    },
    'hidden.bs.modal #editBundleStatus': (event, template) => {
        template.currentBundle.set("");
    },
    'submit #editBundleEstablishmentForm': function (event, template) {
        event.preventDefault();
        var locationTimestamp = convertDateToIsoString(template.$('#timestampShf').val()),
            locationComment = template.$('#commentShf').val(),
            radioTimestamp = convertDateToIsoString(template.$('#timestampTbz').val()),
            radioComment = template.$('#commentTbz').val(),
            closed = template.$('#bundleClosed:checked').val() == "on" ? true : false,
            number = template.$('#bundleEstablishmentNumber').val();
        var bundleId = template.currentBundle.get();

        Meteor.call('updateBundleEstablishment', bundleId, number, locationTimestamp, locationComment, radioTimestamp, radioComment, closed, function (error) {
            if (error) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Bündel gespeichert.");
            template.$('.modal').modal('hide');
        });
    }
});

Template.editBundleStatus.helpers({
    isClosed: function (closed) {
        return closed ? "checked" : "";
    },
    establishment: function (bundle) {
        var bundle = getBundle();
        if (!bundle) return;
        return getActiveEstablishment(bundle);
    }
})

function getBundle() {
    return Bundles.findOne({ _id: Template.instance().currentBundle.get() });
}
function getActiveEstablishment(bundle) {
    var establishment = bundle.establishments.find((establishment) => {
        return establishment.active == true;
    })
    if (deadlineNotDefined(establishment))
        return undefined;
    else
        return establishment;
}

function deadlineNotDefined(establishment) {
    return !(establishment) ||
        ((!_.has(establishment, ("shf")) || !establishment.shf.deadline) &&
            (!_.has(establishment, ("tbz")) || !establishment.tbz.deadline));
}

function enableDateTimePickers() {
    $('.datetimepicker').datetimepicker({
        format: "DD.MM.YYYY HH:mm"
    });
}

function enableTooltips() {
    $('[data-toggle=tooltip]').tooltip();
}
function convertDateToIsoString(dateString) {
    if (!dateString) return "";
    return moment(dateString, "DD.MM.YYYY HH:mm").format();
}
function getMeasurementsForLocation(bundle, location) {
    var measurements = bundle.measurements
        .filter(o => o.location === location)
        .sort((a, b) => moment(b.date) - moment(a.date));

    return measurements;
}