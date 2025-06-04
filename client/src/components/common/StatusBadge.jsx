// frontend/src/components/common/StatusBadge.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Badge from 'react-bootstrap/Badge';
import TooltipWrapper from './TooltipWrapper'; // Optionnel, pour ajouter un tooltip au badge

/**
 * Composant pour afficher un badge de statut avec des couleurs prédéfinies.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - Le contenu texte du badge.
 * @param {'success' | 'danger' | 'warning' | 'info' | 'primary' | 'secondary' | 'light' | 'dark' | string} [props.variant='secondary']
 *        La variante de couleur du badge. Peut être une des variantes Bootstrap
 *        ou un nom de type personnalisé que vous mappez à une variante ou une classe CSS.
 * @param {string} [props.tooltipText] - Texte pour un tooltip affiché au survol du badge.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le composant Badge.
 * @param {object} [props.style] - Styles en ligne supplémentaires pour le composant Badge.
 * @param {'sm' | 'md' | 'lg'} [props.pillSize] - Si défini, rend le badge en forme de pilule avec une taille de police ajustée.
 *                                            'md' est la taille de police par défaut du badge.
 */
const StatusBadge = ({
  children,
  variant = 'secondary',
  tooltipText,
  className = '',
  style = {},
  pillSize, // ex: 'sm', 'md', 'lg' pour ajuster la taille de la police et le padding du badge pilule
  ...otherProps // Pour d'autres props de React-Bootstrap Badge
}) => {
  // Mappage optionnel de types de statut personnalisés à des variantes Bootstrap
  // Vous pouvez étendre cela selon vos besoins.
  const variantMap = {
    // Statuts commerciaux/comptables communs
    paid: 'success',
    unpaid: 'danger',
    pending: 'warning',
    draft: 'secondary',
    sent: 'info',
    overdue: 'danger',
    // Statuts de stock
    in_stock: 'success',
    low_stock: 'warning',
    out_of_stock: 'danger',
    // Statuts utilisateur
    active: 'success',
    inactive: 'secondary',
    suspended: 'warning',
    // Fallback si le variant est déjà une couleur Bootstrap
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    info: 'info',
    primary: 'primary',
    secondary: 'secondary',
    light: 'light',
    dark: 'dark',
  };

  const badgeVariant = variantMap[variant.toLowerCase()] || variant; // Utilise le mapping ou la variante directe

  let badgeClasses = className;
  let badgeStyle = { ...style };

  if (pillSize) {
    badgeClasses += ' rounded-pill'; // Classe Bootstrap pour la forme de pilule
    // Ajuster la taille de la police et le padding pour les pilules si nécessaire
    // Ceci est un exemple, ajustez selon votre design system
    switch (pillSize) {
      case 'sm':
        badgeStyle.fontSize = '0.75em';
        badgeStyle.padding = '0.3em 0.6em';
        break;
      case 'lg':
        badgeStyle.fontSize = '1em';
        badgeStyle.padding = '0.5em 1em';
        break;
      case 'md': // Taille par défaut
      default:
        badgeStyle.fontSize = '0.875em'; // Taille de police par défaut des badges Bootstrap
        badgeStyle.padding = '0.4em 0.8em';
        break;
    }
  }

  const badgeElement = (
    <Badge
      bg={badgeVariant} // `bg` est la prop pour la couleur de fond dans React-Bootstrap v5+
      className={badgeClasses}
      style={badgeStyle}
      {...otherProps}
    >
      {children}
    </Badge>
  );

  if (tooltipText) {
    return (
      <TooltipWrapper tooltipText={tooltipText} placement="top">
        {/* OverlayTrigger a besoin d'un enfant qui peut accepter une ref.
            Badge de React-Bootstrap est un span, donc ça fonctionne. */}
        {badgeElement}
      </TooltipWrapper>
    );
  }

  return badgeElement;
};

StatusBadge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  tooltipText: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  pillSize: PropTypes.oneOf(['sm', 'md', 'lg', undefined]),
};

export default StatusBadge;