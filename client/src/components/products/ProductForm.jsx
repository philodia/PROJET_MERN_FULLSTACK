// frontend/src/components/products/ProductForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Form as BootstrapForm, InputGroup } from 'react-bootstrap';

import FormSection from '../forms/FormSection';
import SelectField from '../common/SelectField';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';

/**
 * Formulaire pour la création ou la modification d'un produit ou service.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.initialValues] - Valeurs initiales pour la modification.
 * @param {function} props.onSubmit - Fonction appelée avec les valeurs du formulaire.
 *                                     Reçoit (values, { setSubmitting, setErrors, resetForm }).
 * @param {boolean} [props.isEditing=false] - Si le formulaire est en mode édition.
 * @param {string} [props.submitError] - Message d'erreur global à afficher.
 * @param {Array<object>} [props.supplierOptions=[]] - Liste des fournisseurs pour sélection.
 *                                                     Chaque option: { value: 'supplierId', label: 'Nom Fournisseur' }
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 */
const ProductForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError = null,
  supplierOptions = [],
  currencySymbol = '€',
}) => {
  const defaultInitialValues = {
    name: '',
    description: '',
    sku: '', // Stock Keeping Unit (Référence Article)
    unitPriceHT: '', // Hors Taxe
    vatRate: '20',   // Taux de TVA en % (ex: 20 pour 20%)
    stockQuantity: '0',
    criticalStockThreshold: '10',
    isService: false, // Est-ce un service (pas de gestion de stock) ?
    supplierId: null, // ID du fournisseur
    isActive: true,
  };

  const formInitialValues = { ...defaultInitialValues, ...initialValues };
  // S'assurer que les nombres sont des chaînes pour les inputs, ou utiliser type="number" et gérer les conversions
  if (formInitialValues.unitPriceHT === null || formInitialValues.unitPriceHT === undefined) formInitialValues.unitPriceHT = '';
  if (formInitialValues.vatRate === null || formInitialValues.vatRate === undefined) formInitialValues.vatRate = '20';
  if (formInitialValues.stockQuantity === null || formInitialValues.stockQuantity === undefined || formInitialValues.isService) formInitialValues.stockQuantity = '0';
  if (formInitialValues.criticalStockThreshold === null || formInitialValues.criticalStockThreshold === undefined || formInitialValues.isService) formInitialValues.criticalStockThreshold = '0'; // Seuil par défaut, ou 0 si service

  if (isEditing && initialValues) {
    if (initialValues.isActive !== undefined) formInitialValues.isActive = initialValues.isActive;
    if (initialValues.isService !== undefined) formInitialValues.isService = initialValues.isService;
    if (initialValues.supplierId) formInitialValues.supplierId = initialValues.supplierId;
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Le nom du produit/service est requis.')
      .max(150, 'Maximum 150 caractères.'),
    description: Yup.string().max(1000, 'Maximum 1000 caractères.'),
    sku: Yup.string()
      .max(50, 'Maximum 50 caractères.')
      .matches(/^[a-zA-Z0-9-]*$/, {
          message: 'SKU invalide (alphanumérique et tirets uniquement).',
          excludeEmptyString: true,
      }),
    unitPriceHT: Yup.number()
      .typeError('Doit être un nombre.')
      .required('Le prix unitaire HT est requis.')
      .min(0, 'Le prix ne peut être négatif.'),
    vatRate: Yup.number()
      .typeError('Doit être un nombre.')
      .required('Le taux de TVA est requis.')
      .min(0, 'Le taux de TVA ne peut être négatif.')
      .max(100, 'Le taux de TVA ne peut excéder 100%.'),
    stockQuantity: Yup.number()
      .typeError('Doit être un nombre entier.')
      .integer('Doit être un nombre entier.')
      .min(0, 'La quantité ne peut être négative.')
      .when('isService', {
        is: false, // Seulement si ce n'est PAS un service
        then: schema => schema.required('La quantité en stock est requise pour un produit.'),
        otherwise: schema => schema.nullable(),
      }),
    criticalStockThreshold: Yup.number()
      .typeError('Doit être un nombre entier.')
      .integer('Doit être un nombre entier.')
      .min(0, 'Le seuil ne peut être négatif.')
      .when('isService', {
        is: false,
        then: schema => schema.required('Le seuil critique est requis pour un produit.'),
        otherwise: schema => schema.nullable(),
      }),
    isService: Yup.boolean(),
    supplierId: Yup.string().nullable(),
    isActive: Yup.boolean(),
  });

  const handleSubmitForm = (values, formikHelpers) => {
    // Convertir les champs numériques en nombres avant soumission
    const dataToSubmit = {
      ...values,
      unitPriceHT: parseFloat(values.unitPriceHT),
      vatRate: parseFloat(values.vatRate),
      stockQuantity: values.isService ? 0 : parseInt(values.stockQuantity, 10),
      criticalStockThreshold: values.isService ? 0 : parseInt(values.criticalStockThreshold, 10),
    };
    onSubmit(dataToSubmit, formikHelpers);
  };


  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmitForm}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form noValidate>
          {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

          <FormSection title="Informations Générales du Produit/Service" useCard={true}>
            <Row>
              <BootstrapForm.Group as={Col} md="8" className="mb-3" controlId="productName">
                <BootstrapForm.Label>Nom du Produit/Service *</BootstrapForm.Label>
                <Field name="name" type="text" as={BootstrapForm.Control} isInvalid={!!errors.name && touched.name} />
                <ErrorMessage name="name" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>
              <BootstrapForm.Group as={Col} md="4" className="mb-3" controlId="productSku">
                <BootstrapForm.Label>Référence (SKU)</BootstrapForm.Label>
                <Field name="sku" type="text" as={BootstrapForm.Control} isInvalid={!!errors.sku && touched.sku} />
                <ErrorMessage name="sku" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>
            </Row>
            <BootstrapForm.Group className="mb-3" controlId="productDescription">
              <BootstrapForm.Label>Description</BootstrapForm.Label>
              <Field name="description" as="textarea" rows={3} className={`form-control ${errors.description && touched.description ? 'is-invalid' : ''}`} />
              <ErrorMessage name="description" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>
            <Row>
                 <BootstrapForm.Group as={Col} md="6" className="mb-3 d-flex align-items-center pt-md-3">
                    <Field
                    type="checkbox"
                    name="isService"
                    as={BootstrapForm.Check}
                    id="isServiceProduct"
                    label="Ceci est un service (pas de gestion de stock)"
                    checked={values.isService}
                    onChange={(e) => {
                        setFieldValue('isService', e.target.checked);
                        if (e.target.checked) { // Si c'est un service, mettre stock à 0
                            setFieldValue('stockQuantity', '0');
                            setFieldValue('criticalStockThreshold', '0');
                        }
                    }}
                    />
                </BootstrapForm.Group>
                 <BootstrapForm.Group as={Col} md="6" className="mb-3 d-flex align-items-center pt-md-3">
                    <Field
                    type="checkbox"
                    name="isActive"
                    as={BootstrapForm.Check}
                    id="isActiveProduct"
                    label="Produit/Service Actif"
                    checked={values.isActive}
                    />
                </BootstrapForm.Group>
            </Row>
          </FormSection>

          <FormSection title="Tarification" useCard={true}>
            <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="unitPriceHT">
                <BootstrapForm.Label>Prix Unitaire HT *</BootstrapForm.Label>
                <InputGroup>
                  <Field name="unitPriceHT" type="number" step="0.01" min="0" as={BootstrapForm.Control} isInvalid={!!errors.unitPriceHT && touched.unitPriceHT} />
                  <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                </InputGroup>
                <ErrorMessage name="unitPriceHT" component="div" className="invalid-feedback d-block" />
              </BootstrapForm.Group>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="vatRate">
                <BootstrapForm.Label>Taux de TVA (%) *</BootstrapForm.Label>
                 <InputGroup>
                    <Field name="vatRate" type="number" step="0.1" min="0" max="100" as={BootstrapForm.Control} isInvalid={!!errors.vatRate && touched.vatRate} />
                    <InputGroup.Text>%</InputGroup.Text>
                </InputGroup>
                <ErrorMessage name="vatRate" component="div" className="invalid-feedback d-block" />
              </BootstrapForm.Group>
            </Row>
          </FormSection>

          {!values.isService && ( // Afficher la section Stock seulement si ce n'est pas un service
            <FormSection title="Gestion du Stock" useCard={true}>
              <Row>
                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="stockQuantity">
                  <BootstrapForm.Label>Quantité en Stock *</BootstrapForm.Label>
                  <Field name="stockQuantity" type="number" step="1" min="0" as={BootstrapForm.Control} isInvalid={!!errors.stockQuantity && touched.stockQuantity} />
                  <ErrorMessage name="stockQuantity" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="criticalStockThreshold">
                  <BootstrapForm.Label>Seuil Critique de Stock *</BootstrapForm.Label>
                  <Field name="criticalStockThreshold" type="number" step="1" min="0" as={BootstrapForm.Control} isInvalid={!!errors.criticalStockThreshold && touched.criticalStockThreshold} />
                  <ErrorMessage name="criticalStockThreshold" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
              </Row>
            </FormSection>
          )}

          {supplierOptions.length > 0 && (
            <FormSection title="Fournisseur (Optionnel)" useCard={true}>
              <BootstrapForm.Group controlId="supplierId">
                <BootstrapForm.Label>Fournisseur Principal</BootstrapForm.Label>
                <SelectField
                  name="supplierId"
                  options={supplierOptions}
                  value={supplierOptions.find(opt => opt.value === values.supplierId) || null}
                  onChange={(selectedOption) => setFieldValue('supplierId', selectedOption ? selectedOption.value : null)}
                  placeholder="Sélectionner un fournisseur"
                  isClearable
                  isInvalid={!!errors.supplierId && touched.supplierId}
                />
                <ErrorMessage name="supplierId" component="div" className="invalid-feedback d-block" />
              </BootstrapForm.Group>
            </FormSection>
          )}

          <div className="d-flex justify-content-end mt-4">
            <AppButton type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Mettre à jour' : 'Créer Produit/Service'}
            </AppButton>
          </div>
           {/* <pre>{JSON.stringify(values, null, 2)}</pre>
           <pre className="text-danger">{JSON.stringify(errors, null, 2)}</pre> */}
        </Form>
      )}
    </Formik>
  );
};

ProductForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
  supplierOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  currencySymbol: PropTypes.string,
};

export default ProductForm;