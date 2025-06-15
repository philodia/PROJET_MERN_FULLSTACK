// frontend/src/app/socket.js (ou services/socketService.js)
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/constants'; // Assurez-vous que le chemin est correct
// Pour accéder au store Redux, il faut l'importer. Attention aux dépendances circulaires.
// Il est parfois préférable de passer le token en argument à connectSocket.
// import { store } from './store'; // Adapter le chemin vers votre store

let socket = null; // Instance du socket, initialisée à null

const defaultSocketOptions = {
  autoConnect: false, // Connexion manuelle
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  // withCredentials: true, // Si authentification par cookies HTTP Only cross-origin
  // transports: ['websocket'], // Forcer websocket si des problèmes avec long-polling
};

/**
 * Initialise et retourne l'instance du socket.
 * Si le socket existe déjà, retourne l'instance existante.
 * @param {object} [options] - Options de configuration pour Socket.IO client.
 * @returns {Socket} L'instance du client Socket.IO.
 */
const initializeSocket = (options = {}) => {
  if (!socket) {
    console.log('[SocketIO] Initialisation du socket...');
    socket = io(SOCKET_URL, { ...defaultSocketOptions, ...options });

    socket.on('connect', () => {
      console.log('[SocketIO] Connecté au serveur. ID:', socket.id);
      // Vous pourriez vouloir émettre un événement ici pour dire que le client est prêt
      // socket.emit('client_ready', { userId: store.getState().auth.user?._id });
    });

    socket.on('disconnect', (reason) => {
      console.warn('[SocketIO] Déconnecté du serveur. Raison:', reason);
      if (reason === 'io server disconnect') {
        // Le serveur a déconnecté le client de force, il ne tentera pas de se reconnecter
        // Vous pourriez vouloir tenter une reconnexion manuelle après un délai ou informer l'utilisateur
      }
      // Sinon, le client tentera de se reconnecter automatiquement (si `reconnection: true`)
    });

    socket.on('connect_error', (error) => {
      console.error('[SocketIO] Erreur de connexion:', error.message, error.data || '');
      // error.data peut contenir des détails de l'erreur du serveur (ex: token invalide)
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[SocketIO] Tentative de reconnexion #${attemptNumber}...`);
    });

    socket.on('reconnect_failed', () => {
      console.error('[SocketIO] Échec de toutes les tentatives de reconnexion.');
      // Informer l'utilisateur qu'il est déconnecté de manière persistante
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[SocketIO] Reconnecté avec succès après ${attemptNumber} tentatives.`);
    });

    // Événement d'erreur général
    socket.on('error', (error) => {
        console.error('[SocketIO] Erreur générale du socket:', error);
    });

  }
  return socket;
};

/**
 * Connecte le socket au serveur.
 * @param {string} [authToken] - Le token JWT à utiliser pour l'authentification (optionnel).
 *                               Si fourni, sera ajouté à `socket.auth`.
 */
export const connectSocket = (authToken) => {
  // Assurer l'initialisation si ce n'est pas déjà fait
  const currentSocket = initializeSocket();

  if (currentSocket && !currentSocket.connected) {
    if (authToken) {
      // Mettre à jour les options d'authentification avant de connecter
      currentSocket.auth = { token: `Bearer ${authToken}` }; // Ou juste `token: authToken` selon le backend
      console.log('[SocketIO] Tentative de connexion avec token d\'authentification.');
    } else {
      // S'assurer que les anciennes options d'auth sont effacées si pas de token
      currentSocket.auth = {};
      console.log('[SocketIO] Tentative de connexion sans token d\'authentification.');
    }
    currentSocket.connect();
  } else if (currentSocket && currentSocket.connected) {
    console.log('[SocketIO] Déjà connecté.');
  }
};

/**
 * Déconnecte le socket du serveur.
 */
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    console.log('[SocketIO] Déconnexion manuelle du socket.');
    socket.disconnect();
  }
  // Optionnel: Réinitialiser la variable socket à null pour forcer une nouvelle initialisation au prochain getSocket/connectSocket
  // Cela ré-attachera les listeners 'connect', 'disconnect', etc.
  // socket = null;
};

/**
 * Retourne l'instance du socket. Initialise si nécessaire (sans options d'auth par défaut).
 * Préférer appeler connectSocket() explicitement pour gérer l'authentification.
 * @returns {Socket | null} L'instance du socket ou null si non initialisé.
 */
export const getSocketInstance = () => {
  return socket ? socket : initializeSocket(); // Initialise avec options par défaut si appelé avant connectSocket
};


/**
 * S'abonne à un événement du serveur.
 * @param {string} eventName - Le nom de l'événement.
 * @param {function} callback - La fonction à exécuter lorsque l'événement est reçu.
 * @returns {function} Une fonction pour se désabonner de l'événement.
 */
export const subscribeToEvent = (eventName, callback) => {
  const currentSocket = getSocketInstance(); // Utiliser getSocketInstance pour s'assurer qu'il est initialisé
  if (!currentSocket) {
    console.warn(`[SocketIO] Tentative de s'abonner à '${eventName}' mais le socket n'est pas initialisé.`);
    return () => {}; // Retourner une fonction no-op
  }

  console.log(`[SocketIO] Abonnement à l'événement: ${eventName}`);
  currentSocket.on(eventName, callback);

  // Retourner une fonction de désabonnement
  return () => {
    console.log(`[SocketIO] Désabonnement de l'événement: ${eventName}`);
    currentSocket.off(eventName, callback);
  };
};

/**
 * Émet un événement vers le serveur.
 * @param {string} eventName - Le nom de l'événement.
 * @param {any} data - Les données à envoyer avec l'événement.
 * @param {function} [ackCallback] - Callback optionnel d'accusé de réception.
 *                                   Sera appelé avec la réponse du serveur (ex: ackCallback(response)).
 */
export const emitEvent = (eventName, data, ackCallback) => {
  const currentSocket = getSocketInstance();
  if (!currentSocket || !currentSocket.connected) {
    console.warn(`[SocketIO] Tentative d'émettre '${eventName}' mais le socket n'est pas connecté.`);
    // Optionnel: mettre l'événement en file d'attente si le socket n'est pas encore connecté
    // ou retourner une indication d'échec.
    if (ackCallback) ackCallback({ error: "Socket non connecté" });
    return;
  }

  if (ackCallback && typeof ackCallback === 'function') {
    currentSocket.emit(eventName, data, ackCallback);
  } else {
    currentSocket.emit(eventName, data);
  }
  console.log(`[SocketIO] Émission de l'événement: ${eventName}`, data);
};

// Optionnel: Exporter une instance unique ou les fonctions individuellement.
// Pour une approche plus orientée service, on pourrait avoir un objet.
// export default {
//   initializeSocket,
//   connectSocket,
//   disconnectSocket,
//   getSocketInstance,
//   subscribeToEvent,
//   emitEvent,
// };