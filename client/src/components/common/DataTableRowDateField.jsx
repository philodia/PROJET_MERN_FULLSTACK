// frontend/src/components/common/DataTableRowDateField.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale'; // Pour la localisation en français

import 'react-datepicker/dist/react-datepicker.css';
// Optionnel: Styles personnalisés pour mieux l'intégrer dans une table
import './DataTableRowDateField.css'; // Nous créerons ce fichier CSS

/**
 * Champ de sélection de date pour une cellule de DataTable.
 * Peut être utilisé pour afficher une date formatée ou permettre la sélection d'une date.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Date|string|number} props.value - La valeur initiale de la date (peut être un objet Date, une chaîne ISO, ou un timestamp).
 * @param {function} [props.onChange] - Fonction callback appelée lorsque la date change. Prend (date, event) en arguments.
 * @param {boolean} [props.isEditable=false] - Si le champ de date est modifiable.
 * @param {string} [props.dateFormatDisplay="dd/MM/yyyy"] - Format d'affichage de la date lorsque non modifiable.
 * @param {string} [props.dateFormatInput="dd/MM/yyyy"] - Format pour le DatePicker lorsqu'il est modifiable.
 * @param {string} [props.placeholderText="Sélectionner une date"] - Placeholder pour le DatePicker.
 * @param {object} [props.datePickerProps] - Props supplémentaires à passer au composant DatePicker.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le wrapper.
 */
const DataTableRowDateField = ({
  value,
  onChange,
  isEditable = false,
  dateFormatDisplay = 'dd/MM/yyyy',
  dateFormatInput = 'dd/MM/yyyy',
  placeholderText = 'Sélectionner une date',
  datePickerProps = {},
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (value) {
      let parsedDate = null;
      if (value instanceof Date && isValid(value)) {
        parsedDate = value;
      } else if (typeof value === 'string') {
        parsedDate = parseISO(value); // Tente de parser une chaîne ISO 8601
      } else if (typeof value === 'number') {
        parsedDate = new Date(value); // Tente de parser un timestamp
      }

      if (parsedDate && isValid(parsedDate)) {
        setSelectedDate(parsedDate);
      } else {
        // console.warn(`DataTableRowDateField: Invalid date value received: ${value}`);
        setSelectedDate(null); // Ou gérer l'erreur autrement
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateChange = (date, event) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date, event); // Passer la date sélectionnée au parent
    }
  };

  if (!isEditable) {
    return (
      <span className={`data-table-row-date-display ${className}`}>
        {selectedDate ? format(selectedDate, dateFormatDisplay, { locale: fr }) : 'N/A'}
      </span>
    );
  }

  return (
    <div className={`data-table-row-date-field ${className}`}>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat={dateFormatInput}
        placeholderText={placeholderText}
        className="form-control form-control-sm" // Classes Bootstrap pour un style de base
        locale={fr} // Localisation en français
        autoComplete="off"
        {...datePickerProps}
        // Exemples de props utiles pour datePickerProps:
        // showMonthDropdown
        // showYearDropdown
        // dropdownMode="select"
        // minDate={new Date()}
        // maxDate={addMonths(new Date(), 5)}
        // filterDate={date => getDay(date) !== 0 && getDay(date) !== 6} // Désactiver les weekends
        // isClearable // Afficher un bouton pour effacer la date
      />
    </div>
  );
};

DataTableRowDateField.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number,
  ]),
  onChange: PropTypes.func,
  isEditable: PropTypes.bool,
  dateFormatDisplay: PropTypes.string,
  dateFormatInput: PropTypes.string,
  placeholderText: PropTypes.string,
  datePickerProps: PropTypes.object,
  className: PropTypes.string,
};

export default DataTableRowDateField;