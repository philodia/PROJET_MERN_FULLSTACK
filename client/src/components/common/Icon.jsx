// frontend/src/components/common/Icon.jsx
import React from 'react';
import PropTypes from 'prop-types';
// Importez les sets d'icônes que vous prévoyez d'utiliser le plus.
// Exemple avec FontAwesome (fa) et Material Design Icons (md)
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BsIcons from 'react-icons/bs'; // Bootstrap Icons
import * as RiIcons from 'react-icons/ri'; // Remix Icon
// Ajoutez d'autres bibliothèques au besoin (ex: AiOutlineAntDesign, FiFeather)

// Mappage des préfixes de bibliothèques aux objets d'icônes importés
const iconLibraries = {
  fa: FaIcons,
  md: MdIcons,
  bs: BsIcons,
  ri: RiIcons,
  // Ajoutez d'autres préfixes ici si vous importez d'autres bibliothèques
  // exemple: ai: AiIcons, fi: FiIcons,
};

/**
 * Composant wrapper pour afficher des icônes de différentes bibliothèques (via react-icons).
 *
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.name - Le nom de l'icône (ex: 'FaUser', 'MdSettings', 'BsFillArchiveFill').
 *                              Le préfixe (Fa, Md, Bs) indique la bibliothèque.
 * @param {string} [props.lib='fa'] - Le préfixe de la bibliothèque d'icônes à utiliser par défaut si non spécifié dans 'name'.
 *                                   Supporté : 'fa', 'md', 'bs', 'ri'. (Extensible)
 * @param {string | number} [props.size] - La taille de l'icône (ex: '2em', 24).
 * @param {string} [props.color] - La couleur de l'icône.
 * @param {string} [props.className] - Classes CSS supplémentaires pour l'élément span wrapper.
 * @param {object} [props.style] - Styles en ligne supplémentaires pour l'élément span wrapper.
 * @param {string} [props.title] - Texte pour l'attribut title (tooltip natif du navigateur).
 * @param {function} [props.onClick] - Fonction à appeler lors du clic sur l'icône.
 */
const Icon = ({
  name,
  lib, // Laisser lib optionnel pour déduire du nom de l'icône
  size,
  color,
  className = '',
  style = {},
  title,
  onClick,
  ...otherProps // Pour d'autres props passées au composant icône lui-même
}) => {
  let IconComponent;
  let effectiveLibPrefix = lib;

  // Essayer de déduire la bibliothèque du nom de l'icône s'il a un préfixe connu
  if (name) {
    const match = name.match(/^(Fa|Md|Bs|Ri|Ai|Fi|Gi|Go|Gr|Im|Io|Io5|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)([A-Z0-9].*)/);
    if (match && match[1]) {
      effectiveLibPrefix = match[1].toLowerCase(); // ex: 'fa', 'md'
      // Le nom de l'icône est déjà complet, pas besoin de le préfixer
    }
  }


  if (!effectiveLibPrefix && !lib) {
     // Si aucune bibliothèque n'est déduite ou fournie, utiliser 'fa' par défaut ou afficher une erreur.
     // Pour cet exemple, on va juste logguer une erreur et ne rien rendre.
     console.error(`Icon: Bibliothèque non spécifiée ou non déductible pour l'icône '${name}'. Veuillez fournir la prop 'lib' ou utiliser un nom d'icône préfixé (ex: 'FaUser').`);
     return null;
  }


  const selectedLibrary = iconLibraries[effectiveLibPrefix];

  if (!selectedLibrary) {
    console.error(`Icon: Bibliothèque d'icônes '${effectiveLibPrefix}' non supportée ou non importée dans Icon.jsx.`);
    return null;
  }

  IconComponent = selectedLibrary[name];

  if (!IconComponent) {
    // Tentative de recherche sans le préfixe si le préfixe était dans le nom
    // ex: si name="FaUser" et effectiveLibPrefix="fa", on a déjà le bon IconComponent.
    // Mais si name="User" et lib="fa", il faut chercher "FaUser"
    const nameWithoutLibPrefix = name.startsWith(effectiveLibPrefix.charAt(0).toUpperCase() + effectiveLibPrefix.slice(1))
      ? name
      : effectiveLibPrefix.charAt(0).toUpperCase() + effectiveLibPrefix.slice(1) + name;

    IconComponent = selectedLibrary[nameWithoutLibPrefix];

    if (!IconComponent) {
        console.error(`Icon: Icône '${name}' (ou '${nameWithoutLibPrefix}') introuvable dans la bibliothèque '${effectiveLibPrefix}'.`);
        return null;
    }
  }

  const iconStyle = {
    ...style, // Styles passés en prop
    fontSize: size,
    color: color,
  };

  // Ajout de `cursor: pointer` si onClick est fourni
  if (onClick) {
    iconStyle.cursor = 'pointer';
  }

  return (
    <span
      className={`app-icon ${className}`}
      style={iconStyle}
      title={title}
      onClick={onClick}
      role={onClick ? 'button' : undefined} // Sémantique si cliquable
      tabIndex={onClick ? 0 : undefined}   // Rendre focusable si cliquable
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
      aria-hidden={!title && !onClick} // Si purement décoratif
      {...otherProps} // Permet de passer des props comme aria-label si nécessaire
    >
      <IconComponent />
    </span>
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  lib: PropTypes.oneOf(Object.keys(iconLibraries)),
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  color: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  title: PropTypes.string,
  onClick: PropTypes.func,
};

export default Icon;