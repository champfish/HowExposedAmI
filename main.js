const key = '7RW7EEYD8GAPT3GZ';
const port = 80;
const format = "YYYY-MM-DD";
const staticPath = '/web/';
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
});

function getNowPrice(sym){
	var date = moment().prevBusinessDay();
	//console.log(sym["Time Series (Daily)"][date.format(format)]);
	var price = sym["Time Series (Daily)"][date.format(format)]['4. close'];
	console.log(price);
	return price;
}


function getSymbol(symbol,callback){
	console.log(symbol);
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
