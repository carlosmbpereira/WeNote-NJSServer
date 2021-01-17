const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {transports: ['polling', 'websocket']});
const port = 7501;

const { build_io } = require("./routing");
const { ServerData } = require("./server_data");

app.use(express.static("www"));

app.get("/", (req, res) => {
    res.sendFile("www/index.html");
});

http.listen(port, () => {
    data = new ServerData();
    data.load();

    // Read files
    build_io(data, io);
    
    console.log("Listening...");
});
