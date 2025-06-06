// frontend/src/components/deliveryNotes/DeliveryNoteView.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import StatusBadge from '../common/StatusBadge';
import DocumentItemListReadOnly from '../common/DocumentItemListReadOnly';
import './DeliveryNoteView.scss';

/**
 * Composant d'affichage d'un Bon de Livraison.
 */
const DeliveryNoteView = ({
  deliveryNote,
  companyInfo,
  className = '',
  isForPDF = false,
}) => {
  if (!deliveryNote) {
    return <div className="p-3 text-muted">Aucun bon de livraison à afficher.</div>;
  }

  const {
    deliveryNoteNumber,
    client,
    deliveryDate,
    items = [],
    shippingAddress,
    notes,
    status,
    sourceQuoteId,
  } = deliveryNote;

  const effectiveCompanyInfo = deliveryNote.companyInfo || companyInfo || {};
  const effectiveShippingAddress = shippingAddress || client?.address || {};

  const formatDate = (dateString, dateFormat = 'dd MMMM yyyy') => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), dateFormat, { locale: fr });
    } catch {
      return dateString;
    }
  };

  const statusLabels = {
    PENDING: { text: 'En attente', variant: 'secondary' },
    SHIPPED: { text: 'Expédié', variant: 'info' },
    PARTIALLY_DELIVERED: { text: 'Partiellement livré', variant: 'warning' },
    DELIVERED: { text: 'Livré', variant: 'success' },
    CANCELLED: { text: 'Annulé', variant: 'danger' },
  };

  const currentStatus =
    statusLabels[status?.toUpperCase()] || { text: status || 'Inconnu', variant: 'light' };

  const itemsForDisplay = items.map((item) => ({
    ...item,
    quantity: item.quantityDelivered,
  }));

  return (
    <div className={`delivery-note-view-wrapper ${isForPDF ? 'pdf-view' : ''} ${className}`}>
      <Card className="document-view-card">
        <Card.Header className="document-header-section p-4">
          <Row className="align-items-center">
            <Col xs={12} md={6} className="company-info mb-3 mb-md-0">
              {effectiveCompanyInfo.logoUrl && (
                <img
                  src={effectiveCompanyInfo.logoUrl}
                  alt={`${effectiveCompanyInfo.name} Logo`}
                  className="company-logo mb-2"
                />
              )}
              <h4 className="company-name mb-1">{effectiveCompanyInfo.name || 'Votre Entreprise'}</h4>
              {effectiveCompanyInfo.address?.street && (
                <p className="mb-0 small">{effectiveCompanyInfo.address.street}</p>
              )}
              {effectiveCompanyInfo.address?.zipCode && (
                <p className="mb-0 small">
                  {effectiveCompanyInfo.address.zipCode} {effectiveCompanyInfo.address.city}
                </p>
              )}
            </Col>
            <Col xs={12} md={6} className="document-meta-info text-md-end">
              <h2 className="document-title mb-3">BON DE LIVRAISON</h2>
              <p className="mb-1">
                <strong>Numéro :</strong> {deliveryNoteNumber || '-'}
              </p>
              <p className="mb-1">
                <strong>Date de livraison :</strong> {formatDate(deliveryDate)}
              </p>
              {sourceQuoteId && (
                <p className="mb-1">
                  <small className="text-muted">Référence Devis : {sourceQuoteId}</small>
                </p>
              )}
              {status && (
                <div className="mt-2">
                  <strong>Statut : </strong>
                  <StatusBadge variant={currentStatus.variant} pillSize="md">
                    {currentStatus.text}
                  </StatusBadge>
                </div>
              )}
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-4">
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0 client-info-section">
              <h6 className="text-muted">Client :</h6>
              <h5 className="client-name mb-1">{client?.companyName || 'Client non spécifié'}</h5>
              {client?.contactName && (
                <p className="mb-0 small">À l'attention de : {client.contactName}</p>
              )}
              {client?.address?.street && (
                <>
                  <p className="mb-0 small text-muted fst-italic">Adresse Client :</p>
                  <p className="mb-0 small fst-italic">{client.address.street}</p>
                  <p className="mb-0 small fst-italic">
                    {client.address.zipCode} {client.address.city}
                  </p>
                </>
              )}
            </Col>
            <Col md={6} className="shipping-address-section">
              <h6 className="text-muted">Adresse de Livraison :</h6>
              {effectiveShippingAddress.street ? (
                <>
                  <p className="mb-0 fw-medium">{effectiveShippingAddress.street}</p>
                  <p className="mb-0 fw-medium">
                    {effectiveShippingAddress.zipCode} {effectiveShippingAddress.city}
                  </p>
                  {effectiveShippingAddress.country && (
                    <p className="mb-0 fw-medium">{effectiveShippingAddress.country}</p>
                  )}
                </>
              ) : (
                <p className="text-muted">Non spécifiée.</p>
              )}
            </Col>
          </Row>

          <DocumentItemListReadOnly
            items={itemsForDisplay}
            title="Articles Livrés"
            showVatRateColumn={false}
            showTotalHTColumn={false}
            columnConfig={{
              productName: { Header: 'Produit / Service' },
              description: { Header: 'Description' },
              quantity: { Header: 'Qté Livrée', cellClassName: 'text-center' },
            }}
          />

          {notes && (
            <Row className="mt-4">
              <Col>
                <h6 className="text-muted">Notes de livraison :</h6>
                <div className="notes-content p-3 bg-light rounded small">
                  <pre>{notes}</pre>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>

        <Card.Footer className="text-center text-muted small p-3 document-footer-section">
          <p className="mb-0">Veuillez vérifier la conformité des marchandises à réception.</p>
        </Card.Footer>
      </Card>
    </div>
  );
};

// PropTypes détaillés
const addressShape = PropTypes.shape({
  street: PropTypes.string,
  city: PropTypes.string,
  zipCode: PropTypes.string,
  country: PropTypes.string,
  state: PropTypes.string,
});

const clientShape = PropTypes.shape({
  companyName: PropTypes.string,
  contactName: PropTypes.string,
  address: addressShape,
});

const companyInfoShape = PropTypes.shape({
  name: PropTypes.string,
  address: addressShape,
  phone: PropTypes.string,
  email: PropTypes.string,
  siret: PropTypes.string,
  tvaIntracom: PropTypes.string,
  logoUrl: PropTypes.string,
});

DeliveryNoteView.propTypes = {
  deliveryNote: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    deliveryNoteNumber: PropTypes.string.isRequired,
    client: clientShape,
    deliveryDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]).isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        productName: PropTypes.string.isRequired,
        description: PropTypes.string,
        quantityOrdered: PropTypes.number,
        quantityDelivered: PropTypes.number.isRequired,
      })
    ).isRequired,
    shippingAddress: addressShape,
    notes: PropTypes.string,
    status: PropTypes.string,
    sourceQuoteId: PropTypes.string,
    companyInfo: companyInfoShape,
  }).isRequired,
  companyInfo: companyInfoShape,
  className: PropTypes.string,
  isForPDF: PropTypes.bool,
};

export default DeliveryNoteView;
