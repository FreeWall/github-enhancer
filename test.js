$(function(){
	chrome.runtime.sendMessage(
		{channel: "deployments"},
		function(response){
			let deployments = JSON.parse($("div[data-react-class=\"DeployHQ.components.Deployments\"]",response).attr("data-react-props"))['deployments'];
			for(let i in deployments){
				var row = $("div.Box-row").first().clone();
				deploymentToRow(deployments[i],row);
				$(".js-active-navigation-container").prepend(row);
			}
			$(".js-active-navigation-container").find("div.Box-row").sort(function(a, b){
				return +new Date($("relative-time",b).first().attr("datetime")) - new Date($("relative-time",a).first().attr("datetime"));
			}).appendTo($(".js-active-navigation-container"));
		}
	);

	function deploymentToRow(deployment,row){
		$("label input",row).css("visibility", "hidden").css("pointer-events", "none");
		$("a[data-hovercard-type=\"pull_request\"]",row).html("Manual deploy of "+deployment['project']['name']);
		let $date = $("span.issue-meta-section.ml-2",row).first().clone();
		let date = new Date(deployment['finishedAt']);
		$("relative-time",$date).attr("datetime", deployment['finishedAt']).attr("title", date.toLocaleString());
		$("div.mt-1.text-small",row).html("Deployed by <a data-hovercard-type='user' href='javascript:void(0);'>"+deployment['user']['name']+"</a> • ");
		if(deployment['status'] == "completed"){
			$("div.mt-1.text-small",row).append("<a class='tooltipped' aria-label='approval' href='javascript:void(0);'>Completed</a>");
		} else if(deployment['status'] == "failed"){
			$("div.mt-1.text-small",row).append("<a class='tooltipped' aria-label='requesting' href='javascript:void(0);'>Failed</a>");
		} else {
			$("div.mt-1.text-small",row).append("<a class='tooltipped' aria-label='required' href='javascript:void(0);'>"+deployment['status']+"</a>");
		}
		$("div.mt-1.text-small",row).append($date);
	}
});