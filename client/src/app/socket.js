import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants'; // Ex: 'http://localhost:5000'

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // autoConnect: false, // si vous voulez vous connecter manuellement
      // withCredentials: true, // si vous utilisez des cookies pour l'auth socket
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }
  return socket;
};

// Fonctions pour s'abonner/émettre des événements
export const subscribeToEvent = (eventName, callback) => {
  const currentSocket = getSocket();
  currentSocket.on(eventName, callback);
  // Retourner une fonction de désabonnement
  return () => currentSocket.off(eventName, callback);
};

export const emitEvent = (eventName, data) => {
  const currentSocket = getSocket();
  currentSocket.emit(eventName, data);
};