// frontend/src/components/stock/StockListItem.jsx
// Utilisé pour un affichage de stock non-tabulaire (ex: liste simple, liste de cartes)

import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, Button, Badge, ProgressBar, Stack } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import './StockListItem.scss'; // Partager ou créer un SCSS spécifique

const StockListItem = ({ product, onAdjustStock, onEdit, onViewDetails }) => {
  const navigate = useNavigate();

  if (!product) return null;

  const {
    id,
    name,
    sku,
    stockQuantity,
    criticalStockThreshold,
    unitPriceHT,
    isService,
    isActive,
  } = product;

  const getStockStatusInfo = () => {
    if (isService) return { text: 'Service', variant: 'info', percentage: null, isCritical: false };
    const stock = stockQuantity ?? 0;
    const threshold = criticalStockThreshold ?? 0;
    let text, variant, percentage = null, isCritical = false;

    if (stock <= 0) {
      text = 'Épuisé'; variant = 'danger'; percentage = 0; isCritical = true;
    } else if (stock <= threshold) {
      text = 'Stock Faible'; variant = 'warning';
      percentage = threshold > 0 ? Math.max(0, Math.min(100, (stock / (threshold * 2)) * 100)) : 50;
      isCritical = true;
    } else {
      text = 'En Stock'; variant = 'success';
      percentage = threshold > 0 ? Math.min(100, (stock / (threshold * 3)) * 100) : 100;
      if (stock > threshold * 3) percentage = 100;
    }
    return { text, variant, percentage, isCritical };
  };

  const stockStatus = getStockStatusInfo();

  const handleItemClick = () => {
    if (onViewDetails) onViewDetails(id);
    else navigate(`/products/view/${id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(id);
    else navigate(`/products/edit/${id}`);
  };

  const handleAdjustStockClick = (e) => {
    e.stopPropagation();
    if (onAdjustStock && !isService) onAdjustStock(product);
  };

  return (
    <ListGroup.Item
      action
      onClick={handleItemClick}
      className={`stock-list-item p-3 ${!isActive ? 'item-inactive' : ''}`}
    >
      <div className="d-flex w-100">
        {/* Section Principale: Nom, SKU, Prix */}
        <div className="flex-grow-1 me-3 item-main-info">
          <h6 className="mb-1 item-name">
            <Link to={`/products/view/${id}`} className="text-decoration-none" onClick={(e) => e.stopPropagation()}>
              {name}
            </Link>
            {!isActive && <Badge bg="secondary" className="ms-2">Inactif</Badge>}
          </h6>
          {sku && <p className="mb-1 text-muted small sku-info">SKU: {sku}</p>}
          {unitPriceHT !== undefined && (
            <p className="mb-0 item-price">
              <Icon name="BsTag" className="me-1 text-muted" />
              {unitPriceHT.toLocaleString(undefined, { minimumFractionDigits: 2 })} € <small className="text-muted">(HT)</small>
            </p>
          )}
        </div>

        {/* Section Stock */}
        <div className="item-stock-info text-center" style={{ minWidth: '150px' }}>
          {isService ? (
            <StatusBadge variant="info" pillSize="md">Service</StatusBadge>
          ) : (
            <>
              <div className="fw-bold stock-quantity">{stockQuantity ?? 'N/A'}</div>
              <div className="text-muted small mb-1">en stock</div>
              <ProgressBar
                now={stockStatus.percentage ?? 0}
                variant={stockStatus.variant}
                className={`stock-progress-bar-sm ${stockStatus.isCritical ? 'pulsate-progress' : ''}`}
                title={`Seuil: ${criticalStockThreshold ?? 'N/A'}`}
              />
              <small className={`d-block mt-1 text-${stockStatus.variant}`}>{stockStatus.text}</small>
            </>
          )}
        </div>
      </div>

      {/* Actions (optionnel, pourrait être dans un menu contextuel) */}
      {(onEdit || (onAdjustStock && !isService)) && (
        <Stack direction="horizontal" gap={2} className="mt-2 pt-2 border-top item-actions-footer">
          {onEdit && (
            <Button variant="outline-primary" size="sm" onClick={handleEditClick}>
              <Icon name="FaPencilAlt" className="me-1" /> Modifier
            </Button>
          )}
          {!isService && onAdjustStock && (
            <Button variant="outline-info" size="sm" onClick={handleAdjustStockClick}>
              <Icon name="BsSliders" className="me-1" /> Ajuster Stock
            </Button>
          )}
        </Stack>
      )}
    </ListGroup.Item>
  );
};

StockListItem.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string,
    stockQuantity: PropTypes.number,
    criticalStockThreshold: PropTypes.number,
    unitPriceHT: PropTypes.number,
    isService: PropTypes.bool,
    isActive: PropTypes.bool,
  }).isRequired,
  onAdjustStock: PropTypes.func,
  onEdit: PropTypes.func,
  onViewDetails: PropTypes.func,
};

export default StockListItem;