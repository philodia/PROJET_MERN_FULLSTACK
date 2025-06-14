// frontend/src/components/layout/Navbar.jsx
import React from 'react';
// import PropTypes from 'prop-types'; // Ajoutez si vous introduisez des props
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // useSelector pour isLoading
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
// Importer le THUNK pour la déconnexion et le sélecteur pour l'état de chargement
import { performLogout, selectAuthIsLoading } from '../../features/auth/authSlice';
import Icon from '../common/Icon';
import './Navbar.scss'; // Assurez-vous d'importer vos styles si vous en avez des spécifiques

const AppNavbar = () => {
  const { user, isAuthenticated, isAdmin, hasRole } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authIsLoading = useSelector(selectAuthIsLoading); // Pour le bouton de déconnexion

  const handleLogout = async () => {
    try {
      await dispatch(performLogout()).unwrap(); // Dispatcher le thunk
      navigate('/login', { replace: true }); // Rediriger après la déconnexion
    } catch (error) {
      console.error("Erreur lors de la déconnexion (capturée dans Navbar):", error);
      // Même si l'API de logout serveur échoue, l'état client devrait être nettoyé.
      // On redirige quand même.
      navigate('/login', { replace: true });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return 'BsPersonWorkspace';
      case 'MANAGER': return 'BsPersonBadgeFill';
      case 'ACCOUNTANT': return 'BsPersonVideo3'; // Exemple, choisir une icône pertinente
      default: return 'BsPersonFill';
    }
  };

  return (
    <Navbar bg="light" expand="lg" className="app-navbar shadow-sm mb-3 sticky-top"> {/* Ajout de sticky-top */}
      <Container fluid="xl"> {/* Utiliser fluid="xl" pour pleine largeur jusqu'à xl, puis conteneur normal */}
        <Navbar.Brand as={Link} to={isAuthenticated ? "/dashboard" : "/"} className="d-flex align-items-center">
          <Icon name="BsJournalRichtext" size="1.6em" className="me-2" color="var(--bs-primary)" />
          <span className="fw-bolder">GestionApp</span> {/* fw-bolder pour un peu plus d'emphase */}
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="app-navbar-nav" />
        <Navbar.Collapse id="app-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <Nav.Link as={NavLink} to="/dashboard" end> {/* `end` pour correspondance exacte */}
                <Icon name="BsGrid1X2Fill" className="me-1" />
                Tableau de Bord
              </Nav.Link>
            )}

            {/* Menu Commercial */}
            {isAuthenticated && hasRole(['ADMIN', 'MANAGER']) && (
              <NavDropdown
                title={
                  <>
                    <Icon name="BsBriefcaseFill" className="me-1" />
                    Commercial
                  </>
                }
                id="commercial-nav-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/clients"><Icon name="BsPeopleFill" className="me-2"/>Clients</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/suppliers"><Icon name="BsTruck" className="me-2"/>Fournisseurs</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/products"><Icon name="BsBoxSeam" className="me-2"/>Produits & Stock</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={NavLink} to="/quotes"><Icon name="BsFileEarmarkRuledFill" className="me-2"/>Devis</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/delivery-notes"><Icon name="BsFileEarmarkZipFill" className="me-2"/>Bons de Livraison</NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Menu Facturation (accessible aussi par Manager) */}
            {isAuthenticated && hasRole(['ADMIN', 'MANAGER', 'ACCOUNTANT']) && (
              <Nav.Link as={NavLink} to="/invoices">
                <Icon name="BsFileEarmarkTextFill" className="me-1" />
                Facturation
              </Nav.Link>
            )}

            {/* Menu Comptabilité */}
            {isAuthenticated && hasRole(['ADMIN', 'ACCOUNTANT']) && (
              <NavDropdown
                title={
                  <>
                    <Icon name="BsCalculatorFill" className="me-1" />
                    Comptabilité
                  </>
                }
                id="accounting-nav-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/accounting/journal"><Icon name="BsJournalText" className="me-2"/>Journal</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/accounting/ledger"><Icon name="BsBookHalf" className="me-2"/>Grand Livre</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/accounting/balance-sheet"><Icon name="BsBarChartLineFill" className="me-2"/>Bilan</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={NavLink} to="/accounting/chart-of-accounts"><Icon name="BsDiagram3Fill" className="me-2"/>Plan Comptable</NavDropdown.Item>
              </NavDropdown>
            )}

            {/* Menu Administration */}
            {isAuthenticated && isAdmin && ( // isAdmin est plus direct ici
              <NavDropdown
                title={
                  <>
                    <Icon name="BsGearFill" className="me-1" />
                    Administration
                  </>
                }
                id="admin-nav-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/admin/users"><Icon name="BsPersonLinesFill" className="me-2"/>Utilisateurs</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/security-logs"><Icon name="BsShieldLockFill" className="me-2"/>Journaux Sécurité</NavDropdown.Item>
                {/* <NavDropdown.Item as={NavLink} to="/admin/settings"><Icon name="BsWrenchAdjustable" className="me-2"/>Paramètres</NavDropdown.Item> */}
              </NavDropdown>
            )}
          </Nav>

          {/* Menu Utilisateur à Droite */}
          <Nav>
            {isAuthenticated && user ? (
              <NavDropdown
                title={
                  <div className="d-flex align-items-center">
                    <Icon name={getRoleIcon(user.role)} className="me-2" />
                    <span>{user.firstName || user.username}</span>
                  </div>
                }
                id="user-nav-dropdown"
                align="end" // Aligner le dropdown à droite
              >
                <NavDropdown.Item as={NavLink} to="/profile">
                  <Icon name="BsPersonCircle" className="me-2" />
                  Mon Profil
                </NavDropdown.Item>
                {/* Vous pouvez ajouter d'autres liens ici (ex: Mes paramètres) */}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} disabled={authIsLoading}>
                  <Icon name="BsBoxArrowRight" className="me-2" />
                  {authIsLoading ? 'Déconnexion...' : 'Déconnexion'}
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              // Liens de connexion/inscription si l'utilisateur n'est pas authentifié
              <>
                <Nav.Link as={NavLink} to="/login">
                  <Icon name="BsBoxArrowInRight" className="me-1" />
                  Connexion
                </Nav.Link>
                {/* Décommentez si vous avez une page d'inscription publique
                <Nav.Link as={NavLink} to="/register">
                  <Icon name="BsPersonPlusFill" className="me-1" />
                  S'inscrire
                </Nav.Link>
                */}
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

// AppNavbar.propTypes = {}; // Ajoutez si vous avez des props

export default AppNavbar;