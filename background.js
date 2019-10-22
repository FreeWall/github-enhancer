'use strict';

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.channel == "deployments") {
            var url = "https://www.michalvanek.net/ateli/deployhq.php";
            fetch(url).then(response => response.json()).then(response => sendResponse(response));
            return true;
        }
    }
);