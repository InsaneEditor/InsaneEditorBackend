const { createServer } = require("http");
const { Server } = require("socket.io");
const { saveClient, deleteClient, getClient } = require('./mysqlManager');
const { authenticate } = require('./authManager');

const httpServer = createServer();
const io = new Server(httpServer);
const connectedClients = {};

//CONFIGS
const webSocketPort = process.env.PORT || 3000;

io.on("connection", (socket) => {
    if (!authenticate(socket)) return;
    let clientId = socket.id
    let clientToken = socket.handshake.auth.token;

    console.log('Client connected ['+clientId+']');

    saveClient(clientToken, clientId);
    connectedClients[clientId] = socket;
    masterManager.masterSocket.send("client connected");

    //TODO do group name
    let roomName = "dbGroupName+dbGroupId";
    socket.join(roomName);
    console.log('Client ['+clientId+'] joined '+roomName);

    //event for client/mcServer to child
    socket.on("serversend", (data) => {
        socket.broadcast.emit("serverreceive", data);
    });
});

io.on("disconnect", (socket) => {
    let clientId = socket.id
    let clientToken = socket.handshake.auth.token;
    masterManager.masterSocket.send("client disconnected");

    deleteClient(clientToken);
    delete connectedClients[clientId];
});

console.log("Socket IO listening on port "+webSocketPort)
httpServer.listen(webSocketPort);