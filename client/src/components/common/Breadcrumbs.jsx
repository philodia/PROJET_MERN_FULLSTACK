// frontend/src/components/common/Breadcrumbs.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import Breadcrumb from 'react-bootstrap/Breadcrumb'; // Utilisation de React-Bootstrap pour le style

/**
 * Composant de fil d'Ariane dynamique basé sur le chemin de l'URL.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.pathTranslations] - Un objet pour traduire les segments de chemin en noms lisibles.
 *                                            Ex: { users: 'Utilisateurs', edit: 'Modifier' }
 * @param {string} [props.homeName='Accueil'] - Le nom pour le lien racine ('/').
 * @param {string} [props.className] - Classes CSS supplémentaires pour le conteneur Breadcrumb.
 */
const AppBreadcrumbs = ({ pathTranslations = {}, homeName = 'Accueil', className = '' }) => {
  const location = useLocation();
  const { pathname } = location;

  // Gérer le cas où le pathname est vide ou juste '/'
  if (pathname === '/') {
    return (
      <Breadcrumb className={className} listProps={{ 'aria-label': 'breadcrumb' }}>
        <Breadcrumb.Item active>{homeName}</Breadcrumb.Item>
      </Breadcrumb>
    );
  }

  const pathnames = pathname.split('/').filter((x) => x); // Divise et retire les segments vides

  if (pathnames.length === 0 && pathname !== '/') { // Devrait être géré par le cas '/' ci-dessus mais sécurité
      return null;
  }

  // Fonction pour capitaliser la première lettre d'une chaîne
  const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <Breadcrumb className={className} listProps={{ 'aria-label': 'breadcrumb' }}>
      <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
        {homeName}
      </Breadcrumb.Item>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        // Tenter de traduire ou utiliser le nom capitalisé
        // Gérer les paramètres de route (ex: /users/:id) - pour l'instant, on affiche l'ID
        // Une logique plus avancée pourrait remplacer :id par le nom de l'utilisateur, par exemple.
        let displayName = pathTranslations[name.toLowerCase()] || capitalize(name.replace(/-/g, ' '));

        // Exemple de gestion simple si 'name' est un ID (à améliorer avec une logique plus robuste)
        // Si vous avez un moyen de récupérer le nom de l'entité via l'ID, ce serait mieux.
        // if (name.match(/^[0-9a-fA-F]{24}$/) && pathnames[index-1]) { // Regex simple pour un ID MongoDB
        //   const prevSegment = pathnames[index-1].toLowerCase();
        //   if (pathTranslations[prevSegment]) {
        //     displayName = `${pathTranslations[prevSegment]} Détail`; // Ou l'ID lui-même
        //   }
        // }


        return isLast ? (
          <Breadcrumb.Item active key={routeTo}>
            {displayName}
          </Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item key={routeTo} linkAs={Link} linkProps={{ to: routeTo }}>
            {displayName}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
};

AppBreadcrumbs.propTypes = {
  pathTranslations: PropTypes.object,
  homeName: PropTypes.string,
  className: PropTypes.string,
};

export default AppBreadcrumbs;