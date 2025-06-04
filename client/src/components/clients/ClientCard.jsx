// frontend/src/components/clients/ClientCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import './ClientCard.scss'; // Fichier SCSS pour des styles personnalisés

/**
 * Carte pour afficher un résumé des informations d'un client.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.client - L'objet client contenant les informations.
 * @param {function} [props.onViewDetails] - Callback pour voir les détails complets (reçoit l'ID du client).
 * @param {function} [props.onEdit] - Callback pour éditer le client (reçoit l'ID du client).
 * @param {function} [props.onDelete] - Callback pour supprimer le client (reçoit l'ID du client).
 * @param {string} [props.className] - Classes CSS supplémentaires pour le composant Card.
 * @param {boolean} [props.showActions=true] - Si les boutons d'action doivent être affichés.
 */
const ClientCard = ({
  client,
  onViewDetails,
  onEdit,
  onDelete,
  className = '',
  showActions = true,
}) => {
  const navigate = useNavigate();

  if (!client) {
    return null; // Ou un placeholder si vous préférez
  }

  const {
    id,
    companyName,
    contactName,
    email,
    phone,
    address,
    status, // Supposons un champ 'status'
  } = client;

  const handleViewClick = (e) => {
    e.preventDefault(); // Empêcher le comportement de lien si la carte est un lien
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(id);
    } else {
      navigate(`/clients/view/${id}`);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    } else {
      navigate(`/clients/edit/${id}`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${companyName}" ?`)) {
      if (onDelete) {
        onDelete(id);
      } else {
        console.warn("Fonction onDelete non fournie à ClientCard.");
      }
    }
  };

  const cardContent = (
    <>
      <Card.Header className="d-flex justify-content-between align-items-center client-card-header">
        <Card.Title as="h6" className="mb-0 text-primary" title={companyName}>
            <Link to={`/clients/view/${id}`} className="text-decoration-none client-name-link">
                {companyName}
            </Link>
        </Card.Title>
        {status && (
          <StatusBadge variant={status} pillSize="sm">{status}</StatusBadge>
        )}
      </Card.Header>
      <Card.Body className="client-card-body">
        {contactName && (
          <div className="client-card-field">
            <Icon name="BsPerson" className="me-2 text-muted" />
            <span>{contactName}</span>
          </div>
        )}
        {email && (
          <div className="client-card-field">
            <Icon name="BsEnvelope" className="me-2 text-muted" />
            <a href={`mailto:${email}`} className="text-body text-decoration-none">{email}</a>
          </div>
        )}
        {phone && (
          <div className="client-card-field">
            <Icon name="BsTelephone" className="me-2 text-muted" />
            <a href={`tel:${phone}`} className="text-body text-decoration-none">{phone}</a>
          </div>
        )}
        {address && (address.city || address.country) && (
          <div className="client-card-field">
            <Icon name="BsGeoAlt" className="me-2 text-muted" />
            <span>{address.city}{address.city && address.country ? ', ' : ''}{address.country}</span>
          </div>
        )}
      </Card.Body>
      {showActions && (onViewDetails || onEdit || onDelete) && (
        <Card.Footer className="client-card-actions d-flex justify-content-end gap-2">
          {onViewDetails !== false && ( // Permet de désactiver explicitement le bouton Voir
            <Button variant="outline-secondary" size="sm" onClick={handleViewClick} title="Voir les détails">
              <Icon name="FaEye" />
            </Button>
          )}
          {onEdit && (
            <Button variant="outline-primary" size="sm" onClick={handleEditClick} title="Modifier">
              <Icon name="FaPencilAlt" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline-danger" size="sm" onClick={handleDeleteClick} title="Supprimer">
              <Icon name="FaTrash" />
            </Button>
          )}
        </Card.Footer>
      )}
    </>
  );

  // Rendre la carte entière cliquable si onViewDetails est la principale action voulue
  // et qu'il n'y a pas d'autres actions plus spécifiques.
  // if (onViewDetails && !onEdit && !onDelete && showActions) {
  //   return (
  //     <Link to={`/clients/view/${id}`} className={`text-decoration-none client-card-link-wrapper ${className}`}>
  //       <Card className="client-card shadow-sm h-100">
  //         {cardContent}
  //       </Card>
  //     </Link>
  //   );
  // }

  return (
    <Card className={`client-card shadow-sm h-100 ${className}`}>
      {cardContent}
    </Card>
  );
};

ClientCard.propTypes = {
  client: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    companyName: PropTypes.string.isRequired,
    contactName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.shape({
      city: PropTypes.string,
      country: PropTypes.string,
    }),
    status: PropTypes.string,
  }).isRequired,
  onViewDetails: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]), // bool pour désactiver explicitement
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
  showActions: PropTypes.bool,
};

export default ClientCard;