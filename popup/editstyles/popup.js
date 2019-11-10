var settings = chrome.extension.getBackgroundPage().settings;

$(function() {
    settings.load(function() {
        url = chrome.extension.getURL(Settings.STYLES[Settings.STYLE_PULL_REQUESTS]);
        fetch(url).then(response => response.text()).then(response => {
            $("[data-settings=deploymentsStyles]").val(response);
            var editor = CodeMirror.fromTextArea($("[data-settings=deploymentsStyles]")[0], {
                mode: "css",
                lineWrapping: true,
                indentUnit: 4,
                tabSize: 4
            });
        });
    });
});