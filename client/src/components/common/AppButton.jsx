// frontend/src/components/common/AppButton.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

/**
 * Composant de bouton personnalisé avec gestion de l'état de chargement et icônes.
 */
const AppButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size,
  isLoading = false,
  loadingText = 'Chargement...',
  disabled = false,
  className = '',
  style = {},
  icon,
  iconPosition = 'left',
  ...otherProps
}) => {
  const isDisabled = isLoading || disabled;

  const renderButtonIcon = () => {
    if (!icon) return null;
    // Assurez-vous d'avoir du CSS pour ces classes, par exemple :
    // .app-button-icon-left { margin-right: 0.5em; }
    // .app-button-icon-right { margin-left: 0.5em; }
    return <span className={`app-button-icon app-button-icon-${iconPosition}`}>{icon}</span>;
  };

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isDisabled}
      className={`app-button ${isLoading ? 'app-button-loading' : ''} ${className}`}
      style={style}
      {...otherProps}
    >
      {isLoading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2" // Bootstrap class pour margin-end
          />
          {loadingText}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && renderButtonIcon()}
          {children}
          {icon && iconPosition === 'right' && renderButtonIcon()}
        </>
      )}
    </Button>
  );
};

AppButton.propTypes = {
  /** Le contenu du bouton (texte, autre icône via children) */
  children: PropTypes.node.isRequired,
  /** Fonction à appeler lors du clic */
  onClick: PropTypes.func,
  /** Le type HTML du bouton */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Le style du bouton (de React-Bootstrap ou personnalisé) */
  variant: PropTypes.string,
  /** La taille du bouton ('sm', 'lg') */
  size: PropTypes.oneOf(['sm', 'lg', undefined]), // undefined est la taille par défaut
  /** Si vrai, affiche un spinner et désactive le bouton */
  isLoading: PropTypes.bool,
  /** Texte à afficher à côté du spinner pendant le chargement */
  loadingText: PropTypes.string,
  /** Si le bouton doit être désactivé (en plus de l'état isLoading) */
  disabled: PropTypes.bool,
  /** Classes CSS supplémentaires */
  className: PropTypes.string,
  /** Styles en ligne supplémentaires */
  style: PropTypes.object,
  /** Une icône à afficher (composant React, ex: <FaIcon />) */
  icon: PropTypes.node,
  /** Position de l'icône par rapport au texte ('left', 'right') */
  iconPosition: PropTypes.oneOf(['left', 'right']),
};

export default AppButton;