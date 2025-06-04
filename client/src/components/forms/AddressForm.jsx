import React from 'react';
import PropTypes from 'prop-types';
import { Field, ErrorMessage } from 'formik';
import { Row, Col, Form as BootstrapForm } from 'react-bootstrap';
import * as Yup from 'yup';

/**
 * Sous-formulaire réutilisable pour la saisie d'une adresse.
 */
const AddressForm = ({
  addressFieldNamePrefix,
  errors,
  touched,
  disabled = false,
  title = 'Adresse',
  hideTitle = false,
  className = '',
}) => {
  const fieldName = (name) => `${addressFieldNamePrefix}.${name}`;

  const hasError = (name) =>
    touched?.[addressFieldNamePrefix]?.[name] &&
    errors?.[addressFieldNamePrefix]?.[name];

  return (
    <div className={`address-form-section ${className}`}>
      {!hideTitle && title && <h5 className="mb-3">{title}</h5>}

      <Row className="mb-3">
        <BootstrapForm.Group as={Col} md="12" controlId={fieldName('street')}>
          <BootstrapForm.Label htmlFor={fieldName('street')}>Rue et numéro</BootstrapForm.Label>
          <Field
            name={fieldName('street')}
            type="text"
            as={BootstrapForm.Control}
            isInvalid={hasError('street')}
            disabled={disabled}
            placeholder="Ex: 123 Rue Principale"
          />
          <ErrorMessage name={fieldName('street')} component="div" className="invalid-feedback" />
        </BootstrapForm.Group>
      </Row>

      <Row className="mb-3">
        <BootstrapForm.Group as={Col} md="4" controlId={fieldName('zipCode')}>
          <BootstrapForm.Label htmlFor={fieldName('zipCode')}>Code Postal</BootstrapForm.Label>
          <Field
            name={fieldName('zipCode')}
            type="text"
            as={BootstrapForm.Control}
            isInvalid={hasError('zipCode')}
            disabled={disabled}
            placeholder="Ex: 75001"
          />
          <ErrorMessage name={fieldName('zipCode')} component="div" className="invalid-feedback" />
        </BootstrapForm.Group>

        <BootstrapForm.Group as={Col} md="8" controlId={fieldName('city')}>
          <BootstrapForm.Label htmlFor={fieldName('city')}>Ville</BootstrapForm.Label>
          <Field
            name={fieldName('city')}
            type="text"
            as={BootstrapForm.Control}
            isInvalid={hasError('city')}
            disabled={disabled}
            placeholder="Ex: Paris"
          />
          <ErrorMessage name={fieldName('city')} component="div" className="invalid-feedback" />
        </BootstrapForm.Group>
      </Row>

      <Row className="mb-3">
        <BootstrapForm.Group as={Col} md="6" controlId={fieldName('state')}>
          <BootstrapForm.Label htmlFor={fieldName('state')}>État / Région (Optionnel)</BootstrapForm.Label>
          <Field
            name={fieldName('state')}
            type="text"
            as={BootstrapForm.Control}
            isInvalid={hasError('state')}
            disabled={disabled}
            placeholder="Ex: Île-de-France"
          />
          <ErrorMessage name={fieldName('state')} component="div" className="invalid-feedback" />
        </BootstrapForm.Group>

        <BootstrapForm.Group as={Col} md="6" controlId={fieldName('country')}>
          <BootstrapForm.Label htmlFor={fieldName('country')}>Pays</BootstrapForm.Label>
          <Field
            name={fieldName('country')}
            type="text"
            as={BootstrapForm.Control}
            isInvalid={hasError('country')}
            disabled={disabled}
            placeholder="Ex: France"
          />
          <ErrorMessage name={fieldName('country')} component="div" className="invalid-feedback" />
        </BootstrapForm.Group>
      </Row>
    </div>
  );
};

AddressForm.propTypes = {
  addressFieldNamePrefix: PropTypes.string.isRequired,
  errors: PropTypes.object.isRequired,
  touched: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  title: PropTypes.string,
  hideTitle: PropTypes.bool,
  className: PropTypes.string,
};

export const addressValidationSchema = (requiredMessage = 'Champ requis') => {
  return Yup.object().shape({
    street: Yup.string().required(requiredMessage).max(100, 'Maximum 100 caractères'),
    city: Yup.string().required(requiredMessage).max(50, 'Maximum 50 caractères'),
    zipCode: Yup.string()
      .required(requiredMessage)
      .matches(/^[0-9A-Za-z\s-]{3,10}$/, 'Code postal invalide')
      .max(10, 'Maximum 10 caractères'),
    state: Yup.string().max(50, 'Maximum 50 caractères'),
    country: Yup.string().required(requiredMessage).max(50, 'Maximum 50 caractères'),
  });
};

export default AddressForm;
