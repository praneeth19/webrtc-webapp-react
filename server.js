const express = require('express');

//var io = require('socket.io')(8081);

var io = require('socket.io')({
  path: '/webrtc-webapp-react',
});

const app = express();
const port = 8080;

// app.get('/', (req, res) => {
//   res.send('Hello server world..!!');
// });

app.use(express.static(__dirname + '/build'));
app.get('/', (req, res, next) => {
  res.sendfile(__dirname + '/build/index.html');
});

const server = app.listen(port, () => console.log('example app on port 8080'));

io.listen(server);
// name spaces -> tutorials  point
const peers = io.of('/webrtcPeer');

//keep a reference of all socket connecions
let connectedPeers = new Map();

peers.on('connection', (socket) => {
  console.log('in new socket connection', socket.id);
  socket.emit('connection-success', { success: socket.id });

  connectedPeers.set(socket.id, socket);

  socket.on('disconnect', () => {
    console.log('disconnected');
    connectedPeers.delete(socket.id);
  });

  socket.on('offerOrAnswer', (data) => {
    // send to other peers if any
    for (const [socketID, socket] of connectedPeers.entries()) {
      //dont send to self
      if (socketID !== data.socketID) {
        console.log('In offerOrAnswer:', socketID, data.payload.type);
        socket.emit('offerOrAnswer', data.payload);
      }
    }
  });

  socket.on('candidate', (data) => {
    // send cadidate to other peers
    for (const [socketID, socket] of connectedPeers.entries()) {
      // dont send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload);
        socket.emit('candidate', data.payload);
      }
    }
  });
});
