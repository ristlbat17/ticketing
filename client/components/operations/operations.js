import download from 'downloadjs'

Router.route('operations', {
    path: '/operations',
    template: 'operations',
    waitOn: function () {
        return [
            Meteor.subscribe('drills'),
            Meteor.subscribe('config'),
            Meteor.subscribe('locationHistory'),
            Meteor.subscribe('bundleHistory')
        ];
    }
});

Template.operations.onCreated(function () {
    var instance = this;
    var firstDrill = Drills.findOne({}, { sort: { 'active': -1 } });
    Session.setDefault('searchFilter');
    Session.setDefault('bundleLimit', "");
    Session.setDefault('locationLimit', "");
    Session.set('drillFilter', firstDrill ? firstDrill._id : undefined);

    instance.autorun(function () {
        instance.subscribe('bundles', Session.get('drillFilter'));
        instance.subscribe('locations', Session.get('drillFilter'));
    });
});

Template.operations.onRendered(function () {
    $('#list-search').val(Session.get('searchFilter'));
    $('#bundleShowNumberElements').val(Session.get('bundleLimit'));
    $('#locationShowNumberElements').val(Session.get('locationLimit'));
});

Template.operations.helpers({
    drills: function () {
        return Drills.find({}, { sort: { 'active': -1 } });
    },
    locations: function () {
        return Locations.find({}, { sort: { 'active': -1 } });
    }
});

Template.operations.events({
    'change #drillFilter': function (event, template) {
        Session.set('drillFilter', event.currentTarget.value);
    },
    'change #bundleShowNumberElements': function (event, template) {
        Session.set('bundleLimit', event.currentTarget.value);
    },
    'change #locationShowNumberElements': function (event, template) {
        Session.set('locationLimit', event.currentTarget.value);
    },
    'click #btn-clear-search': function (event, template) {
        template.$('#list-search').val('').keyup();
    },
    'keyup #list-search': function (event, template) {
        Session.set('searchFilter', event.currentTarget.value);
    },
    'click #downloadLocationHistory' : function(event,template) {
        var drillFilter = Session.get('drillFilter');
        var selectedDrill = Drills.findOne({_id: drillFilter});

        var locationHistoryEntries = LocationHistory.find({
            drill: selectedDrill.name
        }).fetch();

        var formattedEntries = locationHistoryEntries.map((entry) => {
            return {
                timestamp: formatDate(entry.timestamp),
                user: entry.user,
                changeType: entry.changeType,
                drill: entry.drill,
                location: entry.location,
                establishmentNumber: entry.establishmentNumber,
                location_Timestamp: formatDate(entry.location_Timestamp),
                location_Deadline: formatDate(entry.location_Deadline),
                location_Comment: replaceNewline(entry.location_Comment),
                radio_Timestamp: formatDate(entry.radio_Timestamp),
                radio_Deadline: formatDate(entry.radio_Deadline),
                radio_Comment: replaceNewline(entry.radio_Comment),
                closed: entry.closed
            }
        })
        downloadCvs(formattedEntries,selectedDrill.name+" Standortjournal ");
    },
    'click #downloadBundleHistory' : function(event,template) {
        var drillFilter = Session.get('drillFilter');
        var selectedDrill = Drills.findOne({_id: drillFilter});

        var bundleHistoryEntries = BundleHistory.find({
            drill: selectedDrill.name
        }).fetch();

        var formattedEntries = bundleHistoryEntries.map((entry) => {
            return {
                timestamp: formatDate(entry.timestamp),
                user: entry.user,
                changeType: entry.changeType,
                drill: entry.drill,
                bundle: entry.bundle,
                establishmentNumber: entry.establishmentNumber,
                shf_Timestamp: formatDate(entry.shf_Timestamp),
                shf_Deadline: formatDate(entry.shf_Deadline),
                shf_Comment: replaceNewline(entry.shf_Comment),
                tbz_Timestamp: formatDate(entry.tbz_Timestamp),
                tbz_Deadline: formatDate(entry.tbz_Deadline),
                tbz_Comment: replaceNewline(entry.tbz_Comment),
                closed: entry.closed
            }
        })
        downloadCvs(formattedEntries,selectedDrill.name+" Buendeljournal ");
    }
});

function downloadCvs(formattedEntries,title) {
    const csvString = Papa.unparse(formattedEntries, {
        encoding: "utf-8"
    });

    var filename =  title + formatDate(moment()) + '.csv';
    download(csvString,filename,"text/csv");
}

function replaceNewline(value) {
    if(!value) return "";
    value = value.toString().replaceAll('/(?:\r\n|\r|\n)/g', '');
    value = value.toString().replaceAll('\n', '');
    return value;
}

function formatDate(value) {
    var dateTime = moment(value)
    return dateTime.format('DD.MM.YYYY HH:mm:ss')
}
