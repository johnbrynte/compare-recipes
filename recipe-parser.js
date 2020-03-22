const cheerio = require('cheerio');
const rp = require('request-promise');

function parseRecipe(html, id) {
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
                    // convert all "null" units to "'st'"
                    if (!item.unit) {
                        item.unit = "st";
                    }
                    if (id) {
                        item.id = id;
                    }
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

    // var p = /^([0-9]+(?:(?:\.|,|\/)[0-9]+)?)\s?([A-zåÅäÄöÖ]+)?\s+(.+)/;

    // matches [num] ([range num]) ([unit]) 
    var p = /^((?:[0-9]+\s)?[0-9]+(?:(?:\.|,|\/)[0-9]+)?)(?:\s-\s((?:[0-9]+\s)?[0-9]+(?:(?:\.|,|\/)[0-9]+)?))?\s?([A-zåÅäÄöÖ]+)?\s+(.+)/;
    var m = s.match(p);

    if (m) {
        var unit = parseUnit(m[3]);
        var a1 = parseAmount(m[1]);
        var a2 = parseAmount(m[2]);
        var amount = a2 ? (a1 + a2) / 2 : a1;
        return {
            amount: amount,
            unit: unit,
            ingredient: m[4].toLowerCase(),
        };
    }
    return null;
}

function parseAmount(s) {
    if (!s) {
        return null;
    }

    var parts = s.split(" ");
    if (parts.length > 1) {
        return parseAmount(parts[0]) + parseAmount(parts[1]);
    }

    s = s.replace(",", ".");
    try {
        return eval(s);
    } catch (e) {
        return parseFloat(s);
    }
}

function parseUnit(s) {
    if (!s) {
        return null;
    }
    s = s.toLowerCase();
    var units = ["l", "dl", "cl", "ml", "kg", "mg", "g", "msk", "tsk", "krm"];
    if (units.indexOf(s) != -1) {
        return s;
    }
    switch (s) {
        case "kilo":
        case "kilogram":
            return "kg";
        case "gram":
            return "g";
        case "milligram":
            return "mg";
        case "liter":
            return "l";
        case "matsked":
        case "matskedar":
            return "msk";
        case "tesked":
        case "teskedar":
            return "tsk";
        case "kryddmått":
            return "krm";
    }
    return null;
}

function matchUnits(item1, item2) {
    if (item1.unit === item2.unit) {
        return true;
    }
    var convertArray = null;
    var i1, i2;

    // volym
    var vol = ["ml", "krm", "tsk", "cl", "msk", "dl", "l"];
    i1 = vol.indexOf(item1.unit);
    i2 = vol.indexOf(item2.unit);
    if (i1 != -1 && i2 != -1) {
        convert = [1, 1, 5, 10, 15, 100, 1000];
    } else {
        // vikt
        var weight = ["mg", "g", "kg"];
        i1 = weight.indexOf(item1.unit);
        i2 = weight.indexOf(item2.unit);
        if (i1 != -1 && i2 != -1) {
            convert = [1, 1000, 1000000];
        }
    }

    if (!convertArray) {
        return false;
    }

    var i, j, amount;
    if (i1 < i2) {
        i = i1;
        j = i2;
        amount = item2.amount;
    } else {
        i = i2;
        j = i1;
        amount = item1.amount;
    }

    for (; i < j && j >= 0; j--) {
        amount *= convertArray[j] / convertArray[j - 1];
    }

    if (i1 < i2) {
        item2.amount = amount;
        item2.unit = item1.unit;
    } else {
        item1.amount = amount;
        item1.unit = item2.unit;
    }

    return true;
}

function combineRecipes(recipes) {
    var ingredients = [];
    recipes.forEach(recipe => {
        if (!recipe) {
            return;
        }
        recipe.ingredients.forEach(item => {
            var sList = item.ingredient.split(/\s+/g);

            for (var i = 0; i < ingredients.length; i++) {
                var ingredient = ingredients[i];
                var list = ingredient.list;
                for (var j = 0; j < list.length; j++) {
                    var _item = list[j];
                    var _sList = _item.ingredient.split(/\s+/g);
                    for (var k = 0; k < sList.length; k++) {
                        var s = sList[k];
                        for (var l = 0; l < _sList.length; l++) {
                            var _s = _sList[l];
                            try {
                                if (s.search(new RegExp("^" + _s)) != -1
                                    || s.search(new RegExp(_s + "$")) != -1
                                    || _s.search(new RegExp("^" + s)) != -1
                                    || _s.search(new RegExp(s + "$")) != -1) {
                                    // found match
                                    if (matchUnits(item, _item)) {
                                        if (item.ingredient != ingredient.name) {
                                            ingredient.name = null;
                                        }
                                        list.push(item);
                                        return;
                                    }
                                }
                            } catch (e) {
                                if (s == _s) {
                                    // found match
                                    if (matchUnits(item, _item)) {
                                        if (item.ingredient != ingredient.name) {
                                            ingredient.name = null;
                                        }
                                        list.push(item);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // new
            ingredients.push({
                name: item.ingredient,
                list: [item],
            });
        });
    });
    // order
    ingredients.forEach(item => {
        item.list.sort((a, b) => {
            return a.amount - b.amount;
        });
    });
    ingredients.sort((a, b) => {
        var amin = a.list[0].amount;
        var amax = a.list[a.list.length - 1].amount;
        var bmin = b.list[0].amount;
        var bmax = b.list[b.list.length - 1].amount;
        return ((bmax - bmin) / bmax) - ((amax - amin) / amax);
    });
    return ingredients;
}

function scrapeUrls(sites) {
    var promises = sites.map(function(url, i) {
        return rp(url).then(function(htmlString) {
            var recipe = parseRecipe(htmlString, i + 1);
            recipe.url = url;
            return recipe;
        });
    });

    return Promise.all(promises);
}

module.exports = {
    matchUnits: matchUnits,
    combineRecipes: combineRecipes,
    scrapeUrls: scrapeUrls,
};