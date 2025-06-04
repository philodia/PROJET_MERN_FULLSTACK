// frontend/src/components/layout/Footer.jsx
import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Si vous avez des liens internes
import Icon from '../common/Icon'; // Votre composant Icon, optionnel
import './Footer.scss'; // Fichier SCSS pour les styles personnalisés du Footer

const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer bg-light text-center text-lg-start text-muted mt-auto">
      {/* Section: Liens Sociaux (Optionnel) */}
      <section className="d-flex justify-content-center justify-content-lg-between p-4 border-bottom social-links-section">
        <div className="me-5 d-none d-lg-block">
          <span>Restez connecté avec nous sur les réseaux sociaux :</span>
        </div>
        <div>
          <a href="#!" className="me-4 text-reset">
            <Icon name="FaFacebookF" lib="fa" title="Facebook"/>
          </a>
          <a href="#!" className="me-4 text-reset">
            <Icon name="FaTwitter" lib="fa" title="Twitter"/>
          </a>
          <a href="#!" className="me-4 text-reset">
            <Icon name="FaGoogle" lib="fa" title="Google"/>
          </a>
          <a href="#!" className="me-4 text-reset">
            <Icon name="FaInstagram" lib="fa" title="Instagram"/>
          </a>
          <a href="#!" className="me-4 text-reset">
            <Icon name="FaLinkedinIn" lib="fa" title="LinkedIn"/>
          </a>
          <a href="#!" className="me-4 text-reset">
            <Icon name="FaGithub" lib="fa" title="GitHub"/>
          </a>
        </div>
      </section>

      {/* Section: Liens Principaux du Footer */}
      <section className="main-links-section">
        <Container className="text-center text-md-start mt-5">
          <Row className="mt-3">
            <Col md="3" lg="4" xl="3" className="mx-auto mb-4">
              <h6 className="text-uppercase fw-bold mb-4">
                <Icon name="BsKanban" className="me-2" /> GestionApp
              </h6>
              <p>
                Votre solution complète de gestion commerciale et comptable,
                intuitive, sécurisée et performante.
              </p>
            </Col>

            <Col md="2" lg="2" xl="2" className="mx-auto mb-4 footer-links-column">
              <h6 className="text-uppercase fw-bold mb-4">Produits</h6>
              <Nav className="flex-column">
                <Nav.Link as={Link} to="/features" className="p-0 text-reset">Fonctionnalités</Nav.Link>
                <Nav.Link as={Link} to="/pricing" className="p-0 text-reset">Tarifs</Nav.Link>
                <Nav.Link as={Link} to="/integrations" className="p-0 text-reset">Intégrations</Nav.Link>
              </Nav>
            </Col>

            <Col md="3" lg="2" xl="2" className="mx-auto mb-4 footer-links-column">
              <h6 className="text-uppercase fw-bold mb-4">Liens Utiles</h6>
              <Nav className="flex-column">
                <Nav.Link as={Link} to="/help-center" className="p-0 text-reset">Centre d'Aide</Nav.Link>
                <Nav.Link as={Link} to="/contact" className="p-0 text-reset">Contactez-nous</Nav.Link>
                <Nav.Link as={Link} to="/terms-of-service" className="p-0 text-reset">Conditions d'Utilisation</Nav.Link>
                <Nav.Link as={Link} to="/privacy-policy" className="p-0 text-reset">Politique de Confidentialité</Nav.Link>
              </Nav>
            </Col>

            <Col md="4" lg="3" xl="3" className="mx-auto mb-md-0 mb-4">
              <h6 className="text-uppercase fw-bold mb-4">Contact</h6>
              <p><Icon name="BsGeoAltFill" className="me-2" /> 123 Rue Fictive, 75000 Paris, France</p>
              <p><Icon name="BsEnvelopeFill" className="me-2" /> info@gestionapp.dev</p>
              <p><Icon name="BsTelephoneFill" className="me-2" /> + 33 1 23 45 67 89</p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Section: Copyright */}
      <div className="text-center p-4 copyright-section" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
        © {currentYear} Copyright :
        <a className="text-reset fw-bold ms-1" href="https://gestionapp.dev/">
          GestionApp.dev
        </a>
      </div>
    </footer>
  );
};

// Pas de PropTypes nécessaires si le composant ne reçoit pas de props externes.
// Si vous ajoutez des props, n'oubliez pas de les définir.
// Footer.propTypes = {};

export default AppFooter;