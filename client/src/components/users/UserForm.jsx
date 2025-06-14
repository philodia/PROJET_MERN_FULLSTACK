// frontend/src/components/users/UserForm.jsx (Version fonctionnelle attendue)
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { Formik, Form, Field as FormikField } from 'formik';
import * as Yup from 'yup';
import { Row, Col } from 'react-bootstrap';
import AppButton from '../common/AppButton';
import FormField from '../common/FormField';
import SelectField from '../common/SelectField';
import AlertMessage from '../common/AlertMessage';
import { createUserAdmin, updateUserAdmin } from '../../features/users/userSlice'; // Ajustez le chemin

const UserForm = ({ initialUser, isEditMode = false, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const [formError, setFormError] = useState(null); // Pour les erreurs de soumission API

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'Le nom d\'utilisateur doit comporter au moins 3 caractères.')
      .max(30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères.')
      .required('Le nom d\'utilisateur est requis.'),
    email: Yup.string().email('Adresse email invalide.').required('L\'email est requis.'),
    password: isEditMode
      ? Yup.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères s\'il est modifié.')
      : Yup.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères.').required('Le mot de passe est requis.'),
    confirmPassword: Yup.string()
      .when('password', (password, schema) => {
        // Si password a une valeur (c'est-à-dire qu'il est en cours de saisie ou modifié)
        if (password && password.length > 0) {
          return schema.oneOf([Yup.ref('password'), null], 'Les mots de passe doivent correspondre.').required('La confirmation du mot de passe est requise.');
        }
        return schema; // Pas de validation si password est vide (en mode édition)
      }),
    role: Yup.string().required('Le rôle est requis.').oneOf(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'], 'Rôle invalide.'),
    firstName: Yup.string().trim().max(50, 'Le prénom ne peut pas dépasser 50 caractères.'),
    lastName: Yup.string().trim().max(50, 'Le nom de famille ne peut pas dépasser 50 caractères.'),
    isActive: Yup.boolean(),
  });

  const initialFormValues = {
    username: initialUser?.username || '',
    email: initialUser?.email || '',
    password: '',
    confirmPassword: '',
    role: initialUser?.role || 'USER',
    firstName: initialUser?.firstName || '',
    lastName: initialUser?.lastName || '',
    isActive: initialUser ? initialUser.isActive : true,
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setFormError(null);
    const userData = { ...values };

    if (isEditMode && !values.password) { // Ne pas envoyer le mot de passe s'il est vide en mode édition
      delete userData.password;
      delete userData.confirmPassword;
    } else if (values.password) {
      delete userData.confirmPassword; // Ne jamais envoyer confirmPassword à l'API
    }


    try {
      let resultAction;
      if (isEditMode && initialUser?._id) {
        resultAction = await dispatch(updateUserAdmin({ userId: initialUser._id, userData })).unwrap();
      } else {
        resultAction = await dispatch(createUserAdmin(userData)).unwrap();
      }
      resetForm();
      onSuccess(resultAction); // Passer l'utilisateur créé/mis à jour au callback
    } catch (error) {
      console.error("Erreur formulaire utilisateur:", error);
      setFormError(error.message || error.errors || (error.details ? JSON.stringify(error.details) : 'Une erreur est survenue.'));
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'USER', label: 'Utilisateur (USER)' },
    { value: 'ACCOUNTANT', label: 'Comptable (ACCOUNTANT)' },
    { value: 'MANAGER', label: 'Manager (MANAGER)' },
    { value: 'ADMIN', label: 'Administrateur (ADMIN)' },
  ];

  return (
    <Formik
      initialValues={initialFormValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize // Important si initialUser peut changer pendant que le formulaire est monté
    >
      {({ isSubmitting, dirty, isValid }) => (
        <Form>
          {formError && (
            <AlertMessage variant="danger" className="mb-3">
              {typeof formError === 'string' ? formError : 'Veuillez corriger les erreurs du formulaire.'}
            </AlertMessage>
          )}
          <Row className="mb-3">
            <Col md={6}>
              <FormField name="username" label="Nom d'utilisateur" placeholder="john.doe" required />
            </Col>
            <Col md={6}>
              <FormField name="email" type="email" label="Adresse Email" placeholder="utilisateur@example.com" required />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <FormField
                name="password"
                type="password"
                label={isEditMode ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                placeholder={isEditMode ? 'Laisser vide pour ne pas changer' : 'Minimum 8 caractères'}
                required={!isEditMode}
              />
            </Col>
            <Col md={6}>
              <FormField
                name="confirmPassword"
                type="password"
                label="Confirmer le mot de passe"
                placeholder="Retapez le mot de passe"
                // required est géré par la validation conditionnelle Yup
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <FormikField
                name="role"
                component={SelectField}
                options={roleOptions}
                label="Rôle de l'utilisateur"
                placeholder="Sélectionner un rôle"
                required
              />
            </Col>
            <Col md={6} className="d-flex align-items-end pb-2"> {/* align-items-end pour aligner avec le bas du SelectField */}
              <FormField name="isActive" type="checkbox" label="Compte actif" isSwitch />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <FormField name="firstName" label="Prénom" placeholder="John" />
            </Col>
            <Col md={6}>
              <FormField name="lastName" label="Nom de famille" placeholder="Doe" />
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton type="button" variant="outline-secondary" onClick={onCancel} disabled={isSubmitting}>
              Annuler
            </AppButton>
            <AppButton type="submit" isLoading={isSubmitting} disabled={!dirty || !isValid || isSubmitting}>
              {isEditMode ? 'Enregistrer les Modifications' : 'Créer Utilisateur'}
            </AppButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

UserForm.propTypes = {
  initialUser: PropTypes.object,
  isEditMode: PropTypes.bool,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default UserForm;