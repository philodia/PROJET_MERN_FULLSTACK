// frontend/src/components/common/CustomPagination.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Pagination from 'react-bootstrap/Pagination';

/**
 * Composant de pagination réutilisable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {number} props.currentPage - La page actuellement active (1-indexée).
 * @param {number} props.totalPages - Le nombre total de pages.
 * @param {function} props.onPageChange - Callback appelée lorsqu'une page est cliquée. Prend le numéro de page en argument.
 * @param {number} [props.pageNeighbours=1] - Nombre de pages à afficher de chaque côté de la page actuelle.
 * @param {string} [props.className=''] - Classes CSS supplémentaires pour le conteneur Pagination.
 * @param {object} [props.paginationProps] - Props supplémentaires pour le composant Pagination de React-Bootstrap.
 */
const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageNeighbours = 1, // Valeur par défaut, peut être ajustée
  className = '',
  paginationProps = {},
}) => {
  if (totalPages <= 1) {
    return null; // Pas besoin de pagination s'il n'y a qu'une page ou moins
  }

  const buildPageNumbers = () => {
    const pageNumbers = [];
    const totalNumbers = pageNeighbours * 2 + 3; // Page actuelle + voisins de chaque côté + première + dernière + 2 ellipses
    const totalBlocks = totalNumbers + 2; // totalNumbers + 2 pour les ellipses potentielles

    if (totalPages <= totalBlocks) {
      // Moins de pages que de blocs à afficher, donc on affiche tout
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      let startPage = Math.max(2, currentPage - pageNeighbours);
      let endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);

      // Ajuster si la plage est trop petite à cause des limites
      const pagesToShow = endPage - startPage + 1;
      const requiredPagesWithoutEllipses = pageNeighbours * 2 +1;

      if (pagesToShow < requiredPagesWithoutEllipses) {
          if (currentPage < (totalPages / 2)) { // Plus proche du début
              endPage = Math.min(totalPages - 1, startPage + requiredPagesWithoutEllipses -1);
          } else { // Plus proche de la fin
              startPage = Math.max(2, endPage - requiredPagesWithoutEllipses + 1);
          }
      }


      // Première page
      pageNumbers.push(
        <Pagination.Item
          key={1}
          active={1 === currentPage}
          onClick={() => onPageChange(1)}
        >
          1
        </Pagination.Item>
      );

      // Ellipse de début
      if (startPage > 2) {
        pageNumbers.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
      }

      // Pages du milieu
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      // Ellipse de fin
      if (endPage < totalPages - 1) {
        pageNumbers.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
      }

      // Dernière page
      pageNumbers.push(
        <Pagination.Item
          key={totalPages}
          active={totalPages === currentPage}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    return pageNumbers;
  };

  return (
    <div className={`d-flex justify-content-center ${className}`}>
        <Pagination {...paginationProps}>
        <Pagination.First
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
        />
        <Pagination.Prev
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
        />
        {buildPageNumbers()}
        <Pagination.Next
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
        />
        <Pagination.Last
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
        />
        </Pagination>
    </div>
  );
};

CustomPagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  pageNeighbours: PropTypes.number,
  className: PropTypes.string,
  paginationProps: PropTypes.object,
};

export default CustomPagination;