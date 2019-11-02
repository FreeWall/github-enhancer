'use strict';

var settings = new Settings();
var stylesContents = {};

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({pageUrl: {}})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
    settings.install();
    loadSettings();
});

chrome.runtime.onStartup.addListener(function() {
    loadSettings();
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.channel == "deployments") {
            var url = "https://www.michalvanek.net/ateli/deployhq.php";
            fetch(url).then(response => response.json()).then(response => sendResponse(response));
        } else if (request.channel == "styles") {
            var content = "";
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
    loadSettings();
});

function loadSettings() {
    stylesContents = {};
    settings.load(function() {
        for (let key in Settings.STYLES) {
            if (settings.get(key)) {
                var url = chrome.extension.getURL(Settings.STYLES[key]);
                fetch(url).then(response => response.text()).then(response => {
                    stylesContents[key] = response;
                });
            }
        }
        setTimeout(function() {
            chrome.tabs.query({}, function(tabs) {
                for (var i=0; i<tabs.length; ++i) {
                    chrome.tabs.sendMessage(tabs[i].id, {channel: "settings"});
                }
            });
        }, 100);
    });
}