import download from 'downloadjs'

Router.route('operationanalysis', {
    path: '/operationanalysis',
    template: 'operationanalysis',
    waitOn: function () {
        return [
            Meteor.subscribe('drills'),
            Meteor.subscribe('locations'),
            Meteor.subscribe('bundles')
        ];
    }
});

Template.operationanalysis.onCreated(function () {
    var drill = (Drills.find({}, { sort: { 'active': -1 } }).fetch() || [])[0];
    this.selectedDrill = new ReactiveVar(drill ? drill._id : undefined);
    enableDataTable();
    enableTooltips();
})
Template.operationanalysis.onRendered(function () {
    enableDataTable();
    enableTooltips();
});

Template.operationanalysis.events({
    'change #drillFilter': function (event, template) {
        var drillId = $("#drillFilter").val();
        template.selectedDrill.set(drillId);

    },
    'click #downloadLocationAnalysis': function (event, template) {

        var drillId = Template.instance().selectedDrill.get();
        var drill = Drills.findOne({_id:drillId})
        var locations = Locations.find({
            drill: drillId
        });

        var formattedEntries = locations.map((location) => {
            if(!location.establishments){
                return {
                    uebung: drill.name,
                    standort: location.name,
                    bezugsnummer: "-",
                    standort_soll: "-",
                    standort_ist: "-",
                    standort_differenz: "-",
                    standort_kommentar: "-",
                    verbindungskontrolle_soll: "-",
                    verbindungskontrolle_ist: "-",
                    verbindungskontrolle_differenz: "-",
                    verbindungskontrolle_kommentar: "-"
                }
            }
            return location.establishments.map((establishment) => {
                return {
                    uebung: drill.name,
                    standort: location.name,
                    bezugsnummer: establishment.establishmentNumber,
                    standort_soll: formatDate(establishment.location.deadline),
                    standort_ist: formatDate(establishment.location.timestamp),
                    standort_differenz: getDifference(establishment.location.timestamp,establishment.location.deadline),
                    standort_kommentar: replaceNewline(establishment.location.comment),
                    verbindungskontrolle_soll: formatDate(establishment.radio.deadline),
                    verbindungskontrolle_ist: formatDate(establishment.radio.timestamp),
                    verbindungskontrolle_differenz: getDifference(establishment.radio.timestamp,establishment.radio.deadline),
                    verbindungskontrolle_kommentar: replaceNewline(establishment.radio.comment)
                };
            })
        });
        var flattened = [].concat.apply([], formattedEntries);

        downloadCvs(flattened, drill.name+" Standortauswertung ");
    },
    'click #downloadBundleAnalysis': function (event, template) {
        var drillId = Template.instance().selectedDrill.get();
        var drill = Drills.findOne({_id:drillId})
        var bundles = Bundles.find({
            drill: drillId
        });

        var formattedEntries = bundles.map((bundle) => {
            if(!bundle.establishments){
                return {
                    uebung: drill.name,
                    buendel: bundle.name,
                    station_a: bundle.placeA,
                    station_b: bundle.placeB,
                    bezugsnummer: "-",
                    shf_soll: "-",
                    shf_ist: "-",
                    shf_differenz: "-",
                    shf_kommentar: "-",
                    tbz_soll: "-",
                    tbz_ist: "-",
                    tbz_differenz: "-",
                    tbz_kommentar: "-"
                }
            }
            return bundle.establishments.map((establishment) => {
                return {
                    uebung: drill.name,
                    buendel: bundle.name,
                    station_a: bundle.placeA,
                    station_b: bundle.placeB,
                    bezugsnummer: establishment.establishmentNumber,
                    shf_soll: formatDate(establishment.shf.deadline),
                    shf_ist: formatDate(establishment.shf.timestamp),
                    shf_differenz: getDifference(establishment.shf.timestamp,establishment.shf.deadline),
                    shf_kommentar: replaceNewline(establishment.shf.comment),
                    tbz_soll: formatDate(establishment.tbz.deadline),
                    tbz_ist: formatDate(establishment.tbz.timestamp),
                    tbz_differenz: getDifference(establishment.tbz.timestamp,establishment.tbz.deadline),
                    tbz_kommentar: replaceNewline(establishment.tbz.comment)
                };
            })
        });
        var flattened = [].concat.apply([], formattedEntries);

        downloadCvs(flattened, drill.name+" Buendelauswertung ");
    }
});

Template.operationanalysis.helpers({
    drills: function () {
        return Drills.find({});
    },
    locations: function () {
        var drillId = Template.instance().selectedDrill.get();
        return Locations.find({
            drill: drillId
        });
    },
    bundles: function () {
        var drillId = Template.instance().selectedDrill.get();
        return Bundles.find({
            drill: drillId
        });
    },
    'getDifference': (timestamp, deadline) => {
       return getDifference(timestamp, deadline);
    },
    'formatToString' : (date) =>{
        if (!date) return "";
        return moment(date).format('DD.MM.YYYY HH:mm');
    }
});

function enableDataTable() {
    var table = $('.dataTable').DataTable({
        lengthMenu: [[3, 5, 10, -1], [3, 5, 10, "Alle"]],
        stripeClasses: [ 'odd-row', 'even-row' ],
        language: {
            "sEmptyTable": "Keine Daten in der Tabelle vorhanden",
            "sInfo": "_START_ bis _END_ von _TOTAL_ Einträgen",
            "sInfoEmpty": "0 bis 0 von 0 Einträgen",
            "sInfoFiltered": "(gefiltert von _MAX_ Einträgen)",
            "sInfoPostFix": "",
            "sInfoThousands": ".",
            "sLengthMenu": "_MENU_ Einträge anzeigen",
            "sLoadingRecords": "Wird geladen...",
            "sProcessing": "Bitte warten...",
            "sSearch": "Suchen",
            "sZeroRecords": "Keine Einträge vorhanden.",
            "oPaginate": {
                "sFirst": "Erste",
                "sPrevious": "Zurück",
                "sNext": "Nächste",
                "sLast": "Letzte"
            },
            "oAria": {
                "sSortAscending": ": aktivieren, um Spalte aufsteigend zu sortieren",
                "sSortDescending": ": aktivieren, um Spalte absteigend zu sortieren"
            },
            select: {
                rows: {
                    _: '%d Zeilen ausgewählt',
                    0: 'Zum Auswählen auf eine Zeile klicken',
                    1: '1 Zeile ausgewählt'
                }
            }
        }
    });
}

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

function getDifference(timestamp, deadline) {
    if (!timestamp || !deadline) {
        return '';
    }
    var deltaAchieved = moment.duration(moment(deadline) - moment(timestamp));
    var delta = deltaAchieved.locale("de").format("dd[d] hh[h] mm[min]",{ trim: false });
    return delta;
}

function enableTooltips() {
    $('[data-toggle=tooltip]').tooltip();
}