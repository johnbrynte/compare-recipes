const cheerio = require('cheerio');
const rp = require('request-promise');

var sites = [
    'https://www.ica.se/recept/grundrecept-vaffelsmet-292887/',
    'https://www.coop.se/recept/vafflor-recept-pa-vaffelsmet'
];

var promises = sites.map(function(url) {
    return rp(url).then(function(htmlString) {
        return parseRecipe(htmlString);
    }).catch(function(err) {
        console.log(err);
        return null;
    });
});

Promise.all(promises).then(function(r) {
    r.forEach(function(recipe) {
        console.dir(recipe);
    });
});

function parseRecipe(html) {
    const $ = cheerio.load(html);

    var title = $("title").text().trim();

    var ingredients = [];
    var space = 0;

    $('li').each(function() {
        var s = $(this).text().replace(/[\n\r\s]+/g, " ").trim();
        if (s == "") {
            space++;
        } else {
            var item = parseIngredient(s);
            if (item) {
                if (!isDuplicate(ingredients, item)) {
                    ingredients.push(item);
                }
            }
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
    var p = /^([0-9]+(?:\.,[0-9]+)?)\s?([A-zåÅäÄöÖ]+)\s+(.+)/;
    var m = s.match(p);
    if (m) {
        var unit = parseUnit(m[2]);
        if (unit) {
            return {
                amount: parseFloat(m[1]),
                unit: unit,
                ingredient: m[3].toLowerCase(),
            };
        }
    }
    return null;
}

function parseUnit(s) {
    s = s.toLowerCase();
    var units = ["l", "dl", "cl", "ml", "kg", "mg", "g"];
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