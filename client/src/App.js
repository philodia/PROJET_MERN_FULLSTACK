// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import AppRoutes from './router';
import { getSocket, subscribeToEvent } from './app/socket';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Optionnel : import global de vos styles
// import './assets/scss/global.scss'; // ou './index.css'

function App() {
  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.warn('Socket non initialisé.');
      return;
    }

    // Exemple : abonnement à un événement personnalisé
    const unsubscribeNotification = subscribeToEvent('global_notification', (data) => {
      console.log('Notification globale reçue :', data);
      // TODO : afficher une notification (ex: toast) ici
    });

    // Nettoyage lors du démontage
    return () => {
      unsubscribeNotification();
      // socket.disconnect(); // décommente si tu veux couper la connexion à la sortie
    };
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </Router>
    </Provider>
  );
}

export default App;
