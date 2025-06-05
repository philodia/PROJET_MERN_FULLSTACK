// frontend/src/components/quotes/QuoteList.jsx
import React, { useMemo, useState } from 'react';
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
 * Affiche une liste de devis en utilisant DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.quotes - Tableau des objets devis.
 *        Chaque devis: { id, quoteNumber, clientName (ou client.companyName), issueDate, validityDate, totalTTC, status }
 * @param {boolean} [props.isLoading=false] - Si les données sont en cours de chargement.
 * @param {object|string} [props.error] - Erreur à afficher.
 * @param {function} [props.onEditQuote] - Callback pour modifier un devis.
 * @param {function} [props.onDeleteQuote] - Callback pour supprimer un devis.
 * @param {function} [props.onViewQuote] - Callback pour voir les détails d'un devis.
 * @param {function} [props.onConvertToInvoice] - Callback pour convertir un devis en facture.
 * @param {string} [props.noDataMessage="Aucun devis trouvé."] - Message si la liste est vide.
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 */
const QuoteList = ({
  quotes = [],
  isLoading = false,
  error,
  onEditQuote,
  onDeleteQuote,
  onViewQuote,
  onConvertToInvoice,
  noDataMessage = "Aucun devis trouvé.",
  currencySymbol = '€',
}) => {
  const navigate = useNavigate();

  const statusLabels = {
    DRAFT: { text: 'Brouillon', variant: 'secondary' },
    SENT: { text: 'Envoyé', variant: 'info' },
    ACCEPTED: { text: 'Accepté', variant: 'success' },
    REJECTED: { text: 'Rejeté', variant: 'danger' },
    EXPIRED: { text: 'Expiré', variant: 'warning' },
    CONVERTED_TO_DELIVERY: { text: 'Converti (BL)', variant: 'primary' },
    CONVERTED_TO_INVOICE: { text: 'Converti (Fact.)', variant: 'primary' }, // Peut être une couleur différente
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const handleEdit = (quoteId) => {
    if (onEditQuote) onEditQuote(quoteId);
    else navigate(`/quotes/edit/${quoteId}`);
  };

  const handleDelete = (quoteId, quoteNumber) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le devis "${quoteNumber}" (ID: ${quoteId}) ?`)) {
      if (onDeleteQuote) onDeleteQuote(quoteId);
      else console.warn("onDeleteQuote n'est pas défini pour QuoteList.");
    }
  };

  const handleView = (quoteId) => {
    if (onViewQuote) onViewQuote(quoteId);
    else navigate(`/quotes/view/${quoteId}`);
  };

  const handleConvertToInvoiceClick = (quoteId) => {
    if (onConvertToInvoice) {
      // Idéalement, une confirmation ou une modale pour les options de conversion
      if (window.confirm(`Convertir ce devis en facture ?`)) {
        onConvertToInvoice(quoteId);
      }
    } else {
        console.warn("onConvertToInvoice n'est pas défini pour QuoteList.");
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Numéro Devis',
      accessor: 'quoteNumber',
      isSortable: true,
      render: (item) => <Link to={`/quotes/view/${item.id}`}>{item.quoteNumber}</Link>,
      cellStyle: { fontWeight: '500', width: '150px' },
    },
    {
      Header: 'Client',
      accessor: 'clientName', // Ou 'client.companyName' si l'objet client est imbriqué
      isSortable: true,
      // render: (item) => item.client?.companyName || item.clientName || '-',
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
      Header: 'Date Validité',
      accessor: 'validityDate',
      isSortable: true,
      dataType: 'custom',
      render: (item) => formatDate(item.validityDate),
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
        const statusInfo = statusLabels[item.status?.toUpperCase()] || { text: item.status, variant: 'light' };
        return (
          <StatusBadge variant={statusInfo.variant} pillSize="sm">
            {statusInfo.text}
          </StatusBadge>
        );
      },
      cellStyle: { width: '150px', textAlign: 'center' },
    },
    {
      Header: 'Actions',
      id: 'actions',
      render: (item) => {
        const actionsConfig = [
          { id: 'view', iconName: 'FaEye', label: 'Voir', onClick: () => handleView(item.id) },
        ];

        // Permettre l'édition seulement pour certains statuts (ex: Brouillon)
        if (item.status === 'DRAFT' && onEditQuote) {
          actionsConfig.push({ id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleEdit(item.id) });
        }

        // Permettre la conversion si le devis est accepté et pas encore converti
        if (item.status === 'ACCEPTED' && onConvertToInvoice) {
            actionsConfig.push({
                id: 'convertToInvoice',
                iconName: 'BsFileEarmarkTextFill', // Icône de facture
                label: 'Convertir en Facture',
                onClick: () => handleConvertToInvoiceClick(item.id),
                variant: 'success',
            });
        }

        // Permettre la suppression seulement pour certains statuts
        if (item.status === 'DRAFT' && onDeleteQuote) {
          actionsConfig.push({
            id: 'delete',
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(item.id, item.quoteNumber),
            variant: 'danger',
          });
        }
        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '180px' }, // Ajuster pour le nombre d'actions
    },
  ], [onViewQuote, onEditQuote, onDeleteQuote, onConvertToInvoice, currencySymbol]);

  if (error) {
    return <Alert variant="danger">{typeof error === 'string' ? error : (error.message || "Erreur lors du chargement des devis.")}</Alert>;
  }

  return (
    <div className="quote-list-container">
      <DataTable
        columns={columns}
        data={quotes}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={15}
        isSortable
        isHover
        isStriped
        responsive
        size="sm"
        // isSelectable // Si vous voulez des actions groupées (ex: envoyer plusieurs devis)
        // onSelectedRowsChange={...}
      />
    </div>
  );
};

QuoteList.propTypes = {
  quotes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      quoteNumber: PropTypes.string.isRequired,
      clientName: PropTypes.string, // Ou client: PropTypes.shape({ companyName: PropTypes.string })
      client: PropTypes.shape({ companyName: PropTypes.string }),
      issueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      validityDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      totalTTC: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired, // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED_TO_INVOICE
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEditQuote: PropTypes.func,
  onDeleteQuote: PropTypes.func,
  onViewQuote: PropTypes.func,
  onConvertToInvoice: PropTypes.func,
  noDataMessage: PropTypes.string,
  currencySymbol: PropTypes.string,
};

export default QuoteList;