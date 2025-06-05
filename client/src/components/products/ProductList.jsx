// frontend/src/components/products/ProductList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';

import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
//import Icon from '../common/Icon'; // Vérifie si cet import est nécessaire ou utilisé

/**
 * Affiche une liste de produits et services en utilisant DataTable.
 */
const ProductList = ({
  products = [],
  isLoading = false,
  error,
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
  onAdjustStock,
  noDataMessage = "Aucun produit ou service trouvé.",
  currencySymbol = '€',
}) => {
  const navigate = useNavigate();

  const getStockStatusVariant = (product) => {
    if (product.isService) return 'info';
    if (product.stockQuantity <= 0) return 'danger';
    if (product.stockQuantity <= product.criticalStockThreshold) return 'warning';
    return 'success';
  };

  const getStockStatusText = (product) => {
    if (product.isService) return 'Service';
    if (product.stockQuantity <= 0) return 'Épuisé';
    if (product.stockQuantity <= product.criticalStockThreshold) return 'Stock Faible';
    return 'En Stock';
  };

  const handleEdit = (productId) => {
    if (onEditProduct) onEditProduct(productId);
    else navigate(`/products/edit/${productId}`);
  };

  const handleDelete = (productId, productName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" (ID: ${productId}) ?`)) {
      if (onDeleteProduct) onDeleteProduct(productId);
      else console.warn("onDeleteProduct n'est pas défini pour ProductList.");
    }
  };

  const handleView = (productId) => {
    if (onViewProduct) onViewProduct(productId);
    else navigate(`/products/view/${productId}`);
  };

  const handleAdjustStockClick = (product) => {
    if (onAdjustStock) onAdjustStock(product);
    else console.warn("onAdjustStock n'est pas défini pour ProductList.");
  };

  const columns = useMemo(() => [
    {
      Header: 'Nom',
      accessor: 'name',
      isSortable: true,
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
      isSortable: true,
      render: (item) => (
        <StatusBadge variant={item.isService ? 'info' : 'primary'} pillSize="sm">
          {item.isService ? 'Service' : 'Produit'}
        </StatusBadge>
      ),
      cellStyle: { width: '100px', textAlign: 'center' },
    },
    {
      Header: `Prix U. HT (${currencySymbol})`,
      accessor: 'unitPriceHT',
      isSortable: true,
      dataType: 'currency',
      currencyOptions: { currency: currencySymbol === '€' ? 'EUR' : currencySymbol },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right' },
      cellStyle: { width: '130px' },
    },
    {
      Header: 'Stock Actuel',
      accessor: 'stockQuantity',
      isSortable: true,
      render: (item) => item.isService ? '-' : item.stockQuantity,
      cellClassName: 'text-center',
      headerStyle: { textAlign: 'center' },
      cellStyle: { width: '120px' },
    },
    {
      Header: 'Statut Stock',
      id: 'stockStatus',
      isSortable: false,
      render: (item) => (
        <StatusBadge variant={getStockStatusVariant(item)} pillSize="sm">
          {getStockStatusText(item)}
        </StatusBadge>
      ),
      cellStyle: { width: '130px', textAlign: 'center' },
    },
    {
      Header: 'Fournisseur',
      accessor: 'supplierName',
      isSortable: true,
    },
    {
      Header: 'Actif',
      accessor: 'isActive',
      isSortable: true,
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
          { id: 'view', iconName: 'FaEye', label: 'Voir', onClick: () => handleView(item.id) },
          { id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleEdit(item.id) },
        ];

        if (!item.isService && onAdjustStock) {
          actionsConfig.push({
            id: 'adjustStock',
            iconName: 'BsSliders',
            label: 'Ajuster Stock',
            onClick: () => handleAdjustStockClick(item),
            variant: 'info',
          });
        }

        if (onDeleteProduct) {
          actionsConfig.push({
            id: 'delete',
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(item.id, item.name),
            variant: 'danger',
          });
        }

        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '160px' },
    },
  ], [onViewProduct, onEditProduct, onDeleteProduct, onAdjustStock, currencySymbol]);

  if (error) {
    const message = typeof error === 'string' ? error : error?.message || "Erreur lors du chargement des produits.";
    return <Alert variant="danger">{message}</Alert>;
  }

  return (
    <div className="product-list-container">
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={15}
        isSortable
        isHover
        isStriped
        responsive
        size="sm"
      />
    </div>
  );
};

ProductList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      sku: PropTypes.string,
      unitPriceHT: PropTypes.number,
      stockQuantity: PropTypes.number,
      criticalStockThreshold: PropTypes.number,
      isService: PropTypes.bool,
      isActive: PropTypes.bool,
      supplierName: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEditProduct: PropTypes.func,
  onDeleteProduct: PropTypes.func,
  onViewProduct: PropTypes.func,
  onAdjustStock: PropTypes.func,
  noDataMessage: PropTypes.string,
  currencySymbol: PropTypes.string,
};

export default ProductList;
