// frontend/src/components/quotes/QuoteTotals.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Table as BootstrapTable } from 'react-bootstrap'; // Table pour un alignement propre
import './QuoteTotals.scss'; // Fichier SCSS pour les styles personnalisés

/**
 * Affiche les totaux (HT, TVA, TTC) pour un devis ou une facture.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {number} props.totalHT - Montant total Hors Taxe.
 * @param {number} props.totalVAT - Montant total de la TVA.
 * @param {number} props.totalTTC - Montant total Toutes Taxes Comprises.
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 * @param {string} [props.title] - Titre optionnel pour la section des totaux (ex: "Récapitulatif Financier").
 * @param {boolean} [props.useCard=false] - Si les totaux doivent être enveloppés dans un composant Card.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le conteneur principal.
 * @param {object} [props.vatDetails] - Optionnel: un objet ou un tableau pour détailler la TVA par taux.
 *                                      Ex: [{ rate: 20, amount: 100, base: 500 }, { rate: 5.5, amount: 11, base: 200 }]
 */
const QuoteTotals = ({
  totalHT = 0,
  totalVAT = 0,
  totalTTC = 0,
  currencySymbol = '€',
  title, // Titre optionnel pour la section des totaux
  useCard = false, // Par défaut, ne pas utiliser de Card pour plus de flexibilité d'intégration
  className = '',
  vatDetails, // ex: [{ rate: 20, amount: 100, base: 500 }]
}) => {
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0.00'; // Afficher 0.00 si undefined
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const content = (
    <div className={`quote-totals-container ${className}`}>
      {title && !useCard && <h5 className="quote-totals-title mb-3">{title}</h5>}

      <BootstrapTable borderless size="sm" className="quote-totals-table mb-0">
        <tbody>
          <tr>
            <td className="text-muted">Total Hors Taxes (HT)</td>
            <td className="text-end">{formatAmount(totalHT)} {currencySymbol}</td>
          </tr>

          {/* Détail de la TVA si fourni */}
          {vatDetails && vatDetails.length > 0 && (
            vatDetails.map((vat, index) => (
              <tr key={`vat-${vat.rate}-${index}`} className="vat-detail-row">
                <td className="text-muted ps-3">
                  <small>TVA à {vat.rate}% (sur {formatAmount(vat.base)} {currencySymbol})</small>
                </td>
                <td className="text-end">
                  <small>{formatAmount(vat.amount)} {currencySymbol}</small>
                </td>
              </tr>
            ))
          )}
          {/* Afficher le total TVA même si pas de détails, ou si les détails ne somment pas au total (pour cohérence) */}
          {(!vatDetails || vatDetails.length === 0 || (vatDetails.reduce((sum, v) => sum + v.amount, 0) !== totalVAT && totalVAT > 0) ) && (
             <tr>
                <td className="text-muted">Total TVA</td>
                <td className="text-end">{formatAmount(totalVAT)} {currencySymbol}</td>
            </tr>
          )}


          <tr className="quote-total-ttc fw-bold">
            <td>Total Toutes Taxes Comprises (TTC)</td>
            <td className="text-end h5 mb-0">{formatAmount(totalTTC)} {currencySymbol}</td>
          </tr>
        </tbody>
      </BootstrapTable>
    </div>
  );

  if (useCard) {
    return (
      <Card className={`quote-totals-card shadow-sm ${className}`}>
        {title && <Card.Header as="h6">{title || 'Récapitulatif'}</Card.Header>}
        <Card.Body className={!title && !className.includes('p-') ? 'p-3' : ''}> {/* Ajoute padding si pas de titre et pas de padding custom */}
          {content}
        </Card.Body>
      </Card>
    );
  }

  return content;
};

QuoteTotals.propTypes = {
  totalHT: PropTypes.number.isRequired,
  totalVAT: PropTypes.number.isRequired,
  totalTTC: PropTypes.number.isRequired,
  currencySymbol: PropTypes.string,
  title: PropTypes.string,
  useCard: PropTypes.bool,
  className: PropTypes.string,
  vatDetails: PropTypes.arrayOf(PropTypes.shape({
    rate: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    base: PropTypes.number.isRequired,
  })),
};

export default QuoteTotals;