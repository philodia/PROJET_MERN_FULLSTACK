// frontend/src/components/common/LoadingSpinner.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Spinner from 'react-bootstrap/Spinner';
import './LoadingSpinner.css';

/**
 * Composant réutilisable pour afficher un indicateur de chargement (spinner).
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} [props.animation='border'] - Type d'animation du spinner ('border' ou 'grow').
 * @param {string} [props.variant='primary'] - Couleur du spinner (primary, secondary, success, etc.).
 * @param {string} [props.size='md'] - Taille du spinner ('sm', 'md' (par défaut implicite), ou via CSS).
 * @param {string} [props.message] - Message optionnel à afficher sous ou à côté du spinner.
 * @param {boolean} [props.fullScreen=false] - Si vrai, centre le spinner en plein écran avec un overlay.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le conteneur.
 * @param {object} [props.style] - Styles en ligne supplémentaires pour le conteneur.
 */
const LoadingSpinner = ({
  animation = 'border',
  variant = 'primary',
  size = 'md', // 'sm' est une option explicite, 'md' est la taille par défaut de Spinner, 'lg' n'existe pas comme prop, il faut du CSS
  message,
  fullScreen = false,
  className = '',
  style = {},
}) => {
  const spinnerSize = size === 'sm' ? 'sm' : undefined; // La prop `size` de Spinner n'accepte que 'sm'

  const spinnerStyle = size === 'lg' ? { width: '3rem', height: '3rem' } : {}; // Style pour une grande taille

  const spinner = (
    <div
      className={`loading-spinner-container d-flex flex-column align-items-center justify-content-center ${className}`}
      style={style}
    >
      <Spinner
        animation={animation}
        variant={variant}
        role="status"
        size={spinnerSize} // 'sm' ou undefined (pour taille par défaut/moyenne)
        style={spinnerStyle} // Appliquer le style pour 'lg'
      >
        <span className="visually-hidden">Chargement...</span>
      </Spinner>
      {message && <div className="mt-2 spinner-message">{message}</div>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  animation: PropTypes.oneOf(['border', 'grow']),
  variant: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default LoadingSpinner;