const express = require('express');
const multer = require('multer');

const upload = multer();
const app = express();
const port = 3000;

const handlebars = require('express-handlebars');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({ parsed: {}, job_id: 1, jobs: [] })
    .write()

const parser = require('./recipe-parser');

app.set('view engine', 'handlebars');

app.engine('handlebars', handlebars());

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index', {
        layout: false,
        test: JSON.stringify({
            test: 'hello world',
        }),
    });
});

app.post('/parse', upload.none(), (req, res) => {
    // trim empty entries
    var list = req.body.list;
    for (var i = 0; i < list.length; i++) {
        var url = list[i].trim();
        if (url === "") {
            list.splice(i, 1);
            i--;
        } else {
            list[i] = url;
        }
    }

    parser.scrapeUrls(list).then(function(recipes) {
        var id = "" + db.get('job_id')
            .value();
        db.update('job_id', n => n + 1)
            .write();

        var combined = parser.combineRecipes(recipes);
        var data = {
            combined: combined,
            recipes: recipes,
        };

        db.get('jobs')
            .push({
                id: id,
                data: data,
            })
            .write();

        res.redirect('/recipe/' + id);
    }).catch(function(r) {
        // TODO
        console.log(r);
        res.status(400).send("Error: " + r.error);
    });
});

app.get('/recipe/:id', (req, res) => {
    var job = db.get('jobs')
        .find({ id: req.params.id })
        .value();

    if (!job) {
        res.status(404).send("Not found");
        return;
    }

    res.render('recipe', {
        layout: false,
        jsonData: JSON.stringify(job),
    });
});

app.listen(port, () => {

});