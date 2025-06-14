// frontend/src/pages/Auth/LoginPage.jsx
import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Alert, Form as BootstrapForm } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import AuthLayout from '../../components/layout/AuthLayout';
import AppButton from '../../components/common/AppButton';
import Icon from '../../components/common/Icon'; // Pour une icône sur le bouton par exemple

import {
  login,
  clearAuthError, // Renommé depuis clearError pour plus de spécificité
  selectAuthIsLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '../../features/auth/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = useSelector(selectAuthIsLoading);
  const authErrorObject = useSelector(selectAuthError); // Renommé pour clarté que c'est un objet
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'; // Rediriger vers la page de destination ou dashboard
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    // Effacer les erreurs d'authentification précédentes lors du montage de la page
    // pour ne pas afficher une ancienne erreur si l'utilisateur navigue vers la page de login.
    if (authErrorObject) {
        dispatch(clearAuthError());
    }
    // Retourner une fonction de nettoyage est une bonne pratique si l'effet a des "effets de bord"
    // qui doivent être nettoyés, mais ici, ce n'est pas strictement nécessaire pour un simple dispatch.
    // return () => {
    //   dispatch(clearAuthError()); // Ou effacer uniquement si on quitte la page avant une tentative de login
    // };
  }, [dispatch, authErrorObject]); // Exécuter si authErrorObject change (pour le cas où il est initialement là)

  const initialValues = {
    email: '',
    password: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Adresse email invalide.')
      .required('L\'adresse email est requise.'),
    password: Yup.string().required('Le mot de passe est requis.'),
  });

  const handleSubmit = async (values /*, { setSubmitting } // Pas besoin de setSubmitting ici */) => {
    // S'il y a une erreur affichée, l'effacer avant la nouvelle tentative
    if (authErrorObject) {
      dispatch(clearAuthError());
    }

    try {
      await dispatch(login(values)).unwrap();
      // La redirection est gérée par le useEffect ci-dessus basé sur isAuthenticated.
      // Si le login est réussi, isAuthenticated deviendra true, et l'effet se déclenchera.
    } catch (rejectedValue) {
      // L'erreur est déjà dans l'état Redux via authErrorObject.
      // Le rejectedValue ici est ce que rejectWithValue a retourné (ex: { message: '...' })
      console.error('Échec de la connexion (capturé dans le composant):', rejectedValue);
      // Pas besoin de setState local pour l'erreur, elle est déjà dans Redux.
    }
    // Formik gère automatiquement isSubmitting à false après que la promesse de onSubmit soit résolue/rejetée.
  };

  return (
    <AuthLayout pageTitle="Connexion à Votre Compte">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form noValidate>
            {authErrorObject && (
              <Alert variant="danger" onClose={() => dispatch(clearAuthError())} dismissible>
                {authErrorObject.message || // Afficher le message de l'objet erreur
                 (typeof authErrorObject === 'string' ? authErrorObject : 'Identifiants incorrects ou erreur serveur.')}
              </Alert>
            )}

            <BootstrapForm.Group className="mb-3" controlId="loginEmail">
              <BootstrapForm.Label>Adresse Email</BootstrapForm.Label>
              <Field
                name="email"
                type="email"
                as={BootstrapForm.Control}
                isInvalid={!!errors.email && touched.email}
                placeholder="votreadresse@example.com"
                disabled={isLoading} // Désactiver pendant le chargement
              />
              <ErrorMessage name="email" component={BootstrapForm.Control.Feedback} type="invalid" />
            </BootstrapForm.Group>

            <BootstrapForm.Group className="mb-4" controlId="loginPassword"> {/* Augmenté mb */}
              <BootstrapForm.Label>Mot de Passe</BootstrapForm.Label>
              <Field
                name="password"
                type="password"
                as={BootstrapForm.Control}
                isInvalid={!!errors.password && touched.password}
                placeholder="Votre mot de passe"
                disabled={isLoading} // Désactiver pendant le chargement
              />
              <ErrorMessage name="password" component={BootstrapForm.Control.Feedback} type="invalid" />
            </BootstrapForm.Group>

            <div className="d-grid mb-3">
              <AppButton type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={isLoading}>
                <Icon name="FaSignInAlt" className="me-2" />
                {isLoading ? 'Connexion...' : 'Se Connecter'}
              </AppButton>
            </div>

            <div className="text-center">
              <Link to="/auth/forgot-password">Mot de passe oublié ?</Link>
            </div>

            {/* Si l'inscription publique est activée */}
            {/* <hr className="my-4" />
            <div className="text-center">
              <p className="text-muted">Nouvel utilisateur ?</p>
              <AppButton as={Link} to="/auth/register" variant="outline-secondary" className="w-100">
                Créer un compte
              </AppButton>
            </div> */}
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default LoginPage;