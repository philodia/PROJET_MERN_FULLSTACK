// frontend/src/components/common/DataTable/TableRow.jsx
import React from 'react';
import PropTypes from 'prop-types';
import TableCell from './TableCell'; // Votre composant TableCell

/**
 * Composant pour afficher une ligne (<tr>) dans un DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.item - L'objet de données pour la ligne actuelle.
 * @param {Array<object>} props.columns - Tableau de configuration des colonnes.
 * @param {number} props.rowIndex - L'index de la ligne (pour les clés ou styles alternés).
 * @param {function} [props.onRowClick] - Callback appelé avec l'item lorsque la ligne est cliquée.
 * @param {string} [props.className] - Classes CSS supplémentaires pour l'élément <tr>.
 * @param {boolean} [props.isSelectable=false] - Si la ligne peut être sélectionnée.
 * @param {boolean} [props.isSelected=false] - Si la ligne est actuellement sélectionnée.
 * @param {function} [props.onSelectRow] - Callback appelé avec l'item lorsque l'état de sélection de la ligne change.
 */
const TableRow = ({
  item,
  columns,
  rowIndex,
  onRowClick,
  className = '',
  isSelectable = false,
  isSelected = false,
  onSelectRow,
}) => {
  const handleRowClick = () => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handleSelectionChange = (e) => {
    // Empêcher le onRowClick si on clique directement sur la checkbox
    // Sauf si c'est le comportement désiré, mais généralement on veut les séparer.
    // e.stopPropagation(); // Décommentez si vous avez un onRowClick et ne voulez pas qu'il se déclenche ici.
    if (onSelectRow) {
      onSelectRow(item, !isSelected);
    }
  };

  const rowClasses = [
    'table-row',
    className,
    onRowClick ? 'clickable' : '',
    isSelected ? 'table-row-selected' : '',
    rowIndex % 2 === 0 ? 'table-row-even' : 'table-row-odd', // Pour styles alternés
  ].filter(Boolean).join(' ');

  return (
    <tr className={rowClasses} onClick={handleRowClick} role="row" aria-selected={isSelected}>
      {isSelectable && (
        <td
          className="table-cell-checkbox"
          role="gridcell"
          onClick={(e) => e.stopPropagation()} // Empêche le onRowClick sur la cellule de checkbox
          style={{ width: '1%', textAlign: 'center' }} // Style minimal pour la cellule de checkbox
        >
          <input
            type="checkbox"
            className="form-check-input"
            checked={isSelected}
            onChange={handleSelectionChange}
            onClick={(e) => e.stopPropagation()} // Double s'assurer que le clic sur la checkbox ne propage pas
            aria-label={`Sélectionner la ligne ${rowIndex + 1}`}
          />
        </td>
      )}
      {columns.map((column) => (
        <TableCell
          key={column.id || column.accessor || column.dataKey || column.Header} // Clé unique pour la cellule
          item={item}
          column={column}
        />
      ))}
    </tr>
  );
};

TableRow.propTypes = {
  item: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  rowIndex: PropTypes.number.isRequired,
  onRowClick: PropTypes.func,
  className: PropTypes.string,
  isSelectable: PropTypes.bool,
  isSelected: PropTypes.bool,
  onSelectRow: PropTypes.func,
};

export default TableRow;