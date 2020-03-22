var data = JSON.parse($('#recipe-data').text());
var content = $("#content");

data.data.forEach(function(recipe) {
    content.append($("<h2>").html(recipe.title));
    content.append($("<a>").attr("href", recipe.url).html(recipe.url));

    recipe.ingredients.forEach(function(item) {
        content.append($("<p>").html(item.amount + " " + item.unit + " " + item.ingredient));
    });
});