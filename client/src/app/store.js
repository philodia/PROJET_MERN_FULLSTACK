// frontend/src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Importe le reducer d'authentification
import userReducer from '../features/users/userSlice';
import clientReducer from '../features/clients/clientSlice'; 
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    // La clé 'auth' ici déterminera comment l'état d'authentification
    // sera accessible dans le state global (state.auth)
    auth: authReducer,
    users: userReducer,
    clients: clientReducer,
    ui: uiReducer,

  },
  // Le middleware par défaut inclut redux-thunk, ce qui est nécessaire pour createAsyncThunk.
  // Vous pouvez ajouter d'autres middlewares ici si besoin.
  // Par exemple, pour le logging en développement :
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
  // Assurez-vous d'importer 'logger' de 'redux-logger' si vous l'utilisez.

  // Activer les Redux DevTools en développement
  // C'est activé par défaut si process.env.NODE_ENV n'est pas 'production'
  devTools: process.env.NODE_ENV !== 'production',
});

// Optionnel: Exporter le type du RootState et AppDispatch pour une utilisation avec TypeScript
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;