var settings = new Settings();

$(function() {
    settings.load(function() {
        for (let i in Settings.VALUES) {
            $("input[type=checkbox][data-settings="+Settings.VALUES[i]+"]").prop("checked", settings.get(Settings.VALUES[i]));
        }
    });

    $("input[type=checkbox][data-settings]").change(function() {
        settings.set($(this).attr("data-settings"), $(this).is(":checked"));
    });
});