addInput();

function test() {
    $("#inputs").html("");
    addInput();
    addInput();
    addInput();
    $("input:eq(0)").val("https://www.ica.se/recept/pannkakor-eller-plattar-grundrecept-534309/");
    $("input:eq(1)").val("https://www.coop.se/recept/pannkakor-grundrecept");
}

function addInput() {
    var el = $("<input>")
        .attr("type", "text")
        .attr("name", "list[]")
        .attr("placeholder", "URL till ett recept");
    var wrapper = $("<div>").append(el);

    $("#inputs").append(wrapper);

    el.one("input", function() {
        if (wrapper.is(":last-child")) {
            addInput();
        }
    });
}