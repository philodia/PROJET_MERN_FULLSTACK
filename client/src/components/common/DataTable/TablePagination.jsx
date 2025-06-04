// frontend/src/components/common/DataTable/TablePagination.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Pagination from 'react-bootstrap/Pagination';

/**
 * Calcule les numéros de page à afficher, incluant les ellipses.
 * @param {number} currentPage - La page actuelle (base 1).
 * @param {number} totalPages - Le nombre total de pages.
 * @param {number} pageNeighbours - Nombre de numéros de page à afficher de chaque côté de la page actuelle.
 * @returns {Array<string|number>} Tableau des éléments de pagination (numéros ou '...' ou 'LEFT_ELLIPSIS', 'RIGHT_ELLIPSIS').
 */
const getPageNumbers = (currentPage, totalPages, pageNeighbours = 1) => {
  const totalNumbers = (pageNeighbours * 2) + 3; // Page actuelle + voisins + première/dernière page + 2 ellipses max
  const totalBlocks = totalNumbers + 2; // Inclut les deux ellipses si nécessaires

  if (totalPages <= totalBlocks) {
    // Si peu de pages, afficher tous les numéros
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const leftBound = Math.max(2, currentPage - pageNeighbours);
  const rightBound = Math.min(totalPages - 1, currentPage + pageNeighbours);

  pages.push(1); // Toujours afficher la première page

  // Ellipse gauche
  if (leftBound > 2) {
    pages.push('LEFT_ELLIPSIS');
  }

  // Numéros autour de la page actuelle
  for (let i = leftBound; i <= rightBound; i++) {
    pages.push(i);
  }

  // Ellipse droite
  if (rightBound < totalPages - 1) {
    pages.push('RIGHT_ELLIPSIS');
  }

  pages.push(totalPages); // Toujours afficher la dernière page

  return pages;
};


/**
 * Composant de pagination pour DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {number} props.currentPage - La page actuelle (commence à 1).
 * @param {number} props.totalPages - Le nombre total de pages.
 * @param {function} props.onPageChange - Callback appelé avec le nouveau numéro de page lorsque l'utilisateur change de page.
 * @param {number} [props.pageNeighbours=1] - Nombre de numéros de page à afficher de chaque côté de la page actuelle.
 * @param {boolean} [props.showFirstLastButtons=true] - Afficher les boutons "Première" et "Dernière" page.
 * @param {string} [props.className] - Classes CSS supplémentaires.
 * @param {object} [props.style] - Styles en ligne.
 */
const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageNeighbours = 1,
  showFirstLastButtons = true,
  className = '',
  style = {},
}) => {
  if (totalPages <= 1) {
    return null; // Ne rien afficher si une seule page ou moins
  }

  const handlePageClick = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const pageNumbersToDisplay = getPageNumbers(currentPage, totalPages, pageNeighbours);

  return (
    <Pagination className={`justify-content-center ${className}`} style={style}>
      {showFirstLastButtons && (
        <Pagination.First
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          aria-label="Première page"
        />
      )}
      <Pagination.Prev
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Page précédente"
      />

      {pageNumbersToDisplay.map((page, index) => {
        if (page === 'LEFT_ELLIPSIS' || page === 'RIGHT_ELLIPSIS') {
          return <Pagination.Ellipsis key={`${page}-${index}`} disabled />;
        }
        return (
          <Pagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => handlePageClick(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Pagination.Item>
        );
      })}

      <Pagination.Next
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
      />
      {showFirstLastButtons && (
        <Pagination.Last
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Dernière page"
        />
      )}
    </Pagination>
  );
};

TablePagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  pageNeighbours: PropTypes.number,
  showFirstLastButtons: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default TablePagination;