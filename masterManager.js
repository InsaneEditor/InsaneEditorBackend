const io = require("socket.io-client");

const socket = io("ws://localhost:3000", {
    auth: {
        token: "1234"
    }
});