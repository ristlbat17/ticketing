import {getDampingMatches, getAverageDate} from "../operations/dampingMatches.js"

Router.route('bundleDetail', {
    path: '/bundle/:id',
    template: 'bundleDetail',
    waitOn: function () {
        return [
            Meteor.subscribe('bundles')
        ];
    }
});

Template.bundleDetail.onCreated(function () {
    this.bundle = new ReactiveVar(Bundles.findOne({ _id: Router.current().params['id'] }));
});

Template.bundleDetail.onRendered(function () {
    var bundle = this.bundle.get();
    var ctx = this.$('#level-graph')[0].getContext('2d');

    var measurements = getDampingMatches(bundle).sort((a, b) => moment(a.actualDate) - moment(b.actualDate));;

    var options = {
        tooltips: {
            callbacks: {
                label: (item, data) => {
                    return `${item.yLabel} dBm`;
                }
            }
        },
        scales: {
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Kanaldämpfung [dB]'
                },
                ticks: {
                    max: 0,
                    min: -100,
                    stepSize: 10
                }
            }]
        }
    }
    var points = measurements.length;
    var data = {
        labels: new Array(points),
        datasets: [
            {
                label: 'Max. Kanaldämpfung',
                fill: false,
                lineTension: 0,
                backgroundColor: 'rgba(255,87,56,0.4)',
                borderColor: 'rgba(255,87,56,1)',
                pointBorderColor: 'rgba(0,146,255,1)',
                pointBorderWidth: 0,
                pointHoverRadius: 0,
                pointHoverBorderWidth: 0,
                pointRadius: 0,
                pointHitRadius: 0,
                data: Array.from({ length: points }, o => bundle.minValue)
            },
            {
                label: getDirName(bundle, 'AtoB'),
                fill: false,
                lineTension: 0.1,
                backgroundColor: 'rgba(0,146,255,0.4)',
                borderColor: 'rgba(0,146,255,1)',
                pointBorderColor: 'rgba(0,146,255,1)',
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 2,
                data: measurements.map(o => o.AtoBDamping)
            },
            {
                label: getDirName(bundle, 'BtoA'),
                fill: false,
                lineTension: 0.1,
                backgroundColor: 'rgba(255,153,0,0.4)',
                borderColor: 'rgba(255,153,0,1)',
                pointBorderColor: 'rgba(255,153,0,1)',
                pointBackgroundColor: '#fff',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 2,
                data: measurements.map(o => o.BtoADamping)
            }
        ]
    };

    var myLineChart = new Chart(ctx, {
        type: 'line',
        data,
        options
    });

});

Template.bundleDetail.events({
    'click .delete': function (event, template) {
        Template.instance().measurementToDelete = event.currentTarget.dataset.measurementId;
    },
    'click #confirm-delete .btn-ok': function (event, template) {
        Bundles.update({ _id: template.bundle.get()._id }, {
            $pull: {
                measurements: {
                    id: template.measurementToDelete
                }
            }
        }, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            var bundle = template.bundle.get();
            bundle.measurements = bundle.measurements.filter(o => o.id !== template.measurementToDelete);
            template.bundle.set(bundle);
            notificationArea.success("Wert gelöscht.");
            delete template.measurementToDelete;
        });
    }
});

Template.bundleDetail.helpers({
    bundle: function () {
        return Template.instance().bundle.get();
    },
    getDirectionName: function (direction) {
        var bundle = Template.instance().bundle.get();
        return getDirName(bundle, direction);
    },
    getDampingList: function (bundle){
        return getDampingMatches(bundle);
    },
    getAverageDate: function (dateA, dateB){
        return formatDate(getAverageDate(dateA, dateB).averageDate);
    },
    getDeltaHours: function (dateA, dateB){
        return getAverageDate(dateA, dateB).deltaHours;
    },
    formatDate: function (date) {
        return formatDate(date);
    },
    getMeasurementsForLocation: function(bundle, location) {
        var measurements = bundle.measurements            
            .filter(o => o.location === location)
            .sort((a, b) => moment(b.date) - moment(a.date));
    
        return measurements;
    }
});

function getDirName(bundle, direction) {
    if (direction === 'AtoB') {
        return `${bundle.locationA} \u{02192} ${bundle.locationB}`;
    } else {
        return `${bundle.locationB} \u{02192} ${bundle.locationA}`;
    }
}
function formatDate (date){
    return moment(date).format('DD.MM.YY HH:mm');
}
