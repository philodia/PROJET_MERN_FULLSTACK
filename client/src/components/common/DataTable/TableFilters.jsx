// frontend/src/components/common/DataTable/TableFilters.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Row, Col } from 'react-bootstrap';
import AppButton from '../AppButton'; // Votre composant bouton
import SelectField from '../SelectField'; // Votre composant select amélioré
// import DatePickerField from '../DatePickerField'; // Si vous avez des filtres de date

/**
 * Configuration pour un filtre individuel.
 * @typedef {object} FilterConfig
 * @property {string} id - Identifiant unique du filtre (correspond souvent à la clé de la donnée).
 * @property {string} label - Étiquette du filtre.
 * @property {'text' | 'select' | 'dateRange' | 'numberRange' | 'boolean'} type - Type de filtre.
 * @property {Array<object>} [options] - Options pour les filtres de type 'select' (ex: [{ value: '1', label: 'Option 1' }]).
 * @property {string} [placeholder] - Placeholder pour les champs input.
 * @property {any} [defaultValue] - Valeur par défaut du filtre.
 */

/**
 * Composant pour afficher et gérer une interface de filtres pour un DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<FilterConfig>} props.filterConfigs - Configuration des filtres à afficher.
 * @param {object} props.initialFilterValues - Valeurs initiales des filtres.
 * @param {function} props.onApplyFilters - Callback appelé avec les valeurs des filtres lorsque l'utilisateur les applique.
 * @param {function} props.onResetFilters - Callback appelé pour réinitialiser les filtres.
 * @param {boolean} [props.isApplying=false] - Indique si les filtres sont en cours d'application (pour l'état de chargement du bouton).
 * @param {string} [props.className] - Classes CSS supplémentaires pour le conteneur.
 */
const TableFilters = ({
  filterConfigs,
  initialFilterValues = {},
  onApplyFilters,
  onResetFilters,
  isApplying = false,
  className = '',
}) => {
  const [currentFilters, setCurrentFilters] = useState(initialFilterValues);

  // Synchroniser si les valeurs initiales changent de l'extérieur
  useEffect(() => {
    setCurrentFilters(initialFilterValues);
  }, [initialFilterValues]);

  const handleInputChange = (filterId, value) => {
    setCurrentFilters(prev => ({ ...prev, [filterId]: value }));
  };

  // Pour SelectField et potentiellement DatePickerField qui passent l'objet option ou la valeur directement
  const handleSelectChange = (filterId, selected) => {
    let value;
    if (selected && typeof selected === 'object' && 'value' in selected) {
      value = selected.value; // Pour { value: 'val', label: 'Lab' }
    } else {
      value = selected; // Si c'est déjà la valeur brute
    }
    setCurrentFilters(prev => ({ ...prev, [filterId]: value }));
  };

  const handleApply = (e) => {
    e.preventDefault();
    onApplyFilters(currentFilters);
  };

  const handleReset = () => {
    const defaultValues = {};
    filterConfigs.forEach(config => {
      defaultValues[config.id] = config.defaultValue !== undefined ? config.defaultValue : '';
      if (config.type === 'select' && config.isMulti) {
        defaultValues[config.id] = [];
      }
    });
    setCurrentFilters(defaultValues);
    onResetFilters(defaultValues); // Notifier le parent de réinitialiser et passer les valeurs par défaut
  };

  const renderFilterInput = (config) => {
    const value = currentFilters[config.id] !== undefined ? currentFilters[config.id] : (config.defaultValue !== undefined ? config.defaultValue : '');

    switch (config.type) {
      case 'text':
        return (
          <Form.Control
            type="text"
            placeholder={config.placeholder || `Filtrer par ${config.label.toLowerCase()}`}
            value={value}
            onChange={(e) => handleInputChange(config.id, e.target.value)}
          />
        );
      case 'select':
        return (
          <SelectField // Utilise votre composant SelectField
            name={config.id} // Important pour SelectField s'il est utilisé avec Formik (pas le cas ici directement)
            options={config.options || []}
            value={config.options?.find(opt => opt.value === value) || null } // react-select attend l'objet option complet
            onChange={(selectedOption) => handleSelectChange(config.id, selectedOption)}
            placeholder={config.placeholder || 'Tout sélectionner'}
            isClearable
            // isMulti={config.isMulti || false} // Si vous supportez le multi-select
          />
        );
      case 'dateRange':
        // Supposons un composant DateRangePickerField
        // return (
        //   <DateRangePickerField
        //     value={value || { startDate: null, endDate: null }}
        //     onChange={(range) => handleInputChange(config.id, range)}
        //   />
        // );
        return <Form.Text className="text-muted">Filtre DateRange non implémenté.</Form.Text>;
      case 'numberRange':
        return (
            <Row>
                <Col>
                    <Form.Control
                        type="number"
                        placeholder="Min"
                        value={value?.min || ''}
                        onChange={(e) => handleInputChange(config.id, { ...value, min: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                </Col>
                <Col>
                    <Form.Control
                        type="number"
                        placeholder="Max"
                        value={value?.max || ''}
                        onChange={(e) => handleInputChange(config.id, { ...value, max: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                </Col>
            </Row>
        );
      case 'boolean':
        return (
          <Form.Select
            value={value === undefined ? '' : String(value)} // Gérer undefined pour le placeholder
            onChange={(e) => handleInputChange(config.id, e.target.value === '' ? undefined : e.target.value === 'true')}
          >
            <option value="">{config.placeholder || 'Tout'}</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </Form.Select>
        );
      default:
        return <Form.Text className="text-muted">Type de filtre inconnu.</Form.Text>;
    }
  };

  if (!filterConfigs || filterConfigs.length === 0) {
    return null; // Ne rien rendre si pas de configuration de filtres
  }

  return (
    <Form onSubmit={handleApply} className={`table-filters bg-light p-3 mb-3 border rounded ${className}`}>
      <Row className="g-3">
        {filterConfigs.map(config => (
          <Col key={config.id} xs={12} md={6} lg={config.colSize || 3}> {/* colSize peut être dans FilterConfig */}
            <Form.Group controlId={`filter-${config.id}`}>
              <Form.Label>{config.label}</Form.Label>
              {renderFilterInput(config)}
            </Form.Group>
          </Col>
        ))}
      </Row>
      <Row className="mt-3">
        <Col className="d-flex justify-content-end gap-2">
          <AppButton type="button" variant="outline-secondary" onClick={handleReset} disabled={isApplying}>
            Réinitialiser
          </AppButton>
          <AppButton type="submit" variant="primary" isLoading={isApplying} loadingText="Application...">
            Appliquer les filtres
          </AppButton>
        </Col>
      </Row>
    </Form>
  );
};

TableFilters.propTypes = {
  filterConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['text', 'select', 'dateRange', 'numberRange', 'boolean']).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.any.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
      placeholder: PropTypes.string,
      defaultValue: PropTypes.any,
      colSize: PropTypes.number, // Pour la grille Bootstrap (ex: 3, 4, 6)
      // isMulti: PropTypes.bool, // Pour les selects multiples
    })
  ).isRequired,
  initialFilterValues: PropTypes.object,
  onApplyFilters: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  isApplying: PropTypes.bool,
  className: PropTypes.string,
};

export default TableFilters;