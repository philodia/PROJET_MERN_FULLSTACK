// frontend/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Supposons que vos fonctions API sont définies ici :
import {
  loginUser as loginApi,
  registerUser as registerApi,
  fetchCurrentUser as fetchCurrentUserApi,
  // logoutUser as logoutApi, // Si votre logout backend nécessite un appel API
} from '../../api/auth.api'; // Assurez-vous que le chemin est correct

// Récupérer le token du localStorage pour l'état initial
const token = localStorage.getItem('authToken');

const initialState = {
  user: null,
  token: token,
  isAuthenticated: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Thunk asynchrone pour la connexion de l'utilisateur
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginApi(credentials); // Attend { user, token }
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data;
    } catch (error) {
      // L'intercepteur Axios devrait déjà avoir formaté l'erreur
      // error est probablement un objet avec une propriété `message` ou juste une chaîne de caractères
      const errorMessage = error?.message || error || 'Échec de la connexion.';
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunk asynchrone pour l'inscription de l'utilisateur
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await registerApi(userData); // Attend { user, token }
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data;
    } catch (error) {
      const errorMessage = error?.message || error || 'Échec de l\'inscription.';
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunk asynchrone pour charger l'utilisateur si un token existe (au démarrage de l'app par ex.)
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { getState, rejectWithValue }) => {
    const currentToken = getState().auth.token;
    if (!currentToken) {
      return rejectWithValue('Aucun token trouvé.');
    }
    try {
      const user = await fetchCurrentUserApi(); // Attend l'objet utilisateur
      localStorage.setItem('authUser', JSON.stringify(user));
      return user;
    } catch (error) {
      const errorMessage = error?.message || error || 'Échec du chargement de l\'utilisateur.';
      // Si le chargement de l'utilisateur échoue (token invalide), nettoyez
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      // Si votre logout backend nécessite un appel API et renvoie qqc, vous pourriez vouloir un thunk
      // await logoutApi(); // Par exemple
    },
    clearError(state) {
      state.error = null;
      if (state.status === 'failed') {
        state.status = 'idle'; // Remettre à idle si l'erreur est effacée
      }
    },
    // Si vous avez besoin de mettre à jour manuellement l'utilisateur (ex: après modification du profil)
    updateUser(state, action) {
        if (state.isAuthenticated && state.user) {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('authUser', JSON.stringify(state.user));
        }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // Message d'erreur de rejectWithValue
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        // Ne pas changer isAuthenticated ici, car on ne sait pas encore si le token est valide
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload; // L'utilisateur retourné par /api/auth/me
        // state.token est déjà défini depuis localStorage
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // Message d'erreur si le token est invalide ou autre
        state.user = null;
        state.token = null; // Token invalidé, le supprimer
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;

// Sélecteurs
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthStatus = (state) => state.auth.status; // 'idle', 'loading', 'succeeded', 'failed'
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;