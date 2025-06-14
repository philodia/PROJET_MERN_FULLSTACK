import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import FormField from '../common/FormField';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
import Icon from '../common/Icon';

import { 
  updateUserProfile, 
  selectAuthStatus, 
  selectAuthError, 
  clearAuthError 
} from '../../features/auth/authSlice';

const UpdateProfileForm = ({ currentUser, onSuccess }) => {
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Valeurs initiales basées sur currentUser
  const initialValues = {
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    companyName: currentUser?.companyName || '',
    position: currentUser?.position || '',
  };

  // Schéma de validation amélioré
  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .required('Le prénom est requis')
      .min(2, 'Minimum 2 caractères')
      .max(50, 'Maximum 50 caractères')
      .trim(),
    lastName: Yup.string()
      .required('Le nom est requis')
      .min(2, 'Minimum 2 caractères')
      .max(50, 'Maximum 50 caractères')
      .trim(),
    username: Yup.string()
      .required('Le nom d\'utilisateur est requis')
      .min(3, 'Minimum 3 caractères')
      .max(30, 'Maximum 30 caractères')
      .trim()
      .matches(/^[a-zA-Z0-9_.-]+$/, "Caractères autorisés : lettres, chiffres, ., -, _"),
    email: Yup.string()
      .email('Adresse email invalide')
      .required('L\'email est requis')
      .trim(),
    phone: Yup.string()
      .matches(/^(\+\d{1,3})?\s?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/, 'Numéro invalide')
      .nullable(),
    companyName: Yup.string().nullable(),
    position: Yup.string().nullable(),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    // Réinitialiser les états précédents
    if (error) dispatch(clearAuthError());
    setFormSuccessMessage('');
    setSubmitting(true);

    try {
      // Créer un objet avec uniquement les champs modifiés
      const changedValues = {};
      Object.keys(values).forEach(key => {
        if (values[key] !== initialValues[key]) {
          changedValues[key] = values[key];
        }
      });

      // Si aucune modification, on arrête
      if (Object.keys(changedValues).length === 0) {
        setFormSuccessMessage("Aucune modification détectée.");
        return;
      }

      // Dispatch de l'action avec seulement les champs modifiés
      const resultAction = await dispatch(updateUserProfile(changedValues));
      
      if (updateUserProfile.fulfilled.match(resultAction)) {
        setFormSuccessMessage('Profil mis à jour avec succès !');
        if (onSuccess) {
          onSuccess(resultAction.payload);
        }
      } else {
        throw new Error(resultAction.payload?.message || "Échec de la mise à jour");
      }
    } catch (error) {
      console.error('Échec de la mise à jour:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = status === 'loading' || status === 'updating_profile';

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ isSubmitting, dirty, isValid, resetForm }) => (
        <Form>
          {/* Affichage des messages d'état */}
          {error && (
            <AlertMessage variant="danger" onClose={() => dispatch(clearAuthError())} dismissible>
              {error.message || "Erreur lors de la mise à jour"}
            </AlertMessage>
          )}
          
          {formSuccessMessage && (
            <AlertMessage variant="success" onClose={() => setFormSuccessMessage('')} dismissible>
              {formSuccessMessage}
            </AlertMessage>
          )}

          <Row className="g-3 mb-3">
            <Col md={6}>
              <FormField
                name="firstName"
                label="Prénom"
                placeholder="Votre prénom"
                disabled={isLoading}
                required
              />
            </Col>
            <Col md={6}>
              <FormField
                name="lastName"
                label="Nom"
                placeholder="Votre nom"
                disabled={isLoading}
                required
              />
            </Col>
            
            <Col md={6}>
              <FormField
                name="username"
                label="Nom d'utilisateur"
                placeholder="Votre identifiant"
                disabled={isLoading}
                required
              />
            </Col>
            <Col md={6}>
              <FormField
                name="email"
                type="email"
                label="Email"
                placeholder="votre@email.com"
                disabled={isLoading}
                required
              />
            </Col>
            
            <Col md={6}>
              <FormField
                name="phone"
                label="Téléphone"
                placeholder="+33 6 12 34 56 78"
                disabled={isLoading}
              />
            </Col>
            <Col md={6}>
              <FormField
                name="companyName"
                label="Société"
                placeholder="Votre entreprise"
                disabled={isLoading}
              />
            </Col>
            
            <Col md={12}>
              <FormField
                name="position"
                label="Poste"
                placeholder="Votre fonction"
                disabled={isLoading}
              />
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <AppButton
              type="button"
              variant="outline-secondary"
              onClick={() => resetForm()}
              disabled={isLoading || !dirty}
            >
              Réinitialiser
            </AppButton>
            
            <AppButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!dirty || !isValid || isLoading}
              loadingText="Enregistrement..."
            >
              <Icon name="FaSave" className="me-2" />
              Enregistrer
            </AppButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

UpdateProfileForm.propTypes = {
  currentUser: PropTypes.object.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default UpdateProfileForm;