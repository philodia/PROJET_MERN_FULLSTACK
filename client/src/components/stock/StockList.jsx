// frontend/src/components/stock/StockList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
//import Icon from '../common/Icon';
import { Alert, ProgressBar } from 'react-bootstrap';

/**
 * Affiche une liste de produits/services avec leurs informations de stock.
 */
const StockList = ({
  products = [],
  isLoading = false,
  error,
  onAdjustStock,
  onViewProduct,
  onEditProduct,
  noDataMessage = "Aucun produit ou service trouvé pour la gestion des stocks.",
}) => {
  const navigate = useNavigate();

  const getStockStatusInfo = (product) => {
    if (product.isService) {
      return {
        text: 'N/A (Service)',
        variant: 'light',
        percentage: null,
        isCritical: false,
      };
    }

    const stock = product.stockQuantity ?? 0;
    const threshold = product.criticalStockThreshold ?? 0;

    let text = 'En Stock';
    let variant = 'success';
    let percentage = 100;
    let isCritical = false;

    if (stock <= 0) {
      text = 'Épuisé';
      variant = 'danger';
      percentage = 0;
      isCritical = true;
    } else if (stock <= threshold) {
      text = 'Stock Faible';
      variant = 'warning';
      percentage = threshold > 0
        ? Math.max(0, Math.min(100, (stock / (threshold * 2)) * 100))
        : 50;
      isCritical = true;
    } else if (threshold > 0) {
      percentage = Math.min(100, (stock / (threshold * 3)) * 100);
      if (stock > threshold * 3) percentage = 100;
    }

    return { text, variant, percentage, isCritical };
  };

  const handleView = (productId) => {
    onViewProduct ? onViewProduct(productId) : navigate(`/products/view/${productId}`);
  };

  const handleEdit = (productId) => {
    onEditProduct ? onEditProduct(productId) : navigate(`/products/edit/${productId}`);
  };

  const handleAdjust = (product) => {
    onAdjustStock
      ? onAdjustStock(product)
      : console.warn("onAdjustStock n'est pas défini pour StockList.");
  };

  const columns = useMemo(() => [
    {
      Header: 'Nom du Produit/Service',
      accessor: 'name',
      isSortable: true,
      render: (item) => <Link to={`/products/view/${item.id}`}>{item.name}</Link>,
    },
    {
      Header: 'SKU',
      accessor: 'sku',
      isSortable: true,
      cellStyle: { width: '120px' },
    },
    {
      Header: 'Type',
      accessor: 'isService',
      render: (item) => (
        <StatusBadge variant={item.isService ? 'info' : 'primary'} pillSize="sm">
          {item.isService ? 'Service' : 'Produit'}
        </StatusBadge>
      ),
      cellStyle: { width: '100px', textAlign: 'center' },
    },
    {
      Header: 'Stock Actuel',
      accessor: 'stockQuantity',
      isSortable: true,
      render: (item) =>
        item.isService
          ? '-'
          : item.stockQuantity !== null && item.stockQuantity !== undefined
            ? item.stockQuantity
            : 'N/A',
      cellClassName: 'text-center fw-bold',
      headerStyle: { textAlign: 'center' },
      cellStyle: { width: '130px' },
    },
    {
      Header: 'Niveau de Stock',
      id: 'stockLevelIndicator',
      isSortable: false,
      render: (item) => {
        const { percentage, variant, isCritical } = getStockStatusInfo(item);
        if (item.isService || percentage === null) {
          return <span className="text-muted">-</span>;
        }
        return (
          <ProgressBar
            now={percentage}
            variant={variant}
            label={`${Math.round(percentage)}%`}
            className={`stock-progress ${isCritical ? 'pulsate-progress' : ''}`}
            style={{ height: '20px', fontSize: '0.75rem' }}
            title={`Stock: ${item.stockQuantity}, Seuil: ${item.criticalStockThreshold}`}
          />
        );
      },
      cellStyle: { width: '150px', minWidth: '120px', verticalAlign: 'middle' },
    },
    {
      Header: 'Statut Stock',
      id: 'stockStatusText',
      render: (item) => {
        const { text, variant } = getStockStatusInfo(item);
        return (
          <StatusBadge variant={variant} pillSize="sm">
            {text}
          </StatusBadge>
        );
      },
      cellStyle: { width: '130px', textAlign: 'center' },
    },
    {
      Header: 'Seuil Critique',
      accessor: 'criticalStockThreshold',
      render: (item) =>
        item.isService
          ? '-'
          : item.criticalStockThreshold !== null && item.criticalStockThreshold !== undefined
            ? item.criticalStockThreshold
            : 'N/A',
      cellClassName: 'text-center',
      headerStyle: { textAlign: 'center' },
      cellStyle: { width: '130px' },
    },
    {
      Header: 'Actif',
      accessor: 'isActive',
      render: (item) => (
        <StatusBadge variant={item.isActive ? 'success' : 'secondary'} pillSize="sm">
          {item.isActive ? 'Oui' : 'Non'}
        </StatusBadge>
      ),
      cellStyle: { width: '80px', textAlign: 'center' },
    },
    {
      Header: 'Actions',
      id: 'actions',
      render: (item) => {
        const actionsConfig = [
          {
            id: 'edit',
            iconName: 'FaPencilAlt',
            label: 'Modifier Produit',
            onClick: () => handleEdit(item.id),
          },
        ];

        if (!item.isService && onAdjustStock) {
          actionsConfig.push({
            id: 'adjustStock',
            iconName: 'BsSliders',
            label: 'Ajuster Stock',
            onClick: () => handleAdjust(item),
            variant: 'info',
          });
        }

        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '120px' },
    },
  ], [onEditProduct, onAdjustStock]);

  if (error) {
    return (
      <Alert variant="danger">
        {typeof error === 'string'
          ? error
          : error?.message || "Erreur lors du chargement des stocks."}
      </Alert>
    );
  }

  return (
    <div className="stock-list-container">
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={15}
        isSortable
        isHover
        responsive
        size="sm"
      />
    </div>
  );
};

StockList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      sku: PropTypes.string,
      stockQuantity: PropTypes.number,
      criticalStockThreshold: PropTypes.number,
      unitPriceHT: PropTypes.number,
      isService: PropTypes.bool,
      isActive: PropTypes.bool,
      supplierName: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onAdjustStock: PropTypes.func,
  onViewProduct: PropTypes.func,
  onEditProduct: PropTypes.func,
  noDataMessage: PropTypes.string,
};

export default StockList;
