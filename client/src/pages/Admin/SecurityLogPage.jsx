import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSecurityLogs,
  selectAllSecurityLogs,
  selectSecurityLogStatus,
  selectSecurityLogError,
  selectSecurityLogPagination,
  clearSecurityLogError,
} from '../../features/securityLogs/securityLogSlice';

import DataTable from '../../components/common/DataTable/DataTable';
import TablePagination from '../../components/common/DataTable/TablePagination';
//import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import PageContainer from '../../components/layout/PageContainer';
import { Form, Row, Col, Card, Image } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Icon from '../../components/common/Icon';
import AppButton from '../../components/common/AppButton';
import defaultAvatar from '../../assets/images/default-avatar.png';

const SecurityLogPage = () => {
  const dispatch = useDispatch();
  const logs = useSelector(selectAllSecurityLogs);
  const status = useSelector(selectSecurityLogStatus);
  const error = useSelector(selectSecurityLogError);
  const pagination = useSelector(selectSecurityLogPagination);

  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 25,
    sort: '-timestamp',
    action: '',
    username: '', // Simplifié pour correspondre à l'API
    ipAddress: '',
  });

  const [localFilters, setLocalFilters] = useState({
    action: '',
    username: '',
    ipAddress: '',
  });

  const fetchData = useCallback(() => {
    const activeFilters = Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );
    dispatch(fetchSecurityLogs(activeFilters));
  }, [dispatch, queryParams]);

  useEffect(() => {
    fetchData();
    return () => {
      dispatch(clearSecurityLogError());
    };
  }, [dispatch, fetchData]);

  const handlePageChange = (newPage) => {
    setQueryParams(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setQueryParams(prev => ({
      ...prev,
      ...localFilters,
      page: 1,
    }));
  };

  const resetFilters = () => {
    const defaultFilters = { action: '', username: '', ipAddress: '' };
    setLocalFilters(defaultFilters);
    setQueryParams(prev => ({
      ...prev,
      ...defaultFilters,
      page: 1,
    }));
  };

  const columns = useMemo(() => [
    {
      Header: 'Date & Heure',
      accessor: 'timestamp',
      sortable: true,
      Cell: ({ value }) => value ? format(new Date(value), 'dd/MM/yyyy HH:mm:ss', { locale: fr }) : '-',
      width: 180,
    },
    {
      Header: 'Action',
      accessor: 'action',
      sortable: true,
      Cell: ({ value }) => (
        <span className="badge bg-primary">
          {value}
        </span>
      ),
    },
    {
      Header: 'Utilisateur',
      accessor: 'user',
      Cell: ({ value }) => (
        <div className="d-flex align-items-center">
          <Image 
            src={value?.avatarUrl || defaultAvatar} 
            roundedCircle 
            width="30" 
            height="30" 
            className="me-2" 
            alt={`Avatar de ${value?.username || 'utilisateur'}`}
          />
          <span>{value?.username || 'Système/Anonyme'}</span>
        </div>
      ),
    },
    {
      Header: 'Adresse IP',
      accessor: 'ipAddress',
      Cell: ({ value }) => <code>{value}</code>,
    },
    {
      Header: 'Détails',
      accessor: 'details',
      minWidth: 250,
      Cell: ({ value }) => {
        if (!value) return '-';
        const displayValue = typeof value === 'object' 
          ? JSON.stringify(value, null, 2) 
          : String(value);
        
        return (
          <div className="text-truncate" title={displayValue}>
            {displayValue}
          </div>
        );
      },
    },
  ], []);

  const isLoading = status === 'loading';

  return (
    <PageContainer
      title="Journaux de Sécurité"
      breadcrumbs={[
        { label: 'Admin', path: '/admin/dashboard' },
        { label: 'Journaux de Sécurité', isActive: true },
      ]}
      fluid
    >
      {error && (
        <AlertMessage variant="danger" onClose={() => dispatch(clearSecurityLogError())} dismissible>
          {error.message || "Erreur lors du chargement des journaux"}
        </AlertMessage>
      )}

      {/* Filtres */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Form>
            <Row className="g-3 align-items-end">
              <Col md={6} lg={3}>
                <Form.Group controlId="actionFilter">
                  <Form.Label>Action</Form.Label>
                  <Form.Control
                    type="text"
                    name="action"
                    value={localFilters.action}
                    onChange={handleFilterChange}
                    placeholder="Ex: LOGIN_SUCCESS"
                  />
                </Form.Group>
              </Col>
              <Col md={6} lg={3}>
                <Form.Group controlId="usernameFilter">
                  <Form.Label>Nom d'utilisateur</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={localFilters.username}
                    onChange={handleFilterChange}
                    placeholder="Rechercher par nom"
                  />
                </Form.Group>
              </Col>
              <Col md={6} lg={3}>
                <Form.Group controlId="ipFilter">
                  <Form.Label>Adresse IP</Form.Label>
                  <Form.Control
                    type="text"
                    name="ipAddress"
                    value={localFilters.ipAddress}
                    onChange={handleFilterChange}
                    placeholder="Ex: 192.168.1.1"
                  />
                </Form.Group>
              </Col>
              <Col md={6} lg={3} className="d-flex gap-2">
                <AppButton 
                  variant="primary" 
                  onClick={applyFilters} 
                  disabled={isLoading}
                >
                  <Icon name="BsSearch" className="me-1" />
                  Filtrer
                </AppButton>
                <AppButton 
                  variant="outline-secondary" 
                  onClick={resetFilters} 
                  disabled={isLoading}
                >
                  <Icon name="BsArrowClockwise" className="me-1" />
                  Réinitialiser
                </AppButton>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Tableau des journaux */}
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Card.Title as="h5" className="mb-0">
            Événements de sécurité
            {pagination?.totalItems !== undefined && (
              <span className="text-muted fs-6 ms-2">
                ({pagination.totalItems} résultat{pagination.totalItems !== 1 ? 's' : ''})
              </span>
            )}
          </Card.Title>
        </Card.Header>
        
        <Card.Body className="p-0">
          <DataTable
            columns={columns}
            data={logs}
            isLoading={isLoading}
            emptyMessage="Aucun événement de sécurité trouvé"
          />
        </Card.Body>
        
        {pagination && pagination.totalPages > 1 && (
          <Card.Footer className="d-flex justify-content-center">
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
            />
          </Card.Footer>
        )}
      </Card>
    </PageContainer>
  );
};

export default SecurityLogPage;