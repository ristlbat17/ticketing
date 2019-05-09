function Field(el) {
    var $el = el,
        required = !!$el.attr('required'),
        number = $el.attr('type') === 'number',
        $parent = $el.parents('.form-group');

    this.reset = function () {
        if ($el.is('select')) {
            $el.prop('selectedIndex', 0);
        } else {
            $el.val('');
        }

        $parent.removeClass('has-error has-warning has-success');
    };

    this.resetState = function () {
        $parent.removeClass('has-error has-warning has-success');
    };

    Object.defineProperty(this, 'isValid', {
        get: function () {
            if (!!$el.val() || !required) {
                $parent
                    .removeClass('has-error has-warning')
                    .addClass('has-success');
                return true;
            }
            $parent
                .removeClass('has-success has-warning')
                .addClass('has-error');
            return false;
        }
    });

    Object.defineProperty(this, 'name', {
        get: function () {
            return $el.attr('id');
        }
    });

    Object.defineProperty(this, 'data', {
        get: function () {
            return $el.val();
        }
    });
}

FormValidator = function (formSelector) {
    var $form = $(formSelector);
    var fields = [];

    this.validate = function () {
        var valid = true;
        fields.forEach(function (el) {
            valid = el.isValid && valid;
        });
        return valid;
    };

    this.reset = function () {
        fields.forEach(function (el) {
            el.reset();
        });
    };

    this.resetState = function () {
        fields.forEach(function (el) {
            el.resetState();
        });
    };

    Object.defineProperty(this, 'data', {
        get: function () {
            var data = {};
            fields.forEach(function (el) {
                data[el.name] = el.data;
            });
            return data;
        }
    });

    $form.find('input,select,textarea').not('[type=submit]').each(function (key, el) {
        fields.push(new Field($(el)));
    });
};