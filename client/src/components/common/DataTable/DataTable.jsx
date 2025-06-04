// frontend/src/components/common/DataTable/DataTable.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Table as BootstrapTable, Alert } from 'react-bootstrap'; // Renommer pour éviter conflit
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import TablePagination from './TablePagination';
import LoadingSpinner from '../LoadingSpinner'; // Assurez-vous que ce composant existe
// import TableFilters from './TableFilters'; // Si vous intégrez les filtres ici

/**
 * Composant DataTable générique et réutilisable.
 * Gère l'affichage des données, le tri côté client, la pagination côté client, et la sélection.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.data - Le tableau de données à afficher.
 * @param {Array<object>} props.columns - Configuration des colonnes.
 *        Chaque colonne: { Header, accessor/dataKey/id, isSortable, cellClassName, headerClassName, render, dataType, ... }
 * @param {boolean} [props.isLoading=false] - Indique si les données sont en cours de chargement.
 * @param {string} [props.loadingMessage='Chargement des données...'] - Message pendant le chargement.
 * @param {string} [props.noDataMessage='Aucune donnée à afficher.'] - Message si pas de données.
 * @param {object} [props.error] - Objet d'erreur à afficher.
 * @param {number} [props.itemsPerPage=10] - Nombre d'éléments à afficher par page.
 * @param {boolean} [props.isPaginated=true] - Activer/désactiver la pagination.
 * @param {boolean} [props.isSortable=true] - Activer/désactiver le tri globalement (peut être surchargé par colonne).
 * @param {object} [props.initialSortConfig] - Configuration initiale du tri { key: 'accessor', direction: 'ascending' }.
 * @param {boolean} [props.isSelectable=false] - Permet la sélection de lignes.
 * @param {Set<string|number>} [props.initialSelectedRowIds] - IDs des lignes initialement sélectionnées.
 * @param {function} [props.onSelectedRowsChange] - Callback avec les IDs des lignes sélectionnées. (Set<string|number>)
 * @param {function} [props.onRowClick] - Callback appelé lorsqu'une ligne est cliquée (reçoit l'item).
 * @param {string} [props.tableClassName] - Classes CSS pour l'élément <table>.
 * @param {boolean} [props.isStriped=false] - Style de table rayé Bootstrap.
 * @param {boolean} [props.isBordered=false] - Style de table avec bordures Bootstrap.
 * @param {boolean} [props.isHover=false] - Style de table avec survol Bootstrap.
 * @param {string} [props.size] - Taille de la table Bootstrap ('sm').
 * @param {boolean} [props.responsive=true] - Rend la table responsive Bootstrap.
 */
const DataTable = ({
  data = [],
  columns = [],
  isLoading = false,
  loadingMessage = 'Chargement des données...',
  noDataMessage = 'Aucune donnée à afficher.',
  error,
  itemsPerPage = 10,
  isPaginated = true,
  isSortable = true,
  initialSortConfig = { key: null, direction: null },
  isSelectable = false,
  initialSelectedRowIds = new Set(),
  onSelectedRowsChange,
  onRowClick,
  tableClassName = '',
  isStriped = false,
  isBordered = false,
  isHover = false,
  size,
  responsive = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(initialSortConfig);
  const [selectedRowIds, setSelectedRowIds] = useState(initialSelectedRowIds);

  // Réinitialiser la pagination si les données changent
  useEffect(() => {
    setCurrentPage(1);
  }, [data, itemsPerPage]);

  // Synchroniser la sélection externe
  useEffect(() => {
    setSelectedRowIds(initialSelectedRowIds);
  }, [initialSelectedRowIds]);


  // Tri des données (côté client)
  const sortedData = useMemo(() => {
    if (!isSortable || !sortConfig.key) {
      return [...data]; // Retourner une copie pour éviter la mutation de l'original
    }
    const sortableData = [...data];
    sortableData.sort((a, b) => {
      const aValue = getValueFromPath(a, sortConfig.key);
      const bValue = getValueFromPath(b, sortConfig.key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      // Comparaison de chaînes insensible à la casse
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();
      if (strA < strB) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (strA > strB) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortableData;
  }, [data, sortConfig, isSortable]);

  // Pagination des données (côté client)
  const paginatedData = useMemo(() => {
    if (!isPaginated) {
      return sortedData;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, isPaginated]);

  const totalPages = isPaginated ? Math.ceil(sortedData.length / itemsPerPage) : 1;

  const handleSort = useCallback((key) => {
    if (!isSortable) return;
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      // Optionnel: 3ème clic annule le tri ou revient à 'ascending'
      setSortConfig({ key: null, direction: null }); // Annule le tri
      return;
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Revenir à la première page après un tri
  }, [sortConfig, isSortable]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSelectRow = useCallback((item, isSelected) => {
    const itemId = item.id; // Assumant que chaque item a un 'id' unique
    if (!itemId) {
      console.warn("DataTable: L'item n'a pas de propriété 'id' pour la sélection.");
      return;
    }
    const newSelectedRowIds = new Set(selectedRowIds);
    if (isSelected) {
      newSelectedRowIds.add(itemId);
    } else {
      newSelectedRowIds.delete(itemId);
    }
    setSelectedRowIds(newSelectedRowIds);
    if (onSelectedRowsChange) {
      onSelectedRowsChange(newSelectedRowIds);
    }
  }, [selectedRowIds, onSelectedRowsChange]);

  const handleSelectAllRows = useCallback((isNowSelected) => {
    let newSelectedRowIds = new Set();
    if (isNowSelected) {
      // Sélectionner tous les items de la page actuelle ou tous les items ?
      // Pour cet exemple, sélectionnons tous les items des données triées (pas seulement paginées)
      // car la checkbox "select all" est souvent interprétée comme "select all filterable items"
      sortedData.forEach(item => {
        if (item.id) newSelectedRowIds.add(item.id);
      });
    }
    setSelectedRowIds(newSelectedRowIds);
    if (onSelectedRowsChange) {
      onSelectedRowsChange(newSelectedRowIds);
    }
  }, [sortedData, onSelectedRowsChange]);

  const areAllVisibleRowsSelected = useMemo(() => {
    if (!isSelectable || paginatedData.length === 0) return false;
    // Vérifie si tous les items de la page actuelle sont sélectionnés
    return paginatedData.every(item => item.id && selectedRowIds.has(item.id));
    // Pour un "select all" sur toutes les données (pas seulement la page) :
    // return sortedData.length > 0 && sortedData.every(item => item.id && selectedRowIds.has(item.id));
  }, [paginatedData, selectedRowIds, isSelectable]);


  if (error) {
    // Assurez-vous que AlertMessage existe et est importé
    // return <AlertMessage variant="danger">{error.message || 'Une erreur est survenue.'}</AlertMessage>;
    return <Alert variant="danger">{typeof error === 'string' ? error : (error.message || 'Une erreur est survenue lors du chargement des données.')}</Alert>;
  }

  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  if (!data || data.length === 0) {
    // return <AlertMessage variant="info">{noDataMessage}</AlertMessage>;
    return <Alert variant="info">{noDataMessage}</Alert>;
  }

  return (
    <div className="datatable-wrapper">
      {/* Ici, vous pourriez ajouter le composant TableFilters si vous l'intégrez */}
      {/* <TableFilters filterConfigs={...} onApplyFilters={...} /> */}
      <BootstrapTable
        className={tableClassName}
        striped={isStriped}
        bordered={isBordered}
        hover={isHover}
        size={size}
        responsive={responsive}
      >
        <TableHeader
          columns={columns}
          sortConfig={sortConfig}
          onSort={isSortable ? handleSort : undefined}
          isSelectable={isSelectable}
          areAllRowsSelected={areAllVisibleRowsSelected}
          onSelectAllRows={isSelectable ? handleSelectAllRows : undefined}
        />
        <tbody>
          {paginatedData.map((item, index) => (
            <TableRow
              key={item.id || `row-${index}`} // Assurer une clé unique
              item={item}
              columns={columns}
              rowIndex={index}
              onRowClick={onRowClick}
              isSelectable={isSelectable}
              isSelected={item.id ? selectedRowIds.has(item.id) : false}
              onSelectRow={isSelectable ? handleSelectRow : undefined}
            />
          ))}
        </tbody>
      </BootstrapTable>
      {isPaginated && totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

// Fonction utilitaire pour obtenir une valeur imbriquée (répétée ici pour l'autonomie du composant)
const getValueFromPath = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  noDataMessage: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  itemsPerPage: PropTypes.number,
  isPaginated: PropTypes.bool,
  isSortable: PropTypes.bool,
  initialSortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['ascending', 'descending', null]),
  }),
  isSelectable: PropTypes.bool,
  initialSelectedRowIds: PropTypes.instanceOf(Set),
  onSelectedRowsChange: PropTypes.func,
  onRowClick: PropTypes.func,
  tableClassName: PropTypes.string,
  isStriped: PropTypes.bool,
  isBordered: PropTypes.bool,
  isHover: PropTypes.bool,
  size: PropTypes.string,
  responsive: PropTypes.bool,
};

export default DataTable;