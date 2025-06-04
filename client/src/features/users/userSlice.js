// frontend/src/features/users/userSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import {
  fetchUsers as fetchUsersApi,
  fetchUserById as fetchUserByIdApi,
  createUser as createUserApi,
  updateUser as updateUserApi,
  deleteUser as deleteUserApi,
  // setUserStatus as setUserStatusApi, // Si vous l'implémentez
} from '../../api/user.api.js'; // Assurez-vous que le chemin est correct

// createEntityAdapter aide à gérer les données normalisées (recommandé pour les listes)
const usersAdapter = createEntityAdapter({
  // Suppose que chaque utilisateur a un champ `_id` ou `id`
  selectId: (user) => user._id || user.id,
  // Garder l'ordre de tri par défaut (par exemple, par date de création ou nom d'utilisateur)
  // sortComparer: (a, b) => a.username.localeCompare(b.username),
});

const initialState = usersAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  currentUser: null, // Pour stocker l'utilisateur en cours d'édition ou de visualisation détaillée
  pagination: { // Pour stocker les informations de pagination de fetchUsersApi
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10, // Limite par défaut
  },
});

// Thunks asynchrones
export const getUsers = createAsyncThunk(
  'users/getUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await fetchUsersApi(params);
      return data; // Attend { users: [...], totalPages, currentPage, totalUsers }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

export const getUserById = createAsyncThunk(
  'users/getUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await fetchUserByIdApi(userId);
      return data; // Attend l'objet utilisateur
    } catch (error) {
      return rejectWithValue(error.message || `Failed to fetch user ${userId}`);
    }
  }
);

export const addNewUser = createAsyncThunk(
  'users/addNewUser',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await createUserApi(userData);
      return data; // Attend l'utilisateur créé
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to create user');
    }
  }
);

export const editUser = createAsyncThunk(
  'users/editUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const data = await updateUserApi(userId, userData);
      return data; // Attend l'utilisateur mis à jour
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || 'Failed to update user');
    }
  }
);

export const removeUser = createAsyncThunk(
  'users/removeUser',
  async (userId, { rejectWithValue }) => {
    try {
      await deleteUserApi(userId);
      return userId; // Retourne l'ID de l'utilisateur supprimé pour le retirer du state
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete user');
    }
  }
);

// export const toggleUserStatus = createAsyncThunk(
//   'users/toggleUserStatus',
//   async ({ userId, isActive }, { rejectWithValue }) => {
//     try {
//       const data = await setUserStatusApi(userId, isActive);
//       return data; // Attend l'utilisateur mis à jour
//     } catch (error) {
//       return rejectWithValue(error.message || 'Failed to update user status');
//     }
//   }
// );

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser(state, action) {
      state.currentUser = action.payload;
    },
    clearCurrentUser(state) {
      state.currentUser = null;
    },
    clearUserError(state) {
      state.error = null;
      if (state.status === 'failed') state.status = 'idle';
    },
    // Vous pouvez ajouter des reducers pour gérer localement la pagination ou les filtres si nécessaire
    setUserListPage(state, action) {
        state.pagination.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Users
      .addCase(getUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        usersAdapter.setAll(state, action.payload.users); // Remplace tous les utilisateurs
        state.pagination.currentPage = action.payload.currentPage;
        state.pagination.totalPages = action.payload.totalPages;
        state.pagination.totalUsers = action.payload.totalUsers;
        state.pagination.limit = action.payload.limit || state.pagination.limit;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Get User By Id
      .addCase(getUserById.pending, (state) => {
        state.status = 'loading';
        state.currentUser = null; // Effacer le précédent
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUser = action.payload;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add New User
      .addCase(addNewUser.fulfilled, (state, action) => {
        usersAdapter.addOne(state, action.payload); // Ajoute le nouvel utilisateur à la liste
        // Optionnel: Mettre à jour totalUsers si la pagination n'est pas rechargée immédiatement
        state.pagination.totalUsers += 1;
        state.status = 'succeeded'; // Peut-être définir un statut spécifique pour la création
      })
      .addCase(addNewUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // Contient souvent des erreurs de validation du backend
      })
      // Edit User
      .addCase(editUser.fulfilled, (state, action) => {
        usersAdapter.upsertOne(state, action.payload); // Met à jour l'utilisateur dans la liste
        if (state.currentUser && (state.currentUser._id === action.payload._id || state.currentUser.id === action.payload.id) ) {
          state.currentUser = action.payload; // Met à jour currentUser s'il s'agit du même utilisateur
        }
        state.status = 'succeeded';
      })
       .addCase(editUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Remove User
      .addCase(removeUser.fulfilled, (state, action) => {
        usersAdapter.removeOne(state, action.payload); // Retire l'utilisateur de la liste par son ID
        state.pagination.totalUsers -= 1;
        state.status = 'succeeded';
      })
      // Toggle User Status (si implémenté)
      // .addCase(toggleUserStatus.fulfilled, (state, action) => {
      //   usersAdapter.upsertOne(state, action.payload);
      //   if (state.currentUser && state.currentUser._id === action.payload._id) {
      //     state.currentUser = action.payload;
      //   }
      // })
      // Gestion générique des états pending et rejected pour les mutations (add, edit, remove)
      // pour éviter la duplication si vous ne voulez pas de logique spécifique pour chaque
      .addMatcher(
        (action) => [addNewUser.pending, editUser.pending, removeUser.pending].includes(action.type),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      // Si addNewUser.rejected ou editUser.rejected ont déjà des handlers spécifiques,
      // ce .addMatcher pour .rejected ne sera pas nécessaire ou devra être plus spécifique.
      // .addMatcher(
      //   (action) => [addNewUser.rejected, editUser.rejected, removeUser.rejected].includes(action.type),
      //   (state, action) => {
      //     if (state.status === 'loading') { // Seulement si on était en train de charger cette action spécifique
      //       state.status = 'failed';
      //       state.error = action.payload;
      //     }
      //   }
      // );
  },
});

export const { setCurrentUser, clearCurrentUser, clearUserError, setUserListPage } = userSlice.actions;

// Sélecteurs exportés par createEntityAdapter
export const {
  selectAll: selectAllUsers,
  selectById: selectUserByIdFromAdapter, // Renommé pour éviter conflit avec le thunk
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state) => state.users);

// Sélecteurs personnalisés
export const selectUserStatus = (state) => state.users.status;
export const selectUserError = (state) => state.users.error;
export const selectCurrentUserDetail = (state) => state.users.currentUser;
export const selectUserPagination = (state) => state.users.pagination;

export default userSlice.reducer;