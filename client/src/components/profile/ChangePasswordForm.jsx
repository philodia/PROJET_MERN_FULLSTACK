// frontend/src/components/profile/ChangePasswordForm.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
// import { useDispatch } from 'react-redux'; // Si vous utilisez un thunk Redux

import FormField from '../common/FormField';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
import Icon from '../common/Icon';

// Importer la fonction API avec le nom correct
import { changeMyPassword } from '../../api/auth.api'; // <<<< CORRIGÉ ICI

const ChangePasswordForm = ({ onSuccess, onCancel }) => {
  // const dispatch = useDispatch();
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const initialValues = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  };

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Mot de passe actuel requis.'),
    newPassword: Yup.string()
      .required('Nouveau mot de passe requis.')
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.')
      .notOneOf([Yup.ref('currentPassword'), null], 'Le nouveau mot de passe doit être différent de l\'actuel.'),
    confirmNewPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Les nouveaux mots de passe doivent correspondre.')
      .required('Confirmation du nouveau mot de passe requise.'),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setFormError(null);
    setFormSuccess(null);

    try {
      // Utiliser la fonction API importée correctement
      await changeMyPassword({ // <<<< CORRIGÉ ICI
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setFormSuccess('Votre mot de passe a été modifié avec succès !');
      resetForm();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const message = error.message || "Une erreur est survenue lors de la modification du mot de passe.";
      setFormError(message);
      console.error("Erreur changement de mot de passe:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ... reste du composant JSX (qui est déjà correct) ...
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, dirty, isValid }) => (
        <Form>
          {formError && (
            <AlertMessage variant="danger" onClose={() => setFormError(null)} dismissible>
              {typeof formError === 'string' ? formError : JSON.stringify(formError)}
            </AlertMessage>
          )}
          {formSuccess && (
            <AlertMessage variant="success" onClose={() => setFormSuccess(null)} dismissible>
              {formSuccess}
            </AlertMessage>
          )}

          <FormField
            name="currentPassword"
            type="password"
            label="Mot de passe actuel"
            placeholder="Entrez votre mot de passe actuel"
            icon={<Icon name="BsLockFill" />}
          />

          <FormField
            name="newPassword"
            type="password"
            label="Nouveau mot de passe"
            placeholder="Entrez votre nouveau mot de passe"
            icon={<Icon name="BsKeyFill" />}
          />

          <FormField
            name="confirmNewPassword"
            type="password"
            label="Confirmer le nouveau mot de passe"
            placeholder="Confirmez votre nouveau mot de passe"
            icon={<Icon name="BsKeyFill" />}
          />

          <div className="mt-4 d-flex justify-content-end gap-2">
            {onCancel && (
              <AppButton
                type="button"
                variant="outline-secondary"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </AppButton>
            )}
            <AppButton
              type="submit"
              isLoading={isSubmitting}
              disabled={!dirty || !isValid || isSubmitting}
              loadingText="Modification..."
            >
              <Icon name="FaSave" className="me-2" />
              Changer le mot de passe
            </AppButton>
          </div>
        </Form>
      )}
    </Formik>
  );
};

ChangePasswordForm.propTypes = {
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ChangePasswordForm;