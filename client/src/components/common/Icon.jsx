// frontend/src/components/common/Icon.jsx
import React from 'react';
import PropTypes from 'prop-types';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BsIcons from 'react-icons/bs'; // Bootstrap Icons
import * as RiIcons from 'react-icons/ri'; // Remix Icon
// Exemple pour d'autres bibliothèques :
// import * as AiIcons from 'react-icons/ai'; // Ant Design Icons
// import * as FiIcons from 'react-icons/fi'; // Feather Icons

const iconLibraries = {
  fa: FaIcons,
  md: MdIcons,
  bs: BsIcons,
  ri: RiIcons,
  // ai: AiIcons, // Décommentez et importez si vous les utilisez
  // fi: FiIcons,
};

// Expression régulière pour détecter les préfixes de bibliothèque courants de react-icons
const LIB_PREFIX_REGEX = /^(Fa|Md|Bs|Ri|Ai|Fi|Gi|Go|Gr|Im|Io|Io5|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)/;

const Icon = ({
  name,
  lib,
  size,
  color,
  className = '',
  style = {},
  title,
  onClick,
  ...otherProps
}) => {
  // 1. Valider la prop 'name'
  if (typeof name !== 'string' || !name.trim()) {
    // console.warn('Icon: La prop "name" est requise et doit être une chaîne de caractères non vide.');
    // Retourner null ou un placeholder si le nom est invalide.
    // Pour l'erreur "Objects are not valid...", il est crucial de ne pas retourner un objet.
    return null;
  }

  let IconComponent;
  let effectiveLibPrefix = lib ? lib.toLowerCase() : null; // Priorité à la prop 'lib' si fournie
  let iconNameInLibrary = name;

  // 2. Déterminer la bibliothèque et le nom de l'icône
  const nameMatch = name.match(LIB_PREFIX_REGEX);
  const detectedLibPrefixInName = nameMatch ? nameMatch[1].toLowerCase() : null;

  if (effectiveLibPrefix) { // Si 'lib' est fournie
    // Si 'name' contient un préfixe différent de 'lib', on le retire de 'name'
    // et on reconstruit le nom avec le préfixe de 'lib'.
    if (detectedLibPrefixInName && detectedLibPrefixInName !== effectiveLibPrefix) {
      iconNameInLibrary = effectiveLibPrefix.charAt(0).toUpperCase() + effectiveLibPrefix.slice(1) + name.substring(detectedLibPrefixInName.length);
    } else if (!detectedLibPrefixInName) { // Si 'name' n'a pas de préfixe, on ajoute celui de 'lib'
      iconNameInLibrary = effectiveLibPrefix.charAt(0).toUpperCase() + effectiveLibPrefix.slice(1) + name;
    }
    // Si detectedLibPrefixInName === effectiveLibPrefix, iconNameInLibrary (qui est name) est déjà correct.
  } else if (detectedLibPrefixInName) { // Si 'lib' n'est pas fournie, mais 'name' a un préfixe
    effectiveLibPrefix = detectedLibPrefixInName;
    // iconNameInLibrary (qui est name) est déjà correct.
  } else {
    // Ni 'lib' fournie, ni préfixe détectable dans 'name'.
    console.error(`Icon: Bibliothèque non spécifiée ou non déductible pour l'icône '${name}'. Utilisez la prop 'lib' ou un nom préfixé (ex: 'FaUser').`);
    return null;
  }

  // 3. Sélectionner la bibliothèque
  const selectedLibrary = iconLibraries[effectiveLibPrefix];
  if (!selectedLibrary) {
    console.error(`Icon: Bibliothèque d'icônes '${effectiveLibPrefix}' non supportée ou non importée dans Icon.jsx.`);
    return null;
  }

  // 4. Obtenir le composant icône
  IconComponent = selectedLibrary[iconNameInLibrary];

  if (!IconComponent) {
    // Si la première tentative a échoué (ex: 'lib' fournie mais 'name' avait déjà un préfixe),
    // essayer avec 'name' tel quel si 'lib' n'était pas la source du préfixe.
    // Ce cas est principalement pour si 'name' est "FaUser" et 'lib="fa"' a été fourni,
    // iconNameInLibrary serait "FaFaUser" ce qui est faux.
    // La logique ci-dessus tente déjà de gérer ça, mais comme double sécurité :
    if (lib && name !== iconNameInLibrary && selectedLibrary[name]) {
        IconComponent = selectedLibrary[name];
    } else {
        console.error(`Icon: Icône '${iconNameInLibrary}' (ou '${name}') introuvable dans la bibliothèque '${effectiveLibPrefix}'. Vérifiez le nom et la casse.`);
        return null;
    }
  }


  // 5. Préparer les styles et props pour le span wrapper
  const wrapperStyle = {
    display: 'inline-flex', // Pour un meilleur alignement et pour que le span prenne la taille de l'icône
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size, // Appliquer size ici pour que l'icône SVG hérite via '1em'
    color: color,
    ...style,
  };

  if (onClick) {
    wrapperStyle.cursor = 'pointer';
  }

  // 6. Rendre le span avec l'icône
  return (
    <span
      className={`app-icon ${className}`}
      style={wrapperStyle}
      title={title}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
      aria-hidden={!title && !onClick && !otherProps['aria-label'] ? true : undefined} // aria-hidden si purement décoratif
      {...otherProps} // Permet de passer aria-label, etc.
    >
      <IconComponent style={{ width: '1em', height: '1em' }} /> {/* Assurer que l'icône remplit le span */}
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