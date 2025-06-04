// frontend/src/components/common/PageHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// Optionnel: si vous voulez un style d'en-tête plus distinct
// import './PageHeader.css';

/**
 * Composant pour afficher un en-tête de page standardisé.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.title - Le titre principal de la page.
 * @param {React.ReactNode} [props.subtitle] - Un sous-titre ou une description optionnelle.
 * @param {React.ReactNode} [props.actions] - Des éléments d'action à afficher à droite (ex: boutons).
 * @param {string} [props.className='mb-4'] - Classes CSS supplémentaires pour le conteneur Row.
 * @param {React.ReactNode} [props.breadcrumbs] - Composant Fil d'Ariane à afficher au-dessus du titre.
 */
const PageHeader = ({
  title,
  subtitle,
  actions,
  className = 'mb-4', // Marge en bas par défaut
  breadcrumbs,
}) => {
  return (
    <div className={`page-header-container ${className}`}>
      {breadcrumbs && <div className="page-header-breadcrumbs mb-2">{breadcrumbs}</div>}
      <Row className="align-items-center">
        <Col>
          {/* Vous pouvez utiliser <h1>, <h2>, etc. en fonction de votre sémantique */}
          <h2 className="page-header-title mb-0">{title}</h2>
          {subtitle && (
            <p className="page-header-subtitle text-muted mb-0">{subtitle}</p>
          )}
        </Col>
        {actions && (
          <Col xs="auto" className="page-header-actions ms-auto">
            {/* ms-auto pousse les actions à droite */}
            {actions}
          </Col>
        )}
      </Row>
      {/* Optionnel: une ligne de séparation en dessous */}
      {/* <hr className="mt-2" /> */}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
  breadcrumbs: PropTypes.node,
};

export default PageHeader;