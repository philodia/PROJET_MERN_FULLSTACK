// frontend/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  loginUser as loginApi,
  registerUser as registerApi,
  fetchCurrentUser as fetchCurrentUserApi,
  // logoutUser as logoutApiCall, // Si vous avez un appel API pour le logout
} from '../../api/auth.api'; // Ajustez si nécessaire

// Fonction utilitaire pour parser l'utilisateur depuis localStorage
const getUserFromLocalStorage = () => {
  try {
    const storedUser = localStorage.getItem('authUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error("AuthSlice: Erreur parsing utilisateur depuis localStorage", e);
    localStorage.removeItem('authUser');
    return null;
  }
};

const token = localStorage.getItem('authToken');
const user = getUserFromLocalStorage();

const initialState = {
  user: user,
  token: token,
  isAuthenticated: !!token && !!user, // True si token ET user (parsé avec succès) sont présents
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const handleAuthSuccess = (state, action) => {
  state.status = 'succeeded';
  state.user = action.payload.user;
  state.token = action.payload.token;
  state.isAuthenticated = true;
  state.error = null;
  // localStorage est géré dans le thunk pour éviter de le faire dans le reducer (effet de bord)
};

const handleAuthFailure = (state, action, isLoadUser = false) => {
  state.status = 'failed';
  state.error = action.payload;
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;
  // localStorage est nettoyé dans le thunk
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginApi(credentials);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(message || 'Échec de la connexion.');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await registerApi(userData);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(message || 'Échec de l\'inscription.');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { getState, rejectWithValue }) => {
    const currentToken = getState().auth.token; // Ou selectAuthToken(getState())
    if (!currentToken) {
      return rejectWithValue('Aucun token, chargement utilisateur annulé.');
    }
    try {
      const fetchedUser = await fetchCurrentUserApi();
      localStorage.setItem('authUser', JSON.stringify(fetchedUser));
      return fetchedUser; // Retourne seulement l'utilisateur, le token est déjà dans l'état
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(message || 'Session invalide ou expirée.');
    }
  }
);

// Si vous avez un logout API :
// export const logoutUserApi = createAsyncThunk('auth/logoutUserApi', async (_, { dispatch }) => {
//   try {
//     await logoutApiCall();
//   } catch (e) { console.error("Logout API call failed but proceeding with client logout", e); }
//   // Dans tous les cas, on déconnecte côté client
//   dispatch(performLogout()); // Action synchrone pour nettoyer l'état
// });


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Renommé pour clarté si logoutUserApi existe
    performLogout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    },
    clearError(state) {
      state.error = null;
      if (state.status === 'failed') {
        state.status = 'idle';
      }
    },
    updateUser(state, action) {
      if (state.user && action.payload) { // S'assurer que user et payload existent
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('authUser', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, handleAuthSuccess)
      .addCase(login.rejected, handleAuthFailure)
      // Register
      .addCase(register.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(register.fulfilled, handleAuthSuccess)
      .addCase(register.rejected, handleAuthFailure)
      // Load User
      .addCase(loadUser.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(loadUser.fulfilled, (state, action) => { // Action.payload est `fetchedUser`
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true; // Le token était valide
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => handleAuthFailure(state, action, true));
      // Si logoutUserApi est utilisé :
      // .addCase(logoutUserApi.pending, (state) => { state.status = 'loading'; })
      // .addCase(logoutUserApi.fulfilled, (state) => { /* état déjà nettoyé par performLogout */ })
      // .addCase(logoutUserApi.rejected, (state) => { /* état déjà nettoyé par performLogout */ });
  },
});

// Renommer l'action exportée pour éviter confusion si logoutUserApi existe
export const { performLogout: logout, clearError, updateUser } = authSlice.actions;
// Si pas de logout API, garder : export const { logout, clearError, updateUser } = authSlice.actions;

// Sélecteurs
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
// Sélecteur booléen pour isLoading, dérivé de status
export const selectAuthIsLoading = (state) => state.auth.status === 'loading';

export default authSlice.reducer;