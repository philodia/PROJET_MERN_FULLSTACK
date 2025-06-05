// frontend/src/components/suppliers/SupplierCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge'; // Si vous avez un statut
import './SupplierCard.scss'; // Fichier SCSS partagé ou spécifique

/**
 * Carte pour afficher un résumé des informations d'un fournisseur.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.supplier - L'objet fournisseur contenant les informations.
 * @param {function} [props.onViewDetails] - Callback pour voir les détails complets.
 * @param {function} [props.onEdit] - Callback pour éditer le fournisseur.
 * @param {function} [props.onDelete] - Callback pour supprimer le fournisseur.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le composant Card.
 * @param {boolean} [props.showActions=true] - Si les boutons d'action doivent être affichés.
 */
const SupplierCard = ({
  supplier,
  onViewDetails,
  onEdit,
  onDelete,
  className = '',
  showActions = true,
}) => {
  const navigate = useNavigate();

  if (!supplier) {
    return null;
  }

  const {
    id,
    companyName,
    contactName,
    email,
    phone,
    address,
    website,
    isActive, // Supposons un champ 'isActive' pour le statut
  } = supplier;

  const handleViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(id);
    } else {
      navigate(`/suppliers/view/${id}`); // Adapter la route si nécessaire
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    } else {
      navigate(`/suppliers/edit/${id}`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${companyName}" ?`)) {
      if (onDelete) {
        onDelete(id);
      } else {
        console.warn("Fonction onDelete non fournie à SupplierCard.");
      }
    }
  };

  const cardContent = (
    <>
      <Card.Header className="d-flex justify-content-between align-items-center supplier-card-header">
        <Card.Title as="h6" className="mb-0 text-primary" title={companyName}>
          <Link to={`/suppliers/view/${id}`} className="text-decoration-none supplier-name-link">
            {companyName}
          </Link>
        </Card.Title>
        {isActive !== undefined && ( // Afficher le statut seulement s'il est défini
          <StatusBadge variant={isActive ? 'success' : 'secondary'} pillSize="sm">
            {isActive ? 'Actif' : 'Inactif'}
          </StatusBadge>
        )}
      </Card.Header>
      <Card.Body className="supplier-card-body">
        {contactName && (
          <div className="supplier-card-field">
            <Icon name="BsPerson" className="me-2 text-muted" />
            <span>{contactName}</span>
          </div>
        )}
        {email && (
          <div className="supplier-card-field">
            <Icon name="BsEnvelope" className="me-2 text-muted" />
            <a href={`mailto:${email}`} className="text-body text-decoration-none">{email}</a>
          </div>
        )}
        {phone && (
          <div className="supplier-card-field">
            <Icon name="BsTelephone" className="me-2 text-muted" />
            <a href={`tel:${phone}`} className="text-body text-decoration-none">{phone}</a>
          </div>
        )}
        {website && (
          <div className="supplier-card-field">
            <Icon name="BsGlobe" className="me-2 text-muted" />
            <a href={website.startsWith('http') ? website : `//${website}`} target="_blank" rel="noopener noreferrer" className="text-body text-decoration-none">
              {website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {address && (address.city || address.country) && (
          <div className="supplier-card-field">
            <Icon name="BsGeoAlt" className="me-2 text-muted" />
            <span>{address.city}{address.city && address.country ? ', ' : ''}{address.country}</span>
          </div>
        )}
      </Card.Body>
      {showActions && (onViewDetails || onEdit || onDelete) && (
        <Card.Footer className="supplier-card-actions d-flex justify-content-end gap-2">
          {onViewDetails !== false && (
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

  return (
    <Card className={`supplier-card shadow-sm h-100 ${className}`}>
      {cardContent}
    </Card>
  );
};

SupplierCard.propTypes = {
  supplier: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    companyName: PropTypes.string.isRequired,
    contactName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    website: PropTypes.string,
    address: PropTypes.shape({
      city: PropTypes.string,
      country: PropTypes.string,
    }),
    isActive: PropTypes.bool,
  }).isRequired,
  onViewDetails: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
  showActions: PropTypes.bool,
};

export default SupplierCard;