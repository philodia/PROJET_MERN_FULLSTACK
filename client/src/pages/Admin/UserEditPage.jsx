import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserByIdAdmin,
  selectCurrentUserAdminDetail,
  selectUserAdminStatus,
  selectUserAdminError,
  clearUserAdminError,
  // updateUserAdmin // Ce thunk sera appelé depuis UserForm
} from '../../features/users/userSlice'; // Ajustez le chemin

import UserForm from '../../components/users/UserForm'; // À créer ou à réutiliser
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/common/AppButton';
import Icon from '../../components/common/Icon';

import { showSuccessToast } from '../../components/common/NotificationToast';

const UserEditPage = () => {
  const { userId } = useParams(); // Récupérer l'ID de l'utilisateur depuis l'URL
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useSelector(selectCurrentUserAdminDetail);
  const status = useSelector(selectUserAdminStatus); // Statut global du slice user
  const error = useSelector(selectUserAdminError);

  const [pageStatus, setPageStatus] = useState('idle'); // 'idle', 'loading_user', 'error_loading'

  useEffect(() => {
    if (userId) {
      setPageStatus('loading_user');
      dispatch(fetchUserByIdAdmin(userId))
        .unwrap() // Pour attraper l'erreur ici si le thunk la rejette
        .then(() => setPageStatus('idle'))
        .catch(() => setPageStatus('error_loading'));
    }

    // Nettoyer l'erreur du slice quand on quitte la page ou si l'ID change
    return () => {
      if (error) { // Si une erreur globale du slice user existe
        dispatch(clearUserAdminError());
      }
    };
  }, [dispatch, userId, error]); // Relancer si error change pour permettre un nouvel essai

  const handleFormSuccess = () => {
    showSuccessToast('Utilisateur mis à jour avec succès !');
    navigate('/admin/users'); // Rediriger vers la liste des utilisateurs après succès
  };

  const handleFormCancel = () => {
    navigate('/admin/users'); // Rediriger vers la liste des utilisateurs
  };

  if (pageStatus === 'loading_user' || (status === 'loading' && !currentUser)) {
    return <LoadingSpinner fullPage message="Chargement des informations de l'utilisateur..." />;
  }

  if (pageStatus === 'error_loading' || (error && !currentUser)) {
    return (
      <div className="container mt-4">
        <PageHeader title="Erreur de Chargement" />
        <AlertMessage variant="danger">
          Impossible de charger les données de l'utilisateur. Veuillez réessayer plus tard.
          {typeof error === 'string' ? <p>{error}</p> : error?.message && <p>{error.message}</p>}
        </AlertMessage>
        <AppButton onClick={() => navigate('/admin/users')} variant="secondary">
          <Icon name="FaArrowLeft" style={{ marginRight: '8px' }} />
          Retour à la liste
        </AppButton>
      </div>
    );
  }

  if (!currentUser || currentUser._id !== userId) {
    // Si currentUser n'est pas (encore) celui qu'on attend, ou si l'ID ne correspond pas.
    // Cela peut arriver brièvement ou si le fetch a échoué sans mettre pageStatus à 'error_loading'.
    // On pourrait afficher un spinner plus discret ou un message.
    // Ou, si on est sûr que le fetch a échoué, le message d'erreur ci-dessus devrait s'afficher.
    // Pour l'instant, on peut supposer que le spinner ci-dessus couvre ce cas.
    // Si on arrive ici et que currentUser n'est pas le bon, c'est probablement une erreur.
    if (status !== 'loading') { // S'il n'est pas déjà en train de charger le bon
        console.warn('UserEditPage: currentUser in Redux store does not match userId from URL params, or is null.');
        // Peut-être rediriger ou afficher une erreur plus spécifique
    }
     return <LoadingSpinner fullPage message="Préparation du formulaire..." />; // Fallback
  }


  return (
    <div className="container-fluid mt-4 user-edit-page">
      <PageHeader
        title={`Modifier l'Utilisateur : ${currentUser.username}`}
        breadcrumbs={[
          { label: 'Admin', path: '/admin/dashboard-stats' }, // ou /admin
          { label: 'Utilisateurs', path: '/admin/users' },
          { label: 'Modifier', isActive: true },
        ]}
        showBackButton
        backButtonPath="/admin/users"
      />

      {/*
        UserForm gérera son propre état de soumission (isLoading, error de soumission).
        Il prendra `initialUser` pour pré-remplir les champs.
      */}
      <UserForm
        initialUser={currentUser}
        isEditMode={true}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  );
};

export default UserEditPage;