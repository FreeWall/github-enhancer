'use strict';

var stylesContent;
var url = chrome.extension.getURL('styles.css');
fetch(url).then(response => response.text()).then(response => {
	stylesContent = response;
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