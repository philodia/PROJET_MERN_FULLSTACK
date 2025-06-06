// frontend/src/components/deliveryNotes/DeliveryNoteForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  Row,
  Col,
  Form as BootstrapForm,
} from 'react-bootstrap';
import { format as formatDateFns } from 'date-fns';

import FormSection from '../forms/FormSection';
import SelectField from '../common/SelectField';
import ItemSelector from '../forms/ItemSelector';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';

const DeliveryNoteForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError,
  clientOptions = [],
  productOptions = [],
  sourceQuoteOptions = [],
  defaultDeliveryNoteNumber = '',
}) => {
  const today = new Date().toISOString().split('T')[0];

  const defaultInitialValues = {
    clientId: '',
    deliveryNoteNumber: defaultDeliveryNoteNumber,
    deliveryDate: today,
    status: 'PENDING',
    sourceQuoteId: null,
    items: [],
    shippingAddress: { street: '', city: '', zipCode: '', country: '' },
    notes: '',
  };

  let formInitialValues = { ...defaultInitialValues, ...initialValues };

  if (
    initialValues?.sourceQuoteData?.items &&
    Array.isArray(initialValues.sourceQuoteData.items)
  ) {
    formInitialValues.items = initialValues.sourceQuoteData.items.map(item => ({
      tempId: `item-from-quote-${item.productId}-${Math.random().toString(16).slice(2)}`,
      productId: item.productId,
      productName: item.productName,
      description: item.description || '',
      quantityOrdered: item.quantity,
      quantityDelivered: item.quantity,
    }));

    formInitialValues.clientId = initialValues.sourceQuoteData.clientId || '';
    if (initialValues.sourceQuoteData.client?.address) {
      formInitialValues.shippingAddress = {
        ...initialValues.sourceQuoteData.client.address,
      };
    }
  } else if (initialValues?.items) {
    formInitialValues.items = initialValues.items.map(item => ({
      ...item,
      tempId:
        item.tempId ||
        `item-edit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    }));
  }

  formInitialValues.deliveryDate = initialValues?.deliveryDate
    ? formatDateFns(new Date(initialValues.deliveryDate), 'yyyy-MM-dd')
    : today;

  const validationSchema = Yup.object().shape({
    clientId: Yup.string().required('Le client est requis.'),
    deliveryNoteNumber: Yup.string()
      .required('Le numéro de BL est requis.')
      .max(50, 'Max 50 caractères.'),
    deliveryDate: Yup.date().required('La date de livraison est requise.'),
    status: Yup.string().required('Le statut est requis.'),
    sourceQuoteId: Yup.string().nullable(),
    items: Yup.array()
      .of(
        Yup.object().shape({
          productId: Yup.string().required('Produit requis.'),
          productName: Yup.string().required(),
          quantityOrdered: Yup.number().min(0).nullable(),
          quantityDelivered: Yup.number()
            .min(0, 'Quantité livrée >= 0.')
            .required('Quantité livrée requise.')
            .test(
              'lte-ordered',
              'La quantité livrée ne peut excéder la quantité commandée.',
              function (value) {
                const { quantityOrdered } = this.parent;
                return quantityOrdered == null || value <= quantityOrdered;
              }
            ),
        })
      )
      .min(1, 'Au moins un article est requis.')
      .required(),
    shippingAddress: Yup.object().shape({
      street: Yup.string()
        .max(100)
        .required('Rue requise pour l\'adresse de livraison.'),
      city: Yup.string().max(50).required('Ville requise.'),
      zipCode: Yup.string().max(10).required('Code postal requis.'),
      country: Yup.string().max(50).required('Pays requis.'),
    }),
    notes: Yup.string().max(2000, 'Maximum 2000 caractères.'),
  });

  const handleItemQuantityDeliveredChange = (
    tempId,
    newValue,
    setFieldValue,
    currentItems
  ) => {
    const newQuantity = Math.max(0, Number(newValue) || 0);
    const updatedItems = currentItems.map(item =>
      item.tempId === tempId ? { ...item, quantityDelivered: newQuantity } : item
    );
    setFieldValue('items', updatedItems);
  };

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form noValidate>
          {submitError && (
            <AlertMessage variant="danger" className="mb-3">
              {submitError}
            </AlertMessage>
          )}

          <FormSection title="Informations Générales du Bon de Livraison" useCard>
            <Row>
              <BootstrapForm.Group as={Col} md={4} className="mb-3">
                <BootstrapForm.Label>Client *</BootstrapForm.Label>
                <SelectField
                  name="clientId"
                  options={clientOptions}
                  value={clientOptions.find(opt => opt.value === values.clientId) || null}
                  onChange={selected => {
                    setFieldValue('clientId', selected?.value || '');
                    const client = clientOptions.find(c => c.value === selected?.value)?.fullClientData;
                    if (client?.address) {
                      setFieldValue('shippingAddress', client.address);
                    }
                  }}
                  placeholder="Sélectionner un client"
                  isInvalid={!!errors.clientId && touched.clientId}
                  isDisabled={isEditing && !!values.sourceQuoteId}
                />
                <ErrorMessage
                  name="clientId"
                  component="div"
                  className="invalid-feedback d-block"
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md={4} className="mb-3">
                <BootstrapForm.Label>Numéro de BL *</BootstrapForm.Label>
                <Field
                  name="deliveryNoteNumber"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.deliveryNoteNumber && touched.deliveryNoteNumber}
                />
                <ErrorMessage
                  name="deliveryNoteNumber"
                  component="div"
                  className="invalid-feedback"
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md={4} className="mb-3">
                <BootstrapForm.Label>Date de Livraison *</BootstrapForm.Label>
                <Field
                  name="deliveryDate"
                  type="date"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.deliveryDate && touched.deliveryDate}
                />
                <ErrorMessage
                  name="deliveryDate"
                  component="div"
                  className="invalid-feedback"
                />
              </BootstrapForm.Group>
            </Row>

            <Row>
              <BootstrapForm.Group as={Col} md={4} className="mb-3">
                <BootstrapForm.Label>Statut *</BootstrapForm.Label>
                <Field
                  as="select"
                  name="status"
                  className={`form-select ${
                    errors.status && touched.status ? 'is-invalid' : ''
                  }`}
                >
                  <option value="PENDING">En Attente</option>
                  <option value="SHIPPED">Expédié</option>
                  <option value="PARTIALLY_DELIVERED">Partiellement Livré</option>
                  <option value="DELIVERED">Livré</option>
                  <option value="CANCELLED">Annulé</option>
                </Field>
                <ErrorMessage name="status" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              {sourceQuoteOptions.length > 0 && (
                <BootstrapForm.Group as={Col} md={8} className="mb-3">
                  <BootstrapForm.Label>Lié au Devis (Optionnel)</BootstrapForm.Label>
                  <SelectField
                    name="sourceQuoteId"
                    options={sourceQuoteOptions}
                    value={sourceQuoteOptions.find(opt => opt.value === values.sourceQuoteId) || null}
                    onChange={selected => setFieldValue('sourceQuoteId', selected?.value || null)}
                    placeholder="Aucun devis lié"
                    isClearable
                    isDisabled={isEditing && !!values.sourceQuoteId}
                  />
                </BootstrapForm.Group>
              )}
            </Row>
          </FormSection>

          <FormSection title="Adresse de Livraison" useCard>
            <Row>
              <BootstrapForm.Group as={Col} md={6} className="mb-3">
                <BootstrapForm.Label>Rue *</BootstrapForm.Label>
                <Field
                  name="shippingAddress.street"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.shippingAddress?.street && touched.shippingAddress?.street}
                />
                <ErrorMessage
                  name="shippingAddress.street"
                  component="div"
                  className="invalid-feedback"
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md={3} className="mb-3">
                <BootstrapForm.Label>Ville *</BootstrapForm.Label>
                <Field
                  name="shippingAddress.city"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.shippingAddress?.city && touched.shippingAddress?.city}
                />
                <ErrorMessage
                  name="shippingAddress.city"
                  component="div"
                  className="invalid-feedback"
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md={3} className="mb-3">
                <BootstrapForm.Label>Code Postal *</BootstrapForm.Label>
                <Field
                  name="shippingAddress.zipCode"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.shippingAddress?.zipCode && touched.shippingAddress?.zipCode}
                />
                <ErrorMessage
                  name="shippingAddress.zipCode"
                  component="div"
                  className="invalid-feedback"
                />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md={6} className="mb-3">
                <BootstrapForm.Label>Pays *</BootstrapForm.Label>
                <Field
                  name="shippingAddress.country"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.shippingAddress?.country && touched.shippingAddress?.country}
                />
                <ErrorMessage
                  name="shippingAddress.country"
                  component="div"
                  className="invalid-feedback"
                />
              </BootstrapForm.Group>
            </Row>
          </FormSection>

          <FormSection title="Articles à Livrer" useCard>
            <ItemSelector
              items={values.items}
              setItems={items => setFieldValue('items', items)}
              productOptions={productOptions}
              allowQuantityDelivered
              onQuantityDeliveredChange={(tempId, newValue) =>
                handleItemQuantityDeliveredChange(tempId, newValue, setFieldValue, values.items)
              }
            />
            {errors.items && typeof errors.items === 'string' && (
              <div className="text-danger mt-2">{errors.items}</div>
            )}
          </FormSection>

          <FormSection title="Notes" useCard>
            <Field
              name="notes"
              as="textarea"
              className="form-control"
              rows={3}
              placeholder="Remarques ou instructions de livraison"
            />
            <ErrorMessage name="notes" component="div" className="invalid-feedback d-block" />
          </FormSection>

          <div className="text-end mt-4">
            <AppButton type="submit" disabled={isSubmitting}>
              {isEditing ? 'Mettre à jour le BL' : 'Créer le BL'}
            </AppButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

DeliveryNoteForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
  clientOptions: PropTypes.array.isRequired,
  productOptions: PropTypes.array.isRequired,
  sourceQuoteOptions: PropTypes.array,
  defaultDeliveryNoteNumber: PropTypes.string,
};

export default DeliveryNoteForm;
