// frontend/src/components/common/AlertMessage.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Alert from 'react-bootstrap/Alert'; // Importe le composant Alert de React-Bootstrap

/**
 * Composant réutilisable pour afficher des messages d'alerte.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.variant - Le style de l'alerte ('success', 'danger', 'warning', 'info', 'primary', 'secondary', 'light', 'dark').
 * @param {React.ReactNode} props.children - Le contenu du message à afficher.
 * @param {boolean} [props.show=true] - Contrôle la visibilité de l'alerte.
 * @param {function} [props.onClose] - Fonction à appeler lorsque l'alerte est fermée (si `dismissible` est vrai).
 * @param {boolean} [props.dismissible=false] - Si l'alerte peut être fermée par l'utilisateur.
 * @param {string} [props.className] - Classes CSS supplémentaires à appliquer.
 * @param {object} [props.style] - Styles en ligne supplémentaires.
 */
const AlertMessage = ({
  variant,
  children,
  show = true,
  onClose,
  dismissible = false,
  className = '',
  style = {},
  ...otherProps // Pour passer d'autres props au composant Alert de React-Bootstrap
}) => {
  if (!show || !children) {
    return null; // Ne rien rendre si show est faux ou s'il n'y a pas de message
  }

  return (
    <Alert
      variant={variant}
      show={show} // React-Bootstrap Alert gère sa propre visibilité via `show`
      onClose={onClose}
      dismissible={dismissible}
      className={`custom-alert ${className}`} // Permet d'ajouter des classes personnalisées
      style={style}
      {...otherProps}
    >
      {children}
    </Alert>
  );
};

AlertMessage.propTypes = {
  variant: PropTypes.oneOf([
    'success',
    'danger',
    'warning',
    'info',
    'primary',
    'secondary',
    'light',
    'dark',
  ]).isRequired,
  children: PropTypes.node.isRequired,
  show: PropTypes.bool,
  onClose: PropTypes.func,
  dismissible: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default AlertMessage;