// frontend/src/components/common/TooltipWrapper.jsx
import React from 'react';
import PropTypes from 'prop-types';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

/**
 * Un composant wrapper pour afficher facilement des tooltips (info-bulles)
 * autour d'éléments enfants.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {React.ReactNode} props.children - L'élément enfant sur lequel le tooltip sera appliqué.
 *                                          Doit être un seul élément React capable de recevoir des refs.
 * @param {string | React.ReactNode} props.tooltipText - Le texte ou le contenu React à afficher dans le tooltip.
 * @param {string} [props.placement='top'] - La position du tooltip ('top', 'right', 'bottom', 'left', etc.).
 * @param {string} [props.id] - Un ID unique pour le tooltip, requis pour l'accessibilité.
 *                              Si non fourni, un ID sera généré.
 * @param {number} [props.delayShow=250] - Délai en ms avant l'affichage du tooltip.
 * @param {number} [props.delayHide=250] - Délai en ms avant la disparition du tooltip.
 * @param {string} [props.triggerType=['hover', 'focus']] - Événements qui déclenchent le tooltip.
 * @param {string} [props.className] - Classe CSS pour le composant Tooltip lui-même.
 * @param {object} [props.style] - Style en ligne pour le composant Tooltip lui-même.
 * @param {boolean} [props.disabled=false] - Si vrai, le tooltip ne sera pas affiché.
 */
const TooltipWrapper = ({
  children,
  tooltipText,
  placement = 'top',
  id,
  delayShow = 250,
  delayHide = 250,
  triggerType = ['hover', 'focus'],
  className = '',
  style = {},
  disabled = false,
  ...otherProps // Pour d'autres props de OverlayTrigger
}) => {
  // Si pas de texte de tooltip ou si désactivé, on rend juste les enfants sans tooltip.
  if (!tooltipText || disabled) {
    return <>{children}</>; // Utiliser un fragment pour ne pas ajouter de div inutile
  }

  // Générer un ID unique si non fourni, important pour l'accessibilité.
  const tooltipId = id || `tooltip-${Math.random().toString(36).substring(2, 9)}`;

  const renderTooltip = (props) => (
    <Tooltip id={tooltipId} className={className} style={style} {...props}>
      {tooltipText}
    </Tooltip>
  );

  return (
    <OverlayTrigger
      placement={placement}
      delay={{ show: delayShow, hide: delayHide }}
      overlay={renderTooltip}
      trigger={triggerType}
      {...otherProps}
    >
      {/*
        React-Bootstrap OverlayTrigger a besoin que son enfant direct puisse accepter une ref.
        Si children est un composant fonctionnel, il doit être wrappé avec React.forwardRef.
        Pour les éléments DOM natifs (button, span, div), cela fonctionne directement.
      */}
      {children}
    </OverlayTrigger>
  );
};

TooltipWrapper.propTypes = {
  children: PropTypes.element.isRequired, // Doit être un seul élément capable d'accepter une ref
  tooltipText: PropTypes.node.isRequired,
  placement: PropTypes.oneOf([
    'auto-start', 'auto', 'auto-end',
    'top-start', 'top', 'top-end',
    'right-start', 'right', 'right-end',
    'bottom-end', 'bottom', 'bottom-start',
    'left-end', 'left', 'left-start',
  ]),
  id: PropTypes.string,
  delayShow: PropTypes.number,
  delayHide: PropTypes.number,
  triggerType: PropTypes.oneOfType([
    PropTypes.oneOf(['hover', 'focus', 'click']),
    PropTypes.arrayOf(PropTypes.oneOf(['hover', 'focus', 'click'])),
  ]),
  className: PropTypes.string,
  style: PropTypes.object,
  disabled: PropTypes.bool,
};

export default TooltipWrapper;