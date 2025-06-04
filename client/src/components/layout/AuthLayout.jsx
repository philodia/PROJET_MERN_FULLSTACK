// frontend/src/components/layout/AuthLayout.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Pour le logo ou lien vers l'accueil
import Icon from '../common/Icon'; // Votre composant Icon, optionnel
import './AuthLayout.scss'; // Fichier SCSS pour les styles personnalisés

/**
 * Layout spécifique pour les pages d'authentification (Login, Register, Forgot Password, etc.).
 * Centre le contenu et fournit un cadre simple.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Le contenu du formulaire d'authentification (ex: le composant LoginPage).
 * @param {string} [props.pageTitle] - Titre affiché en haut du Card (ex: "Connexion", "Créer un compte").
 * @param {string} [props.cardClassName] - Classes CSS supplémentaires pour le composant Card.
 */
const AuthLayout = ({ children, pageTitle, cardClassName = '' }) => {
  return (
    <div className="auth-layout-wrapper min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light">
      <Container fluid="sm"> {/* Utiliser fluid="sm" pour un conteneur qui devient un peu plus large sur sm et plus */}
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5} xxl={4}>
            <div className="auth-logo-header text-center mb-4">
              <Link to="/" className="text-decoration-none text-dark">
                {/* Remplacez par votre logo si vous en avez un */}
                {/* <img src="/path-to-your-logo.png" alt="Logo GestionApp" style={{ height: '50px' }} /> */}
                <Icon name="BsKanban" size="2.5em" className="mb-2" color="var(--bs-primary)" />
                <h2 className="h4">GestionApp</h2>
              </Link>
            </div>

            <Card className={`auth-card shadow-sm ${cardClassName}`}>
              {pageTitle && (
                <Card.Header className="text-center bg-primary text-white">
                  <h3 className="h5 mb-0">{pageTitle}</h3>
                </Card.Header>
              )}
              <Card.Body className="p-4 p-md-5">
                {children}
              </Card.Body>
            </Card>

            <div className="auth-footer-links text-center mt-4">
              <small className="text-muted">
                <Link to="/terms-of-service" className="text-muted me-3">Conditions</Link>
                <Link to="/privacy-policy" className="text-muted">Confidentialité</Link>
              </small>
            </div>
             <div className="text-center mt-2">
                <small className="text-muted">© {new Date().getFullYear()} GestionApp. Tous droits réservés.</small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  pageTitle: PropTypes.string,
  cardClassName: PropTypes.string,
};

export default AuthLayout;