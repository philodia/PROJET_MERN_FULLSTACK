// frontend/src/components/suppliers/SupplierForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Form as BootstrapForm } from 'react-bootstrap';

import FormSection from '../forms/FormSection';
import AddressForm, { addressValidationSchema } from '../forms/AddressForm';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';

/**
 * Formulaire pour la création ou la modification d'un fournisseur.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.initialValues] - Valeurs initiales pour le formulaire (pour la modification).
 * @param {function} props.onSubmit - Fonction à appeler lors de la soumission du formulaire.
 *                                     Reçoit (values, { setSubmitting, setErrors, resetForm }).
 * @param {boolean} [props.isEditing=false] - Indique si le formulaire est en mode édition.
 * @param {string} [props.submitError] - Message d'erreur global à afficher après une tentative de soumission.
 */
const SupplierForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError = null,
}) => {
  const defaultInitialValues = {
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    siren: '', // Ou équivalent pour les fournisseurs
    tvaIntracom: '',
    website: '',
    paymentTerms: '', // Ex: "Net 30", "Net 60"
    notes: '',
    address: {
      street: '',
      city: '',
      zipCode: '',
      state: '',
      country: '',
    },
    isActive: true, // Fournisseur actif par défaut
  };

  const formInitialValues = { ...defaultInitialValues, ...initialValues };
  if (isEditing && initialValues && initialValues.isActive !== undefined) {
      formInitialValues.isActive = initialValues.isActive;
  }


  const validationSchema = Yup.object().shape({
    companyName: Yup.string()
      .max(100, 'Maximum 100 caractères')
      .required('Le nom de l\'entreprise fournisseur est requis.'),
    contactName: Yup.string()
      .max(100, 'Maximum 100 caractères'),
    email: Yup.string()
      .email('Adresse email invalide.')
      .required('L\'adresse email est requise.'),
    phone: Yup.string()
      .matches(/^(?:\+?\d{1,3}[ -]?)?(?:\(\d{1,}\)[ -]?)?\d(?:[ -]?\d){8,14}$/, {
        message: "Numéro de téléphone invalide.",
        excludeEmptyString: true,
      })
      .max(20, 'Maximum 20 caractères'),
    siren: Yup.string()
      .matches(/^[0-9]{9}$/, {
        message: "Le SIREN doit contenir 9 chiffres.",
        excludeEmptyString: true,
      }),
    tvaIntracom: Yup.string()
      .matches(/^[A-Z]{2}[0-9A-Z]{2,13}$/, {
        message: "Format de TVA intracommunautaire invalide.",
        excludeEmptyString: true,
      }),
    website: Yup.string()
      .url('URL de site web invalide.')
      .max(255, 'Maximum 255 caractères')
      .nullable(),
    paymentTerms: Yup.string().max(100, 'Maximum 100 caractères'),
    notes: Yup.string().max(1000, 'Maximum 1000 caractères'),
    address: addressValidationSchema('Ce champ d\'adresse est requis'),
    isActive: Yup.boolean(),
  });

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values }) => (
        <Form noValidate>
          {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

          <FormSection title="Informations Principales du Fournisseur" useCard={true}>
            <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierCompanyName">
                <BootstrapForm.Label>Nom de l'entreprise *</BootstrapForm.Label>
                <Field
                  name="companyName"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.companyName && touched.companyName}
                />
                <ErrorMessage name="companyName" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierContactName">
                <BootstrapForm.Label>Nom du contact</BootstrapForm.Label>
                <Field
                  name="contactName"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.contactName && touched.contactName}
                />
                <ErrorMessage name="contactName" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>
            </Row>

            <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierEmail">
                <BootstrapForm.Label>Email *</BootstrapForm.Label>
                <Field
                  name="email"
                  type="email"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.email && touched.email}
                />
                <ErrorMessage name="email" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierPhone">
                <BootstrapForm.Label>Téléphone</BootstrapForm.Label>
                <Field
                  name="phone"
                  type="tel"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.phone && touched.phone}
                />
                <ErrorMessage name="phone" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>
            </Row>
             <Row>
                <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierWebsite">
                    <BootstrapForm.Label>Site Web</BootstrapForm.Label>
                    <Field
                        name="website"
                        type="url"
                        placeholder="https://www.example.com"
                        as={BootstrapForm.Control}
                        isInvalid={!!errors.website && touched.website}
                    />
                    <ErrorMessage name="website" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
                 <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierPaymentTerms">
                    <BootstrapForm.Label>Conditions de Paiement</BootstrapForm.Label>
                    <Field
                        name="paymentTerms"
                        type="text"
                        placeholder="Ex: 30 jours nets, À réception"
                        as={BootstrapForm.Control}
                        isInvalid={!!errors.paymentTerms && touched.paymentTerms}
                    />
                    <ErrorMessage name="paymentTerms" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
            </Row>
          </FormSection>

          <FormSection title="Adresse du Fournisseur" useCard={true}>
            <AddressForm
              addressFieldNamePrefix="address"
              errors={errors}
              touched={touched}
              hideTitle={true}
            />
          </FormSection>

          <FormSection title="Informations Légales (Optionnel)" useCard={true}>
             <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierSiren">
                <BootstrapForm.Label>SIREN</BootstrapForm.Label>
                <Field
                  name="siren"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.siren && touched.siren}
                />
                <ErrorMessage name="siren" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="supplierTvaIntracom">
                <BootstrapForm.Label>N° TVA Intracommunautaire</BootstrapForm.Label>
                <Field
                  name="tvaIntracom"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.tvaIntracom && touched.tvaIntracom}
                />
                <ErrorMessage name="tvaIntracom" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>
            </Row>
          </FormSection>

          <FormSection title="Autres Informations" useCard={true}>
            <BootstrapForm.Group className="mb-3" controlId="supplierNotes">
              <BootstrapForm.Label>Notes internes sur le fournisseur</BootstrapForm.Label>
              <Field
                name="notes"
                as="textarea"
                rows={4}
                className={`form-control ${errors.notes && touched.notes ? 'is-invalid' : ''}`}
              />
               <ErrorMessage name="notes" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>
             <BootstrapForm.Group className="mb-3" controlId="supplierIsActive">
                <Field
                  type="checkbox"
                  name="isActive"
                  as={BootstrapForm.Check}
                  id="isActiveSupplier"
                  label="Fournisseur Actif"
                  checked={values.isActive}
                />
              </BootstrapForm.Group>
          </FormSection>

          <div className="d-flex justify-content-end mt-4">
            <AppButton type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Mettre à jour le Fournisseur' : 'Créer le Fournisseur'}
            </AppButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

SupplierForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
};

export default SupplierForm;