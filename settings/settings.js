var Settings = function() {

    var _this = this;

    this.stylesEnabled = true;
    this.updatedSortEnabled = true;

    this.load = function(callback) {
        chrome.storage.sync.get(['stylesEnabled', 'updatedSortEnabled'], function(result) {
            _this.stylesEnabled = result['stylesEnabled'];
            _this.updatedSortEnabled = result['updatedSortEnabled'];
            callback();
        });
    };

    this.save = function() {
        chrome.storage.sync.set({
            stylesEnabled: this.stylesEnabled,
            updatedSortEnabled: this.updatedSortEnabled
        });
    };

    this.isStylesEnabled = function() {
        return this.stylesEnabled;
    };

    this.setStylesEnabled = function(enabled) {
        this.stylesEnabled = enabled;
        this.save();
    };

    this.isUpdatedSortEnabled = function() {
        return this.updatedSortEnabled;
    };

    this.setUpdatedSortEnabled = function(enabled) {
        this.updatedSortEnabled = enabled;
        this.save();
    };
};