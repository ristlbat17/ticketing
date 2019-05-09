 import download from 'downloadjs';

Router.route('archive', {
    path: '/archive',
    template: 'archive',
    waitOn: function () {
        return [
            Meteor.subscribe('ticketsDone'),
            Meteor.subscribe('users'),
            Meteor.subscribe('locations'),
            Meteor.subscribe('drills')
        ];
    }
});
Template.archive.onCreated(() => {
    Session.set('Tickelist', "archive");
})
Template.archive.onRendered(() => {
    $(".select2").select2({
        theme: "classic"
    });
    
    var selection = Session.get('drillLocationFilter')
    $("#drillLocationFilter").val(selection).trigger('change');
});


Template.archive.events({
    'click #download': function (event, template) {
        var drillLocationFilter = Session.get('drillLocationFilter');
        query = {};
        if (drillLocationFilter) {
            var locationAndDrillNames = drillLocationFilter.toString().split(',');
            query.$or = [
                {
                    location: {
                        $in: locationAndDrillNames
                    }
                },
                {
                    drill: {
                        $in: locationAndDrillNames
                    }
                }
            ]
        }

        var tickets = Tickets.find(query,
            {
                creator: 1,
                messenger: 1,
                phone: 1,
                drill: 1,
                location: 1,
                triageName: 1,
                priority: 1,
                description: 1,
                deadline: 1,
                created: 1,
                completedAt: 1,
                actions: 1
            }).fetch();

        var formattedTickets = tickets.map((ticket) => {
            return {
                creator: replaceNewline(ticket.creator),
                messenger: replaceNewline(ticket.messenger),
                phone: replaceNewline(ticket.phone),
                drill: replaceNewline(ticket.drill),
                location: replaceNewline(ticket.location),
                triageName: replaceNewline(ticket.triageName),
                priority: replaceNewline(ticket.priority),
                description: replaceNewline(ticket.description),
                actions: formatActions(ticket.actions),
                deadline: formatDate(ticket.deadline),
                created: formatDate(ticket.created),
                completedAt: formatDate(ticket.completedAt)
            }
        })
        const csvString = Papa.unparse(formattedTickets, {
            encoding: "utf-8"
        });

        var filename = 'Ticketarchiv ' + formatDate(moment()) + '.csv';
        download(csvString,filename,"text/csv");
    },
    'change #drillLocationFilter': function (event, template) {
        var selection = $("#drillLocationFilter").select2("val");
        Session.set('drillLocationFilter', selection)
    }
});

Template.archive.helpers({
    locations: () => {
        return Locations.find({});
    },
    drills: () => {
        return Drills.find({});
    }
})

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

function formatActions(actions){
    if(!actions) return ""
    return actions.map((action)=>{
        return "editor:" + action.editor + "; description: "+ replaceNewline(action.text)+"; created: "+ formatDate(action.created);
    }).join(" ");
}