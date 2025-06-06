// frontend/src/components/invoices/InvoiceView.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import DocumentItemListReadOnly from '../common/DocumentItemListReadOnly'; // Notre composant générique
import QuoteTotals from '../quotes/QuoteTotals'; // Réutilisé pour les totaux
import './InvoiceView.scss'; // Peut partager des styles avec QuoteView.scss et DeliveryNoteView.scss via _document-view.scss

/**
 * Affiche une vue détaillée d'une Facture, formatée pour la lecture ou l'impression/PDF.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.invoice - L'objet facture complet.
 *        { id, invoiceNumber, client: { companyName, contactName, email, phone, address, tvaIntracomClient },
 *          issueDate, dueDate, items: [...], totalHT, totalVAT, totalTTC, notes, paymentTerms, status,
 *          companyInfo: { name, address, phone, email, siret, tvaIntracom, logoUrl, bankDetails: {iban, bic, bankName} },
 *          sourceDocumentInfo: {type, number} // Ex: {type: 'BL', number: 'BL001'}
 *        }
 * @param {object} [props.companyInfo] - Informations sur l'entreprise émettrice.
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 * @param {string} [props.className] - Classes CSS.
 * @param {boolean} [props.isForPDF=false] - Styles optimisés pour PDF.
 */
const InvoiceView = ({
  invoice,
  companyInfo,
  currencySymbol = '€',
  className = '',
  isForPDF = false,
}) => {
  if (!invoice) {
    return <div className="p-3 text-muted">Aucune facture à afficher.</div>;
  }

  const {
    invoiceNumber,
    client,
    issueDate,
    dueDate,
    items = [],
    totalHT = 0,
    totalVAT = 0,
    totalTTC = 0,
    notes, // Notes spécifiques de la facture, mentions légales, etc.
    paymentTerms,
    status,
    sourceDocumentInfo, // Info sur le BL ou Devis source
  } = invoice;

  const effectiveCompanyInfo = invoice.companyInfo || companyInfo || {};

  const formatDate = (dateString, dateFormat = 'dd MMMM yyyy') => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), dateFormat, { locale: fr });
    } catch {
      return dateString;
    }
  };

  const statusLabels = {
    DRAFT: { text: 'Brouillon', variant: 'secondary' },
    SENT: { text: 'Envoyée', variant: 'info' },
    PAID: { text: 'Payée', variant: 'success' },
    PARTIALLY_PAID: { text: 'Partiellement Payée', variant: 'warning' },
    UNPAID: { text: 'Impayée', variant: 'danger' },
    OVERDUE: { text: 'En Retard', variant: 'danger', icon: 'BsExclamationCircleFill' },
    CANCELLED: { text: 'Annulée', variant: 'dark' },
  };
  // Logique pour déterminer si OVERDUE
  let effectiveStatus = status?.toUpperCase();
  if (effectiveStatus === 'UNPAID' && dueDate && new Date(dueDate) < new Date() && new Date(dueDate).setHours(0,0,0,0) !== new Date().setHours(0,0,0,0) ) {
      effectiveStatus = 'OVERDUE';
  }
  const currentStatus = statusLabels[effectiveStatus] || { text: status, variant: 'light' };


  // Adapter les items pour DocumentItemListReadOnly si nécessaire
  const itemsForDisplay = items.map(item => ({
    ...item,
    quantity: item.quantity, // Quantité facturée
    // S'assurer que les autres props attendues par DocumentItemListReadOnly sont là
  }));

  // Préparer les détails de TVA pour QuoteTotals
  const getVatDetailsFromItems = (invoiceItems) => {
      const vatSummary = {};
      (invoiceItems || []).forEach(item => {
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

  return (
    <div className={`invoice-view-wrapper ${isForPDF ? 'pdf-view' : ''} ${className}`}>
      <Card className="document-view-card"> {/* Utiliser la classe générique */}
        <Card.Header className="document-header-section p-4">
          <Row className="align-items-center">
            <Col xs={12} md={7} className="company-info mb-3 mb-md-0">
              {effectiveCompanyInfo.logoUrl && (
                <img src={effectiveCompanyInfo.logoUrl} alt={`${effectiveCompanyInfo.name} Logo`} className="company-logo mb-2" />
              )}
              <h4 className="company-name mb-1">{effectiveCompanyInfo.name || 'Votre Entreprise'}</h4>
              {effectiveCompanyInfo.address && <p className="mb-0 small">{effectiveCompanyInfo.address.street}, {effectiveCompanyInfo.address.zipCode} {effectiveCompanyInfo.address.city}</p>}
              {effectiveCompanyInfo.phone && <p className="mb-0 small">Tél : {effectiveCompanyInfo.phone}</p>}
              {effectiveCompanyInfo.email && <p className="mb-0 small">Email : {effectiveCompanyInfo.email}</p>}
              {effectiveCompanyInfo.siret && <p className="mb-0 small">SIRET : {effectiveCompanyInfo.siret}</p>}
              {effectiveCompanyInfo.tvaIntracom && <p className="mb-0 small">TVA Intra. : {effectiveCompanyInfo.tvaIntracom}</p>}
            </Col>
            <Col xs={12} md={5} className="document-meta-info text-md-end">
              <h2 className="document-title mb-3">FACTURE</h2>
              <p className="mb-1">
                <strong>Numéro :</strong> {invoiceNumber || '-'}
              </p>
              <p className="mb-1">
                <strong>Date d'émission :</strong> {formatDate(issueDate)}
              </p>
              <p className="mb-1">
                <strong>Date d'échéance :</strong> {formatDate(dueDate)}
              </p>
              {sourceDocumentInfo && (
                 <p className="mb-1">
                    <small className="text-muted">
                        Réf. {sourceDocumentInfo.type === 'DELIVERY_NOTE' ? 'BL' : 'Devis'} : {sourceDocumentInfo.number}
                    </small>
                 </p>
              )}
              {status && (
                <div className="mt-2">
                  <strong>Statut : </strong>
                  <StatusBadge variant={currentStatus.variant} pillSize="md">
                     {currentStatus.icon && <Icon name={currentStatus.icon} className="me-1" />}
                     {currentStatus.text}
                  </StatusBadge>
                </div>
              )}
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-4">
          <Row className="mb-4 client-info-section">
            <Col>
              <h6 className="text-muted">Facturé à :</h6>
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
              {client?.tvaIntracomClient && <p className="mb-0 small">N° TVA Intra. Client : {client.tvaIntracomClient}</p>}
            </Col>
          </Row>

          <DocumentItemListReadOnly
            items={itemsForDisplay}
            currencySymbol={currencySymbol}
            title="Détail de la Facturation"
            columnConfig={{ // Configurer les colonnes pour la facture
                productName: { Header: 'Produit / Service', visible: true, accessor: 'productName' },
                description: { Header: 'Description', visible: true, accessor: 'description' },
                quantity: { Header: 'Qté', visible: true, accessor: 'quantity', cellClassName: 'text-center' },
                unitPriceHT: { Header: `Prix U. HT (${currencySymbol})`, visible: true, accessor: 'unitPriceHT', cellClassName: 'text-end' },
                vatRate: { Header: 'TVA (%)', visible: true, accessor: 'vatRate', cellClassName: 'text-center' },
                totalHT: { Header: `Total HT (${currencySymbol})`, visible: true, accessor: 'totalHT', cellClassName: 'text-end fw-bold' },
            }}
          />

          <Row className="mt-4 totals-and-notes-section">
            <Col md={7} className="notes-section mb-3 mb-md-0">
              {paymentTerms && (
                <div className="mb-3">
                    <h6 className="text-muted">Conditions de paiement :</h6>
                    <p className="payment-terms small">{paymentTerms}</p>
                </div>
              )}
              {notes && (
                <>
                  <h6 className="text-muted">Notes et mentions légales :</h6>
                  <div className="notes-content p-3 bg-light rounded small">
                    <pre>{notes}</pre>
                  </div>
                </>
              )}
               {effectiveCompanyInfo.bankDetails && (
                <div className="mt-3 bank-details-section">
                    <h6 className="text-muted">Informations Bancaires pour Paiement :</h6>
                    <p className="small mb-0"><strong>Banque :</strong> {effectiveCompanyInfo.bankDetails.bankName}</p>
                    <p className="small mb-0"><strong>IBAN :</strong> {effectiveCompanyInfo.bankDetails.iban}</p>
                    <p className="small mb-0"><strong>BIC/SWIFT :</strong> {effectiveCompanyInfo.bankDetails.bic}</p>
                </div>
               )}
            </Col>
            <Col md={5} className="totals-section">
              <QuoteTotals // Réutilisation
                totalHT={totalHT}
                totalVAT={totalVAT}
                totalTTC={totalTTC}
                currencySymbol={currencySymbol}
                vatDetails={vatDetailsForDisplay}
              />
            </Col>
          </Row>
        </Card.Body>

        <Card.Footer className="text-center text-muted small p-3 document-footer-section">
          {effectiveCompanyInfo.website && <p className="mb-1">Visitez notre site : <a href={effectiveCompanyInfo.website.startsWith('http') ? effectiveCompanyInfo.website : `//${effectiveCompanyInfo.website}`} target="_blank" rel="noopener noreferrer">{effectiveCompanyInfo.website}</a></p>}
          <p className="mb-0">Merci de votre confiance et de votre règlement.</p>
          {/* Mentions légales obligatoires : "TVA non applicable, art. 293 B du CGI" si auto-entrepreneur, etc. */}
          {/* Pénalités de retard, indemnité forfaitaire pour frais de recouvrement... */}
        </Card.Footer>
      </Card>
    </div>
  );
};

// Structures de props similaires à QuoteView
const clientShape = PropTypes.shape({ /* ... */ companyName: PropTypes.string.isRequired, tvaIntracomClient: PropTypes.string, /* ... */ });
const companyInfoShape = PropTypes.shape({ /* ... */ bankDetails: PropTypes.shape({ iban: PropTypes.string, bic: PropTypes.string, bankName: PropTypes.string }), /* ... */});


InvoiceView.propTypes = {
  invoice: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    invoiceNumber: PropTypes.string.isRequired,
    client: clientShape, // Peut être null si les détails du client ne sont pas entièrement chargés
    issueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    items: PropTypes.array.isRequired,
    totalHT: PropTypes.number.isRequired,
    totalVAT: PropTypes.number.isRequired,
    totalTTC: PropTypes.number.isRequired,
    notes: PropTypes.string,
    paymentTerms: PropTypes.string,
    status: PropTypes.string,
    companyInfo: companyInfoShape,
    sourceDocumentInfo: PropTypes.shape({ type: PropTypes.string, number: PropTypes.string }),
  }).isRequired,
  companyInfo: companyInfoShape,
  currencySymbol: PropTypes.string,
  className: PropTypes.string,
  isForPDF: PropTypes.bool,
};

export default InvoiceView;