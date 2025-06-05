// frontend/src/components/accounting/ChartOfAccountNode.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ListGroup, Collapse, Button } from 'react-bootstrap';
import Icon from '../common/Icon';
import './ChartOfAccountNode.scss'; // Fichier SCSS pour les styles personnalisés

/**
 * Structure d'un nœud du plan comptable.
 * @typedef {object} COANode
 * @property {string} id - Identifiant unique du compte.
 * @property {string} accountNumber - Numéro du compte (ex: "411000").
 * @property {string} accountName - Nom du compte (ex: "Clients").
 * @property {string} type - Type de compte (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE).
 * @property {Array<COANode>} [children] - Tableau des comptes enfants (pour la structure hiérarchique).
 * @property {boolean} [isSelectable=true] - Si le nœud peut être sélectionné.
 * @property {boolean} [isClickable=false] - Si le nœud doit déclencher une action au clic (en dehors de la sélection).
 */

/**
 * Affiche un nœud (compte) du plan comptable et ses enfants,
 * avec possibilité de déplier/replier.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {COANode} props.node - L'objet du nœud de compte à afficher.
 * @param {number} [props.level=0] - Niveau d'indentation (pour le style).
 * @param {function} [props.onNodeSelect] - Callback appelé avec le nœud lorsque celui-ci est sélectionné.
 * @param {string} [props.selectedAccountId] - ID du compte actuellement sélectionné.
 * @param {function} [props.onNodeClick] - Callback appelé avec le nœud lorsque le nom du compte est cliqué (si isClickable).
 * @param {boolean} [props.initiallyOpen=false] - Si le nœud doit être ouvert initialement (s'il a des enfants).
 */
const ChartOfAccountNode = ({
  node,
  level = 0,
  onNodeSelect,
  selectedAccountId,
  onNodeClick,
  initiallyOpen = false,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const [isOpen, setIsOpen] = useState(initiallyOpen && hasChildren);

  const handleToggleOpen = (e) => {
    e.stopPropagation(); // Empêcher onNodeClick si on clique sur le toggle
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (node.isClickable !== false && onNodeClick) {
        onNodeClick(node);
    }
  };

  const handleNodeSelection = (e) => {
    e.stopPropagation();
    if (node.isSelectable !== false && onNodeSelect) {
      onNodeSelect(node);
    }
  };

  const isSelected = selectedAccountId === node.id;
  const nodePaddingLeft = `${level * 1.5 + 0.75}rem`; // Indentation basée sur le niveau

  return (
    <>
      <ListGroup.Item
        action={!!(onNodeSelect && node.isSelectable !== false)} // Rendre cliquable pour la sélection
        active={isSelected}
        onClick={handleNodeSelection}
        className={`coa-node-item level-${level} ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: nodePaddingLeft }}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        <div className="d-flex align-items-center">
          {hasChildren && (
            <Button
              variant="link"
              size="sm"
              onClick={handleToggleOpen}
              className="coa-node-toggle p-0 me-2"
              aria-label={isOpen ? "Réduire" : "Étendre"}
            >
              <Icon name={isOpen ? 'BsChevronDown' : 'BsChevronRight'} size="0.8em" />
            </Button>
          )}
          {!hasChildren && (
            <span className="coa-node-spacer me-2" style={{ width: '1.2em', display: 'inline-block' }}></span> // Espace pour aligner avec les nœuds ayant des enfants
          )}

          <span
            className={`coa-node-label ${onNodeClick && node.isClickable !== false ? 'clickable-label' : ''}`}
            onClick={onNodeClick && node.isClickable !== false ? handleNodeClick : undefined}
            title={`${node.accountNumber} - ${node.accountName}`}
          >
            <span className="coa-node-number text-muted me-2">{node.accountNumber}</span>
            {node.accountName}
          </span>

          {/* Optionnel: Afficher le type de compte ou d'autres infos */}
          {/* <Badge pill bg="light" text="dark" className="ms-auto coa-node-type">{node.type}</Badge> */}
        </div>
      </ListGroup.Item>

      {hasChildren && (
        <Collapse in={isOpen}>
          <div className="coa-node-children">
            <ListGroup variant="flush" style={{ borderLeft: '1px solid #eee', marginLeft: `calc(${nodePaddingLeft} + 0.5rem)` }}> {/* Ligne d'indentation */}
              {node.children.map(childNode => (
                <ChartOfAccountNode
                  key={childNode.id}
                  node={childNode}
                  level={level + 1}
                  onNodeSelect={onNodeSelect}
                  selectedAccountId={selectedAccountId}
                  onNodeClick={onNodeClick}
                  initiallyOpen={false} // Les enfants ne sont pas ouverts par défaut, sauf si spécifié autrement
                />
              ))}
            </ListGroup>
          </div>
        </Collapse>
      )}
    </>
  );
};

ChartOfAccountNode.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string.isRequired,
    accountNumber: PropTypes.string.isRequired,
    accountName: PropTypes.string.isRequired,
    type: PropTypes.string, // ASSET, LIABILITY, etc.
    children: PropTypes.array, // Array of COANode
    isSelectable: PropTypes.bool,
    isClickable: PropTypes.bool,
  }).isRequired,
  level: PropTypes.number,
  onNodeSelect: PropTypes.func,
  selectedAccountId: PropTypes.string,
  onNodeClick: PropTypes.func,
  initiallyOpen: PropTypes.bool,
};

// Pour permettre la récursivité, si ChartOfAccountNode est utilisé dans une liste
// et que le propTypes de cette liste attend un tableau de ChartOfAccountNode.
// Cependant, avec la structure actuelle, `node.children` est un tableau de `COANode`
// et la prop `node` elle-même est de type `COANode`.
// Si vous aviez une prop `childNodes: PropTypes.arrayOf(ChartOfAccountNode.propTypes.node)` par exemple.
// ChartOfAccountNode.propTypes.node.children = PropTypes.arrayOf(PropTypes.shape(ChartOfAccountNode.propTypes.node));


export default ChartOfAccountNode;