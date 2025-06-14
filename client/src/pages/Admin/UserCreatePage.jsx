import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux'; // Non utilisé ici, UserForm gère le dispatch

import UserForm from '../../components/users/UserForm';
import PageHeader from '../../components/common/PageHeader';
import PageContainer from '../../components/layout/PageContainer'; // Ajouté pour la cohérence
// import AppButton from '../../components/common/AppButton'; // Non utilisé directement ici
// import Icon from '../../components/common/Icon'; // Non utilisé directement ici

import { showSuccessToast } from '../../components/common/NotificationToast';

const UserCreatePage = () => {
  const navigate = useNavigate();

  const handleFormSuccess = (createdUser) => {
    // createdUser est l'objet utilisateur retourné par le thunk createUserAdmin
    // et potentiellement passé par le callback onSuccess de UserForm
    showSuccessToast(`L'utilisateur "${createdUser.username || 'Nouveau'}" a été créé avec succès !`);
    navigate('/admin/users', { replace: true }); // Rediriger et remplacer l'entrée dans l'historique
  };

  const handleFormCancel = () => {
    navigate('/admin/users');
  };

  return (
    <PageContainer // Utiliser PageContainer pour le layout standard
      title="Créer un Nouvel Utilisateur" // Le titre peut aussi être géré par PageHeader si PageContainer ne le fait pas
      fluid // Si vous voulez que le contenu prenne toute la largeur
      breadcrumbs={[
        { label: 'Administration', path: '/admin/users' }, // Lien vers la liste des utilisateurs
        { label: 'Créer Utilisateur', isActive: true },
      ]}
    >
      {/* PageHeader peut être redondant si PageContainer gère déjà le titre et le fil d'Ariane */}
      {/* Si PageContainer ne gère pas le titre/breadcrumbs, gardez PageHeader : */}
      <PageHeader
        title="Créer un Nouvel Utilisateur"
        // breadcrumbs sont déjà dans PageContainer, enlever ici pour éviter duplication
        // breadcrumbs={[
        //   { label: 'Admin', path: '/admin/dashboard-stats' },
        //   { label: 'Utilisateurs', path: '/admin/users' },
        //   { label: 'Créer', isActive: true },
        // ]}
        showBackButton
        backButtonPath="/admin/users"
        // Vous pourriez ne pas avoir besoin du titre de PageHeader si PageContainer le gère
      />

      <div className="user-create-form-wrapper mt-3"> {/* Wrapper pour un espacement ou style additionnel si besoin */}
        <UserForm
          // initialUser={null} // Pas besoin de le passer, UserForm devrait avoir des valeurs par défaut
          isEditMode={false} // Indique clairement le mode création
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    </PageContainer>
  );
};

export default UserCreatePage;