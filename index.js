const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = 3000;

const { build_io } = require("./routing");
const { ServerData } = require("./server_data");

app.use(express.static("www"));

app.get("/", (req, res) => {
    res.sendFile("www/index.html");
});

http.listen(port, () => {
    data = new ServerData();
    // Read files
    build_io(data, io);
    
    console.log("Listening...");
});
