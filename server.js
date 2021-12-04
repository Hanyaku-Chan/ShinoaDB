var path = require('path');
var fs = require('fs');

var config = require('./config.json');
var password = config.password;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

//create the database
var jsonCollection = require('./custom_modules/JSON-Collection/index');
var dbCollection = new jsonCollection();

//create a tcp server and send a message to the client
var net = require('net');
var server = net.createServer();
//on data from the client
server.on('connection', function (socket) {

    //get socket ip adress
    var remoteAddress = socket.remoteAddress;

    //on data event
    socket.on('data', async function (data) {
        if (config.debug) console.log(data.toString());
        if (config.debug == true) console.log(data.toString());

        var dataString = data.toString();
        //split data string into array
        var dataArray = dataString.split(' ');
        //get the first element of the array
        var command = dataArray[0];
        dataArray = dataArray.slice(1);

        if (config.password) {
            if (config.password == dataArray[0]) {
                dataArray = dataArray.slice(1);
            } else {
                socket.write('wrong password');
                return;
            }
        }

        switch (command) {
            case 'get':
                if (dataArray[0] == password) return function () {
                    socket.write('cant get password. lookup in config.json');
                }

                if (dbCollection.get(dataArray[0]) != undefined) {
                    socket.write(dbCollection.get(dataArray[0]));
                } else {
                    socket.write('undefined');
                }

                break;

            case 'set':
                if (dataArray[0] == password) return function () {
                    socket.write('cant change password. change in config.json');
                }
                var data = dataArray.slice(1).join(' ');
                dbCollection.set(dataArray[0], data, config.password);
                await delay(100);
                dbCollection.save('./data.json');
                break;

            case 'delete':
                if (dataArray[0] == password) return function () {
                    socket.write('cant change password. change in config.json');
                }
                dbCollection.delete(dataArray[0]);
                await delay(100);
                dbCollection.save('./data.json');
                break;

        }
    });
});

server.listen(require("./config.json").port, function () {
    if (fs.existsSync('data.json')) {
        dbCollection.load('./data.json');
    }
    console.log('Server listening on port ' + require("./config.json").port);
});

//create web interface
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const { allowedNodeEnvironmentFlags } = require('process');

app.set('view engine', 'html');

app.engine('html', require('hbs').__express);

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    if (req.cookies.password !== config.password) return res.redirect('/login');

    var json = dbCollection.getJson();
    res.render('index.hbs', {
        title: "ShinoaDB | Web Interface",
        dataBase: json
    });
});

app.get("/logout", function (req, res) {
    res.clearCookie('password');
    res.redirect('/login');
});

app.get("/login", function (req, res) {
    res.render('login.hbs', {
        title: "ShinoaDB | Login"
    });
});

app.get('/get', async (req, res) => {
    if (req.query.password !== config.password) return res.send('wrong password');
    var key = req.query.key;
    if (dbCollection.get(key) != undefined) {
        res.send(dbCollection.get(key));
    }
    else {
        res.send('undefined');
    }
});

app.get('/set', async (req, res) => {
    if (req.query.password !== config.password) return res.send('wrong password');
    var key = req.query.key;
    var value = req.query.value;
    dbCollection.set(key, value, config.password);
    await delay(100);
    dbCollection.save('./data.json');
    res.send('success');
});

app.get('/delete', async (req, res) => {
    if (req.query.password !== config.password) return res.send('wrong password');
    var key = req.query.key;
    dbCollection.delete(key);
    await delay(100);
    dbCollection.save('./data.json');
    res.send('success');
});

app.post("/login", async (req, res) => {
    if (req.body.password == config.password) {
        res.cookie('password', config.password);
        res.redirect('/');
    } else {
        res.render('loginError.hbs', {
            title: "ShinoaDB | Login",
            err: 'wrong password'
        });
    }
});

app.post('/command', async (req, res) => {
    var cmd = "";
    if (req.body.set !== '') cmd = 'set'
    if (req.body.delete == "Delete") cmd = "delete"
    if (req.body.create == 'Create') cmd = 'create'
    if (req.cookies.password !== config.password) return res.render('login.hbs', {
        title: "ShinoaDB | Login",
    });

    switch (cmd) {
        case 'set':
            if (req.body.name == 'password') return res.render('error.hbs', {
                title: "ShinoaDB | Web Interface",
                dataBase: dbCollection.getJson(),
                err: "Cant change Password in Web. Change in Config.json"
            });
            dbCollection.set(req.body.name, req.body.set, config.password);
            await delay(100);
            dbCollection.save('./data.json');
            break;
        case 'delete':
            if (req.body.name == 'password') return res.render('error.hbs', {
                title: "ShinoaDB | Web Interface",
                dataBase: dbCollection.getJson(),
                err: "Cant change Password in Web. Change in Config.json"
            });
            dbCollection.delete(req.body.name);
            await delay(100);
            dbCollection.save('./data.json');
            break;
        case 'create':
            if (dbCollection.get(req.body.name) !== undefined) return res.render('error.hbs', {
                title: "ShinoaDB | Web Interface",
                dataBase: dbCollection.getJson(),
                err: "Key already exists"
            });
            dbCollection.set(req.body.name, req.body.set);
            await delay(100);
            dbCollection.save('./data.json');
            break;
    }

    await delay(100);
    res.redirect('/');
});

var server = app.listen(require("./config.json").webPort, () => {
    console.log('WebSocket listening on port ' + require("./config.json").webPort);
});