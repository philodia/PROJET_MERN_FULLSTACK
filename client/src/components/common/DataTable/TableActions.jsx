// frontend/src/components/common/DataTable/TableActions.jsx
import React from 'react';
import PropTypes from 'prop-types';
//import { ButtonGroup } from 'react-bootstrap'; // Optionnel, pour grouper les boutons/icônes
import Icon from '../Icon'; // Votre composant Icon
import TooltipWrapper from '../TooltipWrapper'; // Votre composant TooltipWrapper
// import AppButton from '../AppButton'; // Si vous utilisez AppButton pour les actions

/**
 * Configuration pour une action individuelle.
 * @typedef {object} ActionConfig
 * @property {string} id - Identifiant unique de l'action (ex: 'view', 'edit', 'delete').
 * @property {string} iconName - Nom de l'icône à afficher (ex: 'FaEye', 'FaPencilAlt', 'FaTrash').
 * @property {string} [iconLib] - Bibliothèque de l'icône si non incluse dans iconName.
 * @property {string} label - Texte du tooltip ou de l'aria-label pour l'icône.
 * @property {function} onClick - Callback appelé avec l'item de la ligne lorsque l'action est cliquée.
 * @property {string} [variant='link'] - Variante de style pour l'icône/bouton (ex: 'link', 'danger' pour supprimer).
 * @property {boolean} [disabled=false] - Si l'action doit être désactivée.
 * @property {function} [isHidden] - Fonction optionnelle pour masquer conditionnellement l'action (reçoit l'item en argument).
 * @property {string} [className] - Classes CSS supplémentaires pour l'icône/bouton.
 */

/**
 * Composant pour afficher un ensemble d'actions pour une ligne de DataTable.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.item - L'objet de données de la ligne actuelle.
 * @param {Array<ActionConfig>} props.actionsConfig - Configuration des actions à afficher.
 * @param {'icons' | 'buttons'} [props.displayMode='icons'] - Comment afficher les actions.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le conteneur des actions.
 */
const TableActions = ({
  item,
  actionsConfig,
  displayMode = 'icons',
  className = '',
}) => {
  if (!actionsConfig || actionsConfig.length === 0) {
    return null;
  }

  const renderAction = (action) => {
    if (action.isHidden && action.isHidden(item)) {
      return null;
    }

    const handleClick = (e) => {
      e.stopPropagation(); // Empêcher le déclenchement d'un éventuel onClick sur la ligne
      if (action.onClick && !action.disabled) {
        action.onClick(item);
      }
    };

    const actionKey = `${action.id}-${item.id || JSON.stringify(item)}`; // Clé unique

    if (displayMode === 'buttons') {
      // TODO: Implémenter l'affichage avec AppButton si nécessaire
      // return (
      //   <AppButton
      //     key={actionKey}
      //     onClick={handleClick}
      //     variant={action.variant || 'outline-secondary'}
      //     size="sm"
      //     disabled={action.disabled}
      //     className={`me-1 ${action.className || ''}`}
      //     title={action.label} // Tooltip natif du bouton
      //   >
      //     {action.iconName && <Icon name={action.iconName} lib={action.iconLib} style={{ marginRight: action.label ? '5px' : '0' }} />}
      //     {action.label} {/* Ou un label plus court si l'icône est présente */}
      //   </AppButton>
      // );
      // Pour l'instant, une version simple avec des icônes même en mode 'buttons' pour la démo
    }

    // Mode icônes par défaut (ou fallback pour mode 'buttons' non complètement implémenté)
    return (
      <TooltipWrapper key={actionKey} tooltipText={action.label} placement="top" id={`action-${action.id}-${item.id || 'item'}`}>
        <button
          type="button"
          className={`btn btn-link btn-sm p-1 table-action-icon ${action.variant === 'danger' ? 'text-danger' : ''} ${action.className || ''} ${action.disabled ? 'disabled' : ''}`}
          onClick={handleClick}
          disabled={action.disabled}
          aria-label={action.label}
          style={{ lineHeight: 1 }} // Pour un meilleur alignement vertical des icônes
        >
          <Icon name={action.iconName} lib={action.iconLib} size="1.1em" />
        </button>
      </TooltipWrapper>
    );
  };

  return (
    <div className={`table-actions d-flex justify-content-end align-items-center ${className}`}>
      {/* ButtonGroup peut être utilisé pour un meilleur style si plusieurs actions */}
      {/* <ButtonGroup size="sm"> */}
      {actionsConfig.map(renderAction).filter(Boolean) /* filter(Boolean) pour enlever les nulls (actions cachées) */}
      {/* </ButtonGroup> */}
    </div>
  );
};

TableActions.propTypes = {
  item: PropTypes.object.isRequired,
  actionsConfig: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      iconName: PropTypes.string.isRequired,
      iconLib: PropTypes.string,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      disabled: PropTypes.bool,
      isHidden: PropTypes.func,
      className: PropTypes.string,
    })
  ).isRequired,
  displayMode: PropTypes.oneOf(['icons', 'buttons']),
  className: PropTypes.string,
};

export default TableActions;