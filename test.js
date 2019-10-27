chrome.runtime.sendMessage(
	{channel: "styles"},
	function(response){
		$("<style>")
			.prop("type", "text/css")
			.html(response)
			.appendTo("head");
	}
);

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.channel == "onUpdated"){
			if(request.status == "loading"){
				loadDeployments();
			}
			else if(request.status == "complete"){
				renderDeployments();
				moveDraftsToBottom();
				markRequestsForMe();
			}
		}
		return true;
	}
);

function moveDraftsToBottom(){
	var $row = $("[aria-label=\"Open draft pull request\"]").closest("div.js-issue-row");
	$row.toggleClass("stylish-draft-pullrequest", true);
	var $parent = $row.parent();
	$row.detach().appendTo($parent);
}

function markRequestsForMe(){
	var user = $(".Header .Header-link img.avatar").attr("alt").substr(1);
	$("div.js-issue-row").each(function(){
		if($(this).find("img[alt='@"+user+"']").length > 0 || $(this).find("a[data-hovercard-type='user']").html().trim() == user){
			$(this).toggleClass("stylish-foryou-pullrequest", true);
		}
	});
}


var deployments = null;
function loadDeployments(){
	deployments = null;
	var isClosedPullRequestsPage = /^.*\/pulls.*(updated-desc).*$/.test(location.href) && /^.*\/pulls.*(closed).*$/.test(location.href);
	if(isClosedPullRequestsPage){
		chrome.runtime.sendMessage(
			{channel:"deployments"},
			function(response){
				deployments = response['records'];
			}
		);
	}
}

function renderDeployments(){
	if(deployments == null){
		setTimeout(renderDeployments,100);
		return;
	}
	for(let i in deployments){
		var row = $("div.Box-row").first().clone();
		deploymentToRow(deployments[i],row);
		$(".js-active-navigation-container").prepend(row);
	}
	$(".js-active-navigation-container").find("div.Box-row").sort(function(a, b){
		return +new Date($("relative-time",b).first().attr("datetime")) - new Date($("relative-time",a).first().attr("datetime"));
	}).appendTo($(".js-active-navigation-container"));
}

function deploymentToRow(deployment,row){
	$("label",row).remove();
	$(".d-inline-block.mr-1",row).remove();
	$(".float-right.col-3",row).remove();
	$("a[data-hovercard-type=\"pull_request\"]",row).replaceWith("<div class='h4'>Manual deploy of "+deployment['project']['name']+"</div>");
	$("span[aria-label=\"Merged pull request\"]",row).attr("aria-label","DeployHQ").html("<img src='"+chrome.extension.getURL('deployhq.png')+"' style='width:32px;vertical-align:middle;margin-right:7px;margin-left:2px;margin-top:5px;'/>");
	let $date = $("span.issue-meta-section.ml-2",row).first().clone();
	$date.html($date.html().replace('updated','deployed'));
	let date = new Date(deployment['timestamps']['completed_at']);
	$("relative-time",$date).attr("datetime", deployment['timestamps']['completed_at']).attr("title", date.toLocaleString());
	$("div.mt-1.text-small",row).html("Deployed by <a class='muted-link' data-hovercard-type='user' href='javascript:void(0);'>"+deployment['deployer']+"</a> • ");
	if(deployment['status'] == "completed"){
		$("div.mt-1.text-small",row).append("<a class='tooltipped muted-link' aria-label='approval' href='javascript:void(0);'>Completed</a>");
	} else if(deployment['status'] == "failed"){
		$("div.mt-1.text-small",row).append("<a class='tooltipped muted-link' aria-label='requesting' href='javascript:void(0);'>Failed</a>");
	} else {
		$("div.mt-1.text-small",row).append("<a class='tooltipped muted-link' aria-label='required' href='javascript:void(0);'>"+deployment['status']+"</a>");
	}
	$("div.mt-1.text-small",row).append($date);
	row.css("background","#F4F4F4");
}