// frontend/src/components/clients/ClientList.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
import Icon from '../common/Icon';

const ClientList = ({
  clients = [],
  isLoading = false,
  error,
  onEditClient,
  onDeleteClient,
  onViewClient,
  onSelectClients,
  isSelectable = false,
  noDataMessage = "Aucun client trouvé.",
}) => {
  const navigate = useNavigate();
  const [selectedClientIds, setSelectedClientIds] = useState(new Set());

  const handleEdit = (clientId) => {
    if (onEditClient) {
      onEditClient(clientId);
    } else {
      navigate(`/clients/edit/${clientId}`);
    }
  };

  const handleDelete = (clientId) => {
    if (onDeleteClient) {
      onDeleteClient(clientId);
    } else {
      console.warn("onDeleteClient n'est pas défini pour ClientList.");
    }
  };

  const handleView = (clientId) => {
    if (onViewClient) {
      onViewClient(clientId);
    } else {
      navigate(`/clients/view/${clientId}`);
    }
  };

  const handleSelectedRowsChange = (newSelectedIds) => {
    setSelectedClientIds(newSelectedIds);
    if (onSelectClients) {
      onSelectClients(newSelectedIds);
    }
  };

  const statusMap = {
    active: { text: 'Actif', variant: 'success' },
    inactive: { text: 'Inactif', variant: 'secondary' },
    pending: { text: 'En attente', variant: 'warning' },
  };

  const columns = useMemo(() => [
    {
      Header: 'Nom de l\'entreprise',
      accessor: 'companyName',
      isSortable: true,
    },
    {
      Header: 'Contact Principal',
      accessor: 'contactName',
      isSortable: true,
    },
    {
      Header: 'Email',
      accessor: 'email',
      render: (item) => (
        item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : '-'
      )
    },
    {
      Header: 'Téléphone',
      accessor: 'phone',
    },
    {
      Header: 'Ville',
      accessor: 'address.city',
      isSortable: true,
    },
    {
      Header: 'Statut',
      accessor: 'status',
      isSortable: true,
      render: (item) => {
        const status = item.status || 'inactive';
        const config = statusMap[status] || statusMap.inactive;
        return <StatusBadge variant={config.variant}>{config.text}</StatusBadge>;
      }
    },
    {
      Header: 'Actions',
      id: 'actions',
      render: (item) => {
        const actionsConfig = [
          { id: 'view', iconName: 'FaEye', label: 'Voir', onClick: () => handleView(item.id) },
          { id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleEdit(item.id) },
          {
            id: 'delete',
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(item.id),
            variant: 'danger',
          },
        ];
        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right' },
    },
  ], [onViewClient, onEditClient, onDeleteClient, navigate]);

  return (
    <div className="client-list-container">
      {isSelectable && selectedClientIds.size > 0 && (
        <div className="mb-3 p-2 bg-light border rounded d-flex align-items-center">
          <span className="me-3">{selectedClientIds.size} client(s) sélectionné(s)</span>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={() => {
              if (onDeleteClient) {
                Array.from(selectedClientIds).forEach(id => onDeleteClient(id));
              }
            }}
          >
            <Icon name="FaTrash" className="me-1" /> Supprimer la sélection
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={clients}
        isLoading={isLoading}
        error={error?.message || (typeof error === 'string' ? error : null)}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={10}
        isSortable
        isSelectable={isSelectable}
        initialSelectedRowIds={Array.from(selectedClientIds)}
        onSelectedRowsChange={handleSelectedRowsChange}
        isHover
        isStriped
        responsive
      />
    </div>
  );
};

ClientList.propTypes = {
  clients: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object, 
    PropTypes.string,
    PropTypes.instanceOf(Error)
  ]),
  onEditClient: PropTypes.func,
  onDeleteClient: PropTypes.func,
  onViewClient: PropTypes.func,
  onSelectClients: PropTypes.func,
  isSelectable: PropTypes.bool,
  noDataMessage: PropTypes.string,
};

export default ClientList;