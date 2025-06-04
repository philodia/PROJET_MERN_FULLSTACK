// frontend/src/components/dashboard/RecentActivityFeed.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, ListGroup, Spinner, Badge } from 'react-bootstrap';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale'; // Pour la localisation française
import Icon from '../common/Icon'; // Votre composant Icon
import './RecentActivityFeed.scss'; // Fichier SCSS pour les styles personnalisés

/**
 * Structure d'un item d'activité.
 * @typedef {object} ActivityItem
 * @property {string} id - Identifiant unique de l'activité.
 * @property {string} iconName - Nom de l'icône pour l'activité (ex: 'FaUserPlus', 'BsFileEarmarkTextFill').
 * @property {string} [iconLib] - Bibliothèque de l'icône.
 * @property {string} [iconColor] - Couleur de l'icône.
 * @property {string} description - Description de l'activité (ex: "Nouveau client ajouté : Alpha Inc.").
 * @property {string | Date} timestamp - Horodatage de l'activité (chaîne ISO 8601 ou objet Date).
 * @property {string} [user] - Nom de l'utilisateur ayant effectué l'action (optionnel).
 * @property {string} [category] - Catégorie de l'activité (ex: "Client", "Facture", "Système").
 * @property {string} [linkTo] - URL vers laquelle l'activité peut rediriger (optionnel).
 */

/**
 * Composant pour afficher un flux d'activité récente.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} [props.title='Activité Récente'] - Titre de la carte du flux.
 * @param {Array<ActivityItem>} props.items - Tableau des items d'activité à afficher.
 * @param {boolean} [props.isLoading=false] - Si vrai, affiche un spinner.
 * @param {string} [props.noActivityMessage="Aucune activité récente à afficher."] - Message si pas d'items.
 * @param {number} [props.maxItems=5] - Nombre maximum d'items à afficher.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le Card.
 * @param {object} [props.cardStyle] - Styles en ligne pour le Card.
 */
const RecentActivityFeed = ({
  title = 'Activité Récente',
  items = [],
  isLoading = false,
  noActivityMessage = "Aucune activité récente à afficher.",
  maxItems = 7,
  className = '',
  cardStyle = {},
}) => {
  const formatTimestamp = (timestamp) => {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch (error) {
      console.warn("RecentActivityFeed: Erreur de formatage du timestamp", timestamp, error);
      return String(timestamp); // Fallback
    }
  };

  const displayedItems = items.slice(0, maxItems);

  return (
    <Card className={`recent-activity-feed-card shadow-sm h-100 ${className}`} style={cardStyle}>
      <Card.Header as="h6" className="py-3">{title}</Card.Header>
      <Card.Body className="p-0"> {/* p-0 pour que ListGroup touche les bords */}
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center p-3" style={{ minHeight: '150px' }}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Chargement de l'activité...</span>
            </Spinner>
          </div>
        ) : displayedItems.length > 0 ? (
          <ListGroup variant="flush">
            {displayedItems.map((item) => (
              <ListGroup.Item key={item.id} className="activity-item px-3 py-2">
                <div className="d-flex align-items-start">
                  {item.iconName && (
                    <div className="activity-icon-wrapper me-3">
                      <Icon
                        name={item.iconName}
                        lib={item.iconLib}
                        color={item.iconColor || 'var(--bs-secondary)'}
                        size="1.2em"
                      />
                    </div>
                  )}
                  <div className="activity-content flex-grow-1">
                    <div className="activity-description">
                      {item.description}
                      {item.user && <span className="activity-user text-muted small"> par {item.user}</span>}
                    </div>
                    <small className="activity-timestamp text-muted">
                      {formatTimestamp(item.timestamp)}
                    </small>
                  </div>
                  {item.category && (
                    <Badge pill bg="light" text="dark" className="activity-category ms-2 align-self-center">
                      {item.category}
                    </Badge>
                  )}
                </div>
                {/* Si vous voulez que l'item soit cliquable pour plus de détails: */}
                {/* item.linkTo ? <a href={item.linkTo} className="stretched-link"></a> : null */}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted text-center p-3 mb-0">{noActivityMessage}</p>
        )}
      </Card.Body>
      {items.length > maxItems && (
        <Card.Footer className="text-center py-2">
          {/* Optionnel: Lien pour voir toutes les activités */}
          <a href="/activity-log" className="text-primary small">
            Voir toute l'activité <Icon name="BsArrowRightShort" />
          </a>
        </Card.Footer>
      )}
    </Card>
  );
};

RecentActivityFeed.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      iconName: PropTypes.string.isRequired,
      iconLib: PropTypes.string,
      iconColor: PropTypes.string,
      description: PropTypes.string.isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      user: PropTypes.string,
      category: PropTypes.string,
      linkTo: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  noActivityMessage: PropTypes.string,
  maxItems: PropTypes.number,
  className: PropTypes.string,
  cardStyle: PropTypes.object,
};

export default RecentActivityFeed;