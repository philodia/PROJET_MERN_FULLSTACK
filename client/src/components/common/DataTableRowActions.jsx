// frontend/src/components/common/DataTableRowActions.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa';
import AppButton from './AppButton'; // Votre composant de bouton personnalisé
// import Button from 'react-bootstrap/Button'; // Alternative si vous n'utilisez pas AppButton
// import ButtonGroup from 'react-bootstrap/ButtonGroup'; // Pour regrouper les boutons

/**
 * Composant pour afficher les boutons d'action courants pour une ligne de DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.row - L'objet de données original pour la ligne actuelle.
 * @param {function} [props.onEdit] - Fonction à appeler lors du clic sur le bouton "Modifier". Prend `row` en argument.
 * @param {function} [props.onDelete] - Fonction à appeler lors du clic sur le bouton "Supprimer". Prend `row` en argument.
 * @param {function} [props.onView] - Fonction à appeler lors du clic sur le bouton "Voir". Prend `row` en argument.
 * @param {boolean} [props.showEdit=true] - Afficher ou masquer le bouton "Modifier".
 * @param {boolean} [props.showDelete=true] - Afficher ou masquer le bouton "Supprimer".
 * @param {boolean} [props.showView=true] - Afficher ou masquer le bouton "Voir".
 * @param {boolean} [props.isDeleting=false] - Si l'action de suppression est en cours (pour l'état de chargement du bouton).
 * @param {object} [props.editButtonProps] - Props supplémentaires pour le bouton de modification (ex: variant, className).
 * @param {object} [props.deleteButtonProps] - Props supplémentaires pour le bouton de suppression.
 * @param {object} [props.viewButtonProps] - Props supplémentaires pour le bouton de visualisation.
 * @param {string} [props.className] - Classe CSS pour le conteneur des boutons.
 */
const DataTableRowActions = ({
  row,
  onEdit,
  onDelete,
  onView,
  showEdit = true,
  showDelete = true,
  showView = true,
  isDeleting = false, // Pour le spinner sur le bouton supprimer
  editButtonProps = {},
  deleteButtonProps = {},
  viewButtonProps = {},
  className = "d-flex justify-content-start align-items-center", // Alignement par défaut
}) => {

  const handleEdit = (e) => {
    e.stopPropagation(); // Empêcher le onRowClick du DataTable de se déclencher
    if (onEdit) onEdit(row);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(row);
  };

  const handleView = (e) => {
    e.stopPropagation();
    if (onView) onView(row);
  };

  // Si aucune action n'est à afficher, ne rien rendre
  if (!onEdit && !onDelete && !onView) {
      if (!showEdit && !showDelete && !showView) { // Ou si elles sont explicitement masquées
        return null;
      }
  }


  return (
    <div className={className} style={{ gap: '0.25rem' }}> {/* `gap` pour l'espacement */}
      {showView && onView && (
        <AppButton
          variant="outline-info"
          size="sm"
          onClick={handleView}
          title="Voir les détails"
          {...viewButtonProps}
        >
          <FaEye />
        </AppButton>
      )}
      {showEdit && onEdit && (
        <AppButton
          variant="outline-primary"
          size="sm"
          onClick={handleEdit}
          title="Modifier"
          {...editButtonProps}
        >
          <FaEdit />
        </AppButton>
      )}
      {showDelete && onDelete && (
        <AppButton
          variant="outline-danger"
          size="sm"
          onClick={handleDelete}
          isLoading={isDeleting} // Utilisez isLoading de AppButton
          loadingText="" // Pas de texte à côté du spinner pour un petit bouton icône
          title="Supprimer"
          {...deleteButtonProps}
        >
         {!isDeleting && <FaTrashAlt />}
        </AppButton>
      )}
    </div>
  );
};

DataTableRowActions.propTypes = {
  row: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  showEdit: PropTypes.bool,
  showDelete: PropTypes.bool,
  showView: PropTypes.bool,
  isDeleting: PropTypes.bool,
  editButtonProps: PropTypes.object,
  deleteButtonProps: PropTypes.object,
  viewButtonProps: PropTypes.object,
  className: PropTypes.string,
};

export default DataTableRowActions;