if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    };
}

if (!String.prototype.truncate) {
    String.prototype.truncate = function (n, useWordBoundary) {
        var toLong = this.length > n,
            s_ = toLong ? this.substr(0, n - 1) : this;
        s_ = useWordBoundary && toLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
        return toLong ? s_ + '&hellip;' : s_;
    };
}

if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (find, replace) {
        return this.replace(new RegExp(find, 'g'), replace);
    };
}

if (!String.prototype.contains) {
    String.prototype.contains = function (str, startIndex) {
        return ''.indexOf.call(this, str, startIndex) !== -1;
    };
}
