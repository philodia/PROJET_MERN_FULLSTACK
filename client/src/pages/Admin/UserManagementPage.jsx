import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsersAdmin, // Supposons que ce thunk gère la pagination, le tri, les filtres
  deleteUserAdmin,
  // createUserAdmin, updateUserAdmin, // Ces thunks seront appelés depuis UserForm
  selectAllUsersAdmin,
  selectUserAdminStatus,
  selectUserAdminError,
  selectUserAdminPagination,
  clearUserAdminError,
} from '../../features/users/userSlice'; // Ajustez le chemin

import DataTable from '../../components/common/DataTable/DataTable';
import TableActions from '../../components/common/DataTable/TableActions';
import TablePagination from '../../components/common/DataTable/TablePagination';
import AppModal from '../../components/common/AppModal';
import UserForm from '../../components/users/UserForm'; // À créer
import AppButton from '../../components/common/AppButton';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge'; // Pour afficher le statut Actif/Inactif
import Icon from '../../components/common/Icon'; // Pour les icônes dans les boutons

import { showSuccessToast, showErrorToast } from '../../components/common/NotificationToast';
import ConfirmationModal from '../../components/common/ConfirmationModal'; // Composant pour confirmation

const UserManagementPage = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsersAdmin);
  const status = useSelector(selectUserAdminStatus);
  const error = useSelector(selectUserAdminError);
  const pagination = useSelector(selectUserAdminPagination);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null pour création, objet user pour édition

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Paramètres pour la récupération des données (pagination, filtres, tri)
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    sort: '-createdAt', // Trier par date de création décroissante par défaut
    search: '',
    role: '', // Filtre par rôle
    isActive: '', // Filtre par statut (true, false, ou '' pour tous)
  });

  const fetchData = useCallback(() => {
    dispatch(fetchUsersAdmin(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Effacer l'erreur si le statut redevient idle (par exemple après une action réussie)
    if (status === 'idle' && error) {
      dispatch(clearUserAdminError());
    }
  }, [status, error, dispatch]);


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
    // Optionnel: rafraîchir les données si une création/modification a eu lieu
    // fetchData(); // Ou le UserForm peut gérer cela via un callback onSuccess
  };

  const handleUserFormSuccess = () => {
    handleCloseUserModal();
    fetchData(); // Rafraîchir la liste après succès
    showSuccessToast(`Utilisateur ${editingUser ? 'mis à jour' : 'créé'} avec succès !`);
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
      await dispatch(deleteUserAdmin(userToDelete._id)).unwrap(); // unwrap pour attraper l'erreur ici si rethrow depuis le thunk
      showSuccessToast('Utilisateur supprimé avec succès !');
      fetchData(); // Rafraîchir la liste
    } catch (deleteError) {
      showErrorToast(deleteError.message || 'Erreur lors de la suppression de l\'utilisateur.');
    } finally {
      setIsDeleting(false);
      closeDeleteConfirmation();
    }
  };

  const handlePageChange = (newPage) => {
    setQueryParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (searchTerm) => {
    setQueryParams(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  // Définition des colonnes pour DataTable
  const columns = useMemo(() => [
    { Header: 'Nom d\'utilisateur', accessor: 'username', sortable: true },
    { Header: 'Email', accessor: 'email', sortable: true },
    { Header: 'Prénom', accessor: 'firstName', defaultCanSort: false, Cell: ({ value }) => value || '-' },
    { Header: 'Nom', accessor: 'lastName', defaultCanSort: false, Cell: ({ value }) => value || '-' },
    { Header: 'Rôle', accessor: 'role', sortable: true, Cell: ({ value }) => <StatusBadge variant={value.toLowerCase()} pillSize="sm">{value}</StatusBadge> },
    {
      Header: 'Statut',
      accessor: 'isActive',
      sortable: true,
      Cell: ({ value }) => (
        <StatusBadge variant={value ? 'active' : 'inactive'} pillSize="sm">
          {value ? 'Actif' : 'Inactif'}
        </StatusBadge>
      ),
      width: 100,
      textAlign: 'center',
    },
    {
      Header: 'Dernière Connexion',
      accessor: 'lastLogin',
      sortable: true,
      Cell: ({ value }) => (value ? new Date(value).toLocaleDateString('fr-FR') : '-'),
    },
    {
      Header: 'Créé le',
      accessor: 'createdAt',
      sortable: true,
      Cell: ({ value }) => new Date(value).toLocaleDateString('fr-FR'),
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }) => { // row.original contient l'objet utilisateur complet
        const user = row.original;
        return (
          <TableActions
            item={user}
            actionsConfig={[
              { id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleOpenEditModal(user) },
              { id: 'delete', iconName: 'FaTrash', label: 'Supprimer', variant: 'danger', onClick: () => openDeleteConfirmation(user) },
              // Vous pourriez ajouter une action 'view' si nécessaire
            ]}
          />
        );
      },
      disableSortBy: true, // Désactiver le tri sur la colonne d'actions
      width: 120,
      textAlign: 'right',
    },
  ], []); // Les dépendances vides indiquent que `columns` ne changera pas à moins que la page ne soit remontée.

  if (status === 'loading' && !users.length) { // Afficher le spinner seulement au chargement initial
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="container-fluid mt-4 user-management-page">
      <PageHeader
        title="Gestion des Utilisateurs"
        actionButton={
          <AppButton onClick={handleOpenCreateModal} variant="primary">
            <Icon name="FaPlus" style={{ marginRight: '8px' }} />
            Nouvel Utilisateur
          </AppButton>
        }
      />

      {error && (
        <AlertMessage variant="danger" onClose={() => dispatch(clearUserAdminError())} dismissible>
          Erreur : {typeof error === 'string' ? error : JSON.stringify(error)}
        </AlertMessage>
      )}

      <div className="mb-3">
        <SearchBar onSearch={handleSearch} placeholder="Rechercher par nom d'utilisateur, email..." initialValue={queryParams.search}/>
        {/* TODO: Ajouter des filtres plus avancés pour Rôle et Statut si nécessaire, en utilisant TableFilters */}
      </div>

      {/*
        Ici, vous passeriez `users` à votre composant DataTable.
        Le DataTable devrait gérer l'affichage des colonnes,
        le tri (en appelant une fonction qui met à jour queryParams.sort), etc.
      */}
      {status === 'loading' && <p>Chargement des utilisateurs...</p> /* Indicateur de re-chargement */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={status === 'loading'} // Pour afficher un indicateur de chargement sur la table
        // Props pour le tri côté serveur (si DataTable le gère) :
        // onSort={(sortBy) => {
        //   const sortString = sortBy.map(s => `${s.desc ? '-' : ''}${s.id}`).join(',');
        //   setQueryParams(prev => ({ ...prev, sort: sortString, page: 1 }));
        // }}
        // initialSortBy={[{ id: 'createdAt', desc: true }]} // (ou dérivé de queryParams.sort)
        // manualSortBy={true} // Indique que le tri est géré côté serveur
        // manualPagination={true} // Indique que la pagination est gérée côté serveur
      />

      {pagination && pagination.totalPages > 1 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <AppModal
        show={isUserModalOpen}
        onHide={handleCloseUserModal}
        title={editingUser ? `Modifier l'utilisateur : ${editingUser.username}` : 'Créer un Nouvel Utilisateur'}
        size="lg" // Ou 'md'
        // hideFooter // Le footer sera géré par UserForm (boutons Soumettre/Annuler)
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
        body={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.username}" ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        confirmButtonVariant="danger"
        isConfirming={isDeleting}
      />
    </div>
  );
};

export default UserManagementPage;