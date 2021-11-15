var childProcess = require('child_process');
var args = process.argv.slice(2);

args.unshift(__dirname + '/../');

var socketIoProssess = childProcess.exec("npm start");

socketIoProssess.stdout.on('data', function(data) {
    console.log(data);
});