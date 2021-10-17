const { createServer } = require("http");
const { Server } = require("socket.io");
// const { clientConnect, clientDisconnect } = require("managers/masterManager");
//const { authenticate } = require("managers/authManager");

const httpServer = createServer();
const io = new Server(httpServer);
const connectedClients = {};

//CONFIGS
const webSocketPort = 3000;

io.on("connection", (socket) => {
    //if (!authenticate(socket)) return;

    console.info(`Client connected [id=${socket.id}]`);
    connectedClients[socket.id] = socket;

    if(socket.handshake.headers != null){
        socket.join(socket.handshake.headers.room);
        socket.send("joined room "+socket.handshake.headers.room);
        console.log(socket.id+" joined room "+socket.handshake.headers.room);
    }

    socket.on("message", (data) => {
        console.log("msg: "+data);
    });

});

io.on("disconnect", (socket) => {
    delete connectedClients[socket.id];
});

app.get('/:client/:message', function (req, res) {
    if (connectedClients[req.params.client] != null){
        connectedClients[req.params.client].send(req.params.message);
        res.send(req.params.message+" send to "+req.params.client);
    }else{
        res.send('Could not find client with id: '+req.params.client)
    }
});

console.log("Socket IO listening on port "+webSocketPort)
httpServer.listen(webSocketPort);