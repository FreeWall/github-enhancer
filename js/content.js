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
                loadFileList();
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

var fileList = -1;
function loadFileList() {
    if (fileList != -1) {
        renderFileList();
        return;
    }
    let filesUrl = $("body").html().match('src="([^"]*show_toc[^"]*)"');
    if (filesUrl) {
        filesUrl = filesUrl[1];
        $.get(filesUrl, function(response) {
            fileList = [];
            $("span.description", response).each(function() {

                fileList.push({
                    name: $(this).text().trim(),
                    icon: $(this).parent().prev("svg"),
                    changes: {
                        added: $(this).parent().find("span.diffstat span.text-green").text().trim(),
                        deleted: $(this).parent().find("span.diffstat span.text-red").text().trim(),
                    }
                });
            });
            renderFileList();
        });
    }
}

function renderFileList() {
    if ($(".githubenhancer-file-list").length != 0) {
        return;
    }
    let $fileList = $("<div class='githubenhancer-file-list'/>");
    for (let i in fileList) {
        let file = $("<div class='githubenhancer-file'/>");
        file.html("\
            <div class='githubenhancer-changes'>\
                <div class='githubenhancer-column githubenhancer-added'>\
                    " + fileList[i]['changes']['added'] + "\
                </div><div class='githubenhancer-column githubenhancer-deleted'>\
                    " + fileList[i]['changes']['deleted'] + "\
                </div>\
            </div><div class='githubenhancer-icon'>\
            </div><div class='githubenhancer-name'>\
                " + fileList[i]['name'] + "\
            </div>\
        ");
        if (fileList[i]['icon'].hasClass("octicon-diff-added")) {
            $(".githubenhancer-icon", file).toggleClass("icon-added", true);
        } else if (fileList[i]['icon'].hasClass("octicon-diff-modified")) {
            $(".githubenhancer-icon", file).toggleClass("icon-modified", true);
        } else if (fileList[i]['icon'].hasClass("octicon-diff-removed")) {
            $(".githubenhancer-icon", file).toggleClass("icon-removed", true);
        }
        let icon = fileList[i]['icon'].clone();
        icon.removeClass();
        $(".githubenhancer-icon", file).html(icon);
        $fileList.append(file);
    }
    $("div.pr-toolbar").after($fileList);
}