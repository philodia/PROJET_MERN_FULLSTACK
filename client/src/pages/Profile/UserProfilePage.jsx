import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Image,
  Tabs,
  Tab,
  ListGroup
} from 'react-bootstrap';

import PageContainer from '../../components/layout/PageContainer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import Icon from '../../components/common/Icon';

import UpdateProfileForm from '../../components/profile/UpdateProfileForm';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';

import { useAuth } from '../../hooks/useAuth';
import { showSuccessToast, showErrorToast } from '../../components/common/NotificationToast';

import defaultAvatar from '../../assets/images/default-avatar.png';

// Fonctions utilitaires pour le formatage des dates
const formatRole = (role) => 
  role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'N/A';

const formatDate = (date) => 
  date ? new Date(date).toLocaleDateString('fr-FR') : 'N/A';

const formatDateTime = (date) => 
  date ? new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Jamais';

const UserProfilePage = () => {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (authError) {
      showErrorToast(`Erreur de chargement du profil: ${authError}`);
    }
  }, [authError]);

  // Gestion du chargement initial
  useEffect(() => {
    if (!authLoading && user) {
      setIsInitialLoad(false);
    }
  }, [authLoading, user]);

  if (isInitialLoad && authLoading) {
    return (
      <PageContainer title="Mon Profil" fluid>
        <LoadingSpinner fullPage message="Chargement de votre profil..." />
      </PageContainer>
    );
  }

  if (authError && !user) {
    return (
      <PageContainer title="Mon Profil" fluid>
        <AlertMessage variant="danger">
          Erreur lors du chargement de votre profil : {authError}
        </AlertMessage>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title="Mon Profil" fluid>
        <AlertMessage variant="warning">
          Veuillez vous connecter pour voir votre profil.
        </AlertMessage>
      </PageContainer>
    );
  }

  const handleProfileUpdateSuccess = () => {
    showSuccessToast("Votre profil a été mis à jour avec succès !");
  };

  const handlePasswordChangeSuccess = () => {
    showSuccessToast("Votre mot de passe a été modifié avec succès !");
  };

  return (
    <PageContainer 
      title="Mon Profil" 
      fluid 
      breadcrumbs={[{ label: 'Profil', isActive: true }]}
    >
      <Row>
        <Col md={4} lg={3} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <div className="d-flex justify-content-center mb-3">
                <Image
                  src={user.avatarUrl || defaultAvatar}
                  roundedCircle
                  fluid
                  alt={`Avatar de ${user.fullName || user.username}`}
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    border: '3px solid #eaeaea'
                  }}
                />
              </div>
              
              <h4 className="mb-0">{user.fullName || user.username}</h4>
              <p className="text-muted mb-1">{user.email}</p>
              <p className="d-flex align-items-center justify-content-center">
                <Icon 
                  name={
                    user.role === 'ADMIN' ? 'BsPersonBadgeFill' : 
                    user.role === 'MANAGER' ? 'BsBriefcaseFill' : 
                    user.role === 'ACCOUNTANT' ? 'BsCalculatorFill' : 'BsPersonFill'
                  } 
                  className="me-2" 
                />
                {formatRole(user.role)}
              </p>
            </Card.Body>
            
            <ListGroup variant="flush" className="border-top">
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <span className="text-muted">
                  <Icon name="BsCalendarCheck" className="me-2" />
                  Membre depuis
                </span>
                <strong>{formatDate(user.createdAt)}</strong>
              </ListGroup.Item>
              
              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                <span className="text-muted">
                  <Icon name="BsClockHistory" className="me-2" />
                  Dernière connexion
                </span>
                <strong>{formatDateTime(user.lastLogin)}</strong>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col md={8} lg={9}>
          <Card>
            <Tabs
              id="profile-tabs"
              activeKey={activeTab}
              onSelect={setActiveTab}
              className="mb-3 nav-tabs-bordered"
              justify
            >
              <Tab
                eventKey="profile"
                title={
                  <span className="d-flex align-items-center">
                    <Icon name="BsPersonFill" className="me-1" /> 
                    Informations du Profil
                  </span>
                }
              >
                <Card.Body>
                  <Card.Title as="h5" className="mb-3">
                    Modifier le Profil
                  </Card.Title>
                  <UpdateProfileForm
                    currentUser={user}
                    onSuccess={handleProfileUpdateSuccess}
                  />
                </Card.Body>
              </Tab>
              
              <Tab
                eventKey="security"
                title={
                  <span className="d-flex align-items-center">
                    <Icon name="BsShieldLockFill" className="me-1" /> 
                    Sécurité
                  </span>
                }
              >
                <Card.Body>
                  <Card.Title as="h5" className="mb-3">
                    Changer le Mot de Passe
                  </Card.Title>
                  <ChangePasswordForm onSuccess={handlePasswordChangeSuccess} />
                </Card.Body>
              </Tab>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default UserProfilePage;