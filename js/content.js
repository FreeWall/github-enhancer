updateStyles();

var settings = null;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.channel == "onUpdated") {
            if (typeof request.settings !== "undefined") {
                settings = request.settings;
            }
            if (typeof request.status === "undefined" || request.status == "loading") {
                if (request.settings[Settings.DEPLOYMENTS]) {
                    loadDeployments();
                }
                if (request.settings[Settings.UPDATED_SORT]) {
                    sortByRecentlyUpdated();
                }
                if (request.settings[Settings.PULL_REQUEST_FILES]) {
                    loadFileList();
                }
            } else if (request.status == "complete") {
                if (request.settings[Settings.DEPLOYMENTS]) {
                    renderDeployments();
                }
                if (request.settings[Settings.DRAFTS_TO_BOTTOM]) {
                    moveDraftsToBottom();
                }
                if (request.settings[Settings.STYLE_PULL_REQUESTS]) {
                    markRequestsForMe();
                    markDrafts();
                }
                if (request.settings[Settings.PULL_REQUEST_FILES]) {
                    renderFileList();
                }
            }
        } else if (request.channel == "settings") {
            updateStyles()
        }
        return true;
    }
);

function updateStyles() {
    chrome.runtime.sendMessage(
        {channel: "styles"},
        function(response) {
            let style = document.getElementById('data-githubenhancer-styles');
            if (style != null) {
                style.parentNode.removeChild(style);
            }
            style = document.createElement('style');
            style.type = "text/css";
            style.id = 'data-githubenhancer-styles';
            style.innerHTML = response;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
    );
}

function markDrafts() {
    var $row = $("[aria-label=\"Open draft pull request\"]").closest("div.js-issue-row");
    $row.toggleClass("githubenhancer-draft-pullrequest", true);
}

function moveDraftsToBottom() {
    var $row = $("[aria-label=\"Open draft pull request\"]").closest("div.js-issue-row");
    var $parent = $row.parent();
    $row.detach().appendTo($parent);
}

function markRequestsForMe() {
    var user = $(".Header .Header-link img.avatar").attr("alt").substr(1);
    $("div.js-issue-row").each(function() {
        if ($(this).find("img[alt='@" + user + "']").length > 0 || $(this).find("a[data-hovercard-type='user']").html().trim() == user) {
            $(this).toggleClass("githubenhancer-foryou-pullrequest", true);
        }
    });
}

function sortByRecentlyUpdated() {
    if (/^.*\/pulls.*$/.test(location.href) && !/^.*\/pulls.*(sort).*$/.test(location.href) && !/^.*\/pulls.*(updated-desc).*$/.test(location.href)) {
        let url = new URL(location.href);
        let q = url.searchParams.get('q');
        if (q) {
            let args = q.split(' ');
            args.push("sort:updated-desc");
            url.searchParams.set('q', args.join(' '));
        } else {
            url.searchParams.set('q', "is:pr is:open sort:updated-desc");
        }
        location.href = url;
    }
}

function isClosedPullRequestsPage() {
    return /^.*\/pulls.*(updated-desc).*$/.test(location.href) && /^.*\/pulls.*(closed).*$/.test(location.href) && !/^.*\/pulls.*(page=(?!(?:1))\d+).*$/.test(location.href);
}

var deployments = -1;
var deploymentsLoading = false;

function loadDeployments() {
    if (deploymentsLoading) {
        return;
    }
    deployments = -1;
    if (!this.isClosedPullRequestsPage()) {
        return;
    }
    deploymentsLoading = true;
    chrome.runtime.sendMessage(
        {channel: "deployments"},
        function(response) {
            deployments = response['records'];
        }
    );
}

function renderDeployments() {
    if (!this.isClosedPullRequestsPage()) {
        return;
    }
    if (deployments == -1) {
        setTimeout(renderDeployments, 100);
        return;
    }
    deploymentsLoading = false;
    if (deployments == null || deployments.length == 0) {
        return;
    }
    $("div.Box-row.deploy-row").remove();
    for (let i in deployments) {
        if (deployments[i]['status'] != "completed") continue;
        var row = $("div.Box-row").first().clone();
        deploymentToRow(deployments[i], row);
        $(".js-active-navigation-container").prepend(row);
    }
    $(".js-active-navigation-container").find("div.Box-row").sort(function(a, b) {
        return +new Date($("relative-time", b).first().attr("datetime")) - new Date($("relative-time", a).first().attr("datetime"));
    }).appendTo($(".js-active-navigation-container"));
}

function deploymentToRow(deployment, row) {
    row.toggleClass("deploy-row", true);
    row.toggleClass("unread", false).toggleClass("read", true).toggleClass("githubenhancer-foryou-pullrequest", false);
    $("label", row).remove();
    $(".d-inline-block.mr-1", row).remove();
    $(".float-right.col-3", row).remove();
    $("span.labels", row).remove();
    $("a[data-hovercard-type=\"pull_request\"]", row).replaceWith("<div class='h4'>Manual deploy of " + deployment['project']['name'] + "</div>");
    $("span[aria-label*=\"pull request\"]", row).attr("aria-label", "DeployHQ").html("<img src='" + chrome.extension.getURL('static/deployhq.png') + "' style='width:32px;vertical-align:middle;margin-right:7px;margin-left:2px;margin-top:5px;'/>");
    let $date = $("span.issue-meta-section.ml-2", row).first().clone();
    $date.html($date.html().replace('updated', 'deployed'));
    let date = new Date(deployment['timestamps']['completed_at']);
    $("relative-time", $date).attr("datetime", deployment['timestamps']['completed_at']).attr("title", date.toLocaleString());
    $("div.mt-1.text-small", row).html("Deployed " + deployment['branch'] + " by <a class='muted-link' data-hovercard-type='user' href='javascript:void(0);'>" + deployment['deployer'] + "</a> • ");
    $("div.mt-1.text-small", row).append("<div class='deployment-status' data-status='" + deployment['status'] + "'>" + (deployment['status'].charAt(0).toUpperCase()) + deployment['status'].slice(1) + "</div>");
    $("div.mt-1.text-small", row).append($date);
    row.css("background", "#F4F4F4");
}

var pullRequestFiles = -1;
var pullRequestFilesLoading = false;
function loadFileList() {
    if (pullRequestFilesLoading) {
        return;
    }
    if (!settings[Settings.GITHUB_TOKEN] || settings[Settings.GITHUB_TOKEN].length == 0) {
        return;
    }
    let results = location.href.match('\/github\.com\/([a-zA-Z0-9-_.]*/[a-zA-Z0-9-_.]*)\/pull\/(\\d+)');
    if (results) {
        pullRequestFilesLoading = true;
        let repository = results[1];
        let pullId = results[2];
        pullRequestFiles = [];
        loadFileListPage(repository, pullId, 1, function(files) {
            if (files) {
                pullRequestFiles.push(...files);
                renderFileList();
            }
        });
    }
}

function loadFileListPage(repository, pullId, page, doneCallback) {
    fetch("https://api.github.com/repos/" + repository + "/pulls/" + pullId + "/files?page=" + page, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'token ' + settings[Settings.GITHUB_TOKEN],
        }
    })
    .then(function(response) {
        if (response.status != 200) {
            doneCallback(null);
            return;
        }
        response.json().then(data => {
            doneCallback(data);
        });
        let links = response.headers.get('Link');
        if (links) {
            let nextPage = links.match('<.*page=(\\d+)>; rel="next"');
            if (nextPage) {
                nextPage = Number(nextPage[1]);
                loadFileListPage(repository, pullId, nextPage, doneCallback);
            }
        }
    });
}

var fileStatusIcon = {
    added: '<svg title="added" viewBox="0 0 14 16" version="1.1" width="14" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z"></path></svg>',
    modified: '<svg title="modified" viewBox="0 0 14 16" version="1.1" width="14" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zM4 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"></path></svg>',
    renamed: '<svg title="renamed" viewBox="0 0 14 16" version="1.1" width="14" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M6 9H3V7h3V4l5 4-5 4V9zm8-7v12c0 .55-.45 1-1 1H1c-.55 0-1-.45-1-1V2c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zm-1 0H1v12h12V2z"></path></svg>',
    removed: '<svg title="removed" viewBox="0 0 14 16" version="1.1" width="14" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M13 1H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm0 13H1V2h12v12zm-2-5H3V7h8v2z"></path></svg>',
};

function renderFileList() {
    if (pullRequestFiles == -1) {
        setTimeout(renderFileList, 100);
        return;
    }
    if (pullRequestFiles == null || pullRequestFiles.length == 0) {
        return;
    }
    if ($(".githubenhancer-file-list").length != 0) {
        $(".githubenhancer-file-list").remove();
    }
    let $fileList = $("<div class='githubenhancer-file-list'/>");
    for (let i in pullRequestFiles) {
        let file = $("<div class='githubenhancer-file'/>");
        file.html("\
            <div class='githubenhancer-changes'>\
                <div class='githubenhancer-column githubenhancer-added'>\
                    +" + pullRequestFiles[i]['additions'] + "\
                </div><div class='githubenhancer-column githubenhancer-deleted'>\
                    -" + pullRequestFiles[i]['deletions'] + "\
                </div>\
            </div><div class='githubenhancer-icon icon-" + pullRequestFiles[i]['status'] + "'>\
                " + fileStatusIcon[pullRequestFiles[i]['status']] + "\
            </div><div class='githubenhancer-name'>\
                <a href='javascript:void(0);'>" + pullRequestFiles[i]['filename'] + "</a>\
            </div>\
        ");
        $fileList.append(file);
    }

    $("div.pr-toolbar").after($fileList);
}

$(document).on("click", ".githubenhancer-name", function() {
    let link = $("a[title="+CSS.escape($(this).text().trim())+"]");
    if (link.length == 1) {
        location.href = link.attr("href");
    }
});