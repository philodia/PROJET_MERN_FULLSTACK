// frontend/src/components/quotes/QuoteForm.jsx
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

const QuoteForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError,
  clientOptions = [],
  productOptions = [],
  defaultQuoteNumber = '',
  currencySymbol = '€',
}) => {
  const today = new Date().toISOString().split('T')[0];
  const validityDefault = formatDateFns(addDays(new Date(), 30), 'yyyy-MM-dd');

  const defaultInitialValues = {
    clientId: '',
    quoteNumber: defaultQuoteNumber,
    issueDate: today,
    validityDate: validityDefault,
    status: 'DRAFT',
    items: [],
    notes: '',
  };

  const formInitialValues = {
    ...defaultInitialValues,
    ...initialValues,
    issueDate: initialValues?.issueDate
      ? formatDateFns(new Date(initialValues.issueDate), 'yyyy-MM-dd')
      : today,
    validityDate: initialValues?.validityDate
      ? formatDateFns(new Date(initialValues.validityDate), 'yyyy-MM-dd')
      : validityDefault,
    items: initialValues?.items
      ? initialValues.items.map(item => ({
          ...item,
          tempId: item.tempId || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
        }))
      : [],
  };

  const validationSchema = Yup.object().shape({
    clientId: Yup.string().required('Le client est requis.'),
    quoteNumber: Yup.string().required('Le numéro de devis est requis.').max(50, 'Max 50 caractères.'),
    issueDate: Yup.date().required('La date d\'émission est requise.'),
    validityDate: Yup.date()
      .required('La date de validité est requise.')
      .min(Yup.ref('issueDate'), 'La date de validité ne peut être antérieure à la date d\'émission.'),
    status: Yup.string().required('Le statut est requis.'),
    items: Yup.array()
      .of(
        Yup.object().shape({
          productId: Yup.string().required('Produit requis.'),
          productName: Yup.string().required(),
          quantity: Yup.number().min(0.01, 'Quantité > 0 requise.').required('Quantité requise.'),
          unitPriceHT: Yup.number().min(0, 'Prix >= 0 requis.').required('Prix requis.'),
          vatRate: Yup.number().min(0, 'TVA >= 0 requise.').required('TVA requise.'),
        })
      )
      .min(1, 'Au moins un article est requis dans le devis.'),
    notes: Yup.string().max(2000, 'Maximum 2000 caractères.'),
  });

  const calculateTotals = (items) => {
    let totalHT = 0;
    let totalVAT = 0;

    items.forEach(item => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPriceHT) || 0;
      const vatRate = Number(item.vatRate) || 0;

      const itemTotalHT = quantity * unitPrice;
      const itemVAT = itemTotalHT * (vatRate / 100);

      totalHT += itemTotalHT;
      totalVAT += itemVAT;
    });

    const totalTTC = totalHT + totalVAT;
    return { totalHT, totalVAT, totalTTC };
  };

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={(values, formikHelpers) => {
        const { totalHT, totalVAT, totalTTC } = calculateTotals(values.items);
        const dataToSubmit = {
          ...values,
          totalHT,
          totalVAT,
          totalTTC,
          items: values.items.map(({ tempId, ...item }) => item)
        };
        onSubmit(dataToSubmit, formikHelpers);
      }}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => {
        const { totalHT, totalVAT, totalTTC } = calculateTotals(values.items);

        return (
          <Form noValidate className="quote-form">
            {submitError && (
              <AlertMessage variant="danger" className="mb-3">
                {submitError}
              </AlertMessage>
            )}

            <FormSection title="Informations Générales du Devis" useCard>
              <Row>
                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="clientId">
                  <BootstrapForm.Label>Client *</BootstrapForm.Label>
                  <SelectField
                    name="clientId"
                    options={clientOptions}
                    value={clientOptions.find(opt => opt.value === values.clientId) || null}
                    onChange={(selected) => setFieldValue('clientId', selected?.value || '')}
                    placeholder="Sélectionner un client"
                    isInvalid={!!errors.clientId && touched.clientId}
                  />
                  <ErrorMessage name="clientId" component="div" className="invalid-feedback d-block" />
                </BootstrapForm.Group>

                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="quoteNumber">
                  <BootstrapForm.Label>Numéro de Devis *</BootstrapForm.Label>
                  <Field
                    name="quoteNumber"
                    type="text"
                    as={BootstrapForm.Control}
                    isInvalid={!!errors.quoteNumber && touched.quoteNumber}
                  />
                  <ErrorMessage name="quoteNumber" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
              </Row>

              <Row>
                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="issueDate">
                  <BootstrapForm.Label>Date d'Émission *</BootstrapForm.Label>
                  <Field
                    name="issueDate"
                    type="date"
                    as={BootstrapForm.Control}
                    isInvalid={!!errors.issueDate && touched.issueDate}
                  />
                  <ErrorMessage name="issueDate" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>

                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="validityDate">
                  <BootstrapForm.Label>Date de Validité *</BootstrapForm.Label>
                  <Field
                    name="validityDate"
                    type="date"
                    as={BootstrapForm.Control}
                    isInvalid={!!errors.validityDate && touched.validityDate}
                  />
                  <ErrorMessage name="validityDate" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
              </Row>

              {isEditing && (
                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="status">
                  <BootstrapForm.Label>Statut</BootstrapForm.Label>
                  <Field
                    as="select"
                    name="status"
                    className={`form-select ${errors.status && touched.status ? 'is-invalid' : ''}`}
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="SENT">Envoyé</option>
                    <option value="ACCEPTED">Accepté</option>
                    <option value="REJECTED">Rejeté</option>
                    <option value="EXPIRED">Expiré</option>
                  </Field>
                  <ErrorMessage name="status" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
              )}
            </FormSection>

            <FormSection title="Articles du Devis" useCard cardBodyClassName="p-0">
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

            <FormSection title="Récapitulatif et Notes" useCard>
              <Row>
                <Col md={7}>
                  <BootstrapForm.Group controlId="notes">
                    <BootstrapForm.Label>Notes / Conditions Particulières</BootstrapForm.Label>
                    <Field
                      name="notes"
                      as="textarea"
                      rows={5}
                      className={`form-control ${errors.notes && touched.notes ? 'is-invalid' : ''}`}
                    />
                    <ErrorMessage name="notes" component="div" className="invalid-feedback" />
                  </BootstrapForm.Group>
                </Col>
                <Col md={5} className="quote-totals">
                  <div className="d-flex justify-content-between py-1">
                    <span>Total HT:</span>
                    <strong>{totalHT.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span>Total TVA:</span>
                    <strong>{totalVAT.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-top pt-2">
                    <span>Total TTC:</span>
                    <strong>{totalTTC.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                  </div>
                </Col>
              </Row>
            </FormSection>

            <div className="text-end mt-4">
              <AppButton type="submit" disabled={isSubmitting} variant="primary">
                {isEditing ? 'Mettre à jour le devis' : 'Créer le devis'}
              </AppButton>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

QuoteForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
  clientOptions: PropTypes.array.isRequired,
  productOptions: PropTypes.array.isRequired,
  defaultQuoteNumber: PropTypes.string,
  currencySymbol: PropTypes.string,
};

export default QuoteForm;
