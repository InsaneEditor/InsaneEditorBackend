const { createServer } = require("http");
const { Server } = require("socket.io");
const { } = require("./masterManager");
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

    //TODO do group name
    let roomName = "dbGroupName+dbGroupId";
    socket.join(roomName);
    console.log('Client ['+clientId+'] joined '+roomName);

    //event for client/mcServer to child
    socket.on("serversend", (data) => {
        socket.broadcast.emit("serverreceive", data);
    });

    //event for client/mcServer to child
    socket.on("childmsg", (data) => {
        console.log("childmsg: "+data);
    });

    //event for master to child
    socket.on("mastermsg", (data) => {
        console.log("mastermsg: "+data);
    });

});

io.on("disconnect", (socket) => {
    let clientId = socket.id
    let clientToken = socket.handshake.auth.token;

    deleteClient(clientToken);
    delete connectedClients[clientId];
});

console.log("Socket IO listening on port "+webSocketPort)
httpServer.listen(webSocketPort);