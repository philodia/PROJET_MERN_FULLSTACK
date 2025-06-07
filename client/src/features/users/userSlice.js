// frontend/src/features/users/userSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import {
  fetchUsers as fetchUsersApi, // Supposons que cette API est pour les admins
  fetchUserById as fetchUserByIdApi,
  createUser as createUserApi,
  updateUser as updateUserApi,
  deleteUser as deleteUserApi,
  // setUserStatus as setUserStatusApi,
} from '../../api/user.api.js';

const usersAdapter = createEntityAdapter({
  selectId: (user) => user._id, // Mongoose utilise _id par défaut
  // sortComparer: (a, b) => a.username.localeCompare(b.username), // Optionnel
});

// État initial pour la pagination, pourrait être extrait si partagé par plusieurs slices
const initialPaginationState = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0, // Renommé totalUsers en totalItems pour plus de généricité
  limit: 10,
};

const initialState = usersAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed' | 'action_loading' (pour CUD)
  error: null,
  currentUserDetail: null, // Pour stocker l'utilisateur actuellement visualisé/édité en détail
  pagination: initialPaginationState,
});

// --- THUNKS (Renommés pour clarté dans un contexte admin) ---
export const fetchUsersAdmin = createAsyncThunk(
  'users/fetchUsersAdmin', // Nom d'action unique
  async (params = { page: 1, limit: 10 }, { rejectWithValue }) => {
    try {
      const data = await fetchUsersApi(params); // API doit retourner { data: [], totalPages, currentPage, totalItems, limit }
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message || 'Failed to fetch users' });
    }
  }
);

export const fetchUserByIdAdmin = createAsyncThunk(
  'users/fetchUserByIdAdmin',
  async (userId, { rejectWithValue }) => {
    try {
      const user = await fetchUserByIdApi(userId);
      return user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message || `Failed to fetch user ${userId}` });
    }
  }
);

export const createUserAdmin = createAsyncThunk(
  'users/createUserAdmin',
  async (userData, { rejectWithValue }) => {
    try {
      const newUser = await createUserApi(userData);
      return newUser;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message || 'Failed to create user' });
    }
  }
);

export const updateUserAdmin = createAsyncThunk(
  'users/updateUserAdmin',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const updatedUser = await updateUserApi(userId, userData);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message || 'Failed to update user' });
    }
  }
);

export const deleteUserAdmin = createAsyncThunk(
  'users/deleteUserAdmin',
  async (userId, { rejectWithValue }) => {
    try {
      await deleteUserApi(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message || 'Failed to delete user' });
    }
  }
);

// --- USER SLICE ---
const userSlice = createSlice({
  name: 'usersAdmin', // Nom de slice plus spécifique si ce slice est pour l'admin
  initialState,
  reducers: {
    setCurrentUserDetail(state, action) {
      state.currentUserDetail = action.payload;
    },
    clearCurrentUserDetail(state) {
      state.currentUserDetail = null;
    },
    clearUserAdminError(state) {
      state.error = null;
      if (state.status === 'failed') state.status = 'idle';
    },
    setUserAdminPage(state, action) { // Pourrait être utilisé par la pagination si on veut un contrôle client
        state.pagination.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users Admin
      .addCase(fetchUsersAdmin.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsersAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        usersAdapter.setAll(state, action.payload.data); // API renvoie { data: [...], ... }
        state.pagination.currentPage = action.payload.currentPage;
        state.pagination.totalPages = action.payload.totalPages;
        state.pagination.totalItems = action.payload.totalItems;
        state.pagination.limit = action.payload.limit || state.pagination.limit;
      })
      .addCase(fetchUsersAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        usersAdapter.removeAll(state); // Optionnel: vider la liste en cas d'erreur de fetch
        state.pagination = initialPaginationState; // Réinitialiser la pagination
      })

      // Fetch User By Id Admin
      .addCase(fetchUserByIdAdmin.pending, (state) => {
        state.status = 'loading'; // Ou un statut 'loading_detail'
        state.currentUserDetail = null;
        state.error = null;
      })
      .addCase(fetchUserByIdAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUserDetail = action.payload;
      })
      .addCase(fetchUserByIdAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Create User Admin
      .addCase(createUserAdmin.pending, (state) => {
        state.status = 'action_loading'; // Statut spécifique pour les actions CUD
        state.error = null;
      })
      .addCase(createUserAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        usersAdapter.addOne(state, action.payload);
        state.pagination.totalItems = (state.pagination.totalItems || 0) + 1;
        // Pourrait aussi rafraîchir la page actuelle ou aller à la dernière page
      })
      .addCase(createUserAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // Erreurs de validation du backend
      })

      // Update User Admin
      .addCase(updateUserAdmin.pending, (state) => {
        state.status = 'action_loading';
        state.error = null;
      })
      .addCase(updateUserAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        usersAdapter.upsertOne(state, action.payload);
        if (state.currentUserDetail && state.currentUserDetail._id === action.payload._id) {
          state.currentUserDetail = action.payload;
        }
      })
      .addCase(updateUserAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Delete User Admin
      .addCase(deleteUserAdmin.pending, (state) => {
        state.status = 'action_loading';
        state.error = null;
      })
      .addCase(deleteUserAdmin.fulfilled, (state, action) => { // action.payload est userId
        state.status = 'succeeded';
        usersAdapter.removeOne(state, action.payload);
        state.pagination.totalItems = Math.max(0, (state.pagination.totalItems || 0) - 1);
        if (state.currentUserDetail && state.currentUserDetail._id === action.payload) {
          state.currentUserDetail = null; // Effacer si l'utilisateur supprimé était affiché en détail
        }
      })
      .addCase(deleteUserAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentUserDetail,
  clearCurrentUserDetail,
  clearUserAdminError,
  setUserAdminPage
} = userSlice.actions;

export const {
  selectAll: selectAllUsersAdmin, // Renommé pour clarté
  selectById: selectUserByIdAdminFromAdapter,
  selectIds: selectUserAdminIds,
} = usersAdapter.getSelectors((state) => state.usersAdmin); // Utiliser le nom du slice

export const selectUserAdminStatus = (state) => state.usersAdmin.status;
export const selectUserAdminError = (state) => state.usersAdmin.error;
export const selectCurrentUserAdminDetail = (state) => state.usersAdmin.currentUserDetail;
export const selectUserAdminPagination = (state) => state.usersAdmin.pagination;

export default userSlice.reducer;