// frontend/src/components/common/SelectField.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Form } from 'react-bootstrap';

const SelectField = ({
  field,
  form,
  options,
  label,
  placeholder = 'Sélectionner...',
  isMulti = false,
  isClearable = true,
  isSearchable = true,
  isDisabled = false,
  isLoading = false,
  isCreatable = false,
  onChange: customOnChange,
  onCreateOption: customOnCreateOption,
  className = '',
  styles: customStyles = {},
  components: customComponents = {},
  name: propsName,
  value: propsValue,
  ...otherProps
}) => {
  const name = field?.name || propsName;
  const currentValue = field?.value ?? propsValue;

  // Gérer le changement de valeur
  const handleChange = (selected) => {
    const newValue = isMulti
      ? selected?.map(option => option.value) || []
      : selected?.value || null;

    if (form && field) {
      form.setFieldValue(name, newValue);
    }

    if (customOnChange) {
      customOnChange(selected, name);
    }
  };

  const handleBlur = () => {
    if (form && field) {
      form.setFieldTouched(name, true);
    }
  };

  const handleCreateOptionInternal = (inputValue) => {
    if (customOnCreateOption) {
      customOnCreateOption(inputValue, name);
    } else {
      const newOption = {
        value: inputValue.toLowerCase().replace(/\W/g, ''),
        label: inputValue,
      };

      if (form && field) {
        const current = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
        const updated = isMulti ? [...current, newOption.value] : newOption.value;
        form.setFieldValue(name, updated);
      }

      console.warn(
        `SelectField (${name}): 'customOnCreateOption' non défini. La nouvelle option "${inputValue}" ne sera pas ajoutée à la liste sans gestion par le parent.`
      );
    }
  };

  // Conversion des valeurs en options pour react-select
  const selectedValue = isMulti
    ? options.filter(opt => Array.isArray(currentValue) && currentValue.includes(opt.value))
    : options.find(opt => opt.value === currentValue) || null;

  const hasError = Boolean(form?.touched?.[name] && form?.errors?.[name]);

  // Styles par défaut
  const defaultStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDisabled ? '#e9ecef' : base.backgroundColor,
      borderColor: hasError ? '#dc3545' : state.isFocused ? '#86b7fe' : base.borderColor,
      boxShadow: hasError
        ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)'
        : state.isFocused
        ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)'
        : base.boxShadow,
      '&:hover': {
        borderColor: hasError ? '#dc3545' : '#adb5bd',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: otherProps.menuZIndex || 999,
    }),
  };

  const SelectComponent = isCreatable ? CreatableSelect : Select;

  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      {label && <Form.Label>{label}</Form.Label>}
      <SelectComponent
        name={name}
        options={options}
        value={selectedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onCreateOption={isCreatable ? handleCreateOptionInternal : undefined}
        styles={{ ...defaultStyles, ...customStyles }}
        components={customComponents}
        noOptionsMessage={() => 'Aucune option'}
        loadingMessage={() => 'Chargement...'}
        formatCreateLabel={(inputValue) => `Créer « ${inputValue} »`}
        menuPlacement={otherProps.menuPlacement || 'auto'}
        {...otherProps}
      />
      {hasError && (
        <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
          {form.errors[name]}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

SelectField.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
      isDisabled: PropTypes.bool,
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
  name: PropTypes.string,
  value: PropTypes.any,
  menuZIndex: PropTypes.number,
  menuPlacement: PropTypes.oneOf(['auto', 'bottom', 'top']),
};

export default SelectField;
