const authToken = "1234";

export function authenticate(socket){
    if(socket.handshake.auth.token == null){
        socket.send("Unauthorized");
        socket.disconnect();
        return false;
    }else{
        let token = socket.handshake.auth.token;
        if(token !== authToken){
            socket.send("Unauthorized");
            socket.disconnect();
            return false;
        }else{
            socket.send("Successfully logged into the InsaneEditor backend!");
            return true;
        }
    }
}