// frontend/src/components/common/DataTable/TableCell.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns'; // Exemple pour le formatage des dates
import { fr } from 'date-fns/locale'; // Pour la localisation française des dates

import StatusBadge from '../StatusBadge'; // Votre composant StatusBadge
import Icon from '../Icon';               // Votre composant Icon
// import TooltipWrapper from '../TooltipWrapper'; // Si besoin de tooltips sur des textes longs

// Fonction utilitaire pour obtenir une valeur imbriquée d'un objet
// Ex: getValueFromPath(item, 'client.name') -> item.client.name
const getValueFromPath = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// Fonction utilitaire pour formater les devises (exemple simple)
const formatCurrency = (value, currency = 'EUR', locale = 'fr-FR') => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return ''; // Ou '-', ou une autre valeur par défaut
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(value);
};


/**
 * Composant pour afficher une cellule individuelle dans un DataTable.
 * Gère le rendu basé sur le type de données de la colonne.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.item - L'objet de données de la ligne actuelle.
 * @param {object} props.column - La configuration de la colonne actuelle.
 *        Doit contenir au moins `accessor` (ou `dataKey`) et peut contenir `dataType`, `render`, `format`.
 * @param {string} [props.className] - Classes CSS supplémentaires pour la cellule <td>.
 */
const TableCell = ({ item, column, className = '' }) => {
  const {
    accessor,     // Clé pour accéder à la valeur dans l'item (ex: 'name', 'client.address.city')
    dataKey,      // Alias pour accessor, courant dans certaines libs de table
    dataType = 'text', // Type de données pour le formatage/rendu ('text', 'number', 'currency', 'date', 'boolean', 'status', 'actions', 'custom')
    render,       // Fonction de rendu personnalisée pour cette cellule (item, column) => React.ReactNode
    dateFormat = 'dd/MM/yyyy HH:mm', // Format pour les dates
    currencyOptions = { currency: 'EUR', locale: 'fr-FR' }, // Options pour le formatage de devise
    statusMap,    // Mappage pour les statuts (ex: { 'active': { text: 'Actif', variant: 'success' }})
    trueIcon = { name: 'FaCheckCircle', color: 'var(--bs-success)' }, // Pour dataType 'boolean'
    falseIcon = { name: 'FaTimesCircle', color: 'var(--bs-danger)' }, // Pour dataType 'boolean'
    onClick,      // Fonction onClick pour la cellule (item, column)
    cellClassName, // Classe CSS spécifique à la cellule via la configuration de colonne
    cellStyle,     // Style en ligne spécifique à la cellule via la configuration de colonne
  } = column;

  // Si une fonction de rendu personnalisée est fournie, l'utiliser.
  if (typeof render === 'function') {
    return <td className={`${cellClassName || ''} ${className}`} style={cellStyle} onClick={onClick ? () => onClick(item, column) : undefined}>{render(item, column)}</td>;
  }

  const path = accessor || dataKey;
  let value = getValueFromPath(item, path);
  let content = value; // Contenu par défaut est la valeur brute

  switch (dataType) {
    case 'number':
      content = (value !== null && value !== undefined) ? Number(value).toLocaleString(currencyOptions.locale) : '-';
      break;
    case 'currency':
      content = formatCurrency(value, currencyOptions.currency, currencyOptions.locale);
      break;
    case 'date':
      try {
        content = value ? format(new Date(value), dateFormat, { locale: fr }) : '-';
      } catch (error) {
        console.warn(`TableCell: Erreur de formatage de date pour la valeur "${value}" avec le format "${dateFormat}".`, error);
        content = String(value); // Afficher la valeur brute en cas d'erreur
      }
      break;
    case 'datetime': // Alias pour date si le format inclut l'heure
        try {
            content = value ? format(new Date(value), dateFormat, { locale: fr }) : '-';
          } catch (error) {
            console.warn(`TableCell: Erreur de formatage de date pour la valeur "${value}" avec le format "${dateFormat}".`, error);
            content = String(value);
          }
        break;
    case 'boolean':
      content = value ? (
        <Icon name={trueIcon.name} color={trueIcon.color} size="1.2em" lib={trueIcon.lib} />
      ) : (
        <Icon name={falseIcon.name} color={falseIcon.color} size="1.2em" lib={falseIcon.lib} />
      );
      break;
    case 'status':
      // Utilise StatusBadge ou StatusIndicator
      // `statusMap` pourrait être : { 'pending': { text: 'En attente', variant: 'warning' }, 'completed': { text: 'Terminé', variant: 'success' } }
      // Ou `value` pourrait être un objet { text: 'Actif', variant: 'success' }
      if (statusMap && statusMap[value]) {
        const statusConfig = statusMap[value];
        content = <StatusBadge variant={statusConfig.variant || 'secondary'} pillSize="sm">{statusConfig.text || value}</StatusBadge>;
      } else if (typeof value === 'object' && value !== null && value.text && value.variant) {
        content = <StatusBadge variant={value.variant} pillSize="sm">{value.text}</StatusBadge>;
      } else {
        content = <StatusBadge variant="secondary" pillSize="sm">{String(value)}</StatusBadge>; // Fallback
      }
      break;
    case 'actions':
      // Ce cas est généralement géré par une fonction `render` personnalisée
      // qui utiliserait le composant `TableActions`.
      // Si vous voulez une gestion par défaut ici, ce serait limité.
      content = 'Actions non configurées';
      break;
    case 'text':
    default:
      // Pour les textes longs, un tooltip pourrait être utile.
      // if (typeof value === 'string' && value.length > 50) { // Seuil arbitraire
      //   content = (
      //     <TooltipWrapper tooltipText={value} placement="top">
      //       <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '200px' /* Ajuster */ }}>
      //         {value}
      //       </span>
      //     </TooltipWrapper>
      //   );
      // } else {
      content = (value !== null && value !== undefined) ? String(value) : '-';
      // }
      break;
  }

  const tdClassName = [
    dataType ? `td-${dataType}` : '', // Classe basée sur le type de données (ex: td-currency)
    cellClassName || '',
    className,
  ].filter(Boolean).join(' ');

  return <td className={tdClassName} style={cellStyle} onClick={onClick ? () => onClick(item, column) : undefined}>{content}</td>;
};

TableCell.propTypes = {
  item: PropTypes.object.isRequired,
  column: PropTypes.shape({
    accessor: PropTypes.string, // Ou dataKey
    dataKey: PropTypes.string,  // Ou accessor
    dataType: PropTypes.oneOf(['text', 'number', 'currency', 'date', 'datetime', 'boolean', 'status', 'actions', 'custom']),
    render: PropTypes.func,
    dateFormat: PropTypes.string,
    currencyOptions: PropTypes.shape({
      currency: PropTypes.string,
      locale: PropTypes.string,
    }),
    statusMap: PropTypes.object,
    trueIcon: PropTypes.shape({ name: PropTypes.string.isRequired, color: PropTypes.string, lib: PropTypes.string }),
    falseIcon: PropTypes.shape({ name: PropTypes.string.isRequired, color: PropTypes.string, lib: PropTypes.string }),
    onClick: PropTypes.func,
    cellClassName: PropTypes.string,
    cellStyle: PropTypes.object,
  }).isRequired,
  className: PropTypes.string,
};

export default TableCell;