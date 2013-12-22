/*************************************************
 * FastWebServer by Burak (burakadama@gmail.com) *
 *************************************************/

var net = require('net');

var fastwebcgi = {
	VERSION: 1,
	BEGIN_REQUEST: 1,
	ABORT_REQUEST: 2,
	END_REQUEST: 3,
	PARAMS: 4,
	STDIN: 5,
	STDOUT: 6,
	STDERR: 7,
	DATA: 8,
	GET_VALUES: 9,
	GET_VALUES_RESULT: 10,
	UNKNOWN_TYPE: 11,
	MAXTYPE: this.UNKNOWN_TYPE,
	
	RESPONDER: 1,
	AUTHORIZER: 2,
	FILTER: 3,
	
	REQUEST_COMPLETE: 0,
	CANT_MPX_CONN: 1,
	OVERLOADED: 2,
	UNKNOWN_ROLE: 3,
	
	MAX_CONNS: 'MAX_CONNS',
	MAX_REQS: 'MAX_REQS',
	MPXS_CONNS: 'MPXS_CONNS',
	
	HEADER_LEN: 8,
	
	SOCK: null,
	HOST: null,
	PORT: null,
	KEEPALIVE: false,
	
	setHost: function(host){
		this.HOST = host;
		return true;
	},
	
	setPort: function(port){
		this.PORT = port;
		return true;
	},
	
	setKeepAlive: function(b){
		this.KEEPALIVE = b;
		if(!this.KEEPALIVE && this.SOCK){
			this.SOCK.destroy();
		}
	},
	
	getKeepAlive: function(){
		return this.KEEPALIVE;
	},
	
	connect: function(){
		if(!this.SOCK){
			this.SOCK = new net.Socket();
			this.SOCK.connect(this.PORT, this.HOST, function(){
				console.log("Connected !");
			});
		}
	},
	
	buildPacket: function(type, content, requestId){
		if(!requestId) requestId = 1;
		var clen = content.length;
		return String.fromCharCode(this.VERSION)+String.fromCharCode(type)+String.fromCharCode((requestId >> 8) && 0xFF)+String.fromCharCode(requestId && 0xFF)+String.fromCharCode((clen >> 8) && 0xFF)+String.fromCharCode(clen && 0xFF)+String.fromCharCode(0)+String.fromCharCode(0)+content;
	},
	
	buildNvpair: function(name, value){
		var nlen = name.length;
		var vlen = value.length;
		
		if(nlen < 128){
			var nvpair = String.fromCharCode(nlen);
		}else{
			var nvpair = String.fromCharCode((nlen >> 24) | 0x80)+String.fromCharCode((nlen >> 16) & 0xFF)+String.fromCharCode((nlen >> 8) & 0xFF)+String.fromCharCode(nlen & 0xFF);
		}
		if(vlen < 128){
			nvpair = nvpair+String.fromCharCode(vlen);
		}else{
			nvpair = nvpair+String.fromCharCode((vlen >> 24) | 0x80)+String.fromCharCode((vlen >> 16) & 0xFF)+String.fromCharCode((vlen >> 8) & 0xFF)+String.fromCharCode(vlen & 0xFF);
		}
		// console.log(nvpair);
		return nvpair+name+value;
	},
	
	readNvpair: function(data, length){
		var array = [];
		
		if(!length){
			length = data.length;
		}
		
		var p = 0;
		
		while(p != length){
			var stringarray = data.split("");
			var nlen = stringarray[p++].charCodeAt(0);
			if(nlen >= 128){
				nlen = (nlen & 0x7F << 24);
				nlen |= (stringarray[p++].charCodeAt(0) << 16);
				nlen |= (stringarray[p++].charCodeAt(0) << 8);
				nlen |= (stringarray[p++].charCodeAt(0));
			}
			var vlen = stringarray[p++].charCodeAt(0);
			if(vlen >= 128){
				vlen = (nlen & 0x7F << 24);
				vlen |= (stringarray[p++].charCodeAt(0) << 16);
				vlen |= (stringarray[p++].charCodeAt(0) << 8);
				vlen |= (stringarray[p++].charCodeAt(0));
			}
			array[(data.substr(p,nlen))] = data.substr(p+nlen, vlen);
			p = p+nlen+vlen;
		}
		return array;
	},
	
	decodePacketHeader: function(data){
		var ret = [];
		var stringarray = data.split("");
		ret['version'] = splitarray[0].charCodeAt(0);
		ret['type'] = splitarray[1].charCodeAt(0);
		ret['requestId'] = (splitarray[2].charCodeAt(0) << 8)+splitarray[3].charCodeAt(0);
		ret['contentLength'] = (splitarray[4].charCodeAt(0) << 8)+splitarray[5].charCodeAt(0);
		ret['paddingLength'] = splitarray[6].charCodeAt(0);
		ret['reserved'] = splitarray[7].charCodeAt(0);
		return ret;
	},
	
	getValues: function(requestedInfo){
	},
	
	request: function(params, stdin){
		this.connect();
		var response = '';
		this.SOCK.on('data', function(data) {
			console.log("Data : "+data);
		});
		this.SOCK.on('error', function(err) {
			console.log(err);
		});
		this.SOCK.on('close', function() {
			console.log('Connection closed');
			fastwebcgi.connect();
		});
		var request = this.buildPacket(this.BEGIN_REQUEST, String.fromCharCode(0)+String.fromCharCode(this.RESPONDER)+String.fromCharCode(this.KEEPALIVE)+String.fromCharCode(0)+String.fromCharCode(0)+String.fromCharCode(0)+String.fromCharCode(0)+String.fromCharCode(0));
		
		var paramsRequest = '';
		// console.log(params);
		for (var key in params){
			if (params.hasOwnProperty(key)) {
				 paramsRequest = paramsRequest+this.buildNvpair(key, params[key]);
			}
		}
		
		if(paramsRequest != ''){
			request = request+this.buildPacket(this.PARAMS, paramsRequest);
		}
		request = request+this.buildPacket(this.PARAMS, '');
		
		if(stdin){
			request = request+this.buildPacket(this.STDIN, stdin);
		}
		request = request+this.buildPacket(this.STDIN, '');
		// console.log(request);
		this.SOCK.write(request);
	}
}
fastwebcgi.setHost('127.0.0.1');
fastwebcgi.setPort(9000);
fastwebcgi.setKeepAlive(false);
var test = [];
test['GATEWAY_INTERFACE'] = 'FastCGI/1.0';
test['REQUEST_METHOD'] = 'GET';
test['SCRIPT_FILENAME'] = './/test.php';
test['SCRIPT_NAME'] = '/test.php';
test['QUERY_STRING'] = './/test.php';
test['REQUEST_URI'] = 'http://localhost/test.php';
test['DOCUMENT_URI'] = '/test.php';
test['SERVER_SOFTWARE'] = 'php/fcgiclient';
test['REMOTE_ADDR'] = '127.0.0.1';
test['REMOTE_PORT'] = '9985';
test['SERVER_ADDR'] = '127.0.0.1';
test['SERVER_PORT'] = '9985';
test['SERVER_NAME'] = 'localhost';
test['SERVER_PROTOCOL'] = 'HTTP/1.1';
test['CONTENT_TYPE'] = '';
test['CONTENT_LENGTH'] = 0;
fastwebcgi.request(test,false);