// gestion-commerciale-app/backend/config/socket.js

const { Server } = require('socket.io');
// const { verifySocketToken } = require('../middleware/auth.middleware'); // Optionnel: pour authentifier les connexions socket

let io; // Variable pour stocker l'instance du serveur Socket.IO

const connectedUsers = new Map(); // Pour suivre les utilisateurs connectés et leurs socket IDs

function initSocket(httpServer) {
  io = new Server(httpServer, {
    pingTimeout: 60000, // Temps avant de considérer une connexion comme perdue si pas de pong
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000', // L'URL de votre frontend
      methods: ['GET', 'POST'],
      credentials: true, // Important si vous gérez l'authentification via cookies/tokens
    },
  });

  console.log('Socket.IO server initialized');

  // Optionnel: Middleware d'authentification pour Socket.IO
  // io.use(async (socket, next) => {
  //   try {
  //     // Récupérer le token depuis les handshake headers ou query params
  //     const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  //     if (!token) {
  //       return next(new Error('Authentication error: No token provided'));
  //     }
  //     const user = await verifySocketToken(token); // Votre fonction de vérification de token JWT
  //     if (!user) {
  //       return next(new Error('Authentication error: Invalid token'));
  //     }
  //     socket.user = user; // Attacher l'objet utilisateur au socket pour un accès facile
  //     next();
  //   } catch (error) {
  //     console.error('Socket authentication error:', error.message);
  //     next(new Error('Authentication error'));
  //   }
  // });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    // console.log('Socket user (if authenticated):', socket.user); // Si l'authentification est activée

    // Gérer l'identification de l'utilisateur après connexion
    // Le client doit émettre cet événement avec son ID utilisateur après s'être connecté
    socket.on('identify_user', (userId) => {
      if (userId) {
        connectedUsers.set(userId.toString(), socket.id);
        console.log(`User ${userId} identified with socket ID ${socket.id}`);
        // Optionnel: Joindre l'utilisateur à une "room" basée sur son ID
        // Cela permet d'envoyer des messages ciblés à cet utilisateur spécifique
        socket.join(userId.toString());
        socket.emit('user_identified', { message: `Welcome user ${userId}` });
      }
    });

    // Exemple d'événement reçu du client
    socket.on('client_message', (data) => {
      console.log(`Message from client ${socket.id}:`, data);
      // Répondre au client qui a envoyé le message
      socket.emit('server_response', { message: 'Message received by server!' });
      // Envoyer un message à tous les clients connectés sauf l'émetteur
      // socket.broadcast.emit('new_broadcast_message', { senderId: socket.id, message: data.message });
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Retirer l'utilisateur de la liste des connectés s'il était identifié
      for (let [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} (socket ${socket.id}) removed from connected users.`);
          break;
        }
      }
    });

    // Autres événements spécifiques à votre application
    // Par exemple, pour les notifications de stock critique, nouvelles factures, etc.
    // socket.on('subscribe_to_stock_alerts', (productId) => {
    //   socket.join(`stock_alert_${productId}`);
    //   console.log(`Client ${socket.id} subscribed to stock alerts for product ${productId}`);
    // });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}

// Fonction pour émettre un événement à un utilisateur spécifique via son ID
function emitToUser(userId, eventName, data) {
  const ioInstance = getIO();
  const targetSocketId = connectedUsers.get(userId.toString());
  if (targetSocketId) {
    ioInstance.to(targetSocketId).emit(eventName, data);
    console.log(`Emitted event '${eventName}' to user ${userId} (socket ${targetSocketId})`);
  } else {
    // Alternative : utiliser les rooms si l'utilisateur a rejoint une room portant son ID
    ioInstance.to(userId.toString()).emit(eventName, data);
    console.log(`Attempted to emit event '${eventName}' to room/user ${userId}`);
    // console.warn(`User ${userId} not found or not connected for event '${eventName}'.`);
  }
}

// Fonction pour émettre un événement à tous les utilisateurs connectés
function broadcastEvent(eventName, data) {
  const ioInstance = getIO();
  ioInstance.emit(eventName, data);
  console.log(`Broadcasted event '${eventName}' to all connected clients.`);
}

// Fonction pour émettre un événement à tous les utilisateurs d'un rôle spécifique (nécessite de joindre les rooms par rôle)
// function emitToRole(role, eventName, data) {
//   const ioInstance = getIO();
//   ioInstance.to(`role_${role}`).emit(eventName, data); // Assurez-vous que les sockets joignent ces rooms
// }


module.exports = {
  initSocket,
  getIO,
  emitToUser,
  broadcastEvent,
  // emitToRole,
  connectedUsers // Exporter pour un accès éventuel (debugging, etc.)
};