// frontend/src/components/accounting/JournalEntryList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
import { Alert } from 'react-bootstrap';

/**
 * Affiche une liste d'écritures de journal comptable.
 */
const JournalEntryList = ({
  journalEntries = [],
  isLoading = false,
  error,
  onViewEntry = null,
  onEditEntry,
  onDeleteEntry,
  currencySymbol = '€',
}) => {
  const navigate = useNavigate();

  const handleView = (entryId) => {
    if (onViewEntry) onViewEntry(entryId);
    else navigate(`/accounting/journal/${entryId}`);
  };

  const handleEdit = (entryId) => {
    if (onEditEntry) onEditEntry(entryId);
    else navigate(`/accounting/journal/edit/${entryId}`);
  };

  const handleDelete = (entryId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette écriture de journal ?')) {
      if (onDeleteEntry) onDeleteEntry(entryId);
      else console.warn("onDeleteEntry non fourni à JournalEntryList.");
    }
  };

  const processedEntries = useMemo(() => {
    return journalEntries.map(entry => {
      const totalDebit = entry.totalDebit ?? entry.lines?.reduce((sum, line) => sum + (Number(line.debit) || 0), 0) || 0;
      const totalCredit = entry.totalCredit ?? entry.lines?.reduce((sum, line) => sum + (Number(line.credit) || 0), 0) || 0;
      return {
        ...entry,
        totalDebit,
        totalCredit,
      };
    });
  }, [journalEntries]);

  const columns = useMemo(() => [
    {
      Header: 'Date',
      accessor: 'date',
      isSortable: true,
      dataType: 'date',
      dateFormat: 'dd/MM/yyyy',
      cellStyle: { width: '120px' },
      render: (item) => {
        try {
          const parsedDate = typeof item.date === 'string' ? new Date(item.date) : item.date;
          return format(parsedDate, 'dd/MM/yyyy', { locale: fr });
        } catch (err) {
          return item.date;
        }
      }
    },
    {
      Header: 'Réf./ID',
      accessor: 'id',
      isSortable: true,
      cellStyle: { width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
      render: (item) => <span title={item.id}>{String(item.id).substring(0, 8)}...</span>,
    },
    {
      Header: 'Description Générale',
      accessor: 'description',
      isSortable: true,
    },
    {
      Header: 'Total Débit',
      accessor: 'totalDebit',
      dataType: 'currency',
      currencyOptions: { currency: currencySymbol.replace('€', 'EUR'), locale: 'fr-FR' },
      isSortable: true,
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right' },
      cellStyle: { width: '150px' },
    },
    {
      Header: 'Total Crédit',
      accessor: 'totalCredit',
      dataType: 'currency',
      currencyOptions: { currency: currencySymbol.replace('€', 'EUR'), locale: 'fr-FR' },
      isSortable: true,
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right' },
      cellStyle: { width: '150px' },
    },
    // Statut facultatif
    {
      Header: 'Statut',
      accessor: 'status',
      isSortable: true,
       render: (item) => (
         <StatusBadge
          variant={
            item.status === 'DRAFT' ? 'secondary' :
            item.status === 'POSTED' ? 'success' :
            item.status === 'CANCELLED' ? 'danger' : 'light'
         }
           pillSize="sm"
         >
          {item.status === 'DRAFT' ? 'Brouillon' :
            item.status === 'POSTED' ? 'Validée' :
            item.status === 'CANCELLED' ? 'Annulée' : item.status}
         </StatusBadge>
       ),
       cellStyle: { width: '120px', textAlign: 'center' },
     },
    {
      Header: 'Actions',
      id: 'actions',
      render: (item) => {
        const actionsConfig = [];
        if (onViewEntry !== null) {
          actionsConfig.push({ id: 'view', iconName: 'FaEye', label: 'Voir', onClick: () => handleView(item.id) });
        }
        if (onEditEntry && (item.status === 'DRAFT' || !item.status)) {
          actionsConfig.push({ id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleEdit(item.id) });
        }
        if (onDeleteEntry && (item.status === 'DRAFT' || !item.status)) {
          actionsConfig.push({ id: 'delete', iconName: 'FaTrash', label: 'Supprimer', onClick: () => handleDelete(item.id), variant: 'danger' });
        }
        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '120px' },
    },
  ], [onViewEntry, onEditEntry, onDeleteEntry, currencySymbol]);

  if (error) {
    return (
      <Alert variant="danger">
        {typeof error === 'string' ? error : (error.message || "Erreur lors du chargement des écritures.")}
      </Alert>
    );
  }

  return (
    <div className="journal-entry-list-container">
      <DataTable
        columns={columns}
        data={processedEntries}
        isLoading={isLoading}
        noDataMessage="Aucune écriture de journal trouvée."
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

JournalEntryList.propTypes = {
  journalEntries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      description: PropTypes.string.isRequired,
      lines: PropTypes.arrayOf(
        PropTypes.shape({
          account: PropTypes.string,
          debit: PropTypes.number,
          credit: PropTypes.number,
          description: PropTypes.string,
        })
      ).isRequired,
      totalDebit: PropTypes.number,
      totalCredit: PropTypes.number,
      status: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onViewEntry: PropTypes.oneOfType([PropTypes.func, PropTypes.oneOf([null])]),
  onEditEntry: PropTypes.func,
  onDeleteEntry: PropTypes.func,
  currencySymbol: PropTypes.string,
};

export default JournalEntryList;
