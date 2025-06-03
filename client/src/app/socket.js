// frontend/src/app/socket.js (ou un hook personnalisé useSocket)
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'; // Assurez-vous que le port est correct

// Optionnel: Si vous utilisez l'authentification socket
// const token = localStorage.getItem('authToken'); // Ou récupéré depuis Redux/Context

export const socket = io(SOCKET_URL, {
  // autoConnect: false, // Si vous voulez contrôler la connexion manuellement
  // auth: { // Si vous utilisez le middleware d'authentification socket
  //   token: token
  // }
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server:', socket.id);
  // Si vous gérez l'identification utilisateur côté serveur
  // const userId = getCurrentUserId(); // Fonction pour obtenir l'ID de l'utilisateur connecté
  // if (userId) {
  //   socket.emit('identify_user', userId);
  // }
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from Socket.IO server:', reason);
});

socket.on('connect_error', (err) => {
  console.error('Socket.IO connection error:', err.message);
});

// Exemple d'écoute d'un événement
socket.on('server_response', (data) => {
  console.log('Server response:', data);
});

socket.on('user_identified', (data) => {
  console.log('User identified on socket:', data);
});

// Vous pouvez exporter des fonctions pour émettre des événements depuis vos composants React
export const sendMessageToServer = (messageData) => {
  socket.emit('client_message', messageData);
};