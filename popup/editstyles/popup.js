var settings = chrome.extension.getBackgroundPage().settings;

$(function() {
    settings.load(function() {
        let editor = CodeMirror.fromTextArea($("[data-settings=stylePullRequestsCustom]")[0], {
            mode: "css",
            lineWrapping: true,
            indentUnit: 4,
            tabSize: 4
        });

        let originalData = null;

        editor.on('change', function(cm) {
            if (originalData != cm.getValue()) {
                $("#save").removeAttr("disabled");
            } else {
                $("#save").attr("disabled", true);
            }
        });

        if (settings.get(Settings.STYLE_PULL_REQUESTS_CUSTOM)) {
            editor.setValue(settings.get(Settings.STYLE_PULL_REQUESTS_CUSTOM));
            originalData = editor.getValue();
            CodeMirror.signal(editor, "change", editor);
        } else {
            let url = chrome.extension.getURL(Settings.STYLES[Settings.STYLE_PULL_REQUESTS]);
            fetch(url).then(response => response.text()).then(response => {
                editor.setValue(response);
                originalData = editor.getValue();
                CodeMirror.signal(editor, "change", editor);
            });
        }

        $("#save").click(function() {
            saveStyles();
        });

        $("#reset").click(function() {
            if (confirm("Are you sure to reset styles?")) {
                let url = chrome.extension.getURL(Settings.STYLES[Settings.STYLE_PULL_REQUESTS]);
                fetch(url).then(response => response.text()).then(response => {
                    editor.setValue(response);
                    saveStyles();
                });
            }
        });

        function saveStyles() {
            try {
                originalData = editor.getValue();
                settings.set(Settings.STYLE_PULL_REQUESTS_CUSTOM, editor.getValue());
                CodeMirror.signal(editor, "change", editor);
            } catch (e) {
                alert("Failed to save, limit size maybe? (8192 bytes)");
            }
        }
    });
});