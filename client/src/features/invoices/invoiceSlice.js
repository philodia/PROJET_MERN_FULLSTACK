import { createSlice, createAsyncThunk, createEntityAdapter, isAnyOf } from '@reduxjs/toolkit';
import {
  fetchInvoices as fetchInvoicesApi,
  fetchInvoiceById as fetchInvoiceByIdApi,
  createInvoice as createInvoiceApi,
  updateInvoice as updateInvoiceApi,
  deleteInvoice as deleteInvoiceApi,
  recordInvoicePayment as recordInvoicePaymentApi,
  markInvoiceAsSent as markInvoiceAsSentApi,
  cancelInvoice as cancelInvoiceApi,
  duplicateInvoice as duplicateInvoiceApi,
} from '../../api/invoice.api.js';

// Configuration de l'adapter pour la normalisation des données
const invoicesAdapter = createEntityAdapter({
  selectId: (invoice) => invoice._id,
  sortComparer: (a, b) => new Date(b.issueDate) - new Date(a.issueDate),
});

// État initial de la pagination
const initialPaginationState = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 15,
};

// État initial du slice
const initialState = invoicesAdapter.getInitialState({
  status: 'idle',
  actionStatus: 'idle',
  error: null,
  currentInvoice: null,
  pagination: { ...initialPaginationState },
});

// Fonction utilitaire pour gérer les erreurs API
const handleApiError = (error, rejectWithValue) => {
  const errorData = error.response?.data || {};
  return rejectWithValue({
    message: errorData.message || 'Erreur serveur',
    status: error.response?.status || 500,
    details: errorData.errors || null,
  });
};

// --- THUNKS ---

// Récupération paginée des factures
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (params = { page: 1, limit: 15 }, { rejectWithValue }) => {
    try {
      const response = await fetchInvoicesApi(params);
      return {
        data: response.data,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        limit: response.limit,
      };
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Récupération d'une facture par ID
export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchInvoiceById',
  async (invoiceId, { rejectWithValue }) => {
    try {
      return await fetchInvoiceByIdApi(invoiceId);
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Création d'une nouvelle facture
export const createNewInvoice = createAsyncThunk(
  'invoices/createNewInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      return await createInvoiceApi(invoiceData);
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Mise à jour d'une facture existante
export const updateExistingInvoice = createAsyncThunk(
  'invoices/updateExistingInvoice',
  async ({ invoiceId, invoiceData }, { rejectWithValue }) => {
    try {
      return await updateInvoiceApi(invoiceId, invoiceData);
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Suppression d'une facture
export const deleteExistingInvoice = createAsyncThunk(
  'invoices/deleteExistingInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      await deleteInvoiceApi(invoiceId);
      return invoiceId;
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Enregistrement d'un paiement
export const recordPaymentForInvoice = createAsyncThunk(
  'invoices/recordPaymentForInvoice',
  async ({ invoiceId, paymentData }, { rejectWithValue }) => {
    try {
      return await recordInvoicePaymentApi(invoiceId, paymentData);
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Marquage d'une facture comme envoyée
export const sendInvoice = createAsyncThunk(
  'invoices/sendInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      return await markInvoiceAsSentApi(invoiceId);
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Annulation d'une facture
export const cancelInvoice = createAsyncThunk(
  'invoices/cancelInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      return await cancelInvoiceApi(invoiceId);
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// Duplication d'une facture
export const duplicateInvoice = createAsyncThunk(
  'invoices/duplicateInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      return await duplicateInvoiceApi(invoiceId);
    } catch (error) {
      return handleApiError(error, rejectWithValue);
    }
  }
);

// --- SLICE ---
const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setCurrentInvoice: (state, action) => {
      state.currentInvoice = action.payload;
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    },
    clearInvoiceError: (state) => {
      state.error = null;
    },
    setInvoicePage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    resetInvoiceState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Gestion des états généraux
      .addMatcher(
        isAnyOf(
          fetchInvoices.pending,
          fetchInvoiceById.pending
        ),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          createNewInvoice.pending,
          updateExistingInvoice.pending,
          deleteExistingInvoice.pending,
          recordPaymentForInvoice.pending,
          sendInvoice.pending,
          cancelInvoice.pending,
          duplicateInvoice.pending
        ),
        (state) => {
          state.actionStatus = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          fetchInvoices.rejected,
          fetchInvoiceById.rejected
        ),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      )
      .addMatcher(
        isAnyOf(
          createNewInvoice.rejected,
          updateExistingInvoice.rejected,
          deleteExistingInvoice.rejected,
          recordPaymentForInvoice.rejected,
          sendInvoice.rejected,
          cancelInvoice.rejected,
          duplicateInvoice.rejected
        ),
        (state, action) => {
          state.actionStatus = 'failed';
          state.error = action.payload;
        }
      )

      // Gestion des succès
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        invoicesAdapter.setAll(state, action.payload.data);
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalItems,
          limit: action.payload.limit,
        };
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentInvoice = action.payload;
        invoicesAdapter.upsertOne(state, action.payload);
      })
      .addCase(createNewInvoice.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        invoicesAdapter.addOne(state, action.payload);
        state.pagination.totalItems += 1;
        state.currentInvoice = action.payload;
      })
      .addCase(updateExistingInvoice.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        invoicesAdapter.upsertOne(state, action.payload);
        if (state.currentInvoice?._id === action.payload._id) {
          state.currentInvoice = action.payload;
        }
      })
      .addCase(deleteExistingInvoice.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        invoicesAdapter.removeOne(state, action.payload);
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1);
        
        // Réajustement de la pagination si nécessaire
        if (state.pagination.totalItems > 0 && 
            state.pagination.currentPage > state.pagination.totalPages) {
          state.pagination.currentPage = state.pagination.totalPages;
        }
        
        if (state.currentInvoice?._id === action.payload) {
          state.currentInvoice = null;
        }
      })
      .addCase(recordPaymentForInvoice.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        invoicesAdapter.upsertOne(state, action.payload);
        if (state.currentInvoice?._id === action.payload._id) {
          state.currentInvoice = action.payload;
        }
      })
      .addCase(sendInvoice.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        invoicesAdapter.upsertOne(state, action.payload);
        if (state.currentInvoice?._id === action.payload._id) {
          state.currentInvoice = action.payload;
        }
      })
      .addCase(cancelInvoice.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        invoicesAdapter.upsertOne(state, action.payload);
        if (state.currentInvoice?._id === action.payload._id) {
          state.currentInvoice = action.payload;
        }
      })
      .addCase(duplicateInvoice.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        invoicesAdapter.addOne(state, action.payload);
        state.pagination.totalItems += 1;
      });
  },
});

// Export des actions
export const {
  setCurrentInvoice,
  clearCurrentInvoice,
  clearInvoiceError,
  setInvoicePage,
  resetInvoiceState
} = invoiceSlice.actions;

// Sélecteurs de l'adapter
export const {
  selectAll: selectAllInvoices,
  selectById: selectInvoiceById,
  selectIds: selectInvoiceIds,
} = invoicesAdapter.getSelectors((state) => state.invoices);

// Sélecteurs personnalisés
export const selectInvoiceStatus = (state) => state.invoices.status;
export const selectInvoiceActionStatus = (state) => state.invoices.actionStatus;
export const selectInvoiceError = (state) => state.invoices.error;
export const selectCurrentInvoiceDetail = (state) => state.invoices.currentInvoice;
export const selectInvoicePagination = (state) => state.invoices.pagination;

export const selectInvoiceIsLoading = (state) => 
  state.invoices.status === 'loading';

export const selectInvoiceActionLoading = (state) => 
  state.invoices.actionStatus === 'loading';

export default invoiceSlice.reducer;