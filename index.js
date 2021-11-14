const { createServer } = require("http");
const { Server } = require("socket.io");
let mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'mysql.fabiandingemans.nl',
    user            : 'InsaneEditor',
    password        : '4vgr7mvEry5kZPfZ',
    database        : 'InsaneEditor'
});

//CONFIGS
const webSocketPort = process.env.PORT || 3000;
//const regionName = process.env.HEROKU_APP_NAME.replace("insaneeditor-", "");
const regionName = "eu1";

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const connectedClients = {};


io.on("connection", (socket) => {
    if(socket.handshake.auth.type != null){
        if(socket.handshake.auth.type === "client"){
            let clientToken = socket.handshake.auth.token;
            if(clientToken != null && clientToken !== ""){
                pool.query("SELECT * FROM `users` WHERE `WebSocketKey`='"+clientToken+"'; ", (error, results, fields) => {
                    if (error) throw error;
                    let user = results[0];
                    let serverGroupId = socket.handshake.auth.serverGroupId;

                    if(user != null && serverGroupId != null && serverGroupId !== ""){
                        pool.query("SELECT * FROM `server_groups` WHERE `id`='"+serverGroupId+"' AND `owner_id`='"+user.id+"'; ", (error, results, fields) => {
                            if (error) throw error;
                            let group = results[0];

                            if(group != null){
                                let roomName = group.id+"-"+group.name+"-"+group.owner_id;
                                socket.join(roomName);
                                socket.send('{"status":"success", "message": "Joined room '+roomName+'"}');
                            }else{
                                socket.send('{"status":"error", "message": "Could not join room"}');
                            }
                        });

                        socket.send('{"status":"success", "message": "Successfully logged into the InsaneEditor backend as client!"}');
                    }else{
                        socket.send('{"status":"error", "message": "Unauthorized"}');
                        socket.disconnect();
                    }
                });
            }else{
                socket.send('{"status":"error", "message": "Unauthorized"}');
                socket.disconnect();
            }
        }else if(socket.handshake.auth.type === "server"){
            if(socket.handshake.auth.token == null){
                socket.send('{"status":"error", "message": "Unauthorized"}');
                socket.disconnect();
            }else{
                let clientId = socket.id
                let clientToken = socket.handshake.auth.token;

                pool.query("SELECT * FROM `servers` WHERE `authKey`='"+clientToken+"'; ", (error, results, fields) => {
                    if (error) throw error;
                    let rowCount = results.length;
                    if(rowCount > 0){
                        let server = results[0];

                        let currentTime = Math.floor(new Date().getTime() / 1000);
                        pool.query("UPDATE `servers` SET `socketClientId`='"+clientId+"', `regionName`='"+regionName+"', `lastConnected`='"+currentTime+"' WHERE `authKey`='"+clientToken+"'; ", (error, results, fields) => {
                            if (error) throw error;
                        });

                        pool.query("SELECT * FROM `server_groups` WHERE `id`='"+server.server_group_id+"'; ", (error, results, fields) => {
                            if (error) throw error;
                            let group = results[0];

                            let roomName = group.id+"-"+group.name+"-"+group.owner_id;
                            socket.join(roomName);
                            socket.send('{"status":"success", "message": "Joined room '+roomName+'"}');
                        });

                        socket.broadcast.emit("message", '{"status":"warning", "message": "Server '+server.name+' connected"}');
                        socket.send('{"status":"success", "message": "Successfully logged into the InsaneEditor backend as a server!", "serverName": "'+server.name+'"}');

                        connectedClients[clientId] = socket;
                    }else{
                        socket.send('{"status":"error", "message": "Unauthorized"}');
                        socket.disconnect();
                    }
                });
            }
        }else{
            socket.send('{"status":"error", "message": "Unauthorized"}');
            socket.disconnect();
        }
    }else{
        socket.send('{"status":"error", "message": "Unauthorized"}');
        socket.disconnect();
    }

    //event for client/mcServer to child
    socket.on("serversend", (data) => {
        socket.broadcast.emit("serverreceive", data);
    });

    socket.on("disconnect", (data) => {
        let clientId = socket.id
        let clientToken = socket.handshake.auth.token;

        if(socket.handshake.auth.type === "server"){
            pool.query("SELECT * FROM `servers` WHERE `authKey`='"+clientToken+"'; ", (error, results, fields) => {
                if (error) throw error;
                let rowCount = results.length;
                if(rowCount > 0){
                    let server = results[0];

                    socket.broadcast.emit("message", '{"status":"warning", "message": "Server '+server.name+' disconnected"}');
                    pool.query("UPDATE `servers` SET `socketClientId`=NULL, `regionName`=NULL WHERE `id`='"+server.id+"'; ", (error, results, fields) => {
                        if (error) throw error;
                    });
                }
            });
        }

        delete connectedClients[clientId];
    });
});

console.log("Socket IO listening on port "+webSocketPort)
httpServer.listen(webSocketPort);