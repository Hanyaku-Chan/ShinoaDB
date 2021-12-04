var dashboard = require('./client.js');
var db = new dashboard();

async function tester() {
    await db.connect('127.0.0.1', 1337);
    await db.setData('test', 'test'); //sends the data to the server and saves it as 'test'
    await db.getData('test'); //returns the value saved as 'test'
    await db.deleteData('test'); //deletes the value saved as 'test'
}

tester();