// frontend/src/components/layout/PageContainer.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Container from 'react-bootstrap/Container'; // Utilise Container de React-Bootstrap pour la base
import './PageContainer.scss'; // Pour les styles personnalisés si nécessaire

/**
 * Conteneur standard pour le contenu principal des pages de l'application.
 * Gère le padding, une largeur maximale optionnelle, et peut être étendu
 * pour inclure des en-têtes de page ou d'autres éléments communs.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Le contenu de la page à afficher à l'intérieur du conteneur.
 * @param {string} [props.title] - Titre optionnel à afficher en haut de la page. (Peut être géré par un composant PageHeader séparé)
 * @param {boolean} [props.fluid=false] - Si le conteneur doit prendre toute la largeur disponible (Container fluid).
 *                                       Par défaut, il a une largeur maximale pour les grands écrans.
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'} [props.breakpoint] - Point de rupture pour la largeur maximale du conteneur non-fluide.
 * @param {string} [props.className] - Classes CSS supplémentaires à appliquer au conteneur.
 * @param {object} [props.style] - Styles en ligne supplémentaires.
 * @param {React.ReactNode} [props.pageHeaderActions] - Actions à afficher dans l'en-tête de page (ex: boutons).
                                                        (Généralement géré par un composant PageHeader dédié)
 */
const PageContainer = ({
  children,
  title, // Optionnel: peut être géré par un composant PageHeader séparé
  fluid = false,
  breakpoint, // sm, md, lg, xl, xxl pour la largeur max du conteneur non-fluide
  className = '',
  style = {},
  // pageHeaderActions, // Si vous voulez intégrer un PageHeader simple ici
}) => {
  // Si vous voulez un PageHeader plus complexe, il est préférable de le garder comme un composant séparé
  // et de l'utiliser à l'intérieur des pages spécifiques, ou de l'intégrer ici de manière plus structurée.
  // Pour cet exemple, le titre est simple.

  return (
    <div className={`page-container-wrapper ${className}`} style={style}>
      <Container fluid={fluid} {...(breakpoint && !fluid ? { fluid: breakpoint } : {})}>
        {/* Optionnel : En-tête de page simple intégré */}
        {title && (
          <header className="page-container-header mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="page-title h3 mb-0">{title}</h1>
              {/* Si vous avez des actions pour l'en-tête */}
              {/* {pageHeaderActions && <div className="page-header-actions">{pageHeaderActions}</div>} */}
            </div>
            <hr className="mt-2 mb-0" />
          </header>
        )}

        <div className="page-container-content">
          {children}
        </div>
      </Container>
    </div>
  );
};

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  fluid: PropTypes.bool,
  breakpoint: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'xxl']),
  className: PropTypes.string,
  style: PropTypes.object,
  // pageHeaderActions: PropTypes.node,
};

export default PageContainer;