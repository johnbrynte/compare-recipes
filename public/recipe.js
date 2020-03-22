var data = JSON.parse($('#recipe-data').text());
var header = $("#recipe-header");
var content = $("#content");

var title = data.data.recipes[0].title.split(/(\s?,\s|\s-|\s\|)/)[0].trim();
header.append($("<h1>").html(title));

data.data.recipes.forEach(function(recipe, i) {
    header.append($("<p>")
        .attr("recipe-id", i + 1)
        .addClass("recipe-" + (i + 1))
        .addClass("recipe-hover")
        .html(recipe.title + ", ")
        .append($("<a>").attr("href", recipe.url).html(recipe.url)));
});

data.data.combined.forEach(function(ingredient) {
    var ingredientClasses = ingredient.list.map(function(item) {
        return "recipe-" + item.id;
    }).join(" ");
    if (ingredient.name) {
        content.append($("<h3>").addClass(ingredientClasses).addClass("recipe-hover")
            .html(ingredient.name));
    } else {
        var list = [];
        ingredient.list.forEach(function(item) {
            list.push(item.ingredient);
        });
        content.append($("<h3>").addClass(ingredientClasses).addClass("recipe-hover")
            .html(list.join(", ")));
    }

    var max = ingredient.list[ingredient.list.length - 1].amount;
    var range = max - ingredient.list[0].amount;
    if (range > 0) {
        content.append($("<div>").addClass("meter")
            .append($("<div>").addClass("meter-range")
                .css("width", 100 * (range / max) + "%")
                .append($("<div>").html(ingredient.list[0].amount + " " + ingredient.list[0].unit))
                .append($("<div>").html(max + " " + ingredient.list[ingredient.list.length - 1].unit))
            )
        );
    }

    var ingredientRow = $("<p>");
    ingredient.list.forEach(function(item, i) {
        if (i > 0) {
            ingredientRow.append(", ");
        }
        ingredientRow.append($("<span>").attr("recipe-id", item.id)
            .addClass("recipe-" + item.id)
            .addClass("recipe-hover")
            .html(item.amount + " " + item.unit));
    });
    content.append(ingredientRow);
});

$(window).on("mouseenter", function(evt) {
    var el = $(evt.target);
    if (el.attr("recipe-id")) {
        $(".recipe-hover").css("background", "");
        $("[recipe-id=" + el.attr("recipe-id") + "]").css("background", "skyblue");
    }
}).on("mouseleave", function(evt) {
    $(".recipe-hover").css("background", "");
}).on("click", function(evt) {
    var el = $(evt.target);
    if (el.attr("recipe-id")) {
        $(".recipe-hover").css("outline", "");
        $("[recipe-id=" + el.attr("recipe-id") + "]").css("outline", "2px solid skyblue");
    } else {
        $(".recipe-hover").css("outline", "");
    }
});