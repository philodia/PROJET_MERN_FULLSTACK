// frontend/src/components/common/SelectField.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Select, { components as reactSelectComponents } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Form } from 'react-bootstrap'; // Pour Label et messages d'erreur

/**
 * Composant de champ de sélection amélioré utilisant react-select.
 * S'intègre avec Formik en passant les props `field` et `form`.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.field] - Objet field de Formik (contient name, value, onChange, onBlur).
 * @param {object} [props.form] - Objet form de Formik (contient errors, touched, setFieldValue, setFieldTouched).
 * @param {Array<object>} props.options - Tableau d'options pour le select (ex: [{ value: '1', label: 'Option 1' }]).
 * @param {string} [props.label] - Étiquette à afficher au-dessus du champ.
 * @param {string} [props.placeholder='Sélectionner...'] - Texte indicatif.
 * @param {boolean} [props.isMulti=false] - Permet la sélection multiple.
 * @param {boolean} [props.isClearable=true] - Permet d'effacer la sélection.
 * @param {boolean} [props.isSearchable=true] - Permet la recherche dans les options.
 * @param {boolean} [props.isDisabled=false] - Désactive le champ.
 * @param {boolean} [props.isLoading=false] - Affiche un indicateur de chargement.
 * @param {boolean} [props.isCreatable=false] - Permet la création de nouvelles options (utilise CreatableSelect).
 * @param {function} [props.onChange] - Callback personnalisé pour le changement de valeur (en plus de Formik).
 * @param {function} [props.onCreateOption] - Callback pour la création d'une nouvelle option (si isCreatable).
 * @param {string} [props.className] - Classes CSS pour le conteneur du label et du select.
 * @param {object} [props.styles] - Styles personnalisés pour react-select.
 * @param {object} [props.components] - Composants personnalisés pour react-select.
 */
const SelectField = ({
  field, // { name, value, onChange, onBlur } from Formik
  form,  // { touched, errors, setFieldValue, setFieldTouched } from Formik
  options,
  label,
  placeholder = 'Sélectionner...',
  isMulti = false,
  isClearable = true,
  isSearchable = true,
  isDisabled = false,
  isLoading = false,
  isCreatable = false,
  onChange: customOnChange, // Pour un onChange supplémentaire en dehors de Formik
  onCreateOption: customOnCreateOption,
  className = '',
  styles: customStyles = {},
  components: customComponents = {},
  ...otherProps // Autres props pour react-select
}) => {
  const name = field ? field.name : otherProps.name; // S'assurer qu'on a un 'name'
  const value = field ? field.value : otherProps.value;

  const handleChange = (selectedOption) => {
    let newValue;
    if (isMulti) {
      newValue = selectedOption ? selectedOption.map(option => option.value) : [];
    } else {
      newValue = selectedOption ? selectedOption.value : '';
    }

    if (form && field) {
      form.setFieldValue(name, newValue);
    }
    if (customOnChange) {
      customOnChange(selectedOption); // Passer l'option complète ou la valeur, selon le besoin
    }
  };

  const handleBlur = () => {
    if (form && field) {
      form.setFieldTouched(name, true);
    }
    // customOnBlur peut être ajouté si nécessaire
  };

  const handleCreateOption = (inputValue) => {
    if (customOnCreateOption) {
      customOnCreateOption(inputValue);
      // La logique pour ajouter la nouvelle option à `options` ou la gérer
      // doit être implémentée dans le composant parent ou via `customOnCreateOption`.
      // Par exemple, appeler une API, puis mettre à jour l'état qui fournit `options`.
    } else {
      // Comportement par défaut simple si pas de customOnCreateOption :
      // Crée une nouvelle option et la sélectionne (si Formik est utilisé)
      const newOption = { value: inputValue.toLowerCase().replace(/\W/g, ''), label: inputValue };
      // Ici, il faudrait une manière de persister cette option si nécessaire
      // ou au moins de l'ajouter à la liste des options pour qu'elle soit sélectionnable.
      // Pour cet exemple, on va juste la passer à handleChange si Formik est là.
      if (form && field) {
        if (isMulti) {
          const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
          const currentOptions = options.filter(opt => currentValues.includes(opt.value));
          handleChange([...currentOptions, newOption].map(opt => ({value: opt.value, label: opt.label})));
        } else {
          handleChange(newOption);
        }
      }
      console.warn(`SelectField: handleCreateOption called for "${inputValue}" but no customOnCreateOption prop was provided to handle persistence.`);
    }
  };

  // Trouver la/les option(s) sélectionnée(s) à partir de la/des valeur(s)
  let selectedValue;
  if (isMulti) {
    selectedValue = options.filter(option => Array.isArray(value) && value.includes(option.value));
  } else {
    selectedValue = options.find(option => option.value === value) || null;
  }

  // Styles par défaut pour une meilleure intégration avec Bootstrap (optionnel)
  const defaultStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: form && field && form.touched[name] && form.errors[name] ? '#dc3545' : base.borderColor, // Erreur Bootstrap
      boxShadow: form && field && form.touched[name] && form.errors[name] ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)' : state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : base.boxShadow, // Focus/Erreur Bootstrap
      '&:hover': {
        borderColor: form && field && form.touched[name] && form.errors[name] ? '#dc3545' : base.borderColor,
      },
    }),
    // Vous pouvez ajouter d'autres personnalisations de style ici
    // menu: provided => ({ ...provided, zIndex: 9999 }), // Si problèmes de z-index avec modales etc.
  };

  const SelectComponent = isCreatable ? CreatableSelect : Select;

  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      {label && <Form.Label>{label}</Form.Label>}
      <SelectComponent
        {...(field || {})} // Passer les props de field (name, onBlur - onChange est géré)
        name={name} // S'assurer que name est toujours là
        options={options}
        value={selectedValue}
        onChange={handleChange}
        onBlur={handleBlur} // Utiliser notre handleBlur pour Formik
        placeholder={placeholder}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onCreateOption={isCreatable ? handleCreateOption : undefined}
        styles={{ ...defaultStyles, ...customStyles }} // Fusionner les styles
        components={customComponents}
        noOptionsMessage={() => 'Aucune option'}
        loadingMessage={() => 'Chargement...'}
        formatCreateLabel={inputValue => `Créer "${inputValue}"`}
        {...otherProps}
      />
      {form && field && form.touched[name] && form.errors[name] && (
        <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
          {form.errors[name]}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

SelectField.propTypes = {
  field: PropTypes.object, // Formik field
  form: PropTypes.object,  // Formik form
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
      // Vous pouvez ajouter d'autres propriétés si vos options sont plus complexes (ex: isDisabled, color)
    })
  ).isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  isMulti: PropTypes.bool,
  isClearable: PropTypes.bool,
  isSearchable: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  isCreatable: PropTypes.bool,
  onChange: PropTypes.func,
  onCreateOption: PropTypes.func,
  className: PropTypes.string,
  styles: PropTypes.object,
  components: PropTypes.object,
  name: PropTypes.string, // Requis si field n'est pas fourni
  value: PropTypes.any,   // Requis si field n'est pas fourni
};

export default SelectField;