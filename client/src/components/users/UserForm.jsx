// frontend/src/components/users/UserForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Form as BootstrapForm } from 'react-bootstrap';
// import SelectField from '../common/SelectField'; // Remplacé par RoleSelector pour le champ de rôle
import RoleSelector from './RoleSelector'; // <--- NOUVEL IMPORT
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
import FormSection from '../forms/FormSection';

/**
 * Formulaire pour la création ou la modification d'un utilisateur.
 */
const UserForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError,
  availableRoles = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'], // S'assurer que cette liste est cohérente
}) => {
  const defaultInitialValues = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER', // Rôle par défaut mis à jour
    isActive: true,
  };

  const formInitialValues = {
    ...defaultInitialValues,
    ...initialValues,
    password: '',
    confirmPassword: '',
  };
  if (isEditing && initialValues) {
    if (initialValues.role) formInitialValues.role = initialValues.role;
    if (initialValues.isActive !== undefined) formInitialValues.isActive = initialValues.isActive;
  }

  // roleOptions est maintenant géré à l'intérieur de RoleSelector si vous le souhaitez,
  // ou vous pouvez toujours le générer ici et le passer à RoleSelector via une prop
  // si RoleSelector est conçu pour prendre `options` en prop.
  // Pour l'instant, on suppose que RoleSelector gère `availableRoles`.

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .required('Le nom d\'utilisateur est requis.')
      .min(3, 'Au moins 3 caractères.')
      .max(50, 'Maximum 50 caractères.')
      .matches(/^[a-zA-Z0-9_.-]+$/, 'Caractères alphanumériques, underscores, points ou tirets uniquement.'),
    email: Yup.string()
      .email('Adresse email invalide.')
      .required('L\'adresse email est requise.'),
    password: Yup.string()
      .when('$isEditing', {
        is: (isEditingValue) => !isEditingValue,
        then: schema => schema.required('Le mot de passe est requis.').min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
        otherwise: schema => schema.min(8, 'Si modifié, le mot de passe doit contenir au moins 8 caractères.').nullable(),
      }),
    confirmPassword: Yup.string()
      .when('password', (password, schema) => {
        if (password && password[0] && password[0].length > 0) {
          return schema
            .required('Veuillez confirmer le mot de passe.')
            .oneOf([Yup.ref('password'), null], 'Les mots de passe ne correspondent pas.');
        }
        return schema;
      }),
    role: Yup.string()
      .required('Le rôle est requis.')
      .oneOf(availableRoles, 'Rôle invalide.'), // S'assurer que Yup valide contre la même liste
    isActive: Yup.boolean(),
  });

  const handleSubmit = (values, formikHelpers) => {
    const dataToSubmit = { ...values };
    delete dataToSubmit.confirmPassword;
    if (isEditing && !dataToSubmit.password) {
      delete dataToSubmit.password;
    }
    onSubmit(dataToSubmit, formikHelpers);
  };

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
      context={{ isEditing }}
    >
      {({ errors, touched, isSubmitting, values /*, setFieldValue */ }) => ( // setFieldValue est moins nécessaire ici si RoleSelector utilise Field
        <Form noValidate className="user-form">
          {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

          <FormSection title="Informations du Compte Utilisateur" useCard={false} className="mb-4">
            <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="username">
                <BootstrapForm.Label>Nom d'utilisateur *</BootstrapForm.Label>
                <Field
                  name="username"
                  type="text"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.username && touched.username}
                  disabled={isEditing}
                />
                <ErrorMessage name="username" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="emailFormUser"> {/* Changé l'id pour éviter conflit potentiel */}
                <BootstrapForm.Label>Email *</BootstrapForm.Label>
                <Field
                  name="email"
                  type="email"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.email && touched.email}
                />
                <ErrorMessage name="email" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>
            </Row>
          </FormSection>

          <FormSection title={isEditing ? "Changer le Mot de Passe (laisser vide pour ne pas modifier)" : "Mot de Passe *"} useCard={false} className="mb-4">
            <Row>
              <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="passwordFormUser"> {/* Changé l'id */}
                <BootstrapForm.Label>{isEditing ? "Nouveau mot de passe" : "Mot de passe *"}</BootstrapForm.Label>
                <Field
                  name="password"
                  type="password"
                  as={BootstrapForm.Control}
                  isInvalid={!!errors.password && touched.password}
                  placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Au moins 8 caractères"}
                />
                <ErrorMessage name="password" component="div" className="invalid-feedback" />
              </BootstrapForm.Group>

              {(values.password || !isEditing) && (
                  <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="confirmPasswordFormUser"> {/* Changé l'id */}
                    <BootstrapForm.Label>Confirmer le mot de passe *</BootstrapForm.Label>
                    <Field
                    name="confirmPassword"
                    type="password"
                    as={BootstrapForm.Control}
                    isInvalid={!!errors.confirmPassword && touched.confirmPassword}
                    />
                    <ErrorMessage name="confirmPassword" component="div" className="invalid-feedback" />
                </BootstrapForm.Group>
              )}
            </Row>
          </FormSection>

          <FormSection title="Permissions et Statut" useCard={false} className="mb-4">
            <Row>
              <Col md="6" className="mb-3"> {/* Envelopper RoleSelector dans Col pour le layout */}
                <Field
                  name="role"
                  component={RoleSelector} // <--- UTILISATION DE RoleSelector
                  label="Rôle de l'utilisateur *" // Le label est maintenant géré par RoleSelector
                  availableRoles={availableRoles} // Passer les rôles
                  isRequired={true} // Indiquer à RoleSelector que le champ est requis
                  // `field` et `form` sont automatiquement passés par `<Field component={...}>`
                  // `errors` et `touched` sont accessibles DANS RoleSelector via `form.errors` et `form.touched`
                />
                {/* L'ErrorMessage pour 'role' est maintenant géré à l'intérieur de RoleSelector
                    si RoleSelector utilise `form.errors` et `form.touched` */}
              </Col>

              <BootstrapForm.Group as={Col} md="6" className="mb-3 d-flex align-items-center pt-md-4">
                <Field
                  type="checkbox"
                  name="isActive"
                  as={BootstrapForm.Check}
                  id="isActiveUserForm"  // Changé l'id pour s'assurer de son unicité si plusieurs formulaires
                  label="Utilisateur Actif"
                  checked={values.isActive}
                />
              </BootstrapForm.Group>
            </Row>
          </FormSection>

          <div className="d-flex justify-content-end mt-4">
            <AppButton type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Mettre à jour l\'Utilisateur' : 'Créer l\'Utilisateur'}
            </AppButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

UserForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
  availableRoles: PropTypes.arrayOf(PropTypes.string),
};

export default UserForm;