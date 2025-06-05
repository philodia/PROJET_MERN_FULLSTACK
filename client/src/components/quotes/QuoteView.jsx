// frontend/src/components/quotes/QuoteView.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge'; // Pour le statut du devis
import QuoteItemListReadOnly from './QuoteItemListReadOnly'; // Pour afficher les items
import QuoteTotals from './QuoteTotals'; // Pour afficher les totaux
import './QuoteView.scss'; // Fichier SCSS pour les styles spécifiques

/**
 * Affiche une vue détaillée d'un devis, formatée pour la lecture ou l'impression/PDF.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.quote - L'objet devis complet.
 *        { id, quoteNumber, client: { companyName, contactName, email, phone, address },
 *          issueDate, validityDate, items: [...], totalHT, totalVAT, totalTTC, notes, status,
 *          companyInfo: { name, address, phone, email, siret, tvaIntracom, logoUrl } }
 * @param {object} [props.companyInfo] - Informations sur l'entreprise émettrice (si non incluses dans `quote`).
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le conteneur principal.
 * @param {boolean} [props.isForPDF=false] - Si true, applique des styles optimisés pour le PDF.
 */
const QuoteView = ({
  quote,
  companyInfo, // Peut être passé en prop ou faire partie de l'objet quote
  currencySymbol = '€',
  className = '',
  isForPDF = false,
}) => {
  if (!quote) {
    return <div className="p-3 text-muted">Aucun devis à afficher.</div>;
  }

  const {
    quoteNumber,
    client,
    issueDate,
    validityDate,
    items = [],
    totalHT = 0,
    totalVAT = 0,
    totalTTC = 0,
    notes,
    status,
  } = quote;

  // Utiliser companyInfo de l'objet quote si disponible, sinon la prop
  const effectiveCompanyInfo = quote.companyInfo || companyInfo || {};

  const formatDate = (dateString, dateFormat = 'dd MMMM yyyy') => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), dateFormat, { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Préparer les détails de TVA pour QuoteTotals
  const getVatDetailsFromItems = (quoteItems) => {
      const vatSummary = {};
      (quoteItems || []).forEach(item => {
          const itemTotalHT = (Number(item.quantity) || 0) * (Number(item.unitPriceHT) || 0);
          const rate = Number(item.vatRate) || 0;
          if (!vatSummary[rate]) {
              vatSummary[rate] = { base: 0, amount: 0, rate: rate };
          }
          vatSummary[rate].base += itemTotalHT;
          vatSummary[rate].amount += itemTotalHT * (rate / 100);
      });
      return Object.values(vatSummary).filter(v => v.amount > 0).sort((a,b) => b.rate - a.rate);
  };
  const vatDetailsForDisplay = getVatDetailsFromItems(items);

  const statusLabels = {
    DRAFT: { text: 'Brouillon', variant: 'secondary' },
    SENT: { text: 'Envoyé', variant: 'info' },
    ACCEPTED: { text: 'Accepté', variant: 'success' },
    REJECTED: { text: 'Rejeté', variant: 'danger' },
    EXPIRED: { text: 'Expiré', variant: 'warning' },
    CONVERTED_TO_DELIVERY: { text: 'Converti (BL)', variant: 'primary' },
    CONVERTED_TO_INVOICE: { text: 'Converti (Facture)', variant: 'primary' },
  };
  const currentStatus = statusLabels[status?.toUpperCase()] || { text: status, variant: 'light' };


  return (
    <div className={`quote-view-wrapper ${isForPDF ? 'pdf-view' : ''} ${className}`}>
      <Card className="quote-document">
        <Card.Header className="quote-header-section p-4">
          <Row className="align-items-center">
            <Col xs={12} md={6} className="company-info mb-3 mb-md-0">
              {effectiveCompanyInfo.logoUrl && (
                <img src={effectiveCompanyInfo.logoUrl} alt={`${effectiveCompanyInfo.name} Logo`} className="company-logo mb-2" />
              )}
              <h4 className="company-name mb-1">{effectiveCompanyInfo.name || 'Votre Entreprise'}</h4>
              {effectiveCompanyInfo.address && <p className="mb-0 small">{effectiveCompanyInfo.address.street}</p>}
              {effectiveCompanyInfo.address && <p className="mb-0 small">{effectiveCompanyInfo.address.zipCode} {effectiveCompanyInfo.address.city}</p>}
              {effectiveCompanyInfo.phone && <p className="mb-0 small">Tél : {effectiveCompanyInfo.phone}</p>}
              {effectiveCompanyInfo.email && <p className="mb-0 small">Email : {effectiveCompanyInfo.email}</p>}
              {effectiveCompanyInfo.siret && <p className="mb-0 small">SIRET : {effectiveCompanyInfo.siret}</p>}
              {effectiveCompanyInfo.tvaIntracom && <p className="mb-0 small">TVA Intra. : {effectiveCompanyInfo.tvaIntracom}</p>}
            </Col>
            <Col xs={12} md={6} className="quote-meta-info text-md-end">
              <h2 className="quote-title mb-3">DEVIS</h2>
              <p className="mb-1">
                <strong>Numéro :</strong> {quoteNumber || '-'}
              </p>
              <p className="mb-1">
                <strong>Date d'émission :</strong> {formatDate(issueDate)}
              </p>
              <p className="mb-1">
                <strong>Valable jusqu'au :</strong> {formatDate(validityDate)}
              </p>
              {status && (
                <div className="mt-2">
                  <strong>Statut : </strong>
                  <StatusBadge variant={currentStatus.variant} pillSize="md">{currentStatus.text}</StatusBadge>
                </div>
              )}
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-4">
          <Row className="mb-4 client-info-section">
            <Col>
              <h6 className="text-muted">Devis pour :</h6>
              <h5 className="client-name mb-1">{client?.companyName || 'Client non spécifié'}</h5>
              {client?.contactName && <p className="mb-0 small">À l'attention de : {client.contactName}</p>}
              {client?.address && (
                <>
                  <p className="mb-0 small">{client.address.street}</p>
                  <p className="mb-0 small">{client.address.zipCode} {client.address.city}</p>
                  {client.address.country && <p className="mb-0 small">{client.address.country}</p>}
                </>
              )}
              {client?.email && <p className="mb-0 small"><Icon name="BsEnvelope" className="me-1"/> {client.email}</p>}
              {client?.phone && <p className="mb-0 small"><Icon name="BsTelephone" className="me-1"/> {client.phone}</p>}
            </Col>
          </Row>

          <QuoteItemListReadOnly
            items={items}
            currencySymbol={currencySymbol}
            title="Prestations / Produits"
            showVatRateColumn={true} // Afficher la colonne TVA par défaut
            showTotalHTColumn={true}
          />

          <Row className="mt-4 totals-and-notes-section">
            <Col md={7} className="notes-section mb-3 mb-md-0">
              {notes && (
                <>
                  <h6 className="text-muted">Notes et conditions :</h6>
                  <div className="notes-content p-3 bg-light rounded small">
                    <pre>{notes}</pre> {/* <pre> pour conserver les sauts de ligne */}
                  </div>
                </>
              )}
            </Col>
            <Col md={5} className="totals-section">
              <QuoteTotals
                totalHT={totalHT}
                totalVAT={totalVAT}
                totalTTC={totalTTC}
                currencySymbol={currencySymbol}
                vatDetails={vatDetailsForDisplay}
                // useCard={false} // Pas besoin de Card ici, on est déjà dans le Card.Body principal
              />
            </Col>
          </Row>
        </Card.Body>

        <Card.Footer className="text-center text-muted small p-3 quote-footer-section">
          {effectiveCompanyInfo.website && <p className="mb-1">Visitez notre site : <a href={effectiveCompanyInfo.website.startsWith('http') ? effectiveCompanyInfo.website : `//${effectiveCompanyInfo.website}`} target="_blank" rel="noopener noreferrer">{effectiveCompanyInfo.website}</a></p>}
          <p className="mb-0">Merci pour votre confiance.</p>
          {/* Mentions légales si nécessaires : SARL au capital de X €, etc. */}
        </Card.Footer>
      </Card>
    </div>
  );
};

// Structure de l'objet client attendu
const clientShape = PropTypes.shape({
  companyName: PropTypes.string.isRequired,
  contactName: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,
  address: PropTypes.shape({
    street: PropTypes.string,
    city: PropTypes.string,
    zipCode: PropTypes.string,
    country: PropTypes.string,
  }),
});

// Structure de l'objet companyInfo attendu
const companyInfoShape = PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.shape({ street: PropTypes.string, zipCode: PropTypes.string, city: PropTypes.string }),
    phone: PropTypes.string,
    email: PropTypes.string,
    siret: PropTypes.string,
    tvaIntracom: PropTypes.string,
    logoUrl: PropTypes.string,
    website: PropTypes.string,
});

QuoteView.propTypes = {
  quote: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    quoteNumber: PropTypes.string.isRequired,
    client: clientShape.isRequired,
    issueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    validityDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    items: PropTypes.array.isRequired, // La validation détaillée est dans QuoteItemListReadOnly
    totalHT: PropTypes.number.isRequired,
    totalVAT: PropTypes.number.isRequired,
    totalTTC: PropTypes.number.isRequired,
    notes: PropTypes.string,
    status: PropTypes.string,
    companyInfo: companyInfoShape, // Peut être imbriqué dans quote ou passé séparément
  }).isRequired,
  companyInfo: companyInfoShape, // Si passé séparément
  currencySymbol: PropTypes.string,
  className: PropTypes.string,
  isForPDF: PropTypes.bool,
};

export default QuoteView;