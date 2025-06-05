// frontend/src/components/accounting/ChartOfAccountForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Form as BootstrapForm } from 'react-bootstrap';
import SelectField from '../common/SelectField';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';

/**
 * Formulaire pour la création ou la modification d'un compte du plan comptable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.initialValues] - Valeurs initiales pour la modification.
 * @param {function} props.onSubmit - Fonction appelée avec les valeurs du formulaire.
 *                                    Reçoit (values, { setSubmitting, setErrors, resetForm }).
 * @param {boolean} [props.isEditing=false] - Si le formulaire est en mode édition.
 * @param {string} [props.submitError] - Message d'erreur global à afficher.
 * @param {Array<object>} [props.parentAccountOptions] - Options pour sélectionner un compte parent (si hiérarchique).
 *                                                      Chaque option: { value: 'accountId', label: 'Numéro - Nom Compte' }
 */
const ChartOfAccountForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError,
  parentAccountOptions = [], // Laisser vide si le plan n'est pas géré comme strictement hiérarchique ici
}) => {
  const defaultInitialValues = {
    accountNumber: '',
    accountName: '',
    type: '', // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    description: '',
    parentId: null, // Pour un plan comptable hiérarchique
    isActive: true,
  };

  const formInitialValues = { ...defaultInitialValues, ...initialValues };

  const accountTypeOptions = [
    { value: 'ASSET', label: 'Actif' },
    { value: 'LIABILITY', label: 'Passif' },
    { value: 'EQUITY', label: 'Capitaux Propres' },
    { value: 'REVENUE', label: 'Revenu (Produit)' },
    { value: 'EXPENSE', label: 'Dépense (Charge)' },
    // Vous pourriez avoir des types plus granulaires :
    // { value: 'ASSET_CURRENT', label: 'Actif Courant' },
    // { value: 'ASSET_NON_CURRENT', label: 'Actif Non Courant' },
    // { value: 'COST_OF_GOODS_SOLD', label: 'Coût des Marchandises Vendues' },
  ];

  const validationSchema = Yup.object().shape({
    accountNumber: Yup.string()
      .required('Le numéro de compte est requis.')
      .matches(/^[0-9A-Za-z.-]+$/, 'Numéro de compte invalide (chiffres, lettres, points, tirets).')
      .min(3, 'Au moins 3 caractères.')
      .max(20, 'Maximum 20 caractères.'),
    accountName: Yup.string()
      .required('Le nom du compte est requis.')
      .max(100, 'Maximum 100 caractères.'),
    type: Yup.string()
      .required('Le type de compte est requis.')
      .oneOf(accountTypeOptions.map(opt => opt.value), 'Type de compte invalide.'),
    description: Yup.string().max(255, 'Maximum 255 caractères.'),
    parentId: Yup.string().nullable(), // Permettre null si pas de parent
    isActive: Yup.boolean(),
  });

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, setFieldValue, values }) => (
        <Form noValidate className="chart-of-account-form">
          {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

          <Row>
            <BootstrapForm.Group as={Col} md="4" className="mb-3" controlId="accountNumber">
              <BootstrapForm.Label>Numéro de Compte *</BootstrapForm.Label>
              <Field
                name="accountNumber"
                type="text"
                as={BootstrapForm.Control}
                placeholder="Ex: 411000, 607"
                isInvalid={!!errors.accountNumber && touched.accountNumber}
                disabled={isEditing} // Souvent, le numéro de compte n'est pas modifiable
              />
              <ErrorMessage name="accountNumber" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>

            <BootstrapForm.Group as={Col} md="8" className="mb-3" controlId="accountName">
              <BootstrapForm.Label>Nom du Compte *</BootstrapForm.Label>
              <Field
                name="accountName"
                type="text"
                as={BootstrapForm.Control}
                placeholder="Ex: Clients, Achats de Marchandises"
                isInvalid={!!errors.accountName && touched.accountName}
              />
              <ErrorMessage name="accountName" component="div" className="invalid-feedback" />
            </BootstrapForm.Group>
          </Row>

          <Row>
            <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="accountType">
              <BootstrapForm.Label>Type de Compte *</BootstrapForm.Label>
              <SelectField
                name="type"
                options={accountTypeOptions}
                value={accountTypeOptions.find(opt => opt.value === values.type) || null}
                onChange={(selectedOption) => setFieldValue('type', selectedOption ? selectedOption.value : '')}
                placeholder="Sélectionner un type"
                isInvalid={!!errors.type && touched.type}
              />
              <ErrorMessage name="type" component="div" className="invalid-feedback d-block" />
            </BootstrapForm.Group>

            {parentAccountOptions.length > 0 && ( // Afficher seulement si des options de parent sont fournies
                 <BootstrapForm.Group as={Col} md="6" className="mb-3" controlId="parentId">
                    <BootstrapForm.Label>Compte Parent (Optionnel)</BootstrapForm.Label>
                    <SelectField
                        name="parentId"
                        options={parentAccountOptions}
                        value={parentAccountOptions.find(opt => opt.value === values.parentId) || null}
                        onChange={(selectedOption) => setFieldValue('parentId', selectedOption ? selectedOption.value : null)}
                        placeholder="Aucun compte parent"
                        isClearable
                        isInvalid={!!errors.parentId && touched.parentId}
                    />
                    <ErrorMessage name="parentId" component="div" className="invalid-feedback d-block" />
                </BootstrapForm.Group>
            )}
          </Row>

          <BootstrapForm.Group className="mb-3" controlId="description">
            <BootstrapForm.Label>Description (Optionnel)</BootstrapForm.Label>
            <Field
              name="description"
              as="textarea"
              rows={3}
              className={`form-control ${errors.description && touched.description ? 'is-invalid' : ''}`}
              placeholder="Description ou note sur l'utilisation de ce compte..."
            />
            <ErrorMessage name="description" component="div" className="invalid-feedback" />
          </BootstrapForm.Group>

          <BootstrapForm.Group className="mb-3" controlId="isActive">
            <Field
              type="checkbox"
              name="isActive"
              as={BootstrapForm.Check}
              label="Compte Actif"
              checked={values.isActive} // Formik gère `checked` pour les checkboxes
              // onChange et onBlur sont gérés par Formik pour `as={BootstrapForm.Check}`
            />
          </BootstrapForm.Group>

          <div className="d-flex justify-content-end mt-4">
            <AppButton type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Mettre à jour le Compte' : 'Créer le Compte'}
            </AppButton>
          </div>
           {/* Pour le débogage */}
           {/* <pre className="mt-3">{JSON.stringify(values, null, 2)}</pre>
           <pre className="mt-3 text-danger">{JSON.stringify(errors, null, 2)}</pre> */}
        </Form>
      )}
    </Formik>
  );
};

ChartOfAccountForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.string,
  parentAccountOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};

export default ChartOfAccountForm;