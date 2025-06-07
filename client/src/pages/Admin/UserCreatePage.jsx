import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux'; // Pas directement besoin ici si UserForm gère le dispatch

import UserForm from '../../components/users/UserForm';
import PageHeader from '../../components/common/PageHeader';
// import AppButton from '../../components/common/AppButton';
// import Icon from '../../components/common/Icon';

import { showSuccessToast } from '../../components/common/NotificationToast';

const UserCreatePage = () => {
  const navigate = useNavigate();
  // const dispatch = useDispatch(); // Pas nécessaire si UserForm dispatche createUserAdmin

  const handleFormSuccess = (createdUser) => { // UserForm pourrait retourner l'utilisateur créé
    showSuccessToast(`Utilisateur "${createdUser.username}" créé avec succès !`);
    navigate('/admin/users'); // Rediriger vers la liste des utilisateurs après succès
  };

  const handleFormCancel = () => {
    navigate('/admin/users'); // Rediriger vers la liste des utilisateurs
  };

  return (
    <div className="container-fluid mt-4 user-create-page">
      <PageHeader
        title="Créer un Nouvel Utilisateur"
        breadcrumbs={[
          { label: 'Admin', path: '/admin/dashboard-stats' }, // ou /admin
          { label: 'Utilisateurs', path: '/admin/users' },
          { label: 'Créer', isActive: true },
        ]}
        showBackButton
        backButtonPath="/admin/users"
      />

      {/*
        UserForm est appelé sans initialUser (ou initialUser={null}),
        et isEditMode sera false par défaut (ou explicitement false).
      */}
      <UserForm
        // initialUser={null} // Explicitement null ou omis
        isEditMode={false} // Indiquer qu'on est en mode création
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  );
};

export default UserCreatePage;