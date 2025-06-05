// frontend/src/components/users/RoleSelector.jsx
import React from 'react';
import PropTypes from 'prop-types';
import SelectField from '../common/SelectField'; // Votre composant SelectField
import { Form as BootstrapForm } from 'react-bootstrap'; // Pour le Form.Label si besoin
import { ErrorMessage } from 'formik'; // Si utilisé avec Formik et que SelectField ne gère pas l'erreur

/**
 * Composant pour sélectionner un rôle utilisateur.
 * Conçu pour être utilisé avec Formik (en passant les props `field` et `form`)
 * ou de manière autonome.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.field] - Objet field de Formik (contient name, value, onChange, onBlur).
 * @param {object} [props.form] - Objet form de Formik (contient errors, touched, setFieldValue).
 * @param {string} [props.name] - Nom du champ (requis si `field` n'est pas fourni).
 * @param {string} [props.value] - Valeur actuelle (requise si `field` n'est pas fourni).
 * @param {function} [props.onChange] - Callback de changement (requis si `field` n'est pas fourni).
 * @param {string} [props.label='Rôle'] - Étiquette du champ.
 * @param {Array<string>} [props.availableRoles=['ADMIN', 'MANAGER', 'ACCOUNTANT']] - Liste des rôles disponibles.
 * @param {string} [props.placeholder='Sélectionner un rôle...'] - Placeholder du sélecteur.
 * @param {boolean} [props.isDisabled=false] - Si le sélecteur doit être désactivé.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le Form.Group.
 * @param {boolean} [props.isRequired=true] - Si le champ est requis (pour l'astérisque sur le label).
 */
const RoleSelector = ({
  field,
  form,
  name: propsName,
  value: propsValue,
  onChange: propsOnChange,
  label = 'Rôle',
  availableRoles = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'], // Ajout de 'USER' pour plus de flexibilité
  placeholder = 'Sélectionner un rôle...',
  isDisabled = false,
  className = '',
  isRequired = true, // Par défaut, on considère que le rôle est souvent requis
  ...otherProps // Pour d'autres props de SelectField
}) => {
  const name = field ? field.name : propsName;
  const value = field ? field.value : propsValue;

  const roleOptions = availableRoles.map(role => ({
    value: role,
    // Formatter le label pour un affichage plus convivial
    label: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase().replace('_', ' '),
  }));

  const handleChange = (selectedOption) => {
    const newValue = selectedOption ? selectedOption.value : '';
    if (form && field) {
      form.setFieldValue(name, newValue);
    } else if (propsOnChange) {
      propsOnChange(name, newValue); // Passer le nom et la nouvelle valeur
    }
  };

  const handleBlur = () => {
    if (form && field) {
      form.setFieldTouched(name, true);
    }
  };

  const selectedOptionObject = roleOptions.find(opt => opt.value === value) || null;

  const isInvalid = form && field && form.touched[name] && !!form.errors[name];

  return (
    <BootstrapForm.Group className={`mb-3 ${className}`} controlId={name}>
      {label && (
        <BootstrapForm.Label>
          {label}
          {isRequired && <span className="text-danger">*</span>}
        </BootstrapForm.Label>
      )}
      <SelectField
        // Si field et form sont passés, SelectField devrait les gérer.
        // Sinon, on passe les props manuellement.
        {...(field && form ? { field, form } : {})} // Si SelectField prend field/form directement
        name={name} // Toujours passer le nom
        options={roleOptions}
        value={selectedOptionObject} // SelectField attend l'objet option complet
        onChange={handleChange} // Notre handler pour Formik ou propsOnChange
        onBlur={field ? handleBlur : undefined} // Notre handler pour Formik
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={!isRequired} // Permettre d'effacer seulement si non requis ou si un placeholder "aucun rôle" est une option valide
        isInvalid={isInvalid} // Passer l'état d'invalidité si SelectField le gère
        {...otherProps}
      />
      {/* Afficher l'erreur si Formik est utilisé et que SelectField ne le fait pas déjà en interne */}
      {field && form && isInvalid && (
        <ErrorMessage name={name} component="div" className="invalid-feedback d-block" />
      )}
    </BootstrapForm.Group>
  );
};

RoleSelector.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.string,
  availableRoles: PropTypes.arrayOf(PropTypes.string),
  placeholder: PropTypes.string,
  isDisabled: PropTypes.bool,
  className: PropTypes.string,
  isRequired: PropTypes.bool,
};

export default RoleSelector;