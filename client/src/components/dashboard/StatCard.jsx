// frontend/src/components/dashboard/StatCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Optionnel, si la carte est cliquable
import Icon from '../common/Icon'; // Votre composant Icon
import './StatCard.scss'; // Fichier SCSS pour les styles personnalisés

/**
 * Carte pour afficher une statistique clé sur un tableau de bord.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.title - Le titre de la statistique (ex: "Clients Actifs").
 * @param {string | number} props.value - La valeur de la statistique.
 * @param {string} [props.iconName] - Nom de l'icône à afficher (ex: 'FaUsers', 'BsCurrencyEuro').
 * @param {string} [props.iconLib] - Bibliothèque de l'icône si non incluse dans iconName.
 * @param {string} [props.iconColor] - Couleur de l'icône.
 * @param {string} [props.iconBgColor] - Couleur de fond pour le cercle de l'icône.
 * @param {string} [props.unit] - Unité pour la valeur (ex: "€", "%").
 * @param {string} [props.trend] - Indication de tendance (ex: "+5%", "-2 depuis hier").
 * @param {'success' | 'danger' | 'warning' | 'info' | 'neutral'} [props.trendDirection] - Couleur de la tendance.
 * @param {string} [props.linkTo] - URL vers laquelle la carte redirige au clic.
 * @param {string} [props.footerText] - Texte à afficher dans le pied de page de la carte (ex: "Voir détails").
 * @param {boolean} [props.isLoading=false] - Si vrai, affiche un spinner au lieu de la valeur.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le composant Card.
 * @param {object} [props.style] - Styles en ligne supplémentaires pour le composant Card.
 */
const StatCard = ({
  title,
  value,
  iconName,
  iconLib,
  iconColor = 'var(--bs-primary)', // Couleur par défaut pour l'icône
  iconBgColor = 'rgba(var(--bs-primary-rgb), 0.1)', // Fond léger pour l'icône
  unit = '',
  trend,
  trendDirection = 'neutral',
  linkTo,
  footerText,
  isLoading = false,
  className = '',
  style = {},
}) => {
  const trendColorMap = {
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
    neutral: 'text-muted',
  };

  const cardContent = (
    <Card.Body className="d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="stat-card-title text-muted text-uppercase small mb-0">{title}</h6>
          {iconName && (
            <div className="stat-card-icon-wrapper" style={{ backgroundColor: iconBgColor }}>
              <Icon name={iconName} lib={iconLib} size="1.5em" color={iconColor} />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="stat-card-value h3 mb-1 d-flex align-items-center">
            <Spinner animation="border" size="sm" role="status" className="me-2">
              <span className="visually-hidden">Chargement...</span>
            </Spinner>
            Chargement...
          </div>
        ) : (
          <div className="stat-card-value h3 mb-1">
            {value}
            {unit && <span className="stat-card-unit ms-1">{unit}</span>}
          </div>
        )}

        {trend && (
          <small className={`stat-card-trend ${trendColorMap[trendDirection] || 'text-muted'}`}>
            {trend}
          </small>
        )}
      </div>

      {linkTo && footerText && (
        <div className="stat-card-footer mt-3">
          <small className="text-muted">{footerText}</small>
        </div>
      )}
    </Card.Body>
  );

  const cardClasses = `stat-card shadow-sm h-100 ${linkTo ? 'stat-card-linkable' : ''} ${className}`;

  if (linkTo) {
    return (
      <Link to={linkTo} className="text-decoration-none">
        <Card className={cardClasses} style={style}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cardClasses} style={style}>
      {cardContent}
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  iconName: PropTypes.string,
  iconLib: PropTypes.string,
  iconColor: PropTypes.string,
  iconBgColor: PropTypes.string,
  unit: PropTypes.string,
  trend: PropTypes.string,
  trendDirection: PropTypes.oneOf(['success', 'danger', 'warning', 'info', 'neutral']),
  linkTo: PropTypes.string,
  footerText: PropTypes.string,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default StatCard;