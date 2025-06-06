// frontend/src/components/common/DocumentItemListReadOnly.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';

const DocumentItemListReadOnly = ({
  items = [],
  currencySymbol = '€', // Moins pertinent pour BL sans prix
  title = "Détail des Articles",
  // Props pour la configuration des colonnes
  columnConfig = { // Configuration par défaut des colonnes
    productName: { Header: 'Produit / Service', visible: true, accessor: 'productName' },
    description: { Header: 'Description', visible: true, accessor: 'description' },
    quantity: { Header: 'Quantité', visible: true, accessor: 'quantity', cellClassName: 'text-center' },
    unitPriceHT: { Header: 'Prix U. HT', visible: false, accessor: 'unitPriceHT', cellClassName: 'text-end' }, // Caché par défaut pour BL
    vatRate: { Header: 'TVA (%)', visible: false, accessor: 'vatRate', cellClassName: 'text-center' },      // Caché par défaut pour BL
    totalHT: { Header: 'Total HT', visible: false, accessor: 'totalHT', cellClassName: 'text-end fw-bold' }, // Caché par défaut pour BL
    // Vous pouvez ajouter d'autres colonnes ici, comme quantityOrdered
    quantityOrdered: { Header: 'Qté Cmdée', visible: false, accessor: 'quantityOrdered', cellClassName: 'text-center' },
  },
  // customColumns, // Pour ajouter des colonnes non prévues
}) => {
  if (!items || items.length === 0) {
    return <p className="text-muted p-3">Aucun article dans ce document.</p>;
  }

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Construire les colonnes visibles basées sur columnConfig
  const visibleColumns = Object.entries(columnConfig)
    .filter(([key, config]) => config.visible)
    .map(([key, config]) => ({ key, ...config }));


  return (
    // Le Card wrapper a été retiré pour plus de flexibilité, peut être ajouté dans le composant parent
    <div className="document-item-list-container">
      {title && <h6 className="mb-2 document-item-list-title">{title}</h6>}
      <Table striped hover responsive size="sm" className="mb-0 document-items-table">
        <thead className="table-light">
          <tr>
            <th>#</th>
            {visibleColumns.map(col => (
              <th key={col.key} className={col.cellClassName || ''}>{col.Header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.tempId || item.id || `doc-item-${index}`}>
              <td>{index + 1}</td>
              {visibleColumns.map(col => {
                let cellContent = item[col.accessor];
                if (col.key === 'unitPriceHT' || col.key === 'totalHT') {
                  cellContent = `${formatAmount(cellContent)} ${currencySymbol}`;
                } else if (col.key === 'vatRate') {
                  cellContent = `${item[col.accessor]?.toFixed(0) || '0'}%`;
                }
                return (
                  <td key={`${item.id}-${col.key}`} className={col.cellClassName || ''}>
                    {cellContent === undefined || cellContent === null ? '-' : cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

DocumentItemListReadOnly.propTypes = {
  items: PropTypes.array.isRequired,
  currencySymbol: PropTypes.string,
  title: PropTypes.string,
  columnConfig: PropTypes.object, // Structure plus complexe à définir si besoin strict
};

export default DocumentItemListReadOnly;