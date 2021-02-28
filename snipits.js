// var server = http.createServer(function (req, res) {
// 	switch(req.url){
// 		case '/':
// 		fs.readFile(__dirname + staticPath+ 'index.html', function (err,data) {
// 			if (err) {
// 				res.writeHead(404);
// 				res.end(JSON.stringify(err));
// 				return;
// 			}
// 			res.writeHead(200);
// 			res.end(data);
// 		});
// 		break;
// 		default:
// 		fs.readFile(__dirname + staticPath + req.url, function (err,data) {
// 			if (err) {
// 				res.writeHead(404);
// 				res.end(JSON.stringify(err));
// 				return;
// 			}
// 			res.writeHead(200);
// 			res.end(data);
// 		});
// 	}
// }).listen(port);