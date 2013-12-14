/*************************************************
 * FastWebServer by Burak (burakadama@gmail.com) *
 *************************************************/

var util = require('util');
var net = require("net");
var sys = require('sys');
var cluster = require('cluster');
var os = require('os');
var exec = require('child_process').exec;
var fs = require("fs");
var http = require('http');
var https = require('https');
var zlib = require('zlib');
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var php = require("./node-php");

process.on("uncaughtException", function(e) {
	console.log(e);
});

function get(filename){
	return fs.readFileSync(filename, "UTF-8");
}
function put(filename, content){
	return fs.writeFileSync(filename, content, "UTF-8");
}
function toHex(str) {
	var hex = '';
	for(var i=0;i<str.length;i++) {
		hex += ''+str.charCodeAt(i).toString(16);
	}
	return hex;
}
function reqHandler(req, res){
	var ssl = false;
	eval(get("handler.js"));
}
function reqHandlerSSL(req, res){
	var ssl = true;
	eval(get("handler.js"));
}

var agent = new php.Agent(4, "");

agent.on("error", function(err) {
	console.log("client.error");
	console.log(err);
});

eval(get("config.js"));
eval(get("vhosts.js"));
eval(get("mimetypes.js"));

var count = 1;
var clusterhttp = {
	name: 'FastClusterServer',

	cpus: os.cpus().length,

	autoRestart: true,

	start: function (server, port, address) {
		var me = this,i;

		if (cluster.isMaster) {
			for (i = 0; i < me.cpus; i += 1) {
				console.log(me.name + ': starting worker thread #' + count);
				cluster.fork();
				count = count+1;
			}

			cluster.on('death', function (worker) {
				if (me.autoRestart) {
					console.log(me.name + ': Restarting worker thread...');
					cluster.fork();
				}
			});
		}else{
			server.listen(port, address);
		}
	}
}
config['server']['ports'].forEach(function(port) {
	var s = http.createServer(reqHandler);
	clusterhttp.start(s, port, config['server']['address']);
	delete s;
});

config['ssl_server']['ports'].forEach(function(port) {
	var s = https.createServer({key: fs.readFileSync(config['ssl_server']['key']),cert: fs.readFileSync(config['ssl_server']['certificat'])}, reqHandlerSSL);
	clusterhttp.start(s, port, config['ssl_server']['address']);
	delete s;
});

/*************************************************
 * FastWebServer by Burak (burakadama@gmail.com) *
 *************************************************/