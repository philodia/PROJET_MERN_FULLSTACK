// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store'; // Importez votre store
import App from './App';
import './index.css'; // Ou vos styles globaux
import 'bootstrap/dist/css/bootstrap.min.css'; // Si vous utilisez Bootstrap CSS directement
import './assets/scss/global.scss';  

// Dispatch loadUser si un token est présent initialement
import { loadUser } from './features/auth/authSlice';
if (store.getState().auth.token) {
  store.dispatch(loadUser());
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);