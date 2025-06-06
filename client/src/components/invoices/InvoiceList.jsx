// frontend/src/components/invoices/InvoiceList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
import Icon from '../common/Icon';
import { Alert } from 'react-bootstrap';

/**
 * Affiche une liste de factures en utilisant DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.invoices - Tableau des objets factures.
 *        Chaque facture: { id, invoiceNumber, clientName (ou client.companyName), issueDate, dueDate, totalTTC, status, sourceDocumentInfo }
 * @param {boolean} [props.isLoading=false] - Si les données sont en cours de chargement.
 * @param {object|string} [props.error] - Erreur à afficher.
 * @param {function} [props.onEditInvoice] - Callback pour modifier une facture.
 * @param {function} [props.onDeleteInvoice] - Callback pour supprimer une facture.
 * @param {function} [props.onViewInvoice] - Callback pour voir les détails d'une facture.
 * @param {function} [props.onMarkAsSent] - Callback pour marquer une facture comme envoyée.
 * @param {function} [props.onRecordPayment] - Callback pour enregistrer un paiement.
 * @param {string} [props.noDataMessage="Aucune facture trouvée."] - Message si la liste est vide.
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 */
const InvoiceList = ({
  invoices = [],
  isLoading = false,
  error,
  onEditInvoice,
  onDeleteInvoice,
  onViewInvoice,
  onMarkAsSent,
  onRecordPayment,
  noDataMessage = "Aucune facture trouvée.",
  currencySymbol = '€',
}) => {
  const navigate = useNavigate();

  const statusLabels = {
    DRAFT: { text: 'Brouillon', variant: 'secondary' },
    SENT: { text: 'Envoyée', variant: 'info' },
    PAID: { text: 'Payée', variant: 'success' },
    PARTIALLY_PAID: { text: 'Partiellement Payée', variant: 'warning' },
    UNPAID: { text: 'Impayée', variant: 'danger' }, // Si date d'échéance non dépassée
    OVERDUE: { text: 'En Retard', variant: 'danger', icon: 'BsExclamationCircleFill' }, // Si date d'échéance dépassée et impayée
    CANCELLED: { text: 'Annulée', variant: 'dark' },
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleEdit = (invoiceId) => {
    if (onEditInvoice) onEditInvoice(invoiceId);
    else navigate(`/invoices/edit/${invoiceId}`);
  };

  const handleDelete = (invoiceId, invoiceNumber) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture "${invoiceNumber}" (ID: ${invoiceId}) ?`)) {
      if (onDeleteInvoice) onDeleteInvoice(invoiceId);
      else console.warn("onDeleteInvoice n'est pas défini pour InvoiceList.");
    }
  };

  const handleView = (invoiceId) => {
    if (onViewInvoice) onViewInvoice(invoiceId);
    else navigate(`/invoices/view/${invoiceId}`);
  };

  const handleMarkAsSentClick = (invoiceId) => {
    if (onMarkAsSent && window.confirm("Marquer cette facture comme envoyée ?")) {
        onMarkAsSent(invoiceId);
    } else if (!onMarkAsSent) {
        console.warn("onMarkAsSent n'est pas défini.");
    }
  };

  const handleRecordPaymentClick = (invoiceId) => {
    if (onRecordPayment) {
        onRecordPayment(invoiceId); // Ouvre typiquement une modale
    } else {
        console.warn("onRecordPayment n'est pas défini.");
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Numéro Facture',
      accessor: 'invoiceNumber',
      isSortable: true,
      render: (item) => <Link to={`/invoices/view/${item.id}`}>{item.invoiceNumber}</Link>,
      cellStyle: { fontWeight: '500', width: '160px' },
    },
    {
      Header: 'Client',
      accessor: 'clientName', // Ou 'client.companyName'
      isSortable: true,
    },
    {
      Header: 'Date Émission',
      accessor: 'issueDate',
      isSortable: true,
      dataType: 'custom',
      render: (item) => formatDate(item.issueDate),
      cellStyle: { width: '130px' },
    },
    {
      Header: 'Date Échéance',
      accessor: 'dueDate',
      isSortable: true,
      dataType: 'custom',
      render: (item) => formatDate(item.dueDate),
      cellStyle: { width: '130px' },
    },
    {
      Header: `Total TTC (${currencySymbol})`,
      accessor: 'totalTTC',
      isSortable: true,
      dataType: 'currency',
      currencyOptions: { currency: currencySymbol.replace('€','EUR') },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right' },
      cellStyle: { width: '150px', fontWeight: 'bold' },
    },
    {
      Header: 'Statut',
      accessor: 'status',
      isSortable: true,
      render: (item) => {
        // Logique pour déterminer si OVERDUE
        let effectiveStatus = item.status?.toUpperCase();
        if (effectiveStatus === 'UNPAID' && item.dueDate && new Date(item.dueDate) < new Date()) {
            effectiveStatus = 'OVERDUE';
        }
        const statusInfo = statusLabels[effectiveStatus] || { text: item.status, variant: 'light' };
        return (
          <StatusBadge variant={statusInfo.variant} pillSize="sm">
            {statusInfo.icon && <Icon name={statusInfo.icon} className="me-1" />}
            {statusInfo.text}
          </StatusBadge>
        );
      },
      cellStyle: { width: '160px', textAlign: 'center' },
    },
    {
      Header: 'Document Source', // BL ou Devis
      accessor: 'sourceDocumentInfo', // Ex: "BL2024-001" ou "DEV2024-005"
      isSortable: false, // Ou tri personnalisé si la source est structurée
      render: (item) => item.sourceDocumentInfo || '-',
      cellStyle: { width: '160px' },
    },
    {
      Header: 'Actions',
      id: 'actions',
      render: (item) => {
        const actionsConfig = [
          { id: 'view', iconName: 'FaEye', label: 'Voir', onClick: () => handleView(item.id) },
        ];

        if (item.status === 'DRAFT' && onEditInvoice) {
          actionsConfig.push({ id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleEdit(item.id) });
        }
        if (item.status === 'DRAFT' && onMarkAsSent) {
          actionsConfig.push({ id: 'markSent', iconName: 'BsSendFill', label: 'Marquer Envoyée', onClick: () => handleMarkAsSentClick(item.id), variant: 'info' });
        }
        if (['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].includes(item.status?.toUpperCase()) && onRecordPayment) {
            actionsConfig.push({ id: 'recordPayment', iconName: 'BsCreditCardFill', label: 'Enregistrer Paiement', onClick: () => handleRecordPaymentClick(item.id), variant: 'success' });
        }
        if (['DRAFT', 'UNPAID'].includes(item.status?.toUpperCase()) && onDeleteInvoice) { // Suppression possible si brouillon ou impayée (selon règles métier)
          actionsConfig.push({
            id: 'delete',
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(item.id, item.invoiceNumber),
            variant: 'danger',
          });
        }
        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: 'auto', minWidth: '150px' }, // Assez large pour plusieurs icônes
    },
  ], [onViewInvoice, onEditInvoice, onDeleteInvoice, onMarkAsSent, onRecordPayment, currencySymbol]);

  if (error) {
    return <Alert variant="danger">{typeof error === 'string' ? error : (error.message || "Erreur lors du chargement des factures.")}</Alert>;
  }

  return (
    <div className="invoice-list-container">
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={15}
        isSortable
        isHover
        isStriped
        responsive
        size="sm"
        // isSelectable // Si besoin d'actions groupées (ex: exporter plusieurs PDF)
      />
    </div>
  );
};

InvoiceList.propTypes = {
  invoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      invoiceNumber: PropTypes.string.isRequired,
      clientName: PropTypes.string,
      // client: PropTypes.shape({ companyName: PropTypes.string }),
      issueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      totalTTC: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired, // DRAFT, SENT, PAID, PARTIALLY_PAID, UNPAID, OVERDUE, CANCELLED
      sourceDocumentInfo: PropTypes.string, // Ex: "BL001" ou "DEV005"
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEditInvoice: PropTypes.func,
  onDeleteInvoice: PropTypes.func,
  onViewInvoice: PropTypes.func,
  onMarkAsSent: PropTypes.func,
  onRecordPayment: PropTypes.func,
  noDataMessage: PropTypes.string,
  currencySymbol: PropTypes.string,
};

export default InvoiceList;