// frontend/src/components/products/ProductCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import './ProductCard.scss'; // Fichier SCSS partagé ou spécifique

/**
 * Carte pour afficher un résumé des informations d'un produit ou service.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.product - L'objet produit/service.
 *        { id, name, sku, unitPriceHT, vatRate, stockQuantity, criticalStockThreshold, isService, isActive, description }
 * @param {function} [props.onViewDetails] - Callback pour voir les détails.
 * @param {function} [props.onEdit] - Callback pour éditer.
 * @param {function} [props.onDelete] - Callback pour supprimer.
 * @param {string} [props.className] - Classes CSS.
 * @param {boolean} [props.showActions=true] - Afficher les boutons d'action.
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 */
const ProductCard = ({
  product,
  onViewDetails,
  onEdit,
  onDelete,
  className = '',
  showActions = true,
  currencySymbol = '€',
}) => {
  const navigate = useNavigate();

  if (!product) {
    return null;
  }

  const {
    id,
    name,
    sku,
    unitPriceHT,
    stockQuantity,
    criticalStockThreshold,
    isService,
    isActive,
    description,
  } = product;

  const handleViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onViewDetails) onViewDetails(id);
    else navigate(`/products/view/${id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(id);
    else navigate(`/products/edit/${id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      if (onDelete) onDelete(id);
      else console.warn("Fonction onDelete non fournie à ProductCard.");
    }
  };

  const getStockStatus = () => {
    if (isService) return { text: 'Service', variant: 'info' };
    if (stockQuantity <= 0) return { text: 'Épuisé', variant: 'danger' };
    if (stockQuantity <= criticalStockThreshold) return { text: 'Stock Faible', variant: 'warning' };
    return { text: 'En Stock', variant: 'success' };
  };

  const stockStatus = getStockStatus();

  const cardContent = (
    <>
      <Card.Header className="d-flex justify-content-between align-items-center product-card-header">
        <Card.Title as="h6" className="mb-0 product-card-name" title={name}>
          <Link to={`/products/view/${id}`} className="text-decoration-none">
            {name}
          </Link>
        </Card.Title>
        {isActive !== undefined && (
          <StatusBadge variant={isActive ? 'success' : 'secondary'} pillSize="sm">
            {isActive ? 'Actif' : 'Inactif'}
          </StatusBadge>
        )}
      </Card.Header>
      <Card.Body className="product-card-body">
        {sku && (
          <div className="product-card-field sku-field">
            <small className="text-muted">SKU: {sku}</small>
          </div>
        )}
        <div className="product-card-field price-field my-2">
          <Icon name="BsTagFill" className="me-2 text-muted" />
          <span className="fw-bold">
            {unitPriceHT?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencySymbol}
          </span>
          <small className="text-muted ms-1">(HT)</small>
        </div>
        {!isService && (
            <div className="product-card-field stock-field mb-2">
                <Icon name="BsBoxes" className="me-2 text-muted" />
                <span>Stock : {stockQuantity}</span>
                <StatusBadge variant={stockStatus.variant} className="ms-2" pillSize="sm">
                    {stockStatus.text}
                </StatusBadge>
            </div>
        )}
        {isService && (
            <div className="product-card-field stock-field mb-2">
                <Icon name="BsBriefcaseFill" className="me-2 text-muted" />
                <StatusBadge variant="info" pillSize="sm">Service</StatusBadge>
            </div>
        )}
        {description && (
          <Card.Text className="product-card-description small text-muted mt-1">
            {description.length > 70 ? `${description.substring(0, 70)}...` : description}
          </Card.Text>
        )}
      </Card.Body>
      {showActions && (onViewDetails || onEdit || onDelete) && (
        <Card.Footer className="product-card-actions d-flex justify-content-end gap-2">
          {onViewDetails !== false && (
            <Button variant="outline-secondary" size="sm" onClick={handleViewClick} title="Voir détails">
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
    <Card className={`product-card shadow-sm h-100 ${className}`}>
      {cardContent}
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string,
    unitPriceHT: PropTypes.number,
    vatRate: PropTypes.number, // Non affiché directement sur la carte, mais utile pour le contexte
    stockQuantity: PropTypes.number,
    criticalStockThreshold: PropTypes.number,
    isService: PropTypes.bool,
    isActive: PropTypes.bool,
    description: PropTypes.string,
  }).isRequired,
  onViewDetails: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
  showActions: PropTypes.bool,
  currencySymbol: PropTypes.string,
};

export default ProductCard;