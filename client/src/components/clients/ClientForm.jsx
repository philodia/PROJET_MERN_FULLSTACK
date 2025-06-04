// frontend/src/components/clients/ClientForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Form as BootstrapForm } from 'react-bootstrap';

import FormSection from '../forms/FormSection';
import AddressForm, { addressValidationSchema } from '../forms/AddressForm';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage'; // Pour les erreurs de soumission

/**
 * Formulaire pour la création ou la modification d'un client.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.initialValues] - Valeurs initiales pour le formulaire (pour la modification).
 * @param {function} props.onSubmit - Fonction à appeler lors de la soumission du formulaire.
 *                                     Reçoit (values, { setSubmitting, setErrors, resetForm }).
 * @param {boolean} [props.isEditing=false] - Indique si le formulaire est en mode édition.
 * @param {string} [props.submitError] - Message d'erreur global à afficher après une tentative de soumission.
 */
const ClientForm = ({
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
    siren: '',
    tvaIntracom: '',
    notes: '',
    address: {
      street: '',
      city: '',
      zipCode: '',
      state: '',
      country: '',
    },
  };

  const formInitialValues = { ...defaultInitialValues, ...initialValues };

  const validationSchema = Yup.object().shape({
    companyName: Yup.string()
      .max(100, 'Maximum 100 caractères')
      .required('Le nom de l\'entreprise est requis.'),
    contactName: Yup.string()
      .max(100, 'Maximum 100 caractères'),
    email: Yup.string()
      .email('Adresse email invalide.')
      .required('L\'adresse email est requise.'),
    phone: Yup.string()
      .matches(/^(?:\+?\d{1,3}[ -]?)?(?:\(\d{1,}\)[ -]?)?\d(?:[ -]?\d){8,14}$/, {
        message: "Numéro de téléphone invalide.",
        excludeEmptyString: true, // N'applique pas la validation si le champ est vide
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
    notes: Yup.string().max(1000, 'Maximum 1000 caractères'),
    address: addressValidationSchema(), // Utilise le schéma de validation de l'adresse
  });

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize // Important si `initialValues` peut changer (ex: chargement de données pour édition)
    >
      {({ errors, touched, isSubmitting }) => (
        <Form noValidate>
          {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

          <FormSection title="Informations Principales" useCard={true}>
            <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="companyName">
                <BootstrapForm.Label>Nom de l'entreprise *</BootstrapForm.Label>
                <Field
                  name="companyName"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.companyName && touched.companyName}
                />
                <ErrorMessage name="companyName" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="contactName">
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
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="email">
                <BootstrapForm.Label>Email *</BootstrapForm.Label>
                <Field
                  name="email"
                  type="email"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.email && touched.email}
                />
                <ErrorMessage name="email" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="phone">
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
          </FormSection>

          <FormSection title="Adresse du Client" useCard={true}>
            <AddressForm
              addressFieldNamePrefix="address"
              errors={errors}
              touched={touched}
              hideTitle={true} // Le titre est déjà géré par FormSection
            />
          </FormSection>

          <FormSection title="Informations Légales (Optionnel)" useCard={true}>
             <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="siren">
                <BootstrapForm.Label>SIREN</BootstrapForm.Label>
                <Field
                  name="siren"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.siren && touched.siren}
                />
                <ErrorMessage name="siren" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="tvaIntracom">
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

          <FormSection title="Notes" useCard={true}>
            <BootstrapForm.Group controlId="notes">
              <BootstrapForm.Label>Notes internes sur le client</BootstrapForm.Label>
              <Field
                name="notes"
                as="textarea"
                rows={4}
                className="form-control" // Pas besoin de `isInvalid` ici si on n'a pas de règle de validation spécifique
              />
               <ErrorMessage name="notes" component="div" className="text-danger small" />
            </BootstrapForm.Group>
          </FormSection>


          <div className="d-flex justify-content-end mt-4">
            <AppButton type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Mettre à jour le Client' : 'Créer le Client'}
            </AppButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

ClientForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
};

export default ClientForm;