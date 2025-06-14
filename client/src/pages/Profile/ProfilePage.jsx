// frontend/src/pages/Profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux'; // Non utilisé directement ici si les forms gèrent leur dispatch
import { Row, Col, Card, Image, Tabs, Tab, ListGroup } from 'react-bootstrap';

import PageContainer from '../../components/layout/PageContainer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import Icon from '../../components/common/Icon';

import UpdateProfileForm from '../../components/profile/UpdateProfileForm';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';

import { useAuth } from '../../hooks/useAuth';
import { showSuccessToast, showErrorToast } from '../../components/common/NotificationToast';

import defaultAvatar from '../../assets/images/default-avatar.png'; // Vérifier le chemin

const ProfilePage = () => {
  const { user, isLoading: authIsLoading, error: authErrorObject, status: authStatus } = useAuth();
  // authErrorObject pour éviter conflit avec une variable 'error' potentielle

  const [activeTab, setActiveTab] = useState('profileInfo'); // 'profileInfo' ou 'security'

  useEffect(() => {
    // Afficher une erreur toast si le chargement initial du profil via useAuth a échoué
    if (authStatus === 'failed' && authErrorObject) {
      showErrorToast(`Erreur profil: ${authErrorObject.message || JSON.stringify(authErrorObject)}`);
    }
  }, [authStatus, authErrorObject]);

  // Fonctions de formatage de date (peuvent être externalisées dans utils/formatters.js)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric' // 'short' pour le mois ex: 'avr.'
      });
    } catch (e) { return 'Date invalide'; }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Jamais';
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return 'Date invalide'; }
  };

  const getRoleDisplayName = (role) => {
    if (!role) return 'Rôle non défini';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const getRoleIconName = (role) => {
    switch (role) {
      case 'ADMIN': return 'BsPersonLock'; // Icône plus spécifique pour admin
      case 'MANAGER': return 'BsPersonVideo3'; // Exemple pour manager
      case 'ACCOUNTANT': return 'BsPersonGear'; // Exemple pour comptable
      default: return 'BsPerson';
    }
  };


  if (authIsLoading && authStatus !== 'succeeded' && authStatus !== 'failed') {
    // Afficher le spinner uniquement si on charge et qu'on n'a pas encore réussi ou échoué
    return (
      <PageContainer title="Mon Profil" fluid>
        <LoadingSpinner fullPage message="Chargement de votre profil..." />
      </PageContainer>
    );
  }

  if (!user) {
    // Si l'utilisateur n'est pas chargé (soit à cause d'une erreur, soit non authentifié)
    return (
      <PageContainer title="Mon Profil" fluid>
        <AlertMessage variant="warning" className="text-center">
          {authErrorObject ?
            `Erreur de chargement du profil: ${authErrorObject.message || JSON.stringify(authErrorObject)}` :
            "Veuillez vous connecter pour accéder à votre profil."}
        </AlertMessage>
      </PageContainer>
    );
  }

  const handleProfileUpdateSuccess = (updatedUserData) => {
    showSuccessToast("Votre profil a été mis à jour avec succès !");
    // Le hook useAuth devrait refléter les changements si authSlice.user est mis à jour
    // par le thunk updateUserProfile (dispatché depuis UpdateProfileForm).
  };

  const handlePasswordChangeSuccess = () => {
    showSuccessToast("Votre mot de passe a été modifié avec succès !");
    // Après un changement de mot de passe, il est bon de rappeler à l'utilisateur
    // que sa session pourrait être invalidée sur d'autres appareils.
  };

  return (
    <PageContainer
        title="Mon Profil"
        fluid
        breadcrumbs={[{ label: 'Profil', isActive: true }]}
    >
      <Row>
        <Col md={4} lg={3} className="mb-3 mb-md-0">
          <Card className="shadow-sm profile-card">
            <Card.Body className="text-center p-4">
              <Image
                src={user.avatarUrl || defaultAvatar}
                roundedCircle
                className="mb-3 profile-avatar"
                alt={`Avatar de ${user.fullName || user.username}`}
                // Style déplacé en SCSS si possible, mais ok ici pour la taille
                style={{ width: '120px', height: '120px', objectFit: 'cover', border: `3px solid ${'var(--bs-border-color-translucent)' || '#dee2e6'}` }}
              />
              <h4 className="mb-0 profile-username">{user.fullName || user.username}</h4>
              <p className="text-muted mb-1 profile-email">{user.email}</p>
              <div className="profile-role text-muted">
                <Icon name={getRoleIconName(user.role)} className="me-1" />
                {getRoleDisplayName(user.role)}
              </div>
            </Card.Body>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between align-items-center p-3">
                  <span className="text-muted small"><Icon name="BsCalendar2Check" className="me-2"/>Inscription</span>
                  <strong>{formatDate(user.createdAt)}</strong>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between align-items-center p-3">
                  <span className="text-muted small"><Icon name="BsClockHistory" className="me-2"/>Dernière connexion</span>
                  <strong>{formatDateTime(user.lastLogin)}</strong>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col md={8} lg={9}>
          <Card className="shadow-sm profile-tabs-card">
            <Tabs
              id="profile-tabs-main"
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="nav-underline nav-justified px-3 pt-1" // Style d'onglets Bootstrap 5
              // justify // Retiré car nav-justified le fait déjà
            >
              <Tab
                eventKey="profileInfo"
                title={
                  <span className="d-flex align-items-center fw-medium py-2">
                    <Icon name="BsPersonVcard" className="me-2" /> Informations
                  </span>
                }
              >
                <Card.Body className="p-sm-4 p-3"> {/* Padding responsive */}
                  <h5 className="card-title mb-3">Modifier mes informations</h5>
                  <UpdateProfileForm
                    currentUser={user}
                    onSuccess={handleProfileUpdateSuccess}
                  />
                </Card.Body>
              </Tab>
              <Tab
                eventKey="security"
                title={
                  <span className="d-flex align-items-center fw-medium py-2">
                    <Icon name="BsShieldLock" className="me-2" /> Sécurité
                  </span>
                }
              >
                <Card.Body className="p-sm-4 p-3">
                  <h5 className="card-title mb-3">Changer mon mot de passe</h5>
                  <ChangePasswordForm
                    onSuccess={handlePasswordChangeSuccess}
                  />
                </Card.Body>
              </Tab>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default ProfilePage;