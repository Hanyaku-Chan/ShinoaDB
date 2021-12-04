var dashboard = require('./client.js');
var db = new dashboard();

async function tester() {
    await db.connect('127.0.0.1', 1337, "password");
    await db.setData('test', 'test');
}

tester();