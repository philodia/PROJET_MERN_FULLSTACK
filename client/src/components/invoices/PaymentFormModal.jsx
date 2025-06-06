// frontend/src/components/invoices/PaymentFormModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Form as BootstrapForm, Row, Col, InputGroup } from 'react-bootstrap';

import SelectField from '../common/SelectField';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
// import DatePickerField from '../common/DatePickerField'; // Si vous l'avez

/**
 * Modale pour enregistrer un paiement sur une facture.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {boolean} props.show - Contrôle la visibilité de la modale.
 * @param {function} props.onHide - Fonction pour fermer la modale.
 * @param {object} props.invoice - La facture pour laquelle enregistrer le paiement.
 *                                 { id, invoiceNumber, totalTTC, amountPaid (déjà payé), clientName }
 * @param {function} props.onSubmitPayment - Callback avec les données du paiement.
 *                                          Reçoit (paymentData, { setSubmitting, resetForm, setErrors }).
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 * @param {boolean} [props.isSubmittingPayment=false] - État de soumission externe.
 */
const PaymentFormModal = ({
  show,
  onHide,
  invoice,
  onSubmitPayment,
  currencySymbol = '€',
  isSubmittingPayment = false,
}) => {
  const [submitError, setSubmitError] = useState(null);

  if (!invoice) return null;

  const amountAlreadyPaid = invoice.amountPaid || 0;
  const remainingBalance = (invoice.totalTTC || 0) - amountAlreadyPaid;

  const initialValues = {
    invoiceId: invoice.id,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: remainingBalance > 0 ? remainingBalance.toFixed(2) : '', // Suggérer le solde restant
    paymentMethod: '', // Ex: 'CB', 'Virement', 'Chèque'
    reference: '', // Ex: Numéro de chèque, ID transaction
    notes: '',
  };

  const paymentMethodOptions = [
    { value: 'BANK_TRANSFER', label: 'Virement Bancaire' },
    { value: 'CREDIT_CARD', label: 'Carte de Crédit' },
    { value: 'CHECK', label: 'Chèque' },
    { value: 'CASH', label: 'Espèces' },
    { value: 'ONLINE_PAYMENT', label: 'Paiement en Ligne' }, // Stripe, PayPal, etc.
    { value: 'OTHER', label: 'Autre' },
  ];

  const validationSchema = Yup.object().shape({
    paymentDate: Yup.date().required('La date du paiement est requise.'),
    amount: Yup.number()
      .typeError('Doit être un nombre.')
      .required('Le montant du paiement est requis.')
      .positive('Le montant doit être positif.')
      .max(remainingBalance, `Le montant ne peut excéder le solde restant (${remainingBalance.toFixed(2)} ${currencySymbol}).`),
    paymentMethod: Yup.string().required('Le mode de paiement est requis.'),
    reference: Yup.string().max(100, 'Maximum 100 caractères.'),
    notes: Yup.string().max(500, 'Maximum 500 caractères.'),
  });

  const handleSubmit = async (values, formikHelpers) => {
    setSubmitError(null);
    const paymentData = {
        ...values,
        amount: Number(values.amount), // S'assurer que c'est un nombre
    };
    // Passer formikHelpers à onSubmitPayment pour permettre setSubmitting, setErrors, resetForm
    await onSubmitPayment(paymentData, formikHelpers);
    // onHide et resetForm sont généralement appelés dans onSubmitPayment ou ici après succès
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          Enregistrer un Paiement pour Facture <span className="fw-normal">{invoice.invoiceNumber}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3 p-3 bg-light rounded">
          <Row>
            <Col><strong>Client :</strong> {invoice.clientName || 'N/A'}</Col>
            <Col className="text-end"><strong>Total Facture :</strong> {invoice.totalTTC?.toLocaleString(undefined, {minimumFractionDigits:2})} {currencySymbol}</Col>
          </Row>
          <Row>
            <Col><strong>Déjà Payé :</strong> {amountAlreadyPaid.toLocaleString(undefined, {minimumFractionDigits:2})} {currencySymbol}</Col>
            <Col className="text-end"><strong>Solde Restant :</strong> <span className="fw-bold">{remainingBalance.toLocaleString(undefined, {minimumFractionDigits:2})} {currencySymbol}</span></Col>
          </Row>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize // Si `invoice` change alors que la modale est ouverte (peu probable mais sûr)
        >
          {({ errors, touched, isSubmitting, values, setFieldValue }) => (
            <Form noValidate id="paymentRecordForm"> {/* ID pour lier le bouton de soumission externe si besoin */}
              {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

              <Row>
                <BootstrapForm.Group as={Col} md={6} className="mb-3" controlId="paymentDate">
                  <BootstrapForm.Label>Date du Paiement *</BootstrapForm.Label>
                  {/* <Field name="paymentDate" component={DatePickerField} ... /> */}
                  <Field
                    name="paymentDate"
                    type="date"
                    as={BootstrapForm.Control}
                    isInvalid={!!errors.paymentDate && touched.paymentDate}
                  />
                  <ErrorMessage name="paymentDate" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>

                <BootstrapForm.Group as={Col} md={6} className="mb-3" controlId="paymentAmount">
                  <BootstrapForm.Label>Montant Payé *</BootstrapForm.Label>
                  <InputGroup>
                    <Field
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={remainingBalance > 0 ? remainingBalance.toFixed(2) : undefined}
                      as={BootstrapForm.Control}
                      isInvalid={!!errors.amount && touched.amount}
                    />
                    <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                  </InputGroup>
                  <ErrorMessage name="amount" component="div" className="invalid-feedback d-block" />
                </BootstrapForm.Group>
              </Row>

              <Row>
                <BootstrapForm.Group as={Col} md={6} className="mb-3" controlId="paymentMethod">
                  <BootstrapForm.Label>Mode de Paiement *</BootstrapForm.Label>
                  <SelectField
                    name="paymentMethod"
                    options={paymentMethodOptions}
                    value={paymentMethodOptions.find(opt => opt.value === values.paymentMethod) || null}
                    onChange={(selected) => setFieldValue('paymentMethod', selected ? selected.value : '')}
                    placeholder="Sélectionner un mode"
                    isInvalid={!!errors.paymentMethod && touched.paymentMethod}
                  />
                  <ErrorMessage name="paymentMethod" component="div" className="invalid-feedback d-block" />
                </BootstrapForm.Group>

                <BootstrapForm.Group as={Col} md={6} className="mb-3" controlId="paymentReference">
                  <BootstrapForm.Label>Référence de Paiement</BootstrapForm.Label>
                  <Field
                    name="reference"
                    type="text"
                    as={BootstrapForm.Control}
                    placeholder="Ex: N° Chèque, ID Transaction Stripe..."
                    isInvalid={!!errors.reference && touched.reference}
                  />
                  <ErrorMessage name="reference" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
              </Row>

              <BootstrapForm.Group className="mb-3" controlId="paymentNotes">
                <BootstrapForm.Label>Notes (Optionnel)</BootstrapForm.Label>
                <Field
                  name="notes"
                  as="textarea"
                  rows={2}
                  className={`form-control ${errors.notes && touched.notes ? 'is-invalid' : ''}`}
                  placeholder="Notes additionnelles sur ce paiement..."
                />
                <ErrorMessage name="notes" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              {/* Les boutons sont dans Modal.Footer pour un style cohérent de modale */}
            </Form>
          )}
        </Formik>
      </Modal.Body>
      <Modal.Footer>
        <AppButton variant="outline-secondary" onClick={onHide} disabled={isSubmittingPayment}>
          Annuler
        </AppButton>
        <AppButton
          variant="primary"
          type="submit" // Pour soumettre le formulaire Formik
          form="paymentRecordForm" // Lie ce bouton au formulaire Formik par son ID
          isLoading={isSubmittingPayment} // Utiliser l'état de soumission externe pour ce bouton
        >
          Enregistrer le Paiement
        </AppButton>
      </Modal.Footer>
    </Modal>
  );
};

PaymentFormModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  invoice: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    invoiceNumber: PropTypes.string.isRequired,
    totalTTC: PropTypes.number.isRequired,
    amountPaid: PropTypes.number, // Montant déjà payé
    clientName: PropTypes.string,
  }).isRequired,
  onSubmitPayment: PropTypes.func.isRequired,
  currencySymbol: PropTypes.string,
  isSubmittingPayment: PropTypes.bool, // État de chargement externe
};

export default PaymentFormModal;