/*************************************************
 * FastWebServer by Burak (burakadama@gmail.com) *
 *************************************************/

var client = {
	remote_ip: req.connection.remoteAddress,
	host: req.headers.host,
	method: req.method,
	useragent: req.headers['user-agent'],
	acceptencoding: req.headers['accept-encoding']
}

if(!client.acceptencoding){
	client.acceptencoding = "";
}

if(ssl){
	if(vhosts[(client.host+':'+config['ssl_server']['port'])]){
		vhost = vhosts[(client.host+':'+config['ssl_server']['port'])];
	}else if(vhosts[(client.host+':*')]){
		vhost = vhosts[(client.host+':*')];
	}else if(vhosts[('*:'+config['ssl_server']['port'])]){
		vhost = vhosts[('*:'+config['ssl_server']['port'])];
	}else{
		vhost = vhosts['*:*'];
	}
}else{
	if(vhosts[(client.host+':'+config['server']['port'])]){
		vhost = vhosts[(client.host+':'+config['server']['port'])];
	}else if(vhosts[(client.host+':*')]){
		vhost = vhosts[(client.host+':*')];
	}else if(vhosts[('*:'+config['server']['port'])]){
		vhost = vhosts[('*:'+config['server']['port'])];
	}else{
		vhost = vhosts['*:*'];
	}
}
var headers = {"X-Powered-By": "FastWebServer ALPHA"}
var urlreal = url.parse(req.url).pathname;

if(urlreal == '/'){
	urlreal = '/index.html';
}else{
	urlsplit = urlreal.split("");
	if(urlsplit[(urlsplit.length-1)] == '/'){
		urlreal = urlreal+'index.html';
	}
}

var filePath = vhost['DocumentRoot'] + urlreal;

var extname = path.extname(filePath);
var params = querystring.parse(url.parse(req.url).query);
// console.log(params);
fs.exists(filePath, function(exists){
	if(exists){
		fs.readFile(filePath, function(error, content) {
			if(error){
				res.writeHead(500, headers);
				res.write("500 Internal error !");
				res.end();
			}else{
				filesplit = urlreal.split(".");
				if(filesplit.length > 1){
					fileext = filesplit[(filesplit.length-1)];
					if(fileext == "php"){
						headers['Content-Type'] = mimetypes['html'];
						var php = true;
						
						var tmp = "tmp/"+Math.floor(Math.random()* 10000000000000000)+"fws"+Math.floor(Math.random()* 10000000000000000)+".tmp";
						
						exec('"php/php.exe" -r "$_GET[\'test\'] = \'lol\';unset($argv,$argc);require_once(\'www/test.php\');"', function(error, stdout, stderr){
							put(tmp, stdout);
							var raw = fs.createReadStream(tmp);
							fs.unlinkSync(tmp);
							if(client.acceptencoding.match(/\bdeflate\b/)){
								headers['Content-Encoding'] = 'deflate';
								res.writeHead(200, headers);
								raw.pipe(zlib.createDeflate()).pipe(res);
							}else if(client.acceptencoding.match(/\bgzip\b/)){
								headers['Content-Encoding'] = 'gzip';
								res.writeHead(200, headers);
								raw.pipe(zlib.createGzip()).pipe(res);
							}else{
								res.writeHead(200, headers);
								raw.pipe(res);
							}
						});

					}else if(mimetypes[fileext]){
						headers['Content-Type'] = mimetypes[fileext];
					}
				}
				if(!php){
					var raw = fs.createReadStream(filePath);

					if(client.acceptencoding.match(/\bdeflate\b/)){
						headers['Content-Encoding'] = 'deflate';
						res.writeHead(200, headers);
						raw.pipe(zlib.createDeflate()).pipe(res);
					}else if(client.acceptencoding.match(/\bgzip\b/)){
						headers['Content-Encoding'] = 'gzip';
						res.writeHead(200, headers);
						raw.pipe(zlib.createGzip()).pipe(res);
					}else{
						res.writeHead(200, headers);
						raw.pipe(res);
					}
				}
			}
		});
	}else{
		res.writeHead(404, headers);
		res.write("404 Not found !");
		res.end();
	}
});

delete ssl,vhost,headers;

/*************************************************
 * FastWebServer by Burak (burakadama@gmail.com) *
 *************************************************/