'use strict';

var settings = new Settings();
var stylesContents = {};

chrome.runtime.onInstalled.addListener(function(details) {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({pageUrl: {}})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
    if (details.reason == "install") {
        settings.install();
    } else if (details.reason == "update") {
        settings.update();
    }
    loadSettings();
});

chrome.runtime.onStartup.addListener(function() {
    loadSettings();
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.channel == "deployments") {
            let repository = sender.url.match('\/github\.com\/([a-zA-Z0-9-_.]*\/[a-zA-Z0-9-_.]*)');
            if (repository) {
                repository = repository[1];
                if (typeof settings.get(Settings.DEPLOYMENTS)[repository] !== "undefined") {
                    fetch(settings.get(Settings.DEPLOYMENTS)[repository]['url'], {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic ' + btoa(settings.get(Settings.DEPLOYMENTS)[repository]['user'] + ":" + settings.get(Settings.DEPLOYMENTS)[repository]['key']),
                        }
                    })
                    .then(response => response.json())
                    .then(response => sendResponse(response))
                    .catch(error => sendResponse({}));
                } else {
                    sendResponse({});
                }
            }
        } else if (request.channel == "styles") {
            var content = stylesContents['default'];
            for (let key in Settings.STYLES) {
                if (typeof stylesContents[key] !== "undefined") {
                    content += stylesContents[key];
                }
            }
            sendResponse(content);
        }
        return true;
    }
);

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    chrome.tabs.sendMessage(tabId, {channel: "onUpdated", status: info.status, settings: settings.values});
});

settings.onChange(function() {
    loadSettings(true);
});

function loadSettings(reload) {
    reload = !!reload;
    stylesContents = {};
    settings.load(function() {
        var url = chrome.extension.getURL("static/styles/default.css");
        fetch(url).then(response => response.text()).then(response => {
            stylesContents['default'] = response;
        });
        for (let key in Settings.STYLES) {
            if (settings.get(key)) {
                if (key == Settings.STYLE_PULL_REQUESTS && settings.get(Settings.STYLE_PULL_REQUESTS_CUSTOM)) {
                    stylesContents[key] = settings.get(Settings.STYLE_PULL_REQUESTS_CUSTOM);
                } else {
                    url = chrome.extension.getURL(Settings.STYLES[key]);
                    fetch(url).then(response => response.text()).then(response => {
                        stylesContents[key] = response;
                    });
                }
            }
        }
        if (reload) {
            setTimeout(function() {
                chrome.tabs.query({}, function(tabs) {
                    for (var i=0; i<tabs.length; ++i) {
                        chrome.tabs.sendMessage(tabs[i].id, {channel: "settings"});
                    }
                });
            }, 100);
        }
    });
}