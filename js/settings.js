var Settings = function() {

    var _this = this;
    this.values = {};

    this.install = function() {
        for (let i in Settings.VALUES) {
            this.values[Settings.VALUES[i]] = true;
        }
        this.save();
    };

    this.load = function(callback) {
        let keys = [];
        for(let i in Settings.VALUES){
            keys.push(Settings.VALUES[i]);
        }
        chrome.storage.sync.get(keys, function(result) {
            _this.values = result;
            if (typeof callback === "function") {
                callback();
            }
        });
    };

    this.save = function() {
        chrome.storage.sync.set(this.values);
    };

    this.set = function(key, value) {
        this.values[key] = value;
        this.save();
    };

    this.get = function(key) {
        return this.values[key];
    };

    this.isStylesEnabled = function() {
        return this.get(Settings.STYLES_ENABLED);
    };

    this.isUpdatedSortEnabled = function() {
        return this.get(Settings.UPDATED_SORT_ENABLED);
    };
};

Settings.STYLES_ENABLED = "stylesEnabled";
Settings.UPDATED_SORT_ENABLED = "updatedSortEnabled";

Settings.VALUES = [
    Settings.STYLES_ENABLED,
    Settings.UPDATED_SORT_ENABLED
];