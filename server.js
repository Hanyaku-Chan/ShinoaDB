var path = require('path');
var fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

//create the database
var jsonCollection = require('json-collection');
var dbCollection = new jsonCollection();

//create a tcp server and send a message to the client
var net = require('net');
var server = net.createServer();
//on data from the client
server.on('connection', function(socket) {

    //get socket ip adress
    var remoteAddress = socket.remoteAddress;
    
    //on data event
    socket.on('data', async function(data) {
        var dataString = data.toString();
        //split data string into array
        var dataArray = dataString.split(' ');
        //get the first element of the array
        var command = dataArray[0];

        switch(command) {
            case 'get':

                if(dbCollection.get(dataArray[1]) != undefined) {
                    socket.write(dbCollection.get(dataArray[1]));
                } else {
                    socket.write('undefined');
                }

            break;

            case 'set':
                var data = dataArray.join(' ').slice(dataArray[0].length + 1 + dataArray[1].length + 1);
                dbCollection.set(dataArray[1], data);
                await delay(100);
                dbCollection.save('./data.json');
            break;

            case 'delete':
                dbCollection.delete(dataArray[1]);
                await delay(100);
                dbCollection.save('./data.json');
            break;

        }
    });
});

server.listen(require("./config.json").port, function() {
    if(fs.existsSync('data.json')){
        dbCollection.load('./data.json');
     }
     console.log('Server listening on port ' + require("./config.json").port);
});

//create web interface
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const { config } = require('process');

app.set('view engine', 'html');

app.engine('html', require('hbs').__express);

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    var json = dbCollection.getJson();
    res.render('index.hbs', {
        title: "ShinoaDB | Web Interface",
        dataBase: json
    });
});

app.get('/get', async (req, res) => {
    var key = req.query.key;
    if(dbCollection.get(key) != undefined) {
        res.send(dbCollection.get(key));
    }
    else {
        res.send('undefined');
    }
});

app.get('/set', async (req, res) => {
    var key = req.query.key;
    var value = req.query.value;
    dbCollection.set(key, value);
    await delay(100);
    dbCollection.save('./data.json');
    res.send('success');
});

app.get('/delete', async (req, res) => {
    var key = req.query.key;
    dbCollection.delete(key);
    await delay(100);
    dbCollection.save('./data.json');
    res.send('success');
});

app.post('/command', async (req, res) => {
    var cmd = "";
    if(req.body.set !== '') cmd = 'set'
    if(req.body.delete == "Delete") cmd = "delete"

    switch(cmd) {
        case 'set':
            dbCollection.set(req.body.name, req.body.set);
            await delay(100);
            dbCollection.save('./data.json');
        break;
        case 'delete':
            dbCollection.delete(req.body.name);
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