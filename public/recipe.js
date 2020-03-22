var data = JSON.parse($('#recipe-data').text());
var content = $("#content");

data.data.recipes.forEach(function(recipe) {
    content.append($("<p>").html(recipe.title)
        .append($("<a>").attr("href", recipe.url).html(recipe.url)));
});

data.data.combined.forEach(function(ingredient) {
    if (ingredient.name) {
        content.append($("<h3>").html(ingredient.name));
    } else {
        var list = [];
        ingredient.list.forEach(function(item) {
            list.push(item.ingredient);
        });
        content.append($("<h3>").html(list.join(", ")));
    }

    var list = [];
    ingredient.list.forEach(function(item) {
        list.push(item.amount + " " + (item.unit || "st"));
    });
    content.append($("<p>").html(list.join(", ")));
});