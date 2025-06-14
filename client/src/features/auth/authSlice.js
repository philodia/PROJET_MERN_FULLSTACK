// frontend/src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  login as loginApiCall,
  register as registerApiCall,
  getMe as getMeApiCall,
  logout as logoutServerApiCall,
  changeMyPassword as changeMyPasswordApiCall,
  updateMyProfile as updateMyProfileApiCall,
} from '../../api/auth.api'; // Assurez-vous que auth.api.js exporte bien ces noms

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

const tokenFromLocalStorage = localStorage.getItem('authToken');
const userFromLocalStorage = getUserFromLocalStorage();

const initialState = {
  user: userFromLocalStorage,
  token: tokenFromLocalStorage,
  isAuthenticated: !!tokenFromLocalStorage && !!userFromLocalStorage,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed' | 'action_loading'
  error: null,
};

// --- Thunks ---
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginApiCall(credentials);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data;
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(error);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await registerApiCall(userData);
      if (data.token && data.user) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(error);
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) {
      return rejectWithValue({ message: 'Aucun token, chargement utilisateur annulé.' });
    }
    try {
      const fetchedUser = await getMeApiCall();
      localStorage.setItem('authUser', JSON.stringify(fetchedUser));
      return { user: fetchedUser, token };
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return rejectWithValue(error);
    }
  }
);

export const performLogout = createAsyncThunk(
  'auth/performLogout',
  async (_, { dispatch }) => {
    try {
      await logoutServerApiCall();
    } catch (apiError) {
      console.warn("L'appel API de déconnexion serveur a échoué, mais la déconnexion client se poursuit.", apiError.message || apiError);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    dispatch(authSlice.actions.clearAuthDataLocally()); // Dispatcher l'action synchrone
    return { success: true };
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const updatedUser = await updateMyProfileApiCall(profileData);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changeUserPassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await changeMyPasswordApiCall(passwordData);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// --- Helpers pour Reducers ---
const handleAuthSuccess = (state, action) => {
  state.status = 'succeeded';
  state.user = action.payload.user;
  state.token = action.payload.token;
  state.isAuthenticated = true;
  state.error = null;
};

const handleAuthFailure = (state, action) => {
  state.status = 'failed';
  state.error = action.payload;
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;
};

// --- Slice Definition ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action renommée pour plus de clarté sur son rôle interne
    clearAuthDataLocally(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
      if (state.status === 'failed' && state.isAuthenticated) state.status = 'succeeded';
      else if (state.status === 'failed' && !state.isAuthenticated) state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, handleAuthSuccess)
      .addCase(login.rejected, handleAuthFailure)
      .addCase(register.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        if (action.payload.token && action.payload.user) {
          handleAuthSuccess(state, action);
        } else {
          state.status = 'succeeded';
        }
      })
      .addCase(register.rejected, handleAuthFailure)
      .addCase(loadUser.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(loadUser.fulfilled, handleAuthSuccess)
      .addCase(loadUser.rejected, handleAuthFailure)
      .addCase(performLogout.pending, (state) => { state.status = 'loading'; })
      .addCase(performLogout.fulfilled, (state) => { state.status = 'idle';}) // L'état est déjà nettoyé
      .addCase(performLogout.rejected, (state) => { state.status = 'idle'; console.warn("Thunk performLogout rejeté."); })
      .addCase(updateUserProfile.pending, (state) => { state.status = 'action_loading'; state.error = null; })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(changeUserPassword.pending, (state) => { state.status = 'action_loading'; state.error = null; })
      .addCase(changeUserPassword.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(changeUserPassword.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; });
  },
});

// Exporter l'action de nettoyage interne sous un nom clair pour l'intercepteur
export const { clearAuthDataLocally: logoutClientSideInternal, clearAuthError } = authSlice.actions;

// Sélecteurs
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
// ... autres sélecteurs ...
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthIsLoading = (state) => state.auth.status === 'loading' || state.auth.status === 'action_loading';


export default authSlice.reducer;