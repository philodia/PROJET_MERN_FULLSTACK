// frontend/src/components/accounting/JournalEntryForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  Row,
  Col,
  Form as BootstrapForm,
  Button,
  Card,
} from 'react-bootstrap';
import SelectField from '../common/SelectField';
import AppButton from '../common/AppButton';
import Icon from '../common/Icon';
import FormSection from '../forms/FormSection';
import AlertMessage from '../common/AlertMessage';
import './JournalEntryForm.scss';

const JournalEntryForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  chartOfAccounts = [],
  submitError,
  currencySymbol = '€',
}) => {
  const defaultLine = { account: '', description: '', debit: '', credit: '' };
  const defaultInitialValues = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [
      { ...defaultLine, tempId: `line-${Date.now()}-1` },
      { ...defaultLine, tempId: `line-${Date.now()}-2` },
    ],
  };

  const formInitialValues = { ...defaultInitialValues, ...initialValues };

  if (isEditing && initialValues?.lines) {
    formInitialValues.lines = initialValues.lines.map((line, index) => ({
      ...line,
      tempId: line.tempId || `line-edit-${Date.now()}-${index}`,
      debit:
        line.debit !== undefined && line.debit !== null ? String(line.debit) : '',
      credit:
        line.credit !== undefined && line.credit !== null
          ? String(line.credit)
          : '',
    }));
  } else {
    formInitialValues.lines = formInitialValues.lines.map((line, index) => ({
      ...line,
      tempId: `line-new-${Date.now()}-${index}`,
    }));
  }

  const validationSchema = Yup.object().shape({
    date: Yup.date().required('La date est requise.'),
    description: Yup.string()
      .required('Une description générale est requise.')
      .max(255, 'Maximum 255 caractères.'),
    lines: Yup.array()
      .of(
        Yup.object().shape({
          account: Yup.string().required('Compte requis.'),
          description: Yup.string().max(
            255,
            'Maximum 255 caractères pour la description de ligne.'
          ),
          debit: Yup.number()
            .typeError('Doit être un nombre')
            .min(0, 'Ne peut être négatif')
            .test(
              'debit-xor-credit',
              'Débit ou crédit doit être saisi, pas les deux.',
              function (value) {
                const { credit } = this.parent;
                return !(value && credit);
              }
            ),
          credit: Yup.number()
            .typeError('Doit être un nombre')
            .min(0, 'Ne peut être négatif')
            .test(
              'credit-xor-debit',
              'Crédit ou débit doit être saisi, pas les deux.',
              function (value) {
                const { debit } = this.parent;
                return !(value && debit);
              }
            )
            .test(
              'at-least-one-amount',
              'Au moins un débit ou un crédit doit être saisi.',
              function (value) {
                const { debit, account } = this.parent;
                if (
                  account &&
                  (debit === undefined || debit === '') &&
                  (value === undefined || value === '')
                )
                  return false;
                return true;
              }
            ),
        })
      )
      .min(2, 'Au moins deux lignes sont requises.')
      .test(
        'balance-check',
        'Le total des débits doit égaler le total des crédits.',
        function (lines) {
          if (!lines) return true;
          const totalDebit = lines.reduce(
            (sum, line) => sum + (Number(line.debit) || 0),
            0
          );
          const totalCredit = lines.reduce(
            (sum, line) => sum + (Number(line.credit) || 0),
            0
          );
          return Math.abs(totalDebit - totalCredit) < 0.001;
        }
      ),
  });

  const calculateTotals = (lines) => {
    const totalDebit = lines.reduce(
      (sum, line) => sum + (Number(line.debit) || 0),
      0
    );
    const totalCredit = lines.reduce(
      (sum, line) => sum + (Number(line.credit) || 0),
      0
    );
    return { totalDebit, totalCredit };
  };

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={validationSchema}
      onSubmit={(values, formikHelpers) => {
        const processedValues = {
          ...values,
          lines: values.lines.map((line) => ({
            ...line,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
          })),
        };
        onSubmit(processedValues, formikHelpers);
      }}
      enableReinitialize
    >
      {({ values, errors, touched, isSubmitting, setFieldValue }) => {
        const { totalDebit, totalCredit } = calculateTotals(values.lines);
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

        return (
          <Form className="journal-entry-form">
            {submitError && (
              <AlertMessage variant="danger" className="mb-3">
                {submitError}
              </AlertMessage>
            )}

            <FormSection
              title="Informations Générales de l'Écriture"
              useCard={false}
              className="mb-4"
            >
              <Row>
                <BootstrapForm.Group as={Col} md={4} className="mb-3">
                  <BootstrapForm.Label>Date de l'écriture *</BootstrapForm.Label>
                  <Field
                    name="date"
                    type="date"
                    as={BootstrapForm.Control}
                    isInvalid={!!errors.date && touched.date}
                  />
                  <ErrorMessage
                    name="date"
                    component="div"
                    className="invalid-feedback"
                  />
                </BootstrapForm.Group>
                <BootstrapForm.Group as={Col} md={8} className="mb-3">
                  <BootstrapForm.Label>Description *</BootstrapForm.Label>
                  <Field
                    name="description"
                    as={BootstrapForm.Control}
                    placeholder="Ex: Paiement facture, vente de service..."
                    isInvalid={!!errors.description && touched.description}
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="invalid-feedback"
                  />
                </BootstrapForm.Group>
              </Row>
            </FormSection>

            <FormSection title="Lignes d'Écriture" useCard={false}>
              <FieldArray name="lines">
                {({ push, remove }) => (
                  <>
                    {values.lines.map((line, index) => (
                      <Card key={line.tempId} className="mb-3">
                        <Card.Body>
                          <Row className="align-items-center">
                            <Col md={4}>
                              <SelectField
                                name={`lines.${index}.account`}
                                options={chartOfAccounts}
                                value={chartOfAccounts.find(
                                  (opt) => opt.value === line.account
                                )}
                                onChange={(selectedOption) =>
                                  setFieldValue(
                                    `lines.${index}.account`,
                                    selectedOption?.value || ''
                                  )
                                }
                                placeholder="Compte *"
                              />
                              <ErrorMessage
                                name={`lines.${index}.account`}
                                component="div"
                                className="invalid-feedback d-block"
                              />
                            </Col>
                            <Col md={3}>
                              <Field
                                name={`lines.${index}.description`}
                                placeholder="Description"
                                as={BootstrapForm.Control}
                              />
                              <ErrorMessage
                                name={`lines.${index}.description`}
                                component="div"
                                className="invalid-feedback"
                              />
                            </Col>
                            <Col md={2}>
                              <Field
                                name={`lines.${index}.debit`}
                                placeholder="Débit"
                                as={BootstrapForm.Control}
                              />
                              <ErrorMessage
                                name={`lines.${index}.debit`}
                                component="div"
                                className="invalid-feedback"
                              />
                            </Col>
                            <Col md={2}>
                              <Field
                                name={`lines.${index}.credit`}
                                placeholder="Crédit"
                                as={BootstrapForm.Control}
                              />
                              <ErrorMessage
                                name={`lines.${index}.credit`}
                                component="div"
                                className="invalid-feedback"
                              />
                            </Col>
                            <Col md={1}>
                              <Button
                                variant="danger"
                                onClick={() => remove(index)}
                                size="sm"
                                className="mt-2"
                                disabled={values.lines.length <= 2}
                              >
                                <Icon name="trash" />
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      onClick={() =>
                        push({ ...defaultLine, tempId: `line-${Date.now()}` })
                      }
                      variant="secondary"
                      className="mb-3"
                    >
                      <Icon name="plus" className="me-1" />
                      Ajouter une ligne
                    </Button>
                  </>
                )}
              </FieldArray>
              <div className="text-end fw-bold mt-3">
                Total Débit: {totalDebit.toFixed(2)} {currencySymbol} | Total
                Crédit: {totalCredit.toFixed(2)} {currencySymbol}
                {!isBalanced && (
                  <div className="text-danger small mt-1">
                    Les totaux ne sont pas équilibrés.
                  </div>
                )}
              </div>
            </FormSection>

            <div className="d-flex justify-content-end mt-4">
              <AppButton type="submit" disabled={isSubmitting}>
                {isEditing ? 'Mettre à jour' : 'Enregistrer'}
              </AppButton>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

JournalEntryForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  chartOfAccounts: PropTypes.array.isRequired,
  submitError: PropTypes.string,
  currencySymbol: PropTypes.string,
};

export default JournalEntryForm;
