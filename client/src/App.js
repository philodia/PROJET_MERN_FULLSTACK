// frontend/src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux'; // useDispatch pour AppContent
import { store } from './app/store';
import AppRouter from './router';

// Thunks/Actions pour le chargement initial
import { loadUser } from './features/auth/authSlice';
import { loadTheme } from './features/ui/uiSlice'; // Si vous avez un uiSlice pour le thème

// Notifications Toast
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// CSS Globaux
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/scss/global.scss'; // Votre SCSS global personnalisé

// (Optionnel) ErrorBoundary
// import ErrorBoundary from './components/common/ErrorBoundary';


// Composant interne pour pouvoir utiliser les hooks Redux (useDispatch)
const AppInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Tenter de charger l'utilisateur à partir du token stocké
    dispatch(loadUser());
    // Charger le thème persisté (si applicable)
    dispatch(loadTheme());
    // Vous pourriez ajouter d'autres initialisations ici (ex: configuration de l'application depuis une API)
  }, [dispatch]);

  return <AppRouter />;
};

function App() {
  return (
    // <React.StrictMode> // Décommentez si vous voulez activer le mode strict ici
    <Provider store={store}>
      <BrowserRouter>
        {/* <ErrorBoundary fallbackMessage="Une erreur inattendue est survenue."> */}
          <AppInitializer />
        {/* </ErrorBoundary> */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true} // Les nouveaux toasts apparaissent en haut
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored" // 'light', 'dark', ou 'colored' pour utiliser les couleurs de type de toast
        />
      </BrowserRouter>
    </Provider>
    // </React.StrictMode>
  );
}

export default App;