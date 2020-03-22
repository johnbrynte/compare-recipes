const cheerio = require('cheerio');
const rp = require('request-promise');

function parseRecipe(html) {
    const $ = cheerio.load(html);

    var title = $("title").text().trim();

    var ingredients = null;
    var maxScore = 0;

    $('ul').each(function() {
        var list = [];
        var score = 0;
        $(this).find('li').each(function() {
            var s = $(this).text().replace(/[\n\r\s]+/g, " ").trim();
            if (s != "") {
                var item = parseIngredient(s);
                if (item) {
                    score += item.unit ? 2 : 1;
                    list.push(item);
                }
            }
        });
        if (score > maxScore) {
            maxScore = score;
            ingredients = list;
        }
    });

    return {
        title: title,
        ingredients: ingredients,
    };
}

function isDuplicate(a, item) {
    return a.find(function(e) {
        return e.amount == item.amount && e.unit == item.unit && e.ingredient == item.ingredient;
    });
}

function parseIngredient(s) {
    s = s.trim();
    var p = /^([0-9]+(?:\.,[0-9]+)?)\s?([A-zåÅäÄöÖ]+)?\s+(.+)/;
    var m = s.match(p);
    if (m) {
        var unit = parseUnit(m[2]);
        return {
            amount: parseFloat(m[1]),
            unit: unit,
            ingredient: m[3].toLowerCase(),
        };
        // if (unit) {
        // }
    }
    return null;
}

function parseUnit(s) {
    if (!s) {
        return null;
    }
    s = s.toLowerCase();
    var units = ["l", "dl", "cl", "ml", "kg", "mg", "g", "tsk"];
    if (units.indexOf(s) != -1) {
        return s;
    }
    switch (s) {
        case "kilo":
        case "kilogram":
            return "kg";
        case "gram":
            return "g";
        case "liter":
            return "l";
    }
    return null;
}

function scrapeUrls(sites) {
    var promises = sites.map(function(url) {
        return rp(url).then(function(htmlString) {
            var recipe = parseRecipe(htmlString);
            recipe.url = url;
            return recipe;
        });
    });

    return Promise.all(promises);
}

module.exports = {
    scrapeUrls: scrapeUrls,
};