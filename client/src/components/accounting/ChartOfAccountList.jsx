// frontend/src/components/accounting/ChartOfAccountList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
import { Alert } from 'react-bootstrap';

/**
 * Affiche une liste des comptes du plan comptable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.accounts - Liste des comptes.
 * @param {boolean} [props.isLoading=false] - Indique si les données chargent.
 * @param {object|string} [props.error] - Erreur éventuelle.
 * @param {function} [props.onEditAccount] - Callback pour modifier un compte.
 * @param {function} [props.onDeleteAccount] - Callback pour supprimer un compte.
 * @param {function} [props.onViewAccountDetails] - Callback pour voir les détails.
 */
const ChartOfAccountList = ({
  accounts = [],
  isLoading = false,
  error,
  onEditAccount,
  onDeleteAccount,
  onViewAccountDetails,
}) => {
  const navigate = useNavigate();

  const accountTypeLabels = {
    ASSET: 'Actif',
    LIABILITY: 'Passif',
    EQUITY: 'Capitaux Propres',
    REVENUE: 'Revenu',
    EXPENSE: 'Dépense',
  };

  const handleEdit = (accountId) => {
    if (onEditAccount) onEditAccount(accountId);
    else navigate(`/accounting/chart-of-accounts/edit/${accountId}`);
  };

  const handleDelete = (accountId, accountName) => {
    const confirmMsg = `Êtes-vous sûr de vouloir supprimer le compte "${accountName}" (${accountId}) ? Cette action peut avoir des conséquences importantes.`;
    if (window.confirm(confirmMsg)) {
      if (onDeleteAccount) onDeleteAccount(accountId);
      else console.warn("onDeleteAccount non fourni à ChartOfAccountList.");
    }
  };

  const handleViewDetails = (accountId) => {
    if (onViewAccountDetails) onViewAccountDetails(accountId);
    else handleEdit(accountId); // Par défaut, rediriger vers l'édition
  };

  const columns = useMemo(() => [
    {
      Header: 'N° Compte',
      accessor: 'accountNumber',
      isSortable: true,
      cellStyle: { width: '150px', fontWeight: '500' },
    },
    {
      Header: 'Nom du Compte',
      accessor: 'accountName',
      isSortable: true,
    },
    {
      Header: 'Type',
      accessor: 'type',
      isSortable: true,
      Cell: ({ row }) => accountTypeLabels[row.original.type] || row.original.type,
      cellStyle: { width: '180px' },
    },
    {
      Header: 'Compte Parent',
      accessor: 'parentName',
      isSortable: true,
      Cell: ({ row }) => row.original.parentName || row.original.parentId || '-',
      cellStyle: { width: '200px' },
    },
    {
      Header: 'Statut',
      accessor: 'isActive',
      isSortable: true,
      Cell: ({ row }) => (
        <StatusBadge variant={row.original.isActive ? 'success' : 'secondary'} pillSize="sm">
          {row.original.isActive ? 'Actif' : 'Inactif'}
        </StatusBadge>
      ),
      cellStyle: { width: '100px', textAlign: 'center' },
    },
    {
      Header: 'Actions',
      id: 'actions',
      Cell: ({ row }) => {
        const item = row.original;
        const actionsConfig = [
          { id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleEdit(item.id) },
        ];

        if (!item.hasTransactions && onDeleteAccount) {
          actionsConfig.push({
            id: 'delete',
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(item.id, item.accountName),
            variant: 'danger',
          });
        }

        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '100px' },
    },
  ], [onDeleteAccount, onEditAccount]);

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'Erreur lors du chargement du plan comptable.';
    return <Alert variant="danger">{errorMessage}</Alert>;
  }

  return (
    <div className="chart-of-account-list-container">
      <DataTable
        columns={columns}
        data={accounts}
        isLoading={isLoading}
        noDataMessage="Aucun compte trouvé dans le plan comptable."
        isPaginated
        itemsPerPage={20}
        isSortable
        isHover
        responsive
        size="sm"
      />
    </div>
  );
};

ChartOfAccountList.propTypes = {
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      accountNumber: PropTypes.string.isRequired,
      accountName: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      isActive: PropTypes.bool,
      parentId: PropTypes.string,
      parentName: PropTypes.string,
      hasTransactions: PropTypes.bool,
      isSystemAccount: PropTypes.bool,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEditAccount: PropTypes.func,
  onDeleteAccount: PropTypes.func,
  onViewAccountDetails: PropTypes.func,
};

export default ChartOfAccountList;
