let mysql = require('mysql');
const http = require('http');
const { Server } = require("socket.io");

const pool  = mysql.createPool({
    connectionLimit : 10,
    connectTimeout  : 60 * 60 * 1000,
    aquireTimeout   : 60 * 60 * 1000,
    timeout         : 60 * 60 * 1000,
    host            : process.env.SQL_HOST ?? 'mysql.fabiandingemans.nl',
    user            : process.env.SQL_USER ?? 'insane_main',
    password        : process.env.SQL_PASS ?? 'sZ4sKckpwG12',
    database        : process.env.SQL_DB ?? 'insane_main'
});

//CONFIGS
const webSocketPort = 1609;

//const regionName = process.env.REGION;
const regionName = "eu";
const connectedClients = {};

const httpServer = http.createServer({}, requestHandler);

function requestHandler(req, res){
    res.writeHead(405, { 'Content-Type': 'text/html' });
    res.write("<h1>Method Not Allowed</h1>");
    res.write("<p>A request method is not supported for the requested resource</p>");
    res.end();
}

const io = new Server({
    cors: {
        origin: "*"
    },
    secure: true
});
io.attach(httpServer);

io.on("connection", (socket) => {
    if(socket.handshake.auth.type != null){
        if(socket.handshake.auth.type === "client"){
            let clientToken = socket.handshake.auth.token;
            if(clientToken != null && clientToken !== ""){
                pool.query("SELECT * FROM `users` WHERE `websocket_key`=?;", [
                    clientToken
                ], (error, results, fields) => {
                    if (error) throw error;
                    let user = results[0];
                    let serverGroupId = socket.handshake.auth.serverGroupId;

                    if(user != null && serverGroupId != null && serverGroupId !== ""){
                        pool.query("SELECT * FROM `server_groups` WHERE `id`=? AND `user_id`=?; ", [
                            serverGroupId,
                            user.id
                        ], (error, results, fields) => {
                            if (error) throw error;
                            let group = results[0];

                            if(group != null){
                                let roomName = group.id+"-"+group.name+"-"+group.user_id;
                                socket.join(roomName);
                                socket.send(JSON.stringify({
                                    "status":"success",
                                    "message": "Joined room '+roomName+'"
                                }));
                            }else{
                                socket.send(JSON.stringify({
                                    "status":"error",
                                    "message": "Could not join room"
                                }));
                            }
                        });

                        socket.send(JSON.stringify({
                            "status":"success",
                            "message": "Successfully logged into the InsaneEditor backend as client!"
                        }));
                    }else{
                        socket.send(JSON.stringify({
                            "status":"error",
                            "message": "Unauthorized"
                        }));
                        socket.disconnect();
                    }
                });
            }else{
                socket.send(JSON.stringify({
                    "status":"error",
                    "message": "Unauthorized"
                }));
                socket.disconnect();
            }
        }else if(socket.handshake.auth.type === "server"){
            if(socket.handshake.auth.token == null){
                socket.send(JSON.stringify({
                    "status":"error",
                    "message": "Unauthorized"
                }));
                socket.disconnect();
            }else{
                let clientId = socket.id
                let clientToken = socket.handshake.auth.token;

                pool.query("SELECT * FROM `servers` WHERE `auth_token`=?;", [
                    clientToken
                ], (error, results, fields) => {
                    if (error) throw error;
                    let rowCount = results.length;
                    if(rowCount > 0){
                        let server = results[0];

                        let currentTime = Math.floor(new Date().getTime() / 1000);
                        pool.query("UPDATE `servers` SET `websocket_clientid`=?, `websocket_region`=?, `websocket_lastconnected`=? WHERE `auth_token`=?;",[
                            clientId,
                            regionName,
                            currentTime,
                            clientToken
                        ], (error, results, fields) => {
                            if (error) throw error;
                        });

                        pool.query("SELECT * FROM `server_groups` WHERE `id`=?; ", [
                            server.group_id
                        ], (error, results, fields) => {
                            if (error) throw error;
                            let group = results[0];

                            let roomName = group.id+"-"+group.name+"-"+group.owner_id;
                            socket.join(roomName);
                            socket.send(JSON.stringify({
                                "status":"success",
                                "message": "Joined room "+roomName
                            }));
                        });

                        socket.broadcast.emit("message", JSON.stringify({
                            "status":"warning",
                            "message": "Server "+server.name+" connected"
                        }));
                        socket.send(JSON.stringify({
                            "status":"success",
                            "message": "Successfully logged into the InsaneEditor backend as a server!",
                            "serverName": server.name
                        }));

                        connectedClients[clientId] = socket;
                    }else{
                        socket.send(JSON.stringify({
                            "status":"error",
                            "message": "Unauthorized"
                        }));
                        socket.disconnect();
                    }
                });
            }
        }else{
            socket.send(JSON.stringify({
                "status":"error",
                "message": "Unauthorized"
            }));
            socket.disconnect();
        }
    }else{
        socket.send(JSON.stringify({
            "status":"error",
            "message": "Unauthorized"
        }));
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
            pool.query("SELECT * FROM `servers` WHERE `auth_token`=?; ", [
                clientToken
            ], (error, results, fields) => {
                if (error) throw error;
                let rowCount = results.length;
                if(rowCount > 0){
                    let server = results[0];

                    socket.broadcast.emit("message", JSON.stringify({
                        "status":"warning",
                        "message": "Server "+server.name+" disconnected"
                    }));
                    pool.query("UPDATE `servers` SET `websocket_clientid`=?, `websocket_region`=? WHERE `id`=?;", [
                        null,
                        null,
                        server.id
                    ], (error, results, fields) => {
                        if (error) throw error;
                    });
                }
            });
        }

        delete connectedClients[clientId];
    });
});

httpServer.listen(webSocketPort, () => {
    console.log("http server listening on port "+webSocketPort);
});