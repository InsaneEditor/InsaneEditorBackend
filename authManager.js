const { clientExists } = require("./mysqlManager");

const authenticate = (socket) => {
    if(socket.handshake.auth.type != null){
        if(socket.handshake.auth.type == "client"){
            socket.send('{"status":"success", "message": "Successfully logged into the InsaneEditor backend!"}');
            return true;
        }else if(socket.handshake.auth.type == "server"){
            if(socket.handshake.auth.token == null){
                socket.send('{"status":"error", "message": "Unauthorized"}');
                socket.disconnect();
                return false;
            }else{
                let token = socket.handshake.auth.token;
                if(clientExists(token)){
                    socket.send('{"status":"success", "message": "Successfully logged into the InsaneEditor backend!"}');
                    return true;
                }else{
                    socket.send('{"status":"error", "message": "Unauthorized"}');
                    socket.disconnect();
                    return false;
                }
            }
        }else{
            socket.send('{"status":"error", "message": "Unauthorized"}');
            socket.disconnect();
            return false;
        }
    }else{
        socket.send('{"status":"error", "message": "Unauthorized"}');
        socket.disconnect();
        return false;
    }
}

exports.authenticate = authenticate;