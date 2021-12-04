var net = require('net');
var client = new net.Socket();
var operation;
var ip;
var port;
var password;

module.exports = class {
    getData(key, collection) {
        getDataFunc(key, collection);
    }

    setData(name, variable) {
        setDataFunc(name, variable);
    }

    deleteData(key) {
        deleteDataFunc(key);
    }

    async connect(ip, port, password) {
        await setIpadPort(ip, port, password);
    }
}

function setIpadPort(newip, newport, newpassword) {
    ip = newip;
    port = newport;
    password = newpassword;
}

async function deleteDataFunc(key) {
    if(ip == undefined) return console.log('no ip');
    if(port == undefined) return console.log('no port');
    operation = 'delete';

    client.connect(port, ip);

    //on connect event
    client.on('connect', async () => {
        if(operation == 'delete') {
            await client.write('delete ' + password + ' ' + key);
            client.end();
        }
    });
}

async function getDataFunc(key, collection) {
    if(ip == undefined) return console.log('no ip');
    if(port == undefined) return console.log('no port');
    operation = 'get';

    client.connect(port, ip);

    //on connect event
    client.on('connect', async () => {
        if(operation == 'get') {
            await client.write('get ' + password + ' ' + key);
            await client.on('data', function(data) {
                console.log(data.toString());
                client.end();
            });
        }
    });
}

async function setDataFunc(name, variable) {
    if(ip == undefined) return console.log('no ip');
    if(port == undefined) return console.log('no port');
    operation = 'set';

    client.connect(port, ip);

    //on connect event
    client.on('connect', async () => {
        if(operation == 'set') {
            await client.write('set ' + password + ' ' + name + ' ' + variable);
            client.end();
        }
    });
}