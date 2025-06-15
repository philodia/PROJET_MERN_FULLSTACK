// frontend/src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux'; // useSelector ajouté pour AppInitializer
import { store } from './app/store';
import AppRouter from './router';

// Thunks/Actions pour le chargement initial
import { loadUser, selectAuthToken, selectIsAuthenticated } from './features/auth/authSlice';
import { loadTheme, selectAppTheme } from './features/ui/uiSlice'; // selectAppTheme si vous liez le thème du toast

// Socket.IO
import { connectSocket, disconnectSocket /*, subscribeToEvent */ } from './app/socket'; // Ajustez le chemin

// Notifications Toast
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// CSS Globaux
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/scss/global.scss';

// ErrorBoundary (à créer dans components/common/ErrorBoundary.jsx)
import ErrorBoundary from './components/common/ErrorBoundary';


// Composant interne pour pouvoir utiliser les hooks Redux pour l'initialisation
const AppInitializer = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectAuthToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const appTheme = useSelector(selectAppTheme); // Pour le thème du ToastContainer

  // Effet pour les initialisations au chargement de l'application
  useEffect(() => {
    dispatch(loadUser()); // Tenter de charger l'utilisateur via token
    dispatch(loadTheme());  // Charger le thème persisté depuis localStorage
  }, [dispatch]);

  // Effet pour gérer la connexion Socket.IO basée sur l'état d'authentification
  useEffect(() => {
    if (isAuthenticated && token) {
      // console.log('[AppInit] Utilisateur authentifié, connexion au socket avec token...');
      connectSocket(token);
    } else if (!isAuthenticated && token === null) { // S'assurer que le token est explicitement null (après logout)
      // console.log('[AppInit] Utilisateur non authentifié ou déconnecté, déconnexion du socket...');
      disconnectSocket();
    }

    // Exemple d'abonnement à un événement socket global (décommentez et adaptez si besoin)
    // const unsubscribeGlobalNotification = subscribeToEvent('global_message', (data) => {
    //   console.log('Message global du serveur via Socket:', data);
    //   // import { showInfoToast } from '../components/common/NotificationToast';
    //   // showInfoToast(data.message || 'Notification du serveur');
    // });

    return () => {
      // unsubscribeGlobalNotification();
      // La déconnexion du socket à la fermeture de l'onglet/navigateur est gérée par le navigateur.
      // Si le composant AppInitializer se démonte (très rare), on pourrait déconnecter ici.
    };
  }, [isAuthenticated, token]); // Dépendances pour la gestion du socket

  return (
    <>
      <AppRouter />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={appTheme === 'dark' ? 'dark' : 'light'} // Lier au thème de l'application
        // ou theme="colored" pour des couleurs basées sur le type de toast
      />
    </>
  );
};

function App() {
  return (
    <React.StrictMode> {/* Activer StrictMode pour le développement */}
      <Provider store={store}>
        <BrowserRouter>
          <ErrorBoundary fallbackUI={<DefaultErrorFallback />}> {/* Envelopper avec ErrorBoundary */}
            <AppInitializer />
          </ErrorBoundary>
        </BrowserRouter>
      </Provider>
    </React.StrictMode>
  );
}

// Composant de fallback simple pour ErrorBoundary (peut être dans un fichier séparé)
const DefaultErrorFallback = ({ error, resetErrorBoundary }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Une erreur est survenue !</h2>
    <p>Nous sommes désolés pour ce désagrément.</p>
    {error?.message && <pre style={{ whiteSpace: 'pre-wrap', color: 'grey' }}>{error.message}</pre>}
    <button onClick={() => window.location.reload()} style={{marginTop: '10px'}}>
      Rafraîchir la page
    </button>
    {/* Ou si resetErrorBoundary est fourni par une lib ErrorBoundary plus avancée:
    <button onClick={resetErrorBoundary}>Réessayer</button>
    */}
  </div>
);

export default App;