import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, ButtonGroup, Table, Badge, ListGroup } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import PageContainer from '../../components/layout/PageContainer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import AppButton from '../../components/common/AppButton';
import Icon from '../../components/common/Icon';
import StatusBadge from '../../components/common/StatusBadge';
import AppModal from '../../components/common/AppModal';
import RecordPaymentForm from '../../components/invoices/RecordPaymentForm';

import {
  fetchInvoiceById,
  selectCurrentInvoiceDetail,
  selectInvoiceStatus,
  selectInvoiceError,
  clearInvoiceError,
  clearCurrentInvoice,
} from '../../features/invoices/invoiceSlice';
import { 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast 
} from '../../components/common/NotificationToast';
import { useAuth } from '../../hooks/useAuth';

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasRole } = useAuth();

  const invoice = useSelector(selectCurrentInvoiceDetail);
  const status = useSelector(selectInvoiceStatus);
  const error = useSelector(selectInvoiceError);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Tous les hooks au top level
  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: invoice?.currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [invoice?.currency]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  }, []);

  // Formatage de devise avec gestion des erreurs
  const formatCurrencyForDisplay = useCallback((value) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 'N/A';
    }
    try {
      return currencyFormatter.format(value);
    } catch (error) {
      console.error('Erreur de formatage de devise:', error);
      return `${value} ${invoice?.currency || ''}`;
    }
  }, [currencyFormatter, invoice?.currency]);

  // Calcul des totaux de paiement
  const paymentSummary = useMemo(() => {
    if (!invoice) return null;
    
    const amountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const amountDue = invoice.totalTTC - amountPaid;
    const isFullyPaid = amountDue <= 0;
    
    return {
      amountPaid,
      amountDue,
      isFullyPaid
    };
  }, [invoice]);

  useEffect(() => {
    if (invoiceId) {
      dispatch(fetchInvoiceById(invoiceId));
    }
    
    return () => {
      dispatch(clearCurrentInvoice());
      dispatch(clearInvoiceError());
    };
  }, [dispatch, invoiceId]);

  const handleRecordPaymentSuccess = useCallback(() => {
    showSuccessToast('Paiement enregistré avec succès !');
    setShowPaymentModal(false);
    dispatch(fetchInvoiceById(invoiceId));
  }, [dispatch, invoiceId]);

  const handleDownloadPDF = useCallback(() => {
    showInfoToast('Téléchargement du PDF en cours...');
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  }, [invoiceId]);

  // Retours conditionnels
  if (status === 'loading' && !invoice) {
    return (
      <PageContainer title="Détail Facture">
        <LoadingSpinner fullPage message="Chargement de la facture..." />
      </PageContainer>
    );
  }

  if (error && !invoice) {
    return (
      <PageContainer title="Erreur Facture">
        <AlertMessage variant="danger">
          {error.message || "Impossible de charger la facture"}
        </AlertMessage>
        <AppButton onClick={() => navigate('/invoices')} variant="secondary">
          Retour à la liste
        </AppButton>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer title="Facture Introuvable">
        <AlertMessage variant="warning">
          La facture demandée n'a pas été trouvée.
        </AlertMessage>
        <AppButton onClick={() => navigate('/invoices')} variant="secondary">
          Retour à la liste
        </AppButton>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Facture ${invoice.invoiceNumber || 'Détails'}`}
      fluid
      breadcrumbs={[
        { label: 'Facturation', path: '/invoices' },
        { label: invoice.invoiceNumber || 'Détail', isActive: true },
      ]}
    >
      <Card className="mb-4 shadow-sm">
        <Card.Body className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h4 className="mb-0 me-3 d-inline-block">
              Facture N° {invoice.invoiceNumber}
            </h4>
            <StatusBadge 
              variant={invoice.status?.toLowerCase()} 
              pillSize="lg"
            >
              {invoice.status || 'N/A'}
            </StatusBadge>
          </div>
          
          <ButtonGroup>
            {['DRAFT', 'SENT', 'OVERDUE', 'PARTIALLY_PAID'].includes(invoice.status) && 
              hasRole(['ADMIN', 'ACCOUNTANT']) && (
              <AppButton 
                variant="success" 
                onClick={() => setShowPaymentModal(true)}
                isLoading={isActionLoading}
                icon={<Icon name="FaRegCreditCard" />}
              >
                Enregistrer Paiement
              </AppButton>
            )}
            
            <AppButton 
              variant="outline-secondary" 
              onClick={handleDownloadPDF}
              isLoading={isActionLoading}
              icon={<Icon name="FaFilePdf" />}
            >
              Télécharger PDF
            </AppButton>
            
            {hasRole(['ADMIN', 'MANAGER']) && (
              <AppButton 
                variant="outline-primary" 
                as={Link} 
                to={`/invoices/edit/${invoice._id}`}
                icon={<Icon name="FaEdit" />}
              >
                Modifier
              </AppButton>
            )}
          </ButtonGroup>
        </Card.Body>
      </Card>

      {error && (
        <AlertMessage 
          variant="danger" 
          onClose={() => dispatch(clearInvoiceError())} 
          dismissible
          className="mb-4"
        >
          {error.message || "Une erreur est survenue"}
        </AlertMessage>
      )}

      <Row className="g-4">
        <Col lg={4} md={12} className="d-flex flex-column">
          <Card className="mb-4 shadow-sm flex-grow-1">
            <Card.Header>
              <Card.Title as="h5" className="d-flex align-items-center">
                <Icon name="FaUserTie" className="me-2" />
                Client
              </Card.Title>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Société:</strong> {invoice.clientSnapshot?.companyName || invoice.client?.companyName || 'N/A'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Contact:</strong> {invoice.clientSnapshot?.contactFullName || invoice.client?.contactName || 'N/A'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Email:</strong> {invoice.clientSnapshot?.email || invoice.client?.email || 'N/A'}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Adresse:</strong><br />
                {invoice.clientSnapshot?.billingAddress?.street}<br />
                {invoice.clientSnapshot?.billingAddress?.additionalLine && (
                  <>{invoice.clientSnapshot.billingAddress.additionalLine}<br /></>
                )}
                {invoice.clientSnapshot?.billingAddress?.zipCode} {invoice.clientSnapshot?.billingAddress?.city}<br />
                {invoice.clientSnapshot?.billingAddress?.country}
              </ListGroup.Item>
              {invoice.clientSnapshot?.siren && (
                <ListGroup.Item>
                  <strong>SIREN:</strong> {invoice.clientSnapshot.siren}
                </ListGroup.Item>
              )}
              {invoice.clientSnapshot?.vatNumber && (
                <ListGroup.Item>
                  <strong>N° TVA:</strong> {invoice.clientSnapshot.vatNumber}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>

          <Card className="shadow-sm flex-grow-1">
            <Card.Header>
              <Card.Title as="h5" className="d-flex align-items-center">
                <Icon name="FaInfoCircle" className="me-2" />
                Détails Facture
              </Card.Title>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Date d'émission:</strong> {formatDate(invoice.issueDate)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Date d'échéance:</strong> {formatDate(invoice.dueDate)}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Conditions:</strong> {invoice.paymentTerms || 'N/A'}
              </ListGroup.Item>
              {invoice.sourceQuote && (
                <ListGroup.Item>
                  <strong>Devis source:</strong> 
                  <Link 
                    to={`/quotes/view/${invoice.sourceQuote._id || invoice.sourceQuote}`} 
                    className="ms-2"
                  >
                    {invoice.sourceQuote.quoteNumber || 'Voir Devis'}
                  </Link>
                </ListGroup.Item>
              )}
              {invoice.deliveryNotes?.length > 0 && (
                <ListGroup.Item>
                  <strong>Bons de Livraison:</strong>
                  <ul className="mt-2">
                    {invoice.deliveryNotes.map(dn => (
                      <li key={dn._id || dn}>
                        <Link to={`/delivery-notes/view/${dn._id || dn}`}>
                          {dn.deliveryNoteNumber || 'Voir BL'}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col lg={8} md={12}>
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <Card.Title as="h5" className="d-flex align-items-center">
                <Icon name="FaListUl" className="me-2" />
                Articles Facturés
              </Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive striped hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Produit/Service</th>
                    <th className="text-end">Qté</th>
                    <th className="text-end">Prix U. HT</th>
                    <th className="text-end">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={item._id || item.tempId || index}>
                      <td>
                        <strong>{item.productName}</strong>
                        {item.description && (
                          <div className="text-muted small">{item.description}</div>
                        )}
                      </td>
                      <td className="text-end">{item.quantity}</td>
                      <td className="text-end">{formatCurrencyForDisplay(item.unitPriceHT)}</td>
                      <td className="text-end">{formatCurrencyForDisplay(item.totalHT)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          
          <Row>
            <Col md={invoice.payments?.length > 0 ? 7 : 12}>
              <Card className="shadow-sm">
                <Card.Header>
                  <Card.Title as="h5" className="d-flex align-items-center">
                    <Icon name="FaCoins" className="me-2" />
                    Récapitulatif Financier
                  </Card.Title>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    {invoice.subTotalHTBeforeDiscount !== invoice.subTotalHT && (
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Sous-Total HT (avant remise):</span> 
                        <strong>{formatCurrencyForDisplay(invoice.subTotalHTBeforeDiscount)}</strong>
                      </ListGroup.Item>
                    )}
                    {invoice.totalDiscountAmount > 0 && (
                      <ListGroup.Item className="d-flex justify-content-between text-danger">
                        <span>Remise Totale:</span> 
                        <strong>- {formatCurrencyForDisplay(invoice.totalDiscountAmount)}</strong>
                      </ListGroup.Item>
                    )}
                    <ListGroup.Item className="d-flex justify-content-between">
                      <span>Sous-Total HT:</span> 
                      <strong>{formatCurrencyForDisplay(invoice.subTotalHT)}</strong>
                    </ListGroup.Item>
                    
                    {invoice.vatDetails?.map(vatLine => (
                      <ListGroup.Item 
                        key={`vat-${vatLine.rate}`} 
                        className="d-flex justify-content-between ps-4"
                      >
                        <span className="text-muted">
                          TVA ({vatLine.rate}% sur {formatCurrencyForDisplay(vatLine.base)}):
                        </span>
                        <span>{formatCurrencyForDisplay(vatLine.amount)}</span>
                      </ListGroup.Item>
                    ))}
                    
                    <ListGroup.Item className="d-flex justify-content-between">
                      <span>Total TVA:</span> 
                      <strong>{formatCurrencyForDisplay(invoice.totalVatAmount)}</strong>
                    </ListGroup.Item>
                    
                    <ListGroup.Item className="d-flex justify-content-between fs-5 fw-bold border-top">
                      <span>Total TTC:</span> 
                      <span>{formatCurrencyForDisplay(invoice.totalTTC)}</span>
                    </ListGroup.Item>
                    
                    {paymentSummary && (
                      <>
                        <ListGroup.Item className="d-flex justify-content-between text-success">
                          <span>Montant Payé:</span> 
                          <strong>{formatCurrencyForDisplay(paymentSummary.amountPaid)}</strong>
                        </ListGroup.Item>
                        
                        <ListGroup.Item 
                          className={`d-flex justify-content-between fs-5 fw-bold ${paymentSummary.isFullyPaid ? 'text-success' : 'text-danger'}`}
                        >
                          <span>{paymentSummary.isFullyPaid ? 'Solde Réglé' : 'Solde Dû'}:</span>
                          <span>{formatCurrencyForDisplay(paymentSummary.amountDue)}</span>
                        </ListGroup.Item>
                      </>
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
            
            {invoice.payments?.length > 0 && (
              <Col md={5}>
                <Card className="shadow-sm">
                  <Card.Header>
                    <Card.Title as="h5" className="d-flex align-items-center">
                      <Icon name="FaHistory" className="me-2" />
                      Historique des Paiements
                    </Card.Title>
                  </Card.Header>
                  <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {invoice.payments.map(p => (
                      <ListGroup.Item key={p._id}>
                        <div>
                          <strong>{formatCurrencyForDisplay(p.amount)}</strong> - 
                          <Badge bg="info" className="ms-2">
                            {p.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </Badge>
                        </div>
                        <small className="text-muted">
                          Le {formatDate(p.date)} {p.reference && `(Réf: ${p.reference})`}
                        </small>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card>
              </Col>
            )}
          </Row>

          {(invoice.notes || invoice.customerNotes || invoice.termsAndConditions) && (
            <Card className="mt-4 shadow-sm">
              <Card.Body>
                {invoice.termsAndConditions && (
                  <>
                    <Card.Subtitle className="mb-2 text-muted">Conditions Générales</Card.Subtitle>
                    <p className="small" style={{ whiteSpace: 'pre-line' }}>
                      {invoice.termsAndConditions}
                    </p>
                  </>
                )}
                
                {invoice.customerNotes && (
                  <>
                    <Card.Subtitle className="mt-3 mb-2 text-muted">Notes pour le Client</Card.Subtitle>
                    <p className="small" style={{ whiteSpace: 'pre-line' }}>
                      {invoice.customerNotes}
                    </p>
                  </>
                )}
                
                {invoice.internalNotes && hasRole(['ADMIN', 'ACCOUNTANT']) && (
                  <>
                    <Card.Subtitle className="mt-3 mb-2 text-muted">Notes Internes</Card.Subtitle>
                    <p className="small fst-italic" style={{ whiteSpace: 'pre-line' }}>
                      {invoice.internalNotes}
                    </p>
                  </>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <AppModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        title={`Enregistrer un Paiement pour Facture ${invoice.invoiceNumber}`}
        size="lg"
      >
        <RecordPaymentForm
          invoiceId={invoice._id}
          invoiceTotalTTC={invoice.totalTTC}
          amountAlreadyPaid={paymentSummary?.amountPaid || 0}
          currency={invoice.currency}
          onSuccess={handleRecordPaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      </AppModal>
    </PageContainer>
  );
};

export default InvoiceDetailPage;