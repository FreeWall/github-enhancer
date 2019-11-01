'use strict';

var settings = new Settings();
var stylesContent;

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({pageUrl: {}})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
    settings.setStylesEnabled(true);
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
            sendResponse(stylesContent);
        }
        return true;
    }
);

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    chrome.tabs.sendMessage(tabId, {channel: "onUpdated", status: info.status});
});

function loadSettings() {
    settings.load(function() {
        if (settings.isStylesEnabled()) {
            var url = chrome.extension.getURL('static/styles.css');
            fetch(url).then(response => response.text()).then(response => {
                stylesContent = response;
            });
        }
    });
}