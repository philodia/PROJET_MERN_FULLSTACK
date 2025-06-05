// frontend/src/components/suppliers/SupplierList.jsx
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable/DataTable';
import TableActions from '../common/DataTable/TableActions';
import StatusBadge from '../common/StatusBadge';
import Icon from '../common/Icon';
import { Alert } from 'react-bootstrap';

/**
 * Affiche une liste de fournisseurs en utilisant DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.suppliers - Tableau des objets fournisseurs.
 *        Chaque fournisseur: { id, companyName, contactName, email, phone, address, isActive, website }
 * @param {boolean} [props.isLoading=false] - Si les données sont en cours de chargement.
 * @param {object|string} [props.error] - Erreur à afficher.
 * @param {function} [props.onEditSupplier] - Callback pour modifier un fournisseur.
 * @param {function} [props.onDeleteSupplier] - Callback pour supprimer un fournisseur.
 * @param {function} [props.onViewSupplier] - Callback pour voir les détails.
 * @param {function} [props.onSelectSuppliers] - Callback avec les IDs des fournisseurs sélectionnés.
 * @param {boolean} [props.isSelectable=false] - Si les lignes peuvent être sélectionnées.
 * @param {string} [props.noDataMessage="Aucun fournisseur trouvé."] - Message si la liste est vide.
 */
const SupplierList = ({
  suppliers = [],
  isLoading = false,
  error,
  onEditSupplier,
  onDeleteSupplier,
  onViewSupplier,
  onSelectSuppliers,
  isSelectable = false,
  noDataMessage = "Aucun fournisseur trouvé.",
}) => {
  const navigate = useNavigate();
  const [selectedSupplierIds, setSelectedSupplierIds] = useState(new Set());

  const handleEdit = (supplierId) => {
    if (onEditSupplier) onEditSupplier(supplierId);
    else navigate(`/suppliers/edit/${supplierId}`);
  };

  const handleDelete = (supplierId, companyName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${companyName}" (ID: ${supplierId}) ?`)) {
      if (onDeleteSupplier) onDeleteSupplier(supplierId);
      else console.warn("onDeleteSupplier n'est pas défini pour SupplierList.");
    }
  };

  const handleView = (supplierId) => {
    if (onViewSupplier) onViewSupplier(supplierId);
    else navigate(`/suppliers/view/${supplierId}`);
  };

  const handleSelectedRowsChange = (newSelectedIds) => {
    setSelectedSupplierIds(newSelectedIds);
    if (onSelectSuppliers) {
      onSelectSuppliers(newSelectedIds);
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Nom de l\'entreprise',
      accessor: 'companyName',
      isSortable: true,
    },
    {
      Header: 'Contact',
      accessor: 'contactName',
      isSortable: true,
    },
    {
      Header: 'Email',
      accessor: 'email',
      // render: (item) => item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : '-',
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
      Header: 'Site Web',
      accessor: 'website',
      render: (item) => item.website ? (
        <a href={item.website.startsWith('http') ? item.website : `//${item.website}`} target="_blank" rel="noopener noreferrer">
          {item.website.replace(/^https?:\/\//, '').split('/')[0]} {/* Affiche juste le domaine */}
        </a>
      ) : '-',
    },
    {
      Header: 'Statut',
      accessor: 'isActive',
      isSortable: true,
      render: (item) => (
        <StatusBadge variant={item.isActive ? 'success' : 'secondary'} pillSize="sm">
          {item.isActive ? 'Actif' : 'Inactif'}
        </StatusBadge>
      ),
      cellStyle: { width: '100px', textAlign: 'center' },
    },
    {
      Header: 'Actions',
      id: 'actions',
      render: (item) => {
        const actionsConfig = [
          { id: 'view', iconName: 'FaEye', label: 'Voir', onClick: () => handleView(item.id) },
          { id: 'edit', iconName: 'FaPencilAlt', label: 'Modifier', onClick: () => handleEdit(item.id) },
        ];
        if (onDeleteSupplier) {
           actionsConfig.push( {
            id: 'delete',
            iconName: 'FaTrash',
            label: 'Supprimer',
            onClick: () => handleDelete(item.id, item.companyName),
            variant: 'danger',
            // isHidden: (item) => item.hasOpenOrders, // Cacher si des commandes en cours
          });
        }
        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '120px' },
    },
  ], [onViewSupplier, onEditSupplier, onDeleteSupplier]);

  if (error) {
    return <Alert variant="danger">{typeof error === 'string' ? error : (error.message || "Erreur lors du chargement des fournisseurs.")}</Alert>;
  }

  return (
    <div className="supplier-list-container">
      {/* Boutons d'action globaux ou pour la sélection groupée */}
      {isSelectable && selectedSupplierIds.size > 0 && (
        <div className="mb-3 p-2 bg-light border rounded">
          <span className="me-3">{selectedSupplierIds.size} fournisseur(s) sélectionné(s).</span>
          {/* <Button variant="outline-danger" size="sm" onClick={() => console.log('Supprimer sélection:', selectedSupplierIds)}>
            <Icon name="FaTrash" className="me-1" /> Supprimer la sélection
          </Button> */}
        </div>
      )}
      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={10}
        isSortable
        isHover
        isStriped
        responsive
        isSelectable={isSelectable}
        initialSelectedRowIds={selectedSupplierIds}
        onSelectedRowsChange={handleSelectedRowsChange}
        // onRowClick={(item) => handleView(item.id)} // Optionnel
      />
    </div>
  );
};

SupplierList.propTypes = {
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      companyName: PropTypes.string.isRequired,
      contactName: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      website: PropTypes.string,
      address: PropTypes.shape({
        city: PropTypes.string,
      }),
      isActive: PropTypes.bool,
      // hasOpenOrders: PropTypes.bool, // Exemple pour conditionner la suppression
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEditSupplier: PropTypes.func,
  onDeleteSupplier: PropTypes.func,
  onViewSupplier: PropTypes.func,
  onSelectSuppliers: PropTypes.func,
  isSelectable: PropTypes.bool,
  noDataMessage: PropTypes.string,
};

export default SupplierList;