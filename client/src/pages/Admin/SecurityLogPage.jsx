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
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import PageHeader from '../../components/common/PageHeader';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    username: '',
    ipAddress: '',
  });

  const [localFilters, setLocalFilters] = useState({
    action: '',
    username: '',
    ipAddress: '',
  });

  const fetchData = useCallback(() => {
    const activeFilters = {};
    for (const key in queryParams) {
      if (queryParams[key]) {
        activeFilters[key] = queryParams[key];
      }
    }
    dispatch(fetchSecurityLogs(activeFilters));
  }, [dispatch, queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (status === 'idle' && error) {
      dispatch(clearSecurityLogError());
    }
  }, [status, error, dispatch]);

  const handlePageChange = (newPage) => {
    setQueryParams(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyLocalFilters = () => {
    setQueryParams(prev => ({
      ...prev,
      ...localFilters,
      page: 1,
    }));
  };

  const resetLocalFilters = () => {
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
      Cell: ({ value }) => format(new Date(value), 'dd/MM/yyyy HH:mm:ss', { locale: fr }),
      width: 180,
    },
    {
      Header: 'Action',
      accessor: 'action',
      sortable: true,
    },
    {
      Header: 'Utilisateur',
      accessor: 'user',
      sortable: false,
      Cell: ({ value }) => value?.username || 'Système/Anonyme',
    },
    {
      Header: 'Tentative (si échec login)',
      accessor: 'usernameAttempt',
      Cell: ({ value }) => value || '-',
    },
    {
      Header: 'Adresse IP',
      accessor: 'ipAddress',
      sortable: true,
    },
    {
      Header: 'Détails',
      accessor: 'details',
      Cell: ({ value }) => {
        if (!value) return '-';
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return (
          <span
            title={displayValue}
            style={{
              display: 'block',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayValue}
          </span>
        );
      },
      minWidth: 250,
    },
  ], []);

  const isLoading = status === 'loading';

  if (isLoading && !logs.length) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="container-fluid mt-4 security-log-page">
      <PageHeader
        title="Journaux de Sécurité"
        breadcrumbs={[
          { label: 'Admin', path: '/admin/dashboard-stats' },
          { label: 'Journaux de Sécurité', isActive: true },
        ]}
      />

      {error && (
        <AlertMessage
          variant="danger"
          onClose={() => dispatch(clearSecurityLogError())}
          dismissible
        >
          Erreur de chargement des journaux : {typeof error === 'string' ? error : error.message || JSON.stringify(error)}
        </AlertMessage>
      )}

      {/* Filtres */}
      <div className="bg-light p-3 mb-3 border rounded">
        <Form onSubmit={(e) => { e.preventDefault(); applyLocalFilters(); }}>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group controlId="filterAction">
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
            <Col md={3}>
              <Form.Group controlId="filterUsername">
                <Form.Label>Nom d'utilisateur</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={localFilters.username}
                  onChange={handleFilterChange}
                  placeholder="Nom exact ou partiel"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="filterIpAddress">
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
            <Col md={3} className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={isLoading}>
                Filtrer
              </Button>
              <Button variant="outline-secondary" type="button" onClick={resetLocalFilters} disabled={isLoading}>
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Table */}
      {isLoading && <p>Chargement des journaux...</p>}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
      />

      {pagination && pagination.totalPages > 1 && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {!isLoading && logs.length === 0 && (
        <AlertMessage variant="info" className="mt-3">
          Aucun journal de sécurité ne correspond à vos critères.
        </AlertMessage>
      )}
    </div>
  );
};

export default SecurityLogPage;
