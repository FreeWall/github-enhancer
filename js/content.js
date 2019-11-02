updateStyles();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.channel == "onUpdated") {
            if (typeof request.status === "undefined" || request.status == "loading") {
                if (request.settings[Settings.DEPLOYMENTS]) {
                    loadDeployments();
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

function moveDraftsToBottom() {
    var $row = $("[aria-label=\"Open draft pull request\"]").closest("div.js-issue-row");
    $row.toggleClass("githubenhancer-draft-pullrequest", true);
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

function isClosedPullRequestsPage() {
    return /^.*\/pulls.*(updated-desc).*$/.test(location.href) && /^.*\/pulls.*(closed).*$/.test(location.href) && !/^.*\/pulls.*(page=(?!(?:1))\d+).*$/.test(location.href);
}

var deployments = null;
function loadDeployments() {
    deployments = null;
    if (this.isClosedPullRequestsPage()) {
        chrome.runtime.sendMessage(
            {channel: "deployments"},
            function(response) {
                deployments = response['records'];
            }
        );
    }
}

function renderDeployments() {
    if (!this.isClosedPullRequestsPage()) {
        return;
    }
    if (deployments == null) {
        setTimeout(renderDeployments, 100);
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
    $("span[aria-label=\"Merged pull request\"],span[aria-label=\"Closed pull request\"]", row).attr("aria-label", "DeployHQ").html("<img src='" + chrome.extension.getURL('static/deployhq.png') + "' style='width:32px;vertical-align:middle;margin-right:7px;margin-left:2px;margin-top:5px;'/>");
    let $date = $("span.issue-meta-section.ml-2", row).first().clone();
    $date.html($date.html().replace('updated', 'deployed'));
    let date = new Date(deployment['timestamps']['completed_at']);
    $("relative-time", $date).attr("datetime", deployment['timestamps']['completed_at']).attr("title", date.toLocaleString());
    $("div.mt-1.text-small", row).html("Deployed by <a class='muted-link' data-hovercard-type='user' href='javascript:void(0);'>" + deployment['deployer'] + "</a> • ");
    $("div.mt-1.text-small", row).append("<div class='deployment-status' data-status='" + deployment['status'] + "'>" + (deployment['status'].charAt(0).toUpperCase()) + deployment['status'].slice(1) + "</div>");
    $("div.mt-1.text-small", row).append($date);
    row.css("background", "#F4F4F4");
}