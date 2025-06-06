// frontend/src/components/invoices/InvoiceForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Form as BootstrapForm } from 'react-bootstrap';
import { addDays, format as formatDateFns } from 'date-fns';

import FormSection from '../forms/FormSection';
import SelectField from '../common/SelectField';
import ItemSelector from '../forms/ItemSelector';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
import QuoteTotals from '../quotes/QuoteTotals'; // Peut être réutilisé ou adapté
// import DatePickerField from '../common/DatePickerField';

/**
 * Formulaire pour la création ou la modification d'une Facture.
 */
const InvoiceForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError,
  clientOptions = [],
  productOptions = [], // Pour ajouter des items manuellement
  sourceDocumentOptions = [], // Ex: [{ value: 'BL_ID_1', label: 'BL2024-001 - Client A', type: 'DELIVERY_NOTE' }, { value: 'Q_ID_1', label: 'DEV2024-005 - Client B', type: 'QUOTE' }]
  defaultInvoiceNumber = '',
  currencySymbol = '€',
  paymentTermsOptions = [ // Exemples de conditions de paiement
    { value: 'À réception', label: 'À réception' },
    { value: 'Net 15 jours', label: 'Net 15 jours' },
    { value: 'Net 30 jours', label: 'Net 30 jours' },
    { value: '30 jours fin de mois', label: '30 jours fin de mois' },
    { value: 'Comptant', label: 'Comptant' },
  ],
}) => {
  const today = new Date().toISOString().split('T')[0];
  // Date d'échéance par défaut (ex: 30 jours)
  const defaultDueDate = formatDateFns(addDays(new Date(), 30), 'yyyy-MM-dd');

  const defaultInitialValues = {
    clientId: '',
    invoiceNumber: defaultInvoiceNumber,
    issueDate: today,
    dueDate: defaultDueDate,
    status: 'DRAFT', // DRAFT, SENT, PAID, PARTIALLY_PAID, UNPAID, OVERDUE, CANCELLED
    items: [],
    paymentTerms: 'Net 30 jours', // Conditions de paiement par défaut
    notes: '', // Notes spécifiques à la facture
    // Liens optionnels vers documents sources
    sourceQuoteId: null,
    sourceDeliveryNoteId: null,
    // Les totaux (totalHT, totalVAT, totalTTC) seront calculés
  };

  let formInitialValues = { ...defaultInitialValues, ...initialValues };

  // Pré-remplissage si création depuis un document source (BL ou Devis)
  if (initialValues && initialValues.sourceDocumentData) {
    const { sourceDoc, type } = initialValues.sourceDocumentData; // ex: sourceDoc = données du BL/Devis
    formInitialValues.clientId = sourceDoc.clientId || '';
    if (type === 'DELIVERY_NOTE') {
      formInitialValues.sourceDeliveryNoteId = sourceDoc.id;
      // Pré-remplir les items du BL, en considérant quantityDelivered
      formInitialValues.items = (sourceDoc.items || []).map(item => ({
        tempId: `item-from-dn-${item.productId}-${Math.random().toString(16).slice(2)}`,
        productId: item.productId,
        productName: item.productName,
        description: item.description || '',
        quantity: item.quantityDelivered, // Quantité du BL
        unitPriceHT: item.unitPriceHT,   // Prix du BL (ou devis original)
        vatRate: item.vatRate,           // TVA du BL (ou devis original)
      }));
    } else if (type === 'QUOTE') {
      formInitialValues.sourceQuoteId = sourceDoc.id;
      formInitialValues.items = (sourceDoc.items || []).map(item => ({
        tempId: `item-from-quote-${item.productId}-${Math.random().toString(16).slice(2)}`,
        productId: item.productId,
        productName: item.productName,
        description: item.description || '',
        quantity: item.quantity,
        unitPriceHT: item.unitPriceHT,
        vatRate: item.vatRate,
      }));
    }
  } else if (initialValues && initialValues.items) {
     formInitialValues.items = initialValues.items.map(item => ({
        ...item,
        tempId: item.tempId || `item-edit-inv-${Date.now()}-${Math.random().toString(16).slice(2)}`
    }));
  }

  formInitialValues.issueDate = initialValues?.issueDate ? formatDateFns(new Date(initialValues.issueDate), 'yyyy-MM-dd') : today;
  formInitialValues.dueDate = initialValues?.dueDate ? formatDateFns(new Date(initialValues.dueDate), 'yyyy-MM-dd') : defaultDueDate;


  const validationSchema = Yup.object().shape({
    clientId: Yup.string().required('Le client est requis.'),
    invoiceNumber: Yup.string().required('Le numéro de facture est requis.').max(50, 'Max 50 caractères.'),
    issueDate: Yup.date().required('La date d\'émission est requise.'),
    dueDate: Yup.date()
      .required('La date d\'échéance est requise.')
      .min(Yup.ref('issueDate'), 'La date d\'échéance ne peut être antérieure à la date d\'émission.'),
    status: Yup.string().required('Le statut est requis.'),
    items: Yup.array()
      .of(
        Yup.object().shape({
          productId: Yup.string().required('Produit requis.'),
          quantity: Yup.number().min(0.01, 'Quantité > 0 requise.').required('Quantité requise.'),
          unitPriceHT: Yup.number().min(0, 'Prix >= 0 requis.').required('Prix requis.'),
          vatRate: Yup.number().min(0, 'TVA >= 0 requise.').required('TVA requise.'),
        })
      )
      .min(1, 'Au moins un article est requis dans la facture.')
      .required('Les articles sont requis.'),
    paymentTerms: Yup.string().max(100, 'Max 100 caractères'),
    notes: Yup.string().max(2000, 'Maximum 2000 caractères.'),
    sourceQuoteId: Yup.string().nullable(),
    sourceDeliveryNoteId: Yup.string().nullable(),
  });

  const calculateInvoiceTotals = (items) => {
    let totalHT = 0;
    let totalVAT = 0;
    // Pour un détail de TVA par taux
    const vatSummary = {};

    items.forEach(item => {
      const itemQty = Number(item.quantity) || 0;
      const itemPrice = Number(item.unitPriceHT) || 0;
      const itemRate = Number(item.vatRate) || 0;

      const itemTotalHT = itemQty * itemPrice;
      const itemVATAmount = itemTotalHT * (itemRate / 100);

      totalHT += itemTotalHT;
      totalVAT += itemVATAmount;

      if (itemRate > 0) {
        if (!vatSummary[itemRate]) {
          vatSummary[itemRate] = { base: 0, amount: 0, rate: itemRate };
        }
        vatSummary[itemRate].base += itemTotalHT;
        vatSummary[itemRate].amount += itemVATAmount;
      }
    });
    const totalTTC = totalHT + totalVAT;
    const vatDetails = Object.values(vatSummary).sort((a,b) => b.rate - a.rate);
    return { totalHT, totalVAT, totalTTC, vatDetails };
  };


  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={(values, formikHelpers) => {
        const { totalHT, totalVAT, totalTTC } = calculateInvoiceTotals(values.items);
        const dataToSubmit = {
            ...values,
            totalHT,
            totalVAT,
            totalTTC,
            items: values.items.map(({ tempId, ...itemData }) => itemData)
        };
        onSubmit(dataToSubmit, formikHelpers);
      }}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => {
        const { totalHT, totalVAT, totalTTC, vatDetails } = calculateInvoiceTotals(values.items);

        return (
          <Form noValidate className="invoice-form">
            {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

            <FormSection title="Informations Générales de la Facture" useCard={true}>
              <Row>
                <BootstrapForm.Group as={Col} md={4} className="mb-3" controlId="invClientId">
                  <BootstrapForm.Label>Client *</BootstrapForm.Label>
                  <SelectField
                    name="clientId"
                    options={clientOptions}
                    value={clientOptions.find(opt => opt.value === values.clientId) || null}
                    onChange={(selected) => setFieldValue('clientId', selected ? selected.value : '')}
                    placeholder="Sélectionner un client"
                    isInvalid={!!errors.clientId && touched.clientId}
                    // isDisabled={isEditing && (!!values.sourceQuoteId || !!values.sourceDeliveryNoteId)}
                  />
                  <ErrorMessage name="clientId" component="div" className="invalid-feedback d-block" />
                </BootstrapForm.Group>
                <BootstrapForm.Group as={Col} md={4} className="mb-3" controlId="invNumber">
                  <BootstrapForm.Label>Numéro de Facture *</BootstrapForm.Label>
                  <Field name="invoiceNumber" type="text" as={BootstrapForm.Control} isInvalid={!!errors.invoiceNumber && touched.invoiceNumber} />
                  <ErrorMessage name="invoiceNumber" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
                 <BootstrapForm.Group as={Col} md={4} className="mb-3" controlId="invStatus">
                  <BootstrapForm.Label>Statut *</BootstrapForm.Label>
                   <Field as="select" name="status" className={`form-select ${errors.status && touched.status ? 'is-invalid' : ''}`}>
                        <option value="DRAFT">Brouillon</option>
                        <option value="SENT">Envoyée</option>
                        <option value="PAID">Payée</option>
                        <option value="PARTIALLY_PAID">Partiellement Payée</option>
                        <option value="UNPAID">Impayée</option>
                        <option value="OVERDUE">En Retard</option>
                        <option value="CANCELLED">Annulée</option>
                    </Field>
                  <ErrorMessage name="status" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
              </Row>
              <Row>
                <BootstrapForm.Group as={Col} md={4} className="mb-3" controlId="invIssueDate">
                  <BootstrapForm.Label>Date d'Émission *</BootstrapForm.Label>
                  <Field name="issueDate" type="date" as={BootstrapForm.Control} isInvalid={!!errors.issueDate && touched.issueDate} />
                  <ErrorMessage name="issueDate" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
                <BootstrapForm.Group as={Col} md={4} className="mb-3" controlId="invDueDate">
                  <BootstrapForm.Label>Date d'Échéance *</BootstrapForm.Label>
                  <Field name="dueDate" type="date" as={BootstrapForm.Control} isInvalid={!!errors.dueDate && touched.dueDate} />
                  <ErrorMessage name="dueDate" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
                 <BootstrapForm.Group as={Col} md={4} className="mb-3" controlId="invPaymentTerms">
                  <BootstrapForm.Label>Conditions de Paiement</BootstrapForm.Label>
                  <SelectField
                    name="paymentTerms"
                    options={paymentTermsOptions}
                    value={paymentTermsOptions.find(opt => opt.value === values.paymentTerms) || null}
                    onChange={(selected) => setFieldValue('paymentTerms', selected ? selected.value : '')}
                    isClearable
                    isCreatable // Permettre d'ajouter de nouvelles conditions
                    placeholder="Ex: Net 30 jours"
                    isInvalid={!!errors.paymentTerms && touched.paymentTerms}
                  />
                  <ErrorMessage name="paymentTerms" component="div" className="invalid-feedback d-block" />
                </BootstrapForm.Group>
              </Row>
              {/* Champs pour lier documents sources (si applicables et non auto-remplis) */}
            </FormSection>

            <FormSection title="Articles de la Facture" useCard={true} cardBodyClassName="p-0">
              <ItemSelector
                availableItems={productOptions}
                selectedItems={values.items}
                onItemsChange={(newItems) => setFieldValue('items', newItems)}
                currencySymbol={currencySymbol}
              />
              {errors.items && touched.items && typeof errors.items === 'string' && (
                <div className="text-danger mt-2 p-3 small">{errors.items}</div>
              )}
            </FormSection>

            <FormSection title="Récapitulatif et Notes" useCard={true}>
              <Row>
                <Col md={7}>
                  <BootstrapForm.Group controlId="invNotes">
                    <BootstrapForm.Label>Notes / Mentions Légales</BootstrapForm.Label>
                    <Field name="notes" as="textarea" rows={5} placeholder="Ex: TVA non applicable, art. 293 B du CGI. Pénalités de retard..." className={`form-control ${errors.notes && touched.notes ? 'is-invalid' : ''}`} />
                    <ErrorMessage name="notes" component="div" className="invalid-feedback" />
                  </BootstrapForm.Group>
                </Col>
                <Col md={5}>
                  <QuoteTotals // Réutilisation de QuoteTotals
                    totalHT={totalHT}
                    totalVAT={totalVAT}
                    totalTTC={totalTTC}
                    currencySymbol={currencySymbol}
                    vatDetails={vatDetails}
                  />
                </Col>
              </Row>
            </FormSection>

            <div className="d-flex justify-content-end mt-4">
              <AppButton type="submit" variant="primary" isLoading={isSubmitting}>
                {isEditing ? 'Mettre à jour la Facture' : 'Créer la Facture'}
              </AppButton>
            </div>
            {/* <pre>{JSON.stringify(values, null, 2)}</pre>
            <pre className="text-danger">{JSON.stringify(errors, null, 2)}</pre> */}
          </Form>
        );
      }}
    </Formik>
  );
};

InvoiceForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
  clientOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
  productOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  sourceDocumentOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string, type: PropTypes.string })),
  defaultInvoiceNumber: PropTypes.string,
  currencySymbol: PropTypes.string,
  paymentTermsOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
};

export default InvoiceForm;