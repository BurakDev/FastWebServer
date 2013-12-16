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
		
		return nvpair+name+value;
	},
	
	readNvpair: function(data, length){
	}
}
fastwebcgi.setHost('127.0.0.1');
fastwebcgi.setPort(9000);
fastwebcgi.setKeepAlive(false);