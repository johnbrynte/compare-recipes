addInput();

function addInput() {
    var el = $("<input>")
        .attr("type", "text")
        .attr("name", "list[]")
        .attr("placeholder", "Website");

    $("#inputs").append($("<div>").append(el));

    el.one("input", function() {
        if ($(this).last()) {
            addInput();
        }
    });
}