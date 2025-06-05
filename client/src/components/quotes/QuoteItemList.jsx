// frontend/src/components/quotes/QuoteItemListReadOnly.jsx
// Renommé pour indiquer clairement son rôle en lecture seule
import React from 'react';
import PropTypes from 'prop-types';
import { Table, Card } from 'react-bootstrap'; // Utiliser Table pour un affichage plus structuré
import './QuoteItemList.scss'; // Partager ou créer un SCSS

/**
 * Affiche une liste en lecture seule des lignes d'un devis ou d'une facture.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.items - Tableau des items du document.
 *        Chaque item: { productName, description, quantity, unitPriceHT, vatRate, totalHT }
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 * @param {string} [props.title="Détail des Articles"] - Titre pour la section.
 * @param {boolean} [props.showVatRateColumn=true] - Afficher la colonne Taux TVA.
 * @param {boolean} [props.showTotalHTColumn=true] - Afficher la colonne Total HT.
 */
const QuoteItemListReadOnly = ({
  items = [],
  currencySymbol = '€',
  title = "Détail des Articles",
  showVatRateColumn = true,
  showTotalHTColumn = true,
}) => {
  if (!items || items.length === 0) {
    return <p className="text-muted p-3">Aucun article dans ce document.</p>;
  }

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="quote-item-list-card mb-3">
      {title && <Card.Header as="h6">{title}</Card.Header>}
      <Card.Body className="p-0"> {/* p-0 pour que la table touche les bords */}
        <Table striped hover responsive className="mb-0 quote-items-table">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Produit / Service</th>
              <th>Description</th>
              <th className="text-center">Qté</th>
              <th className="text-end">Prix U. HT</th>
              {showVatRateColumn && <th className="text-center">TVA (%)</th>}
              {showTotalHTColumn && <th className="text-end">Total HT</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.tempId || item.id || `item-${index}`}>
                <td>{index + 1}</td>
                <td>{item.productName}</td>
                <td className="item-description-cell">
                  {item.description || '-'}
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-end">
                  {formatAmount(item.unitPriceHT)} {currencySymbol}
                </td>
                {showVatRateColumn && (
                  <td className="text-center">{item.vatRate?.toFixed(0) || '0'}%</td>
                )}
                {showTotalHTColumn && (
                  <td className="text-end fw-bold">
                    {formatAmount(item.totalHT)} {currencySymbol}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

QuoteItemListReadOnly.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Ou tempId
      tempId: PropTypes.string,
      productName: PropTypes.string.isRequired,
      description: PropTypes.string,
      quantity: PropTypes.number.isRequired,
      unitPriceHT: PropTypes.number.isRequired,
      vatRate: PropTypes.number.isRequired,
      totalHT: PropTypes.number.isRequired,
    })
  ).isRequired,
  currencySymbol: PropTypes.string,
  title: PropTypes.string,
  showVatRateColumn: PropTypes.bool,
  showTotalHTColumn: PropTypes.bool,
};

export default QuoteItemListReadOnly;