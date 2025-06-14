import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsersAdmin,
  deleteUserAdmin,
  selectAllUsersAdmin,
  selectUserAdminStatus,
  selectUserAdminError,
  selectUserAdminPagination,
  clearUserAdminError,
} from '../../features/users/userSlice';
import { selectCurrentUser } from '../../features/auth/authSlice'; // Import ajouté

import DataTable from '../../components/common/DataTable/DataTable';
import TableActions from '../../components/common/DataTable/TableActions';
import TablePagination from '../../components/common/DataTable/TablePagination';
import AppModal from '../../components/common/AppModal';
import UserForm from '../../components/users/UserForm';
import AppButton from '../../components/common/AppButton';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
//import PageHeader from '../../components/common/PageHeader';
import PageContainer from '../../components/layout/PageContainer';
//import SearchBar from '../../components/common/SearchBar'; // Import décommenté
import TableFilters from '../../components/common/DataTable/TableFilters';
import StatusBadge from '../../components/common/StatusBadge';
import Icon from '../../components/common/Icon';
//import { Form as BootstrapForm, Row, Col } from 'react-bootstrap';

import { showSuccessToast, showErrorToast } from '../../components/common/NotificationToast';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const UserManagementPage = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsersAdmin);
  const status = useSelector(selectUserAdminStatus);
  const error = useSelector(selectUserAdminError);
  const pagination = useSelector(selectUserAdminPagination);
  const currentUser = useSelector(selectCurrentUser); // Utilisateur connecté

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialisation simplifiée des queryParams
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    sort: '-createdAt',
    search: '',
    role: '',
    isActive: '',
  });

  const fetchData = useCallback(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(queryParams).filter(([, value]) => 
        value !== '' && value !== null && value !== undefined
      )
    );
    dispatch(fetchUsersAdmin(activeFilters));
  }, [dispatch, queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (error) dispatch(clearUserAdminError());
    };
  }, [dispatch, error]);

  // Gestion du tri
  const handleSort = useCallback((sortBy) => {
    if (sortBy.length > 0) {
      const { id, desc } = sortBy[0];
      const sortOrder = desc ? '-' : '';
      setQueryParams(prev => ({ 
        ...prev, 
        sort: `${sortOrder}${id}`,
        page: 1 // Reset à la première page
      }));
    } else {
      setQueryParams(prev => ({ ...prev, sort: '-createdAt' }));
    }
  }, []);

  // Conversion des paramètres de tri pour DataTable
  const sortBy = useMemo(() => {
    if (!queryParams.sort) return [];
    const isDesc = queryParams.sort.startsWith('-');
    const id = isDesc ? queryParams.sort.slice(1) : queryParams.sort;
    return [{ id, desc: isDesc }];
  }, [queryParams.sort]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleUserFormSuccess = (actionType) => {
    handleCloseUserModal();
    fetchData();
    showSuccessToast(`Utilisateur ${actionType === 'updated' ? 'mis à jour' : 'créé'} avec succès !`);
  };

  const openDeleteConfirmation = (user) => {
    setUserToDelete(user);
    setIsConfirmDeleteModalOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setUserToDelete(null);
    setIsConfirmDeleteModalOpen(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteUserAdmin(userToDelete._id)).unwrap();
      showSuccessToast('Utilisateur supprimé avec succès !');
      
      // Gestion de la pagination après suppression
      if (users.length === 1 && queryParams.page > 1) {
        setQueryParams(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchData();
      }
    } catch (deleteErr) {
      showErrorToast(deleteErr.message || 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
      closeDeleteConfirmation();
    }
  };

  const handlePageChange = (newPage) => {
    setQueryParams(prev => ({ ...prev, page: newPage }));
  };

  const handleApplyFilters = (appliedFilters) => {
    setQueryParams(prev => ({
      ...prev,
      ...appliedFilters,
      page: 1, // Reset à la première page
    }));
  };

  const handleResetFilters = () => {
    setQueryParams({
      page: 1,
      limit: 10,
      sort: '-createdAt',
      search: '',
      role: '',
      isActive: '',
    });
  };

  const filterConfigs = useMemo(() => [
    { 
      id: 'search', 
      label: 'Recherche globale', 
      type: 'text', 
      placeholder: 'Nom, email...', 
      colSize: 12 
    },
    {
      id: 'role', 
      label: 'Rôle', 
      type: 'select',
      options: [
        { value: '', label: 'Tous les rôles' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'ACCOUNTANT', label: 'Comptable' },
        { value: 'USER', label: 'Utilisateur' },
      ],
      colSize: 6, 
      md: 3
    },
    {
      id: 'isActive', 
      label: 'Statut', 
      type: 'select',
      options: [
        { value: '', label: 'Tous les statuts' },
        { value: 'true', label: 'Actif' },
        { value: 'false', label: 'Inactif' },
      ],
      colSize: 6, 
      md: 3
    },
  ], []);

  const columns = useMemo(() => [
    { Header: 'Nom d\'utilisateur', accessor: 'username', sortable: true },
    { Header: 'Email', accessor: 'email', sortable: true },
    { 
      Header: 'Nom Complet', 
      accessor: 'fullName', 
      Cell: ({ value }) => value || '-' 
    },
    { 
      Header: 'Rôle', 
      accessor: 'role', 
      sortable: true, 
      Cell: ({ value }) => value ? 
        <StatusBadge variant={value.toLowerCase()} pillSize="sm">
          {value}
        </StatusBadge> : '-' 
    },
    {
      Header: 'Statut', 
      accessor: 'isActive', 
      sortable: true,
      Cell: ({ value }) => (
        <StatusBadge variant={value ? 'success' : 'danger'} pillSize="sm">
          {value ? 'Actif' : 'Inactif'}
        </StatusBadge>
      ),
      textAlign: 'center', 
      width: 100,
    },
    {
      Header: 'Créé le', 
      accessor: 'createdAt', 
      sortable: true,
      Cell: ({ value }) => value ? 
        format(new Date(value), 'P', { locale: fr }) : '-',
    },
    {
      Header: 'Actions', 
      id: 'actions', 
      disableSortBy: true, 
      textAlign: 'right', 
      width: 100,
      Cell: ({ row }) => (
        <TableActions 
          item={row.original} 
          actionsConfig={[
            { 
              id: 'edit', 
              iconName: 'FaPencilAlt', 
              label: 'Modifier', 
              onClick: () => handleOpenEditModal(row.original) 
            },
            { 
              id: 'delete', 
              iconName: 'FaTrash', 
              label: 'Supprimer', 
              variant: 'danger', 
              onClick: () => openDeleteConfirmation(row.original), 
              disabled: row.original._id === currentUser?._id
            },
          ]}
        />
      ),
    },
  ], [currentUser]);

  const isLoading = status === 'loading';
  const isLoadingInitial = isLoading && users.length === 0;

  if (isLoadingInitial) {
    return (
      <PageContainer title="Gestion des Utilisateurs">
        <LoadingSpinner fullPage />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Gestion des Utilisateurs"
      actionButton={
        <AppButton onClick={handleOpenCreateModal} variant="primary" icon={<Icon name="FaPlus" />}>
          Nouvel Utilisateur
        </AppButton>
      }
      breadcrumbs={[
        { label: 'Administration', path: '/admin/dashboard-stats' },
        { label: 'Utilisateurs', isActive: true },
      ]}
    >
      {error && (
        <AlertMessage 
          variant="danger" 
          onClose={() => dispatch(clearUserAdminError())} 
          dismissible
        >
          {error.message || 'Erreur lors du chargement des utilisateurs'}
        </AlertMessage>
      )}

      <TableFilters
        filterConfigs={filterConfigs}
        initialFilterValues={{
          search: queryParams.search,
          role: queryParams.role,
          isActive: queryParams.isActive
        }}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        isApplying={isLoading}
        className="mb-3"
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        onSort={handleSort}
        sortBy={sortBy}
        manualSortBy
      />

      {pagination && pagination.totalPages > 0 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          className="mt-3"
        />
      )}

      {!isLoading && users.length === 0 && (
        <AlertMessage variant="info" className="mt-3">
          Aucun utilisateur ne correspond à vos critères
        </AlertMessage>
      )}

      <AppModal
        show={isUserModalOpen}
        onHide={handleCloseUserModal}
        title={editingUser ? `Modifier : ${editingUser.username}` : 'Créer un Utilisateur'}
        size="lg"
      >
        <UserForm
          initialUser={editingUser}
          onSuccess={handleUserFormSuccess}
          onCancel={handleCloseUserModal}
        />
      </AppModal>

      <ConfirmationModal
        show={isConfirmDeleteModalOpen}
        onHide={closeDeleteConfirmation}
        onConfirm={handleDeleteUser}
        title="Confirmer la Suppression"
        body={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.username}" ?`}
        confirmButtonText="Supprimer"
        confirmButtonVariant="danger"
        isConfirming={isDeleting}
      />
    </PageContainer>
  );
};

export default UserManagementPage;