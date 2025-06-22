const express = require('express');
const { Server } = require('socket.io');
const { PeerServer } = require('peer');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();

// Configurer le serveur HTTPS avec les certificats locaux
const server = https.createServer({
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
}, app);

// Initialiser Socket.IO
const io = new Server(server);

// Servir les fichiers statiques (index.html, styles.css, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configurer le serveur PeerJS pour la signalisation
const peerServer = PeerServer({
  port: 9000,
  path: '/webrtc-app',
  ssl: {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
  }
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Nouvelle connexion Socket.IO:', socket.id);

  // Lorsqu'un utilisateur rejoint une room
  socket.on('join-room', (roomId, userId) => {
    console.log(`Utilisateur ${userId} a rejoint la room ${roomId}`);
    socket.join(roomId);
    // Informer les autres utilisateurs de la room
    socket.to(roomId).emit('user-connected', userId);

    // Gérer les messages de chat
    socket.on('chat-message', (message, userId) => {
      console.log(`Message de ${userId} dans ${roomId}: ${message}`);
      io.to(roomId).emit('chat-message', { message, userId });
    });

    // Lorsqu'un utilisateur se déconnecte
    socket.on('disconnect', () => {
      console.log(`Utilisateur ${userId} a quitté la room ${roomId}`);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

// Démarrer le serveur HTTPS
server.listen(3000, () => {
  console.log('Serveur démarré sur https://localhost:3000');
});
