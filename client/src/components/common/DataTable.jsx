// frontend/src/components/common/DataTable.jsx
import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import Table from 'react-bootstrap/Table';
import Pagination from 'react-bootstrap/Pagination';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { FaSort, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa'; // Icônes pour le tri et la recherche

/**
 * Composant DataTable réutilisable avec tri, pagination et recherche côté client.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {Array<object>} props.data - Les données à afficher dans le tableau.
 * @param {Array<object>} props.columns - Configuration des colonnes. Chaque objet colonne peut avoir:
 *   - Header: string | React.ReactNode - Le titre de la colonne.
 *   - accessor: string - La clé pour accéder à la donnée dans l'objet de ligne.
 *   - sortable: boolean - Si la colonne est triable.
 *   - Cell: function - Fonction optionnelle pour personnaliser le rendu de la cellule. Prend ({ row, value }) en props.
 *   - thClassName: string - Classe CSS pour le <th>.
 *   - tdClassName: string - Classe CSS pour le <td>.
 * @param {boolean} [props.isLoading=false] - Si les données sont en cours de chargement.
 * @param {boolean} [props.showPagination=true] - Afficher ou masquer la pagination.
 * @param {number} [props.initialPageSize=10] - Nombre d'éléments par page par défaut.
 * @param {Array<number>} [props.pageSizeOptions=[5, 10, 20, 50, 100]] - Options pour le sélecteur de taille de page.
 * @param {boolean} [props.showSearch=true] - Afficher ou masquer le champ de recherche.
 * @param {string} [props.searchPlaceholder='Rechercher...'] - Placeholder pour le champ de recherche.
 * @param {function} [props.onRowClick] - Fonction à appeler lors du clic sur une ligne. Prend (row.original) en argument.
 * @param {string} [props.tableClassName=''] - Classes CSS pour le composant Table.
 * @param {React.ReactNode} [props.noDataComponent] - Composant à afficher si pas de données.
 * @param {boolean} [props.serverSide=false] - Indique si la pagination, le tri et la recherche sont gérés côté serveur.
 * @param {function} [props.onStateChange] - Callback lorsque l'état interne change (page, pageSize, sortBy, searchTerm). Utile pour le server-side.
 * @param {number} [props.totalItems] - Nombre total d'items (pour la pagination server-side).
 * @param {number} [props.currentPageServer] - Page actuelle (pour la pagination server-side).
 */
const DataTable = ({
  data = [],
  columns = [],
  isLoading = false,
  showPagination = true,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
  showSearch = true,
  searchPlaceholder = 'Rechercher...',
  onRowClick,
  tableClassName = '',
  noDataComponent = <p className="text-center my-3">Aucune donnée à afficher.</p>,
  serverSide = false,
  onStateChange, // ({ pageIndex, pageSize, sortBy, searchTerm })
  totalItems, // Requis pour serverSide pagination
  currentPageServer, // Requis pour serverSide pagination
}) => {
  const [currentPage, setCurrentPage] = useState(serverSide ? (currentPageServer || 1) : 1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(null); // { key: string, direction: 'ascending' | 'descending' }

  // Effet pour synchroniser avec les props server-side
  useEffect(() => {
    if (serverSide && currentPageServer !== undefined) {
      setCurrentPage(currentPageServer);
    }
  }, [currentPageServer, serverSide]);

  // Effet pour appeler onStateChange lorsque les dépendances changent
  useEffect(() => {
    if (serverSide && onStateChange) {
      onStateChange({
        pageIndex: currentPage,
        pageSize: pageSize,
        sortBy: sortConfig,
        searchTerm: searchTerm,
      });
    }
  }, [currentPage, pageSize, sortConfig, searchTerm, serverSide, onStateChange]);


  const processedData = useMemo(() => {
    if (serverSide) return data; // Les données sont déjà traitées côté serveur

    let  filteredData = [...data];

    // 1. Filtrage (Recherche)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredData = filteredData.filter((row) =>
        columns.some((column) => {
          const value = row[column.accessor];
          return value && String(value).toLowerCase().includes(lowerSearchTerm);
        })
      );
    }

    // 2. Tri
    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortConfig.direction === 'ascending'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        // Gérer d'autres types si nécessaire (dates, booléens)
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig, columns, serverSide]);

  // 3. Pagination (appliquée après le tri et le filtre pour le côté client)
  const paginatedData = useMemo(() => {
    if (serverSide || !showPagination) return processedData;
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize, showPagination, serverSide]);

  const totalPages = serverSide ? Math.ceil((totalItems || 0) / pageSize) : Math.ceil(processedData.length / pageSize);

  const requestSort = (key) => {
    if (serverSide) {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
            // Optionnel: troisième clic pour annuler le tri ou revenir à 'ascending'
            // Pour annuler: setSortConfig(null); return;
            // Pour revenir à asc: direction = 'ascending'; // ou ne rien changer si on veut cycler
             setSortConfig(null); // Annuler le tri
             return;
        }
        setSortConfig({ key, direction });
    } else {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
        }
        setSortConfig({ key, direction });
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    if (!serverSide) setCurrentPage(1); // Réinitialiser à la première page lors de la recherche côté client
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    if (!serverSide) setCurrentPage(1); // Réinitialiser à la première page
  };

  const renderSortIcon = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <FaSort className="ms-1 text-muted" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <FaSortUp className="ms-1" />;
    }
    return <FaSortDown className="ms-1" />;
  };

  if (isLoading) {
    return <p className="text-center my-3">Chargement des données...</p>; // Ou un spinner plus élaboré
  }

  if (!isLoading && data.length === 0 && !serverSide) {
      return noDataComponent;
  }
  if (!isLoading && paginatedData.length === 0 && serverSide && totalItems === 0) {
      return noDataComponent;
  }


  return (
    <div className="datatable-container">
      {(showSearch || showPagination) && (
        <div className="row mb-3 align-items-center">
          {showSearch && (
            <div className="col-sm-12 col-md-6 mb-2 mb-md-0">
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </InputGroup>
            </div>
          )}
          {showPagination && pageSizeOptions.length > 0 && (
            <div className={`col-sm-12 ${showSearch ? 'col-md-6' : 'col-md-12'} d-flex justify-content-md-end`}>
              <Form.Group controlId="pageSizeSelect" className="d-flex align-items-center">
                <Form.Label className="me-2 mb-0 small">Afficher :</Form.Label>
                <Form.Select size="sm" value={pageSize} onChange={handlePageSizeChange} style={{width: 'auto'}}>
                  {pageSizeOptions.map(sizeOpt => (
                    <option key={sizeOpt} value={sizeOpt}>
                      {sizeOpt}
                    </option>
                  ))}
                </Form.Select>
                 <span className="ms-2 small text-muted">
                    {serverSide ? `Page ${currentPage} sur ${totalPages}` : `Page ${currentPage} sur ${totalPages} (${processedData.length} élements)`}
                 </span>
              </Form.Group>
            </div>
          )}
        </div>
      )}

      <Table striped bordered hover responsive className={tableClassName}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessor || column.Header}
                onClick={() => column.sortable && requestSort(column.accessor)}
                className={`${column.sortable ? 'sortable-header' : ''} ${column.thClassName || ''}`}
                style={column.sortable ? { cursor: 'pointer' } : {}}
              >
                {column.Header}
                {column.sortable && renderSortIcon(column.accessor)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} onClick={() => onRowClick && onRowClick(row)}>
                {columns.map((column, colIndex) => {
                  const value = row[column.accessor];
                  return (
                    <td key={`${rowIndex}-${colIndex}`} className={column.tdClassName || ''}>
                      {column.Cell ? column.Cell({ row, value }) : (value !== null && value !== undefined ? String(value) : '')}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            !isLoading && (
                <tr>
                    <td colSpan={columns.length} className="text-center">
                        {searchTerm ? "Aucun résultat trouvé pour votre recherche." : (serverSide ? "Aucune donnée disponible pour cette page." : noDataComponent)}
                    </td>
                </tr>
            )
          )}
        </tbody>
      </Table>

      {showPagination && totalPages > 1 && (
        <div className="d-flex justify-content-center">
          <Pagination>
            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
            {/* Logique pour afficher un nombre limité de pages */}
            {[...Array(totalPages).keys()].map(num => {
                const pageNum = num + 1;
                // Logique simplifiée pour afficher les pages, peut être améliorée
                if (totalPages <= 7 || // Affiche toutes les pages si peu nombreuses
                    pageNum === 1 || pageNum === totalPages || // Toujours afficher la première et la dernière
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) || // Pages autour de la page actuelle
                    (currentPage <= 3 && pageNum <= 5) || // Début de la pagination
                    (currentPage >= totalPages - 2 && pageNum >= totalPages - 4) // Fin de la pagination
                ) {
                    return (
                        <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => handlePageChange(pageNum)}
                        >
                            {pageNum}
                        </Pagination.Item>
                    );
                } else if (
                    (pageNum === currentPage - 2 && currentPage > 3) ||
                    (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                ) {
                    return <Pagination.Ellipsis key={`ellipsis-${pageNum}`} disabled />;
                }
                return null;
            })}
            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
          </Pagination>
        </div>
      )}
    </div>
  );
};

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      Header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      accessor: PropTypes.string.isRequired, // Important pour le tri et l'accès aux données
      sortable: PropTypes.bool,
      Cell: PropTypes.func,
      thClassName: PropTypes.string,
      tdClassName: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  showPagination: PropTypes.bool,
  initialPageSize: PropTypes.number,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  showSearch: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  onRowClick: PropTypes.func,
  tableClassName: PropTypes.string,
  noDataComponent: PropTypes.node,
  serverSide: PropTypes.bool,
  onStateChange: PropTypes.func,
  totalItems: PropTypes.number,
  currentPageServer: PropTypes.number,
};

export default DataTable;