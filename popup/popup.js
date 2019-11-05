var settings = chrome.extension.getBackgroundPage().settings;

$(function() {
    settings.load(function() {
        for (let i in Settings.VALUES) {
            $("input[type=checkbox][data-settings=" + Settings.VALUES[i] + "]").prop("checked", settings.get(Settings.VALUES[i]));
        }
    });

    chrome.tabs.query({currentWindow: true}, function(tabs) {
        let deployments = settings.get(Settings.DEPLOYMENTS);
        for (let i in tabs) {
            if (tabs[i].url) {
                let repository = tabs[i].url.match('\/github\.com\/([a-zA-Z0-9-_.]*\/[a-zA-Z0-9-_.]*)');
                if (repository) {
                    repository = repository[1];
                    $("[data-js=deployment-repository]").append('\
                    <label class="row double">\
                        <div class="label">'+repository+'</div>\
                        <div class="checkbox">\
                            <input data-repository="'+repository+'" type="checkbox"/>\
                        </div>\
                    </label>\
                    <div class="subgroup" data-repository-group="'+repository+'" style="display:none">\
                        <div class="subrow">\
                            <input data-repository-settings="url" placeholder="https://deployhq.com/projects/your-project/" type="text"/>\
                        </div>\
                        <div class="subrow">\
                            <input data-repository-settings="user" placeholder="E-mail address" type="text"/>\
                        </div>\
                        \<div class="subrow">\
                            <input data-repository-settings="key" placeholder="API key" type="text"/>\
                        </div>\
                    </div>').show();
                    if (typeof deployments[repository] !== "undefined") {
                        $("[data-repository="+$.escapeSelector(repository)+"]").prop("checked", true);
                        $("[data-repository-group="+$.escapeSelector(repository)+"]").show();
                        for (let key in deployments[repository]) {
                            $("[data-repository-settings=" + $.escapeSelector(key) + "]").val(deployments[repository][key]);
                        }
                    }
                }
            }
        }
    });

    $("input[type=checkbox][data-settings]").change(function() {
        settings.set($(this).attr("data-settings"), $(this).is(":checked"));
    });

    $(document).on("change", "input[type=checkbox][data-repository]", function() {
        if ($(this).is(":checked")) {
            $("[data-repository-group=" + $.escapeSelector($(this).attr("data-repository")) + "]").show();
        } else {
            $("[data-repository-group=" + $.escapeSelector($(this).attr("data-repository")) + "]").hide();
        }
    });

    $(document).on("change", "input[data-repository], input[data-repository-settings]", function() {
        let deployments = settings.get(Settings.DEPLOYMENTS);
        $("input[data-repository]").each(function() {
            let repository = $(this).attr("data-repository");
            if ($(this).is(":checked")) {
                deployments[repository] = {};
                $("[data-repository-group=" + $.escapeSelector(repository) + "] [data-repository-settings]").each(function() {
                    deployments[repository][$(this).attr("data-repository-settings")] = $(this).val();
                });
            } else {
                delete deployments[repository];
            }
        });
        settings.set(Settings.DEPLOYMENTS, deployments);
    });
});