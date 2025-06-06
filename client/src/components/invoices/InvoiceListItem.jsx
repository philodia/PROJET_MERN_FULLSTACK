// frontend/src/components/invoices/InvoiceItemList.jsx
import React from 'react';
import PropTypes from 'prop-types';
import DocumentItemListReadOnly from '../common/DocumentItemListReadOnly'; // Le composant générique

/**
 * Affiche la liste des articles d'une facture en lecture seule.
 * C'est un wrapper autour de DocumentItemListReadOnly, préconfiguré pour les factures.
 */
const InvoiceItemList = ({
  items = [],
  currencySymbol = '€',
  title = "Détail de la Facture",
}) => {
  // Configuration des colonnes spécifiques pour une facture
  const invoiceColumnConfig = {
    productName: { Header: 'Produit / Service', visible: true, accessor: 'productName' },
    description: { Header: 'Description', visible: true, accessor: 'description' },
    quantity: { Header: 'Qté', visible: true, accessor: 'quantity', cellClassName: 'text-center' },
    unitPriceHT: { Header: `Prix U. HT (${currencySymbol})`, visible: true, accessor: 'unitPriceHT', cellClassName: 'text-end' },
    vatRate: { Header: 'TVA (%)', visible: true, accessor: 'vatRate', cellClassName: 'text-center' },
    totalHT: { Header: `Total HT (${currencySymbol})`, visible: true, accessor: 'totalHT', cellClassName: 'text-end fw-bold' },
    // Colonnes non visibles par défaut pour cette vue de facture, mais DocumentItemListReadOnly les a
    quantityOrdered: { Header: 'Qté Cmdée', visible: false, accessor: 'quantityOrdered' },
  };

  return (
    <DocumentItemListReadOnly
      items={items}
      currencySymbol={currencySymbol}
      title={title}
      columnConfig={invoiceColumnConfig}
    />
  );
};

InvoiceItemList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      tempId: PropTypes.string,
      productName: PropTypes.string.isRequired,
      description: PropTypes.string,
      quantity: PropTypes.number.isRequired,
      unitPriceHT: PropTypes.number.isRequired,
      vatRate: PropTypes.number.isRequired,
      totalHT: PropTypes.number.isRequired, // totalHT de la ligne
    })
  ).isRequired,
  currencySymbol: PropTypes.string,
  title: PropTypes.string,
};

export default InvoiceItemList;