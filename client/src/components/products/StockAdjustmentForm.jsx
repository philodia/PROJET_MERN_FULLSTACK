// frontend/src/components/products/StockAdjustmentForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Form as BootstrapForm, Row, Col } from 'react-bootstrap';
import SelectField from '../common/SelectField';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
// import Icon from '../common/Icon'; // Si besoin d'icônes dans le formulaire

/**
 * Formulaire pour enregistrer une opération manuelle sur le stock d'un produit.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.product - Le produit concerné par l'ajustement { id, name, stockQuantity }.
 * @param {function} props.onSubmit - Fonction appelée avec les valeurs du formulaire.
 *                                    Reçoit (values, { setSubmitting, setErrors, resetForm }).
 * @param {function} props.onCancel - Fonction pour annuler/fermer le formulaire (ex: fermer une modale).
 * @param {string} [props.submitError] - Message d'erreur global à afficher.
 * @param {boolean} [props.isSubmittingOp=false] - État de soumission externe.
 */
const StockAdjustmentForm = ({
  product,
  onSubmit,
  onCancel,
  submitError,
  isSubmittingOp = false, // Renommer pour éviter conflit avec isSubmitting de Formik
}) => {
  if (!product || product.isService) {
    return (
      <AlertMessage variant="warning">
        {product?.isService ? "Les services n'ont pas de stock à ajuster." : "Aucun produit sélectionné pour l'ajustement de stock."}
      </AlertMessage>
    );
  }

  const adjustmentTypes = [
    { value: 'IN', label: 'Entrée en Stock (+)' }, // Achat, Retour client, Production
    { value: 'OUT', label: 'Sortie de Stock (-)' }, // Perte, Casse, Usage interne
    { value: 'CORRECTION', label: 'Correction d\'Inventaire (=)' }, // Mettre à jour à une nouvelle quantité exacte
  ];

  const initialValues = {
    productId: product.id,
    productName: product.name,
    currentStock: product.stockQuantity,
    adjustmentType: 'IN', // Type par défaut
    quantity: '',
    newStockQuantity: '', // Seulement pour le type 'CORRECTION'
    reason: '', // Motif de l'ajustement
    adjustmentDate: new Date().toISOString().split('T')[0],
  };

  const validationSchema = Yup.object().shape({
    adjustmentType: Yup.string().required("Le type d'ajustement est requis."),
    quantity: Yup.number()
      .when('adjustmentType', {
        is: (val) => val === 'IN' || val === 'OUT',
        then: schema => schema.typeError('Doit être un nombre.')
                              .required('La quantité est requise.')
                              .positive('La quantité doit être positive.'),
        otherwise: schema => schema.nullable(), // Non requis pour 'CORRECTION'
      }),
    newStockQuantity: Yup.number()
        .when('adjustmentType', {
            is: 'CORRECTION',
            then: schema => schema.typeError('Doit être un nombre.')
                                  .required('La nouvelle quantité est requise pour une correction.')
                                  .min(0, 'La quantité ne peut être négative.'),
            otherwise: schema => schema.nullable(),
        }),
    reason: Yup.string().required('Un motif est requis.').max(255, 'Maximum 255 caractères.'),
    adjustmentDate: Yup.date().required('La date d\'ajustement est requise.'),
  });

  const handleSubmitForm = (values, formikHelpers) => {
    const dataToSubmit = {
        productId: values.productId,
        adjustmentType: values.adjustmentType,
        quantity: values.adjustmentType !== 'CORRECTION' ? Number(values.quantity) : undefined, // Quantité d'ajustement
        newStockQuantity: values.adjustmentType === 'CORRECTION' ? Number(values.newStockQuantity) : undefined, // Nouvelle quantité totale
        reason: values.reason,
        adjustmentDate: values.adjustmentDate,
    };
    onSubmit(dataToSubmit, formikHelpers);
  };


  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmitForm}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => (
        <Form noValidate className="stock-adjustment-form">
          {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

          <BootstrapForm.Group className="mb-3" controlId="productInfo">
            <BootstrapForm.Label>Produit Concerné</BootstrapForm.Label>
            <div className="form-control bg-light">
              <strong>{values.productName}</strong> (ID: {values.productId})
              <br />
              <small>Stock actuel : {values.currentStock === null || values.currentStock === undefined ? 'N/A' : values.currentStock} unités</small>
            </div>
          </BootstrapForm.Group>

          <Row>
            <BootstrapForm.Group as={Col} md={6} className="mb-3" controlId="adjustmentDate">
              <BootstrapForm.Label>Date de l'Ajustement *</BootstrapForm.Label>
              <Field
                name="adjustmentDate"
                type="date"
                as={BootstrapForm.Control}
                isInvalid={!!errors.adjustmentDate && touched.adjustmentDate}
              />
              <ErrorMessage name="adjustmentDate" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>

            <BootstrapForm.Group as={Col} md={6} className="mb-3" controlId="adjustmentType">
              <BootstrapForm.Label>Type d'Ajustement *</BootstrapForm.Label>
              <SelectField
                name="adjustmentType"
                options={adjustmentTypes}
                value={adjustmentTypes.find(opt => opt.value === values.adjustmentType) || null}
                onChange={(selectedOption) => {
                    setFieldValue('adjustmentType', selectedOption ? selectedOption.value : '');
                    // Réinitialiser les champs de quantité si le type change
                    setFieldValue('quantity', '');
                    setFieldValue('newStockQuantity', '');
                }}
                isInvalid={!!errors.adjustmentType && touched.adjustmentType}
              />
              <ErrorMessage name="adjustmentType" component="div" className="invalid-feedback d-block" />
            </BootstrapForm.Group>
          </Row>


          {values.adjustmentType === 'IN' || values.adjustmentType === 'OUT' ? (
            <BootstrapForm.Group className="mb-3" controlId="quantity">
              <BootstrapForm.Label>
                Quantité à {values.adjustmentType === 'IN' ? 'Ajouter' : 'Retirer'} *
              </BootstrapForm.Label>
              <Field
                name="quantity"
                type="number"
                min="1" // Positive est déjà dans Yup
                step="1"
                as={BootstrapForm.Control}
                isInvalid={!!errors.quantity && touched.quantity}
                placeholder={`Quantité à ${values.adjustmentType === 'IN' ? 'entrer' : 'sortir'}`}
              />
              <ErrorMessage name="quantity" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>
          ) : null}

          {values.adjustmentType === 'CORRECTION' && (
            <BootstrapForm.Group className="mb-3" controlId="newStockQuantity">
              <BootstrapForm.Label>Nouvelle Quantité Totale en Stock *</BootstrapForm.Label>
              <Field
                name="newStockQuantity"
                type="number"
                min="0"
                step="1"
                as={BootstrapForm.Control}
                isInvalid={!!errors.newStockQuantity && touched.newStockQuantity}
                placeholder="Quantité réelle après inventaire"
              />
              <ErrorMessage name="newStockQuantity" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>
          )}

          <BootstrapForm.Group className="mb-3" controlId="reason">
            <BootstrapForm.Label>Motif de l'Ajustement *</BootstrapForm.Label>
            <Field
              name="reason"
              as="textarea"
              rows={3}
              className={`form-control ${errors.reason && touched.reason ? 'is-invalid' : ''}`}
              placeholder="Ex: Inventaire annuel, Réception commande fournisseur X, Perte due à un dommage..."
            />
            <ErrorMessage name="reason" component="div" className="invalid-feedback" />
          </BootstrapForm.Group>

          <div className="d-flex justify-content-end mt-4 gap-2">
            {onCancel && (
                <AppButton type="button" variant="outline-secondary" onClick={onCancel} disabled={isSubmitting || isSubmittingOp}>
                    Annuler
                </AppButton>
            )}
            <AppButton type="submit" variant="primary" isLoading={isSubmitting || isSubmittingOp}>
              Enregistrer l'Ajustement
            </AppButton>
          </div>
            {/* <pre>{JSON.stringify(values, null, 2)}</pre>
            <pre className="text-danger">{JSON.stringify(errors, null, 2)}</pre> */}
        </Form>
      )}
    </Formik>
  );
};

StockAdjustmentForm.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    stockQuantity: PropTypes.number,
    isService: PropTypes.bool,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  submitError: PropTypes.string,
  isSubmittingOp: PropTypes.bool,
};

export default StockAdjustmentForm;