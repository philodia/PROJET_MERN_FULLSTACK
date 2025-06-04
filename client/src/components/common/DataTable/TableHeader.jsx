// frontend/src/components/common/DataTable/TableHeader.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon'; // Votre composant Icon
// import TooltipWrapper from '../TooltipWrapper';

/**
 * Composant pour afficher l'en-tête (<thead>) d'un DataTable,
 * gérant l'affichage des titres de colonnes et les indicateurs de tri.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.columns - Tableau de configuration des colonnes.
 *        Chaque objet colonne doit avoir `Header` et peut avoir `accessor` (ou `id`), `isSortable`.
 * @param {object} [props.sortConfig] - Configuration actuelle du tri.
 *        Ex: { key: 'name', direction: 'ascending' } ou { key: 'name', direction: 'descending' }.
 * @param {function} [props.onSort] - Callback appelé avec la clé de la colonne lorsque l'en-tête est cliqué pour le tri.
 * @param {string} [props.className] - Classes CSS supplémentaires pour l'élément <thead>.
 * @param {boolean} [props.isSelectable=false] - Si la table a une colonne de sélection (pour ajuster l'en-tête).
 * @param {boolean} [props.areAllRowsSelected=false] - Si toutes les lignes sont actuellement sélectionnées.
 * @param {function} [props.onSelectAllRows] - Callback pour sélectionner/désélectionner toutes les lignes.
 */
const TableHeader = ({
  columns,
  sortConfig,
  onSort,
  className = '',
  isSelectable = false,
  areAllRowsSelected = false,
  onSelectAllRows,
}) => {
  const handleSort = (columnKey) => {
    if (onSort && columnKey) {
      onSort(columnKey);
    }
  };

  const handleSelectAllChange = (e) => {
    if (onSelectAllRows) {
      onSelectAllRows(e.target.checked);
    }
  };

  const renderSortIcon = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      // Icône de tri neutre (optionnel, ou rien si pas de tri actif sur cette colonne)
      // return <Icon name="FaSort" size="0.8em" style={{ marginLeft: '5px', opacity: 0.5 }} />;
      return <Icon name="FaSort" size="0.8em" style={{ marginLeft: '5px', color: '#aaa' }} />;
    }
    if (sortConfig.direction === 'ascending') {
      return <Icon name="FaSortUp" size="0.8em" style={{ marginLeft: '5px' }} />;
    }
    if (sortConfig.direction === 'descending') {
      return <Icon name="FaSortDown" size="0.8em" style={{ marginLeft: '5px' }} />;
    }
    return null;
  };

  return (
    <thead className={`table-header ${className}`}>
      <tr>
        {isSelectable && (
          <th
            scope="col"
            className="table-header-cell table-header-checkbox"
            style={{ width: '1%', textAlign: 'center' }}
          >
            <input
              type="checkbox"
              className="form-check-input"
              checked={areAllRowsSelected}
              onChange={handleSelectAllChange}
              aria-label="Sélectionner toutes les lignes"
              // Potentiellement, ajouter un état indéterminé si certaines lignes sont sélectionnées mais pas toutes
              // ref={el => el && (el.indeterminate = someSelected && !areAllRowsSelected)}
            />
          </th>
        )}
        {columns.map((column) => {
          const columnKey = column.accessor || column.dataKey || column.id || column.Header;
          const isSortable = column.isSortable !== false && onSort && columnKey; // isSortable par défaut à true si onSort est fourni

          return (
            <th
              key={columnKey}
              scope="col"
              className={`table-header-cell ${isSortable ? 'sortable' : ''} ${column.headerClassName || ''}`}
              style={column.headerStyle || {}}
              onClick={isSortable ? () => handleSort(columnKey) : undefined}
              onKeyDown={isSortable ? (e) => { if (e.key === 'Enter') handleSort(columnKey); } : undefined}
              tabIndex={isSortable ? 0 : undefined}
              role={isSortable ? 'button' : undefined}
              aria-sort={sortConfig && sortConfig.key === columnKey ? sortConfig.direction : 'none'}
            >
              {typeof column.Header === 'function' ? column.Header() : column.Header}
              {isSortable && renderSortIcon(columnKey)}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

TableHeader.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      Header: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.node]).isRequired,
      accessor: PropTypes.string, // Ou dataKey, ou id
      dataKey: PropTypes.string,
      id: PropTypes.string,
      isSortable: PropTypes.bool,
      headerClassName: PropTypes.string,
      headerStyle: PropTypes.object,
    })
  ).isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['ascending', 'descending']),
  }),
  onSort: PropTypes.func,
  className: PropTypes.string,
  isSelectable: PropTypes.bool,
  areAllRowsSelected: PropTypes.bool,
  onSelectAllRows: PropTypes.func,
};

export default TableHeader;