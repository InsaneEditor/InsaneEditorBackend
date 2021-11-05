const io = require("socket.io-client");

const socket = io("ws://10.1.12.57:5040");

socket.on("connect", () => {
    console.log("Connected to master");
});

socket.on("disconnect", () => {
    console.log("Disconnected from master");
});

socket.on("message", (data) => {
    console.log("message from master: "+data);
});

exports.masterSocket = socket;