// frontend/src/components/layout/Navbar.jsx

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { logout as logoutAction } from '../../features/auth/authSlice';
import Icon from '../common/Icon';

const AppNavbar = () => {
  const { user, isAuthenticated, isAdmin, hasRole } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="lg" className="app-navbar shadow-sm mb-3">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <Icon name="BsKanban" size="1.5em" className="me-2" color="var(--bs-primary)" />
          GestionApp
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <Nav.Link as={NavLink} to="/dashboard">
                <Icon name="BsGrid1X2Fill" className="me-1" />
                Tableau de Bord
              </Nav.Link>
            )}

            {isAuthenticated && hasRole?.(['ADMIN', 'MANAGER']) && (
              <NavDropdown
                title={
                  <>
                    <Icon name="BsBriefcaseFill" className="me-1" />
                    Commercial
                  </>
                }
                id="commercial-nav-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/clients">Clients</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/suppliers">Fournisseurs</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/products">Produits & Stock</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={NavLink} to="/quotes">Devis</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/delivery-notes">Bons de Livraison</NavDropdown.Item>
              </NavDropdown>
            )}

            {isAuthenticated && hasRole?.(['ADMIN', 'ACCOUNTANT', 'MANAGER']) && (
              <Nav.Link as={NavLink} to="/invoices">
                <Icon name="BsFileEarmarkTextFill" className="me-1" />
                Factures
              </Nav.Link>
            )}

            {isAuthenticated && hasRole?.(['ADMIN', 'ACCOUNTANT']) && (
              <NavDropdown
                title={
                  <>
                    <Icon name="BsCalculatorFill" className="me-1" />
                    Comptabilité
                  </>
                }
                id="accounting-nav-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/accounting/journal">Journal</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/accounting/ledger">Grand Livre</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/accounting/balance-sheet">Bilan</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={NavLink} to="/accounting/chart-of-accounts">Plan Comptable</NavDropdown.Item>
              </NavDropdown>
            )}

            {isAuthenticated && isAdmin && (
              <NavDropdown
                title={
                  <>
                    <Icon name="BsGearFill" className="me-1" />
                    Administration
                  </>
                }
                id="admin-nav-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/admin/user-management">Utilisateurs</NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/admin/security-logs">Journaux Sécurité</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          <Nav>
            {isAuthenticated && user ? (
              <NavDropdown
                title={
                  <>
                    <Icon
                      name={
                        user.role === 'ADMIN'
                          ? 'BsPersonWorkspace'
                          : user.role === 'MANAGER'
                          ? 'BsPersonBadgeFill'
                          : 'BsPersonFill'
                      }
                      className="me-1"
                    />
                    {user.username || user.email}
                  </>
                }
                id="user-nav-dropdown"
                align="end"
              >
                <NavDropdown.Item as={NavLink} to="/profile">
                  <Icon name="BsPersonCircle" className="me-2" />
                  Profil
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <Icon name="BsBoxArrowRight" className="me-2" />
                  Déconnexion
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              {/*<Nav.Link as={NavLink} to="/login">
                <Icon name="BsBoxArrowInRight" className="me-1" />
                Connexion
              </Nav.Link>*/}
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
