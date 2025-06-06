// frontend/src/components/securityLogs/SecurityLogFilter.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Row, Col, Button } from 'react-bootstrap';
import SelectField from '../common/SelectField';
import AppButton from '../common/AppButton';
// import DatePickerField from '../common/DatePickerField'; // Si vous avez un composant personnalisé

/**
 * Formulaire de filtre pour les journaux de sécurité.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {function} props.onApplyFilters - Callback appelé avec les valeurs des filtres.
 * @param {function} props.onResetFilters - Callback pour réinitialiser les filtres.
 * @param {object} [props.initialFilterValues={}] - Valeurs initiales des filtres.
 * @param {Array<object>} [props.userOptions=[]] - Options pour le filtre utilisateur [{value: 'userId', label: 'username'}].
 * @param {Array<object>} [props.actionTypeOptions=[]] - Options pour le filtre type d'action [{value: 'ACTION_TYPE', label: 'Description Action'}].
 * @param {boolean} [props.isFiltering=false] - Indique si le filtrage est en cours.
 */
const SecurityLogFilter = ({
  onApplyFilters,
  onResetFilters,
  initialFilterValues = {},
  userOptions = [],
  actionTypeOptions = [],
  isFiltering = false,
}) => {
  const defaultFilters = {
    startDate: '',
    endDate: '',
    userId: '',
    actionType: '',
    ipAddress: '',
    // searchTerm: '', // Si vous avez une recherche textuelle globale
  };

  const [filters, setFilters] = useState({ ...defaultFilters, ...initialFilterValues });

  useEffect(() => {
    // Synchroniser si les initialFilterValues changent de l'extérieur (ex: filtres persistés)
    setFilters(prev => ({ ...prev, ...initialFilterValues }));
  }, [initialFilterValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setFilters(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    onResetFilters(defaultFilters); // Notifier le parent de réinitialiser et passer les valeurs par défaut
  };

  return (
    <Form onSubmit={handleSubmit} className="security-log-filter bg-light p-3 mb-4 border rounded">
      <Row className="g-3 align-items-end">
        <Col md={6} lg={3}>
          <Form.Group controlId="filterStartDate">
            <Form.Label>Date de Début</Form.Label>
            {/* <DatePickerField name="startDate" value={filters.startDate} onChange={(date) => setFilters(prev => ({...prev, startDate: date}))} /> */}
            <Form.Control
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col md={6} lg={3}>
          <Form.Group controlId="filterEndDate">
            <Form.Label>Date de Fin</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              min={filters.startDate || undefined} // Empêcher endDate < startDate
            />
          </Form.Group>
        </Col>

        {userOptions.length > 0 && (
            <Col md={6} lg={3}>
            <Form.Group controlId="filterUserId">
                <Form.Label>Utilisateur</Form.Label>
                <SelectField
                name="userId"
                options={userOptions}
                value={userOptions.find(opt => opt.value === filters.userId) || null}
                onChange={(selected) => handleSelectChange('userId', selected)}
                placeholder="Tous les utilisateurs"
                isClearable
                />
            </Form.Group>
            </Col>
        )}

        {actionTypeOptions.length > 0 && (
            <Col md={6} lg={3}>
            <Form.Group controlId="filterActionType">
                <Form.Label>Type d'Action</Form.Label>
                <SelectField
                name="actionType"
                options={actionTypeOptions}
                value={actionTypeOptions.find(opt => opt.value === filters.actionType) || null}
                onChange={(selected) => handleSelectChange('actionType', selected)}
                placeholder="Tous les types"
                isClearable
                />
            </Form.Group>
            </Col>
        )}

        <Col md={6} lg={3}>
            <Form.Group controlId="filterIpAddress">
                <Form.Label>Adresse IP</Form.Label>
                <Form.Control
                    type="text"
                    name="ipAddress"
                    value={filters.ipAddress}
                    onChange={handleChange}
                    placeholder="Ex: 192.168.1.X"
                />
            </Form.Group>
        </Col>

        {/* <Col md={6} lg={3}>
            <Form.Group controlId="filterSearchTerm">
                <Form.Label>Recherche (Détails)</Form.Label>
                <Form.Control
                    type="text"
                    name="searchTerm"
                    value={filters.searchTerm}
                    onChange={handleChange}
                    placeholder="Mot-clé dans les détails..."
                />
            </Form.Group>
        </Col> */}

        <Col xs={12} lg="auto" className="d-flex gap-2">
          <AppButton type="submit" variant="primary" isLoading={isFiltering} className="w-100 w-lg-auto">
            Filtrer
          </AppButton>
          <Button type="button" variant="outline-secondary" onClick={handleReset} disabled={isFiltering} className="w-100 w-lg-auto">
            Réinitialiser
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

SecurityLogFilter.propTypes = {
  onApplyFilters: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  initialFilterValues: PropTypes.object,
  userOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
  actionTypeOptions: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
  isFiltering: PropTypes.bool,
};

export default SecurityLogFilter;