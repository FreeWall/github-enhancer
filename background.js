// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green.');
  });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.channel == "deployments") {
            var url = "https://pz-deployment.deployhq.com/projects/postovnezdarma-cz/deployments?to=3ae3682c-3491-0bc7-85c1-ccaab0101b9f";
            fetch(url)
                .then(response => response.text())
                .then(response => sendResponse(response));
            /*fetch(url, {
				headers: {
					"Accept": "application/json",
					'Authorization': 'Basic '+btoa('user@domain.com:api-key'),
				}
            })*/
            return true;
        }
    }
);