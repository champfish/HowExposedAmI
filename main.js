const key = 'INSERTKEYHERE';
const port = 80;
const format = "YYYY-MM-DD";
const staticPath = '/web/';
var cutoff = 262*5;
var tail = 0;


var tick = [];

const unirest = require('unirest');
const fs = require('fs');
var moment = require('moment-business-days');

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/web/index.html');
});

app.get('/socket.io.min.js', (req, res) => {
	res.sendFile(__dirname + '/web/socket.io.min.js');
});

app.get('/socket.io.min.js.map', (req, res) => {
	res.sendFile(__dirname + '/web/socket.io.min.js.map');
});

app.get('/web.js', (req, res) => {
	res.sendFile(__dirname + '/web/web.js');
});


http.listen(port, () => {
	console.log('listening on *:'+port);
});


io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('disconnect', () => {
		console.log('user disconnected');
	});
	socket.on('nowPrice', (ticker,callback) => {
		getSymbol(ticker,function(back){
			var price = getNowPrice(back);
			callback(price);
		});
	});
	socket.on('correlation', (stocks,callback) => {
		correlationGen(stocks,function(back){
			callback(back);
		});
	});
});

async function correlationGen(stocks,callback){
	var syms = {};

	var keys = Object.keys(stocks);
	var N = keys.length;
	
	var delta = new Array(N); 
	for (var i = 0; i < delta.length; i++) { 
		delta[i] = new Array(cutoff); 
	}

	var close = new Array(N); 
	for (var i = 0; i < close.length; i++) { 
		close[i] = new Array(N); 
	}

	var corr = new Array(N); 
	for (var i = 0; i < corr.length; i++) { 
		corr[i] = new Array(N); 
	} 

	for(var k = 0; k<N; k++){
		var key = keys[k];	
		getSymbol(key, function(sym){
			var date = moment().prevBusinessDay();
			var todayPrice = getPrice(sym,date);
			for(var d=0; d<cutoff; d++){
				close[k][d]=todayPrice;
				var yestPrice = -1;
				while(yestPrice==-1){
					date = date.prevBusinessDay();
					yestPrice = getPrice(sym,date);
				}
				delta[k][d]= (todayPrice-yestPrice)/todayPrice;
				todayPrice=yestPrice;
			}
		});
	}

		//The effect of a ON b
		for(var a=0; a<N;a++){
			for(var b=0; b<N;b++){
				var diff = 0;
				for(var d=0; d<delta[a].length;d++){
					var instaDiff=0;
					instaDiff += delta[a][d]*delta[b][d];

					// if(d>tail-1 && d<delta[a].length-tail-1){
					// 	for(var t=-tail; t<=tail; t++){
					// 		instaDiff += delta[a][d]*((close[b][d]-close[b][d+t+1])/close[b][d]) * gauss(t,tail);
					// 	}
					// }else{
					// 	instaDiff += delta[a][d]*delta[b][d];
					// }
					if(delta[a][d]!=0){
						diff+=instaDiff/(delta[a][d]*delta[a][d])*diminish(d,cutoff);
					}
				}
				console.log(a+' '+b+' '+diff);
				corr[a][b]=diff;
			}
		}
		callback(corr);
	}

	function diminish(d,cutoff){
		return 1/cutoff;
		return (3.0/2)*Math.pow(cutoff,-(3.0/2))*Math.sqrt(-d+cutoff);
	}

	function gauss(t,tail){
		var tt = Math.abs(t);
		if(tt==0){
			return 1;
		}else{
			return 0;
		}
	// 	switch(tt){
	// 		case 0:
	// 		return 0.3829;
	// 		break;

	// 		case 1:
	// 		return 0.2417;
	// 		break;

	// 	// abote 1.5 with mean 0 st 1.
	// 	case 2:
	// 	default:
	// 	return 0.06685;
	// }
}

function getNowPrice(sym){
	var date = moment().prevBusinessDay();
	return getPrice(sym,date);
}

function getPrice(sym,date){
	if(sym["Time Series (Daily)"][date.format(format)]==null){
		return -1;
	}
	var price = sym["Time Series (Daily)"][date.format(format)]['4. close'];
	return price;
}


function getSymbol(symbol,callback){
	if(tick[symbol]!=null){
		callback(tick[symbol]);
	}else{
		readSymbol(symbol, function(back){
			callback(back);
		});
	}
}

function readSymbol(symbol,callback){
	console.log('READ');
	fs.readFile('stocks/'+symbol+'.json', (err, data) => {
		if (err) {
			saveSymbol(symbol, function(back){
				tick[symbol]=back;
				callback(back);						
			});
		}else{
			let sym = JSON.parse(data);
			tick[symbol]=sym;
			callback(sym);
		}
	});
}

function saveSymbol(symbol,callback){
	var req = unirest("GET", "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol="+symbol+"&outputsize=full&apikey="+key);

	req.headers({
		'Accept': 'application/json', 
		'Content-Type': 'application/json'
	})

	req.end(function (res) {
		if (res.error){ 
			throw new Error(res.error) 
		}else{
			fName = 'stocks/'+symbol+'.json';
			console.log(fName+' written.');
			fs.writeFileSync('stocks/'+symbol+'.json',JSON.stringify(res.body));
			callback(res.body);
		}
	});
}	

getSymbol("SPY",function(){});
getSymbol("VTHR",function(){});