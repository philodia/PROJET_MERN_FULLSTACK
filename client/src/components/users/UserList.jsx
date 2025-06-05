// frontend/src/components/users/UserList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert } from 'react-bootstrap';

import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';

const UserList = ({
  users = [],
  isLoading = false,
  error,
  onEditUser,
  onDeleteUser,
  onToggleUserStatus,
  noDataMessage = "Aucun utilisateur trouvé.",
}) => {
  const navigate = useNavigate();

  const roleColors = {
    ADMIN: 'danger',
    MANAGER: 'primary',
    ACCOUNTANT: 'info',
    USER: 'secondary',
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleEdit = (userId) => {
    if (onEditUser) onEditUser(userId);
    else navigate(`/admin/user-management/edit/${userId}`);
  };

  const handleDelete = (userId, username) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" (ID: ${userId}) ?`)) {
      if (onDeleteUser) onDeleteUser(userId);
      else console.warn("onDeleteUser non fourni à UserList.");
    }
  };

  const handleToggleStatus = (userId, currentStatus) => {
    const actionText = currentStatus ? "désactiver" : "activer";
    if (window.confirm(`Êtes-vous sûr de vouloir ${actionText} cet utilisateur (ID: ${userId}) ?`)) {
      if (onToggleUserStatus) onToggleUserStatus(userId, !currentStatus);
      else console.warn("onToggleUserStatus non fourni à UserList.");
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Nom d\'utilisateur',
      accessor: 'username',
    },
    {
      Header: 'Email',
      accessor: 'email',
    },
    {
      Header: 'Rôle',
      accessor: 'role',
      Cell: ({ row }) => {
        const role = row.original.role;
        const color = roleColors[role?.toUpperCase()] || 'secondary';
        const label = role
          ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
          : 'N/A';

        return (
          <StatusBadge variant={color} pillSize="sm">
            {label}
          </StatusBadge>
        );
      },
      disableSortBy: false,
      style: { width: '150px', textAlign: 'center' },
    },
    {
      Header: 'Statut',
      accessor: 'isActive',
      Cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <StatusBadge variant={active ? 'success' : 'secondary'} pillSize="sm">
            {active ? 'Actif' : 'Inactif'}
          </StatusBadge>
        );
      },
      style: { width: '100px', textAlign: 'center' },
    },
    {
      Header: 'Dernière Connexion',
      accessor: 'lastLogin',
      Cell: ({ value }) => formatDate(value),
      style: { width: '180px' },
    },
    {
      Header: 'Créé le',
      accessor: 'createdAt',
      Cell: ({ value }) => formatDate(value),
      style: { width: '180px' },
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }) => {
        const user = row.original;
        const actionsConfig = [
          {
            id: 'edit',
            iconName: 'FaPencilAlt',
            label: 'Modifier',
            onClick: () => handleEdit(user.id),
          },
          {
            id: 'toggleStatus',
            iconName: user.isActive ? 'FaToggleOff' : 'FaToggleOn',
            label: user.isActive ? 'Désactiver' : 'Activer',
            onClick: () => handleToggleStatus(user.id, user.isActive),
            variant: user.isActive ? 'warning' : 'success',
          },
        ];

        if (onDeleteUser) {
          actionsConfig.push({
            id: 'delete',
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(user.id, user.username),
            variant: 'danger',
          });
        }

        return <TableActions item={user} actionsConfig={actionsConfig} />;
      },
      style: { textAlign: 'right', width: '150px' },
    },
  ], [onEditUser, onDeleteUser, onToggleUserStatus]);

  if (error) {
    return (
      <Alert variant="danger">
        {typeof error === 'string'
          ? error
          : error?.message || "Erreur lors du chargement des utilisateurs."}
      </Alert>
    );
  }

  return (
    <div className="user-list-container">
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={15}
        isSortable
        isHover
        responsive
        size="sm"
      />
    </div>
  );
};

UserList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
      lastLogin: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEditUser: PropTypes.func,
  onDeleteUser: PropTypes.func,
  onToggleUserStatus: PropTypes.func,
  noDataMessage: PropTypes.string,
};

export default UserList;
