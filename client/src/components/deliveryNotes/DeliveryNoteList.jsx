// frontend/src/components/deliveryNotes/DeliveryNoteList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
import { Alert } from 'react-bootstrap';

/**
 * Composant pour afficher une liste de bons de livraison.
 */
const DeliveryNoteList = ({
  deliveryNotes = [],
  isLoading = false,
  error,
  onEditDeliveryNote,
  onDeleteDeliveryNote,
  onViewDeliveryNote,
  onConvertToInvoice,
  noDataMessage = "Aucun bon de livraison trouvé.",
}) => {
  const navigate = useNavigate();

  const statusLabels = {
    PENDING: { text: 'En attente', variant: 'secondary' },
    SHIPPED: { text: 'Expédié', variant: 'info' },
    PARTIALLY_DELIVERED: { text: 'Partiellement livré', variant: 'warning' },
    DELIVERED: { text: 'Livré', variant: 'success' },
    CANCELLED: { text: 'Annulé', variant: 'danger' },
    INVOICED: { text: 'Facturé', variant: 'primary' },
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleEdit = (id) => {
    onEditDeliveryNote ? onEditDeliveryNote(id) : navigate(`/delivery-notes/edit/${id}`);
  };

  const handleDelete = (id, number) => {
    if (window.confirm(`Supprimer le BL "${number}" (ID: ${id}) ?`)) {
      onDeleteDeliveryNote?.(id);
    }
  };

  const handleView = (id) => {
    onViewDeliveryNote ? onViewDeliveryNote(id) : navigate(`/delivery-notes/view/${id}`);
  };

  const handleConvertToInvoiceClick = (id) => {
    if (onConvertToInvoice && window.confirm("Convertir ce bon de livraison en facture ?")) {
      onConvertToInvoice(id);
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Numéro BL',
      accessor: 'deliveryNoteNumber',
      isSortable: true,
      render: (item) => (
        <Link to={`/delivery-notes/view/${item.id}`}>{item.deliveryNoteNumber}</Link>
      ),
      cellStyle: { fontWeight: '500', width: '150px' },
    },
    {
      Header: 'Client',
      accessor: 'clientName',
      isSortable: true,
    },
    {
      Header: 'Date de Livraison',
      accessor: 'deliveryDate',
      isSortable: true,
      dataType: 'custom',
      render: (item) => formatDate(item.deliveryDate),
      cellStyle: { width: '150px' },
    },
    {
      Header: 'Devis Source',
      accessor: 'sourceQuoteId',
      isSortable: true,
      render: (item) =>
        item.sourceQuoteId ? (
          <Link to={`/quotes/view/${item.sourceQuoteId}`}>
            {item.sourceQuoteNumber || item.sourceQuoteId}
          </Link>
        ) : '-',
      cellStyle: { width: '150px' },
    },
    {
      Header: 'Statut',
      accessor: 'status',
      isSortable: true,
      render: (item) => {
        const key = item.status?.toUpperCase();
        const statusInfo = statusLabels[key] || { text: item.status || '-', variant: 'light' };
        return (
          <StatusBadge variant={statusInfo.variant} pillSize="sm">
            {statusInfo.text}
          </StatusBadge>
        );
      },
      cellStyle: { width: '180px', textAlign: 'center' },
    },
    {
      Header: 'Actions',
      id: 'actions',
      render: (item) => {
        const actionsConfig = [
          {
            id: `view-${item.id}`,
            iconName: 'FaEye',
            label: 'Voir',
            onClick: () => handleView(item.id),
          },
        ];

        if (item.status === 'PENDING' && onEditDeliveryNote) {
          actionsConfig.push({
            id: `edit-${item.id}`,
            iconName: 'FaPencilAlt',
            label: 'Modifier',
            onClick: () => handleEdit(item.id),
          });
        }

        if (
          ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(item.status) &&
          onConvertToInvoice
        ) {
          actionsConfig.push({
            id: `convert-${item.id}`,
            iconName: 'BsFileEarmarkMedicalFill',
            label: 'Facturer ce BL',
            onClick: () => handleConvertToInvoiceClick(item.id),
            variant: 'success',
          });
        }

        if (item.status === 'PENDING' && onDeleteDeliveryNote) {
          actionsConfig.push({
            id: `delete-${item.id}`,
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(item.id, item.deliveryNoteNumber),
            variant: 'danger',
          });
        }

        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '180px' },
    },
  ], [onEditDeliveryNote, onDeleteDeliveryNote, onViewDeliveryNote, onConvertToInvoice]);

  if (error) {
    return (
      <Alert variant="danger">
        {typeof error === 'string'
          ? error
          : error?.message || "Erreur lors du chargement des bons de livraison."}
      </Alert>
    );
  }

  return (
    <div className="delivery-note-list-container">
      <DataTable
        columns={columns}
        data={deliveryNotes}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={15}
        isSortable
        isHover
        isStriped
        responsive
        size="sm"
      />
    </div>
  );
};

DeliveryNoteList.propTypes = {
  deliveryNotes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      deliveryNoteNumber: PropTypes.string.isRequired,
      clientName: PropTypes.string,
      deliveryDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      status: PropTypes.string.isRequired,
      sourceQuoteId: PropTypes.string,
      sourceQuoteNumber: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEditDeliveryNote: PropTypes.func,
  onDeleteDeliveryNote: PropTypes.func,
  onViewDeliveryNote: PropTypes.func,
  onConvertToInvoice: PropTypes.func,
  noDataMessage: PropTypes.string,
};

export default DeliveryNoteList;
