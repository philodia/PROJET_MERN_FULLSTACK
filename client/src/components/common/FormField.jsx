// frontend/src/components/common/FormField.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Field, ErrorMessage } from 'formik';
import Form from 'react-bootstrap/Form'; // Pour utiliser Form.Control, Form.Label, Form.Text

/**
 * Composant de champ de formulaire générique pour une utilisation avec Formik.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.name - Le nom du champ (doit correspondre à une clé dans `initialValues` de Formik).
 * @param {string} props.label - Le label à afficher pour le champ.
 * @param {string} [props.type='text'] - Le type de l'input HTML (text, email, password, number, etc.).
 * @param {string} [props.as='input'] - Le type de composant à rendre ('input', 'textarea', 'select').
 *                                    Si 'select', `options` doit être fourni.
 * @param {string} [props.placeholder] - Le placeholder pour le champ.
 * @param {boolean} [props.required=false] - Si le champ est requis (ajoute un indicateur visuel au label).
 * @param {string} [props.classNameContainer='mb-3'] - Classes CSS pour le conteneur Form.Group.
 * @param {string} [props.controlClassName=''] - Classes CSS pour le Form.Control (input/textarea/select).
 * @param {string} [props.labelClassName=''] - Classes CSS pour le Form.Label.
 * @param {React.ReactNode} [props.helpText] - Texte d'aide à afficher sous le champ.
 * @param {Array<object>} [props.options] - Tableau d'options pour un champ `select`. Chaque objet doit avoir `value` et `label`.
 *                                         Ex: [{ value: 'option1', label: 'Option 1' }]
 * @param {object} [props.fieldProps] - Props supplémentaires à passer au composant <Field /> de Formik.
 * @param {boolean} [props.disabled=false] - Si le champ doit être désactivé.
 * @param {React.ReactNode} [props.prepend] - Contenu à afficher avant le champ (InputGroup.Text).
 * @param {React.ReactNode} [props.append] - Contenu à afficher après le champ (InputGroup.Text).
 */
const FormField = ({
  name,
  label,
  type = 'text',
  as = 'input', // 'input', 'textarea', 'select'
  placeholder,
  required = false,
  classNameContainer = 'mb-3',
  controlClassName = '',
  labelClassName = '',
  helpText,
  options = [], // Pour as='select'
  fieldProps = {},
  disabled = false,
  prepend,
  append,
  ...otherInputProps // Autres props HTML natives pour l'input/textarea/select
}) => {
  return (
    <Form.Group controlId={name} className={classNameContainer}>
      {label && (
        <Form.Label className={labelClassName}>
          {label}
          {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}

      <Field name={name} {...fieldProps}>
        {({ field, form, meta }) => {
          const isInvalid = meta.touched && meta.error;
          const isValid = meta.touched && !meta.error && meta.value; // Optionnel: pour le feedback de validité

          const renderField = () => {
            if (as === 'select') {
              return (
                <Form.Select
                  {...field}
                  type={type} // type n'est pas vraiment utilisé pour select mais gardé pour la structure
                  placeholder={placeholder} // placeholder sur select ne fonctionne pas toujours comme attendu sans une option vide
                  className={`${controlClassName} ${isInvalid ? 'is-invalid' : ''} ${isValid && as !== 'checkbox' ? 'is-valid' : ''}`}
                  disabled={disabled || form.isSubmitting}
                  {...otherInputProps}
                >
                  {placeholder && <option value="">{placeholder}</option>}
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              );
            }
            // Pour input, textarea, etc.
            return (
              <Form.Control
                {...field}
                as={as} // Permet d'utiliser <Field as="textarea" />
                type={as !== 'textarea' ? type : undefined} // type n'est pas valide pour textarea
                placeholder={placeholder}
                className={`${controlClassName} ${isInvalid ? 'is-invalid' : ''} ${isValid && as !== 'checkbox' ? 'is-valid' : ''}`}
                isInvalid={!!isInvalid} // Prop spécifique de React-Bootstrap pour le style d'erreur
                // isValid={!!isValid} // Prop spécifique pour le style de succès
                disabled={disabled || form.isSubmitting}
                {...otherInputProps}
              />
            );
          };

          // Gérer InputGroup si prepend ou append est fourni
          if (prepend || append) {
            return (
              <div className="input-group"> {/* Utiliser la classe input-group de Bootstrap */}
                {prepend && <span className="input-group-text">{prepend}</span>}
                {renderField()}
                {append && <span className="input-group-text">{append}</span>}
                <ErrorMessage name={name} component={Form.Control.Feedback} type="invalid" />
              </div>
            );
          }

          return (
            <>
              {renderField()}
              <ErrorMessage name={name} component={Form.Control.Feedback} type="invalid" />
              {helpText && !isInvalid && <Form.Text muted>{helpText}</Form.Text>}
            </>
          );
        }}
      </Field>
    </Form.Group>
  );
};

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string, // Rendu optionnel si on ne veut pas de label
  type: PropTypes.string,
  as: PropTypes.oneOf(['input', 'textarea', 'select']),
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  classNameContainer: PropTypes.string,
  controlClassName: PropTypes.string,
  labelClassName: PropTypes.string,
  helpText: PropTypes.node,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  fieldProps: PropTypes.object,
  disabled: PropTypes.bool,
  prepend: PropTypes.node,
  append: PropTypes.node,
};

export default FormField;