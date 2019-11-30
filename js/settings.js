var Settings = function() {

    var _this = this;
    this.values = {};
    this.onChangeCallback = function() {};

    this.install = function() {
        this.values = {};
        this.values[Settings.FULL_WIDTH] = true;
        this.values[Settings.PULL_REQUEST_FILES] = false;
        this.values[Settings.STYLE_PULL_REQUESTS] = true;
        this.values[Settings.DRAFTS_TO_BOTTOM] = true;
        this.values[Settings.UPDATED_SORT] = true;
        this.values[Settings.DEPLOYMENTS] = {};
        this.save();
    };

    this.update = function() {
        this.load(function() {
            if (typeof this.values[Settings.FULL_WIDTH] === "undefined") this.values[Settings.FULL_WIDTH] = true;
            if (typeof this.values[Settings.STYLE_PULL_REQUESTS] === "undefined") this.values[Settings.STYLE_PULL_REQUESTS] = true;
            if (typeof this.values[Settings.DRAFTS_TO_BOTTOM] === "undefined") this.values[Settings.DRAFTS_TO_BOTTOM] = true;
            if (typeof this.values[Settings.UPDATED_SORT] === "undefined") this.values[Settings.UPDATED_SORT] = true;
            this.save();
        }.bind(this));
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
        this.onChangeCallback();
    };

    this.set = function(key, value) {
        this.values[key] = value;
        this.save();
    };

    this.get = function(key) {
        return this.values[key];
    };

    this.onChange = function(callback) {
        this.onChangeCallback = callback;
    };
};

Settings.FULL_WIDTH = "fullWidth";
Settings.PULL_REQUEST_FILES = "pullRequestFiles";
Settings.GITHUB_TOKEN = "githubToken";
Settings.STYLE_PULL_REQUESTS = "stylePullRequests";
Settings.STYLE_PULL_REQUESTS_CUSTOM = "stylePullRequestsCustom";
Settings.DRAFTS_TO_BOTTOM = "draftsToBottom";
Settings.UPDATED_SORT = "updatedSort";
Settings.DEPLOYMENTS = "deployments";

Settings.VALUES = [
    Settings.FULL_WIDTH,
    Settings.PULL_REQUEST_FILES,
    Settings.GITHUB_TOKEN,
    Settings.STYLE_PULL_REQUESTS,
    Settings.STYLE_PULL_REQUESTS_CUSTOM,
    Settings.DRAFTS_TO_BOTTOM,
    Settings.UPDATED_SORT,
    Settings.DEPLOYMENTS,
];

Settings.STYLES = {
    [Settings.FULL_WIDTH]: "static/styles/fullwidth.css",
    [Settings.STYLE_PULL_REQUESTS]: "static/styles/pullrequests.css",
};