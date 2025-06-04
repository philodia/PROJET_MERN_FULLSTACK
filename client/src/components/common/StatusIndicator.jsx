// frontend/src/components/common/StatusIndicator.jsx
import React from 'react';
import PropTypes from 'prop-types';
import TooltipWrapper from './TooltipWrapper'; // Optionnel, pour ajouter un tooltip au statut

/**
 * Composant pour afficher un indicateur visuel de statut (rond de couleur).
 *
 * @param {object} props - Les propriétés du composant.
 * @param {'success' | 'error' | 'warning' | 'info' | 'pending' | 'neutral' | string} [props.type='neutral']
 *        Le type de statut, qui détermine la couleur par défaut.
 *        Peut aussi être une couleur CSS valide (ex: '#ff0000', 'rgb(0,255,0)').
 * @param {string} [props.label] - Texte optionnel à afficher à côté de l'indicateur.
 * @param {string} [props.tooltipText] - Texte pour un tooltip affiché au survol de l'indicateur.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Taille de l'indicateur.
 * @param {boolean} [props.pulsate=false] - Si vrai, ajoute une animation de pulsation (pour 'pending' par exemple).
 * @param {string} [props.className] - Classes CSS supplémentaires pour le wrapper.
 * @param {object} [props.style] - Styles en ligne pour le wrapper.
 * @param {object} [props.indicatorStyle] - Styles en ligne spécifiques pour le rond de couleur.
 */
const StatusIndicator = ({
  type = 'neutral',
  label,
  tooltipText,
  size = 'md',
  pulsate = false,
  className = '',
  style = {},
  indicatorStyle = {},
}) => {
  const statusColors = {
    success: 'var(--bs-success, #198754)', // Vert Bootstrap ou fallback
    error: 'var(--bs-danger, #dc3545)',    // Rouge Bootstrap ou fallback
    warning: 'var(--bs-warning, #ffc107)', // Jaune Bootstrap ou fallback
    info: 'var(--bs-info, #0dcaf0)',       // Cyan Bootstrap ou fallback
    pending: 'var(--bs-primary, #0d6efd)', // Bleu Bootstrap ou fallback (souvent utilisé pour en cours)
    neutral: 'var(--bs-secondary, #6c757d)',// Gris Bootstrap ou fallback
  };

  // Détermine la couleur : soit une couleur CSS directe, soit une couleur basée sur le type.
  const color = statusColors[type] || type; // Si 'type' n'est pas une clé, on suppose que c'est une couleur.

  const sizeMap = {
    sm: '8px',
    md: '12px',
    lg: '16px',
  };
  const indicatorSize = sizeMap[size] || sizeMap.md;

  const baseIndicatorStyle = {
    display: 'inline-block',
    width: indicatorSize,
    height: indicatorSize,
    borderRadius: '50%',
    backgroundColor: color,
    verticalAlign: 'middle',
    ...indicatorStyle, // Permet de surcharger ou d'ajouter des styles
  };

  const wrapperStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: label ? '0.5em' : '0', // Espace entre le rond et le label
    ...style,
  };

  // Le rond indicateur
  let indicatorElement = (
    <span
      style={baseIndicatorStyle}
      className={`status-indicator-dot ${pulsate ? 'status-indicator-pulsate' : ''}`}
      aria-hidden="true" // Purement décoratif si label ou tooltip est présent
    />
  );

  // Si un tooltip est fourni, on enveloppe l'indicateur (et le label si pas de tooltip sur le label lui-même)
  if (tooltipText) {
    indicatorElement = (
      <TooltipWrapper tooltipText={tooltipText} placement="top">
        {/* Si pas de label, le tooltip est sur le rond. Si label, on pourrait vouloir le tooltip sur l'ensemble. */}
        {/* Pour cet exemple, le tooltip est sur le rond si pas de label, sinon sur l'ensemble via le wrapper. */}
        {/* Ici, on place le tooltip uniquement sur le rond pour plus de simplicité */}
        <span style={{ display: 'inline-block' }}> {/* Wrapper pour le tooltip sur le rond */}
          {indicatorElement}
        </span>
      </TooltipWrapper>
    );
  }

  return (
    <span className={`status-indicator ${className}`} style={wrapperStyle}>
      {indicatorElement}
      {label && <span className="status-indicator-label">{label}</span>}
    </span>
  );
};

StatusIndicator.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  tooltipText: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  pulsate: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  indicatorStyle: PropTypes.object,
};

export default StatusIndicator;