// frontend/src/pages/Auth/LoginPage.jsx
import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Alert, Form as BootstrapForm } from 'react-bootstrap'; // Bootstrap Form pour les groupes
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import AuthLayout from '../../components/layout/AuthLayout';
import AppButton from '../../components/common/AppButton'; // Votre composant bouton
// import AlertMessage from '../../components/common/AlertMessage'; // On peut utiliser Alert de Bootstrap directement

// Importer les actions et sélecteurs de Redux
import { login, clearError, selectAuthIsLoading, selectAuthError, selectIsAuthenticated } from '../../features/auth/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = useSelector(selectAuthIsLoading);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Effacer les erreurs précédentes lors du montage du composant
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

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

  const handleSubmit = async (values, { setSubmitting }) => {
    // Effacer les erreurs précédentes au cas où l'utilisateur resoumet après une erreur
    if (authError) {
        dispatch(clearError());
    }

    try {
      // `login` est un createAsyncThunk, il retourne une promesse
      // `.unwrap()` est une fonction utilitaire de RTK pour obtenir le payload en cas de succès
      // ou lancer l'erreur (payload de rejectWithValue) en cas d'échec.
      await dispatch(login(values)).unwrap();
      // La redirection est gérée par le useEffect ci-dessus basé sur isAuthenticated
      // Si vous ne voulez pas attendre le useEffect, vous pouvez naviguer ici aussi :
      // const from = location.state?.from?.pathname || "/dashboard";
      // navigate(from, { replace: true });
    } catch (rejectedValueOrSerializedError) {
      // L'erreur est déjà dans l'état Redux (authError) grâce à `rejectWithValue` dans le thunk
      // et sera affichée par le sélecteur.
      // Pas besoin de `setSubmitError` local si `authError` est utilisé pour l'affichage.
      console.error('Échec de la connexion:', rejectedValueOrSerializedError);
    }
    // setSubmitting est automatiquement géré par Formik pour les soumissions asynchrones
    // et l'état `isLoading` de Redux contrôle le bouton.
    // `setSubmitting(false)` n'est généralement pas nécessaire ici si le thunk gère bien son cycle.
  };

  return (
    <AuthLayout pageTitle="Accéder à votre compte">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {/* `isSubmitting` de Formik est utile, mais on utilise `isLoading` de Redux pour le bouton */}
        {({ errors, touched /*, isSubmitting: formikIsSubmitting */ }) => (
          <Form noValidate>
            {authError && (
              <Alert variant="danger" onClose={() => dispatch(clearError())} dismissible>
                {typeof authError === 'object' ? JSON.stringify(authError) : authError}
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
              />
              <ErrorMessage name="email" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>

            <BootstrapForm.Group className="mb-3" controlId="loginPassword">
              <BootstrapForm.Label>Mot de Passe</BootstrapForm.Label>
              <Field
                name="password"
                type="password"
                as={BootstrapForm.Control}
                isInvalid={!!errors.password && touched.password}
                placeholder="Votre mot de passe"
              />
              <ErrorMessage name="password" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>

            <div className="d-grid mb-3">
              <AppButton type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </AppButton>
            </div>

            <div className="text-center mb-3">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>

            <hr />

            {/*<div className="text-center">
              <p className="mb-1">Vous n'avez pas de compte ?</p>
              <Link to="/register" className="fw-bold">
                Créez-en un ici
              </Link>
            </div>*/}
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default LoginPage;