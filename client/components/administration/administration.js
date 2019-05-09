Router.route('administration', {
    path: '/admin',
    template: 'administration',
    waitOn: function () {
        return [
            Meteor.subscribe('users'),
            Meteor.subscribe('drills'),
            Meteor.subscribe('locations'),
            Meteor.subscribe('bundles')
        ];
    }
});

function enableDateTimePickers() {
    $('.datetimepicker').datetimepicker({
        format: "DD.MM.YYYY HH:mm"
    });
}

Template.administration.onCreated(function () {
    var that = this;
    Session.setDefault('editItem', {});
    that.config = new ReactiveVar({});

    var drillFilter = undefined;
    Session.set('drillFilter', drillFilter);
    Session.set('drillFilterLocation', drillFilter);

    Meteor.call('getConfig', function (err, config) {
        that.config.set(config);
    });

    that.autorun(function () {
        var filter = Session.get('drillFilter');
        $('#drillFilter').eq(filter).prop('selected', true)

        var filterlocation = Session.get('drillFilterLocation');
        $('#drillFilterLocation').eq(filterlocation).prop('selected', true)
    });
});

Template.administration.onRendered(function () {

    $('#adminUserEdit').on('shown.bs.modal', function () {
        $('#username', this).focus()
    });
    $('#adminDrillEdit').on('shown.bs.modal', function () {
        $('#name', this).focus()
    });
    $('#adminLocationEdit').on('shown.bs.modal', function () {
        $('#name', this).focus()
    });
});

Template.administration.onDestroyed(function () {
    Session.set('editItem', {});
});

Template.administration.helpers({
    users: function () {
        return Meteor
            .users
            .find({
                $or: [
                    { 'profile.admin': false },
                    { 'profile.admin': { $exists: false } }
                ]
            }, {
                sort: { 'profile.name': 1 }
            });
    },
    drills: function () {
        return Drills.find({}, {
            sort: { 'name': 1 }
        });
    },
    locations: function () {
        return Locations.find({}, {
            sort: { 'drill': 1, 'name': 1 }
        });
    },
    locationsPerDrill: function () {

        var drillFilter = Session.get('drillFilterLocation');
        var query = {
            drill: drillFilter
        }
        return Locations.find(query,
            {
                sort: { 'name': 1 }
            });
    },
    bundles: function () {
        return Bundles.find({}, {
            sort: { 'name': 1 }
        });
    },
    bundlesPerDrill: function () {

        var drillFilter = Session.get('drillFilter');
        var query = {
            drill: drillFilter
        }
        return Bundles.find(query,
            {
                sort: { 'name': 1 }
            });
    },
    config: function () {
        return Template.instance().config.get();
    }
});

Template.administration.events({
    'click #newUser': setEmpty,
    'click #newDrill': setEmpty,
    'click #newLocation': setEmpty,
    'click #newBundle': setEmpty,
    'click #deleteEverythingBtn': function (event, template) {
        template.$('#deleteEverything').on('hidden.bs.modal', function () {
            template.$('#deleteEverything').off('hidden.bs.modal');
            Meteor.call('deleteEverything', function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.");
                }
            });
        });
    },
    'click .js-add-location-establishment': function (event, template) {
        var updateQuery = {};
        var hasNoEstablishments = this.establishments == undefined || this.establishments.length == 0;
        var number = hasNoEstablishments ? 1 : Math.max.apply(null, this.establishments.map(function (a) { return a.establishmentNumber })) + 1;
        updateQuery.$push = {
            'establishments': {
                establishmentNumber: number,
                active : hasNoEstablishments
            }
        }

        Locations.update({ _id: this._id }, updateQuery, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            // in order to enable newly added datetimepickers
            enableDateTimePickers();
            notificationArea.success("Bezug hinzugefügt.");
        });
    },
    'click .js-delete-location-establishment': function (event, template) {

        var establishmentNumberToDelete = parseInt($(event.target).attr('data-number'));
        var updateQuery = {};
        updateQuery.$pull = {
            'establishments': {
                establishmentNumber: establishmentNumberToDelete,
            }
        }
        Locations.update({ _id: this._id }, updateQuery, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Bezug gelöscht.");
        });
    },
    'click .js-add-establishment': function (event, template) {
        var updateQuery = {};
        var hasNoEstablishments = this.establishments == undefined || this.establishments.length == 0;
        var number = hasNoEstablishments ? 1 : Math.max.apply(null, this.establishments.map(function (a) { return a.establishmentNumber })) + 1;
        updateQuery.$push = {
            'establishments': {
                establishmentNumber: number,
                active : hasNoEstablishments
            }
        }

        Bundles.update({ _id: this._id }, updateQuery, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            // in order to enable newly added datetimepickers
            enableDateTimePickers();
            notificationArea.success("Bezug hinzugefügt.");
        });
    },
    'click .js-delete-establishment': function (event, template) {

        var bundleId = this._id;
        var establishmentNumberToDelete = parseInt($(event.target).attr('data-number'));

        var updateQuery = {};
        updateQuery.$pull = {
            'establishments': {
                establishmentNumber: establishmentNumberToDelete,
            }
        }
        Bundles.update({ _id: this._id }, updateQuery, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Bezug gelöscht.");
        });
    },
    'change #drillFilter': function (event, template) {
        Session.set('drillFilter', event.currentTarget.value);
    },
    'change #drillFilterLocation': function (event, template) {
        Session.set('drillFilterLocation', event.currentTarget.value);
    },
    'submit #bundleDeadlineForm': function (event, template) {
        event.preventDefault();

        var establishmentRows = template.$('.establishmentContext');
        establishmentRows.each(function (i, establishmentRow) {

            var bundleId = $(establishmentRow).find('.bundleId').val();
            var updateQuery = {};

            var establishmentNumber = $(establishmentRow).find(".establishmentNumber").data('number');
            var shfMustBeMetAt = convertDateToIsoString($(establishmentRow).find('.shf').val())
            var tbzMustBeMetAt = convertDateToIsoString($(establishmentRow).find('.tbz').val())


            try {
                Meteor.call('setEstablishmentDeadlines', bundleId, establishmentNumber, shfMustBeMetAt, tbzMustBeMetAt);
            } catch (error) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }

        });
        notificationArea.success("Deadlines gespeichert.");
    },

    'submit #locationDeadlineForm': function (event, template) {
        event.preventDefault();

  

        var establishmentRows = template.$('.locationEstablishmentContext');
        establishmentRows.each(function (i, establishmentRow) {

            var bundleId = $(establishmentRow).find('.bundleId').val();
            var updateQuery = {};

            var establishmentNumber = $(establishmentRow).find(".establishmentNumber").data('number');
            var location = convertDateToIsoString($(establishmentRow).find('.location').val())
            var radio = convertDateToIsoString($(establishmentRow).find('.radio').val())


            try {
                Meteor.call('setEstablishmentDeadlinesLocations', bundleId, establishmentNumber, location, radio);
            } catch (error) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }

        });
        notificationArea.success("Deadlines gespeichert.");
    },

    'submit #ticketConfigForm': function (event, template) {
        event.preventDefault();

        var highPrio = template.$('#highPrioMinutes'),
            midPrio = template.$('#middlePrioMinutes'),
            lowPrio = template.$('#lowPrioMinutes'),
            bundleWarningMinutes = template.$('#bundleWarningMinutes')
        save = true;

        highPrio.parents('.form-group').removeClass('has-error');
        midPrio.parents('.form-group').removeClass('has-error');
        lowPrio.parents('.form-group').removeClass('has-error');
        bundleWarningMinutes.parents('.form-group').removeClass('has-error');

        function checkField(field, text) {
            var n = field.val();
            if (!n || !(Number(n) == n && n % 1 === 0)) {
                field.parents('.form-group').addClass('has-error');
                notificationArea.error("Priorität '{0}' muss eine Ganzzahl sein.".format(text));
                return false;
            }
            return true;
        }

        save = checkField(highPrio, 'Hoch') && save;
        save = checkField(midPrio, 'Mittel') && save;
        save = checkField(lowPrio, 'Tief') && save;
        save = checkField(bundleWarningMinutes, 'Bündel Deadline warnung') && save;


        if (!save) return;

        var config = template.config.get();
        Config.update({ _id: config._id }, {
            $set: {
                'priorities.high': highPrio.val() * 1,
                'priorities.normal': midPrio.val() * 1,
                'priorities.low': lowPrio.val() * 1,
                'priorities.bundleWarningMinutes': bundleWarningMinutes.val() * 1
            }
        }, function (err) {
            if (err) {
                return notificationArea.error("Ein Fehler ist aufgetreten.");
            }
            notificationArea.success("Konfiguration gespeichert.");
        });
    }
});

Template.adminUserRow.events({
    'click tr': setEditItem
});

Template.adminUserEdit.helpers({
    editItem: getEditItem
});

Template.adminUserEdit.events({
    'submit #userEditForm': function (event, template) {
        event.preventDefault();
        var usernameField = template.$('.js-username').removeClass('has-error'),
            nameField = template.$('.js-name').removeClass('has-error'),
            passwordField = template.$('.js-password').removeClass('has-error'),
            user = usernameField.find('input').val(),
            name = nameField.find('input').val(),
            pass = passwordField.find('input').val(),
            save = true,
            update = !!Session.get('editItem')._id;

        if (!update && !user) {
            save = false;
            usernameField.addClass('has-error');
        }

        if (!name) {
            save = false;
            nameField.addClass('has-error');
        }

        if (!update && !pass) {
            save = false;
            passwordField.addClass('has-error');
        }

        if (!save) return;

        var reset = function () {
            passwordField.find('input').val('');
            user = usernameField.find('input').val();
            name = nameField.find('input').val();
        };

        if (update) {
            var userId = getEditItem()._id;
            Meteor.users.update({ _id: userId }, { $set: { 'profile.name': name } }, function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                Meteor.call('setUserPassword', userId, pass, function (err) {
                    if (err) {
                        return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                    }
                    notificationArea.success("Benutzer gespeichert.");
                    template.$('.modal').modal('hide');
                    reset();
                });
            });

        } else {
            Meteor.call('createNewUser', user, name, pass, function (err) {
                if (err && err.error === 403) {
                    return notificationArea.error("Benutzer existiert bereits.", true);
                } else if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                notificationArea.success("Benutzer erstellt.");
                template.$('.modal').modal('hide');
                reset();
            });
        }
    },
    'click .js-delete': function (event, template) {
        var userId = getEditItem()._id;
        Meteor.users.remove({ _id: userId }, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Benutzer gelöscht.");
            template.$('.modal').modal('hide');
        });
    }
});

Template.adminDrillRow.events({
    'click tr': setEditItem,
    'click button': function (event, template) {
        event.stopPropagation();
        Meteor.call('setDrillActive', template.data._id);
    }
});

Template.adminDrillEdit.helpers({
    editItem: getEditItem
});

Template.adminDrillEdit.events({
    'submit #drillEditForm': function (event, template) {
        event.preventDefault();
        var nameField = template.$('.js-name').removeClass('has-error'),
            name = nameField.find('input').val(),
            save = true,
            update = !!Session.get('editItem')._id;

        if (!name) {
            save = false;
            nameField.addClass('has-error');
        }

        if (!save) return;

        if (update) {
            var editId = getEditItem()._id;
            Drills.update({ _id: editId }, { $set: { 'name': name } }, function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                notificationArea.success("Übung gespeichert.");
                template.$('.modal').modal('hide');
                nameField.find('input').val('');
            });
        } else {
            Drills.insert({ name: name, active: false }, function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                notificationArea.success("Übung erstellt.");
                template.$('.modal').modal('hide');
                nameField.find('input').val('');
            });
        }
    },
    'click .js-delete': function (event, template) {
        var editId = getEditItem()._id;
        Drills.remove({ _id: editId }, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Übung gelöscht.");
            template.$('.modal').modal('hide');
        });
    }
});

Template.adminLocationRow.helpers({
    getDrill: function (id) {
        return (Drills.findOne({ _id: id }) || {}).name;
    }
});

Template.adminLocationRow.events({
    'click tr': setEditItem
});

Template.adminLocationEdit.helpers({
    editItem: getEditItem,
    drills: function () {
        return Drills.find();
    }
});

Template.adminLocationEdit.events({
    'show.bs.modal #adminLocationEdit': function (event, template) {
        if (isEdit()) {
            template.$('.js-drill').find('select').val(Session.get('editItem').drill);
        }
    },
    'submit #locationEditForm': function (event, template) {
        event.preventDefault();
        var nameField = template.$('.js-name').removeClass('has-error'),
            drillField = template.$('.js-drill').removeClass('has-error'),
            chiefField = template.$('.js-chief').removeClass('has-error'),
            phoneNumberField = template.$('.js-phone').removeClass('has-error'),
            name = nameField.find('input').val(),
            drill = drillField.find('select').val(),
            responsiblePersonName = chiefField.find('input').val(),
            responsiblePersonPhoneNumber = phoneNumberField.find('input').val(),
            save = true,
            update = !!Session.get('editItem')._id;

        if (!name) {
            save = false;
            nameField.addClass('has-error');
        }

        if (!drill) {
            save = false;
            drillField.addClass('has-error');
        }

        if (!save) return;

        if (update) {
            var editId = getEditItem()._id;
            Locations.update({ _id: editId }, { $set: { 'name': name, 'drill': drill, 'responsiblePerson': responsiblePersonName, 'contactNumberResonsiblePerson': responsiblePersonPhoneNumber } }, function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                notificationArea.success("Übung gespeichert.");
                template.$('.modal').modal('hide');
            });
        } else {
            Locations.insert({ name: name, drill: drill, responsiblePerson: responsiblePersonName, contactNumberResonsiblePerson: responsiblePersonPhoneNumber }, function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                notificationArea.success("Übung erstellt.");
                template.$('.modal').modal('hide');
                nameField.find('input').val('');
            });
        }
    },
    'click .js-delete': function (event, template) {
        var editId = getEditItem()._id;
        Locations.remove({ _id: editId }, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Übung gelöscht.");
            template.$('.modal').modal('hide');
        });
    }
});

Template.adminBundleRow.helpers({
    getDrill: function (id) {
        return (Drills.findOne({ _id: id }) || {}).name;
    }
});

Template.adminBundleRow.events({
    'click tr': setEditItem
});

Template.adminBundleEdit.onCreated(function () {
    var drill = (Drills.find({}, { sort: { 'active': -1 } }).fetch() || [])[0];
    this.selectedDrill = new ReactiveVar(drill ? drill._id : undefined);
});

Template.adminBundleEdit.helpers({
    editItem: getEditItem,
    drills: function () {
        return Drills.find();
    },
    locations: function () {
        return Locations.find({ drill: Template.instance().selectedDrill.get() });
    },
    removeDamping: function (minValue){
        return minValue + 22;
    } 

});

Template.adminBundleEdit.events({
    'change #bundle-drill': function (event, template) {
        template.selectedDrill.set(template.$('#bundle-drill').val());
    },
    'show.bs.modal #adminBundleEdit': function (event, template) {
        if (isEdit()) {
            template.$('.js-drill select').val(Session.get('editItem').drill).change();
            setTimeout(function () {
                template.$('.js-location-a select').val(Session.get('editItem').locationA);
                template.$('.js-location-b select').val(Session.get('editItem').locationB);
            }, 500);
        } else {
            template.$('#bundle-drill').change();
        }
    },
    'submit #bundleEditForm': function (event, template) {
        event.preventDefault();
        var nameField = template.$('.js-name').removeClass('has-error'),
            minValueField = template.$('.js-min-value').removeClass('has-error'),
            drillField = template.$('.js-drill').removeClass('has-error'),
            locationAField = template.$('.js-location-a').removeClass('has-error'),
            LocationBField = template.$('.js-location-b').removeClass('has-error'),
            name = nameField.find('input').val(),
            minValue = minValueField.find('input').val(),
            minValue = minValue - 22; 
            drill = drillField.find('select').val(),
            locationA = locationAField.find('select').val(),
            locationB = LocationBField.find('select').val(),
            save = true,
            update = !!Session.get('editItem')._id;

        if (!name) {
            save = false;
            nameField.addClass('has-error');
        }

        if (!minValue) {
            save = false;
            minValueField.addClass('has-error');
        } else {
            minValue = parseFloat(minValue);
        }

        if (!drill) {
            save = false;
            drillField.addClass('has-error');
        }

        if (!locationA) {
            save = false;
            locationAField.addClass('has-error');
        }

        if (!locationB) {
            save = false;
            LocationBField.addClass('has-error');
        }

        if (!save) return;

        if (update) {
            var editId = getEditItem()._id;
            Bundles.update({ _id: editId }, { $set: { 'name': name, 'drill': drill, 'locationA': locationA, 'locationB': locationB, 'minValue': minValue } }, function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                notificationArea.success("Bündel gespeichert.");
                template.$('.modal').modal('hide');
            });
        } else {
            Bundles.insert({ name: name, drill: drill, locationA: locationA, locationB: locationB, minValue: minValue, measurements: [] }, function (err) {
                if (err) {
                    return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
                }
                notificationArea.success("Bündel erstellt.");
                template.$('.modal').modal('hide');
                nameField.find('input').val('');
                minValueField.find('input').val('');
            });
        }
    },
    'click .js-delete': function (event, template) {
        var editId = getEditItem()._id;
        Bundles.remove({ _id: editId }, function (err) {
            if (err) {
                return notificationArea.error("Es ist ein Fehler aufgetreten.", true);
            }
            notificationArea.success("Bündel gelöscht.");
            template.$('.modal').modal('hide');
        });
    }
});

Template.adminBundleCheckPointRow.onRendered(function () {
    // in order to get bs datepicker
    enableDateTimePickers();
});

Template.adminBundleCheckPointRow.events({
    'click .js-set-bundle-establishment': function (event, template) {
        event.preventDefault();
        var establishmentNumber = parseInt($(event.target).attr('data-id')); 
        var bundleId = this._id;
        Meteor.call("setActiveBundleEstabilshment", bundleId, establishmentNumber);
        notificationArea.success("Bezug  "+ establishmentNumber +" aktiviert.");
    }
})

Template.adminBundleCheckPointRow.helpers({
    isFirst: function (establishmentNumber) {
        return this.establishments.findIndex(est => est.establishmentNumber == establishmentNumber) == 0;
    },
    hasNoEstablishments: function (establishments) {
        return this.establishments == undefined || this.establishments.length == 0;
    }
})

Template.locationEstabilishmentRow.onRendered(function () {
    // in order to get bs datepicker
    enableDateTimePickers();
});

Template.locationEstabilishmentRow.events({
    'click .js-set-location-establishment': function (event, template) {
        event.preventDefault();
        var establishmentNumber = parseInt($(event.target).attr('data-id')); 
        var locationId = this._id;
        Meteor.call("setActiveLocationEstabilshment", locationId, establishmentNumber);
        notificationArea.success("Bezug  "+ establishmentNumber +" aktiviert.");
    }
})

Template.locationEstabilishmentRow.helpers({
    isFirst: function (establishmentNumber) {
        return this.establishments.findIndex(est => est.establishmentNumber == establishmentNumber) == 0;
    },
    hasNoEstablishments: function (establishments) {
        return this.establishments == undefined || this.establishments.length == 0;
    }
})

function setEmpty() {
    Session.set('editItem', {});
}

function setEditItem() {
    Session.set('editItem', this);
}

function getEditItem() {
    return Session.get('editItem');
}

function isEdit() {
    return !!Session.get('editItem') && !!Object.keys(Session.get('editItem')).length;
}

function convertDateToIsoString (dateString) {
    if (!dateString) return "";
    return moment(dateString, "DD.MM.YYYY HH:mm").format();
}