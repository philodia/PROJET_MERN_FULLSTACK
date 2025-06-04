// frontend/src/components/common/SearchBar.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';
import debounce from 'lodash.debounce'; // Ou import { debounce } from 'lodash'; si vous avez tout lodash

const SearchBar = ({
  onSearch,
  placeholder = 'Rechercher...',
  delay = 300,
  initialValue = '',
  showClearButton = true,
  className = '',
  // Option: ajouter une prop pour décider si on recherche au montage avec initialValue
  // searchOnMountIfInitial = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  // useRef pour suivre si le composant est monté et a passé son premier rendu.
  // Cela évite de déclencher le debounce au montage initial.
  const isMountedAndPastFirstRenderRef = useRef(false);

  // Mémorise la fonction debounced. Elle ne sera recréée que si onSearch ou delay changent.
  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term); // onSearch est marqué comme isRequired, donc pas besoin de ?.
    }, delay),
    [onSearch, delay] // Dépendances correctes pour useCallback
  );

  // Synchronise searchTerm si initialValue (prop) change de l'extérieur.
  useEffect(() => {
    // Si initialValue change, on met à jour notre état interne searchTerm.
    // Cela pourrait déclencher l'effet ci-dessous si searchTerm est modifié.
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Gère le déclenchement du debounce lorsque searchTerm change.
  useEffect(() => {
    if (isMountedAndPastFirstRenderRef.current) {
      // Si le composant est monté et que ce n'est pas le premier rendu,
      // et que searchTerm change, on lance la recherche debouncée.
      debouncedSearch(searchTerm);
    } else {
      // Au premier rendu (montage) :
      isMountedAndPastFirstRenderRef.current = true;

      // Comportement optionnel : si on veut effectuer une recherche initiale avec initialValue au montage
      // if (initialValue && searchOnMountIfInitial) {
      //   onSearch(initialValue); // Recherche immédiate
      // }
      // Note: si searchOnMountIfInitial était true, cela se ferait sans debounce.
      // Un debounce au montage est rarement ce qu'on veut pour la valeur initiale.
    }

    // Fonction de nettoyage pour annuler le debounce si le composant est démonté
    // ou si searchTerm change avant la fin du délai (ce qui relance cet effet).
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]); // Dépendances de l'effet. Si searchTerm ou debouncedSearch changent, l'effet est relancé.

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    debouncedSearch.cancel(); // Annuler tout debounce en cours
    onSearch(''); // Notifier immédiatement le parent que la recherche est effacée
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    debouncedSearch.cancel(); // Annuler tout debounce en cours
    onSearch(searchTerm); // Rechercher immédiatement
  };

  return (
    <Form onSubmit={handleSubmit} className={`d-flex ${className}`}>
      <InputGroup>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleChange}
          aria-label={placeholder}
        />
        {showClearButton && searchTerm && ( // Affiche le bouton seulement si showClearButton est true ET searchTerm n'est pas vide
          <Button variant="outline-secondary" onClick={handleClear} title="Effacer la recherche">
            <FaTimes />
          </Button>
        )}
        <Button variant="primary" type="submit" title="Rechercher">
          <FaSearch />
        </Button>
      </InputGroup>
    </Form>
  );
};

SearchBar.propTypes = {
  /**
   * Fonction callback appelée lorsque la recherche est soumise ou après le délai de debounce.
   * Reçoit le terme de recherche en argument.
   */
  onSearch: PropTypes.func.isRequired,
  /**
   * Texte indicatif pour le champ de recherche.
   */
  placeholder: PropTypes.string,
  /**
   * Délai en millisecondes avant que la fonction onSearch ne soit appelée après la dernière frappe.
   */
  delay: PropTypes.number,
  /**
   * Valeur initiale pour le champ de recherche.
   */
  initialValue: PropTypes.string,
  /**
   * Détermine si le bouton d'effacement doit être affiché lorsque le champ n'est pas vide.
   */
  showClearButton: PropTypes.bool,
  /**
   * Classes CSS additionnelles pour le conteneur du formulaire.
   */
  className: PropTypes.string,
  // searchOnMountIfInitial: PropTypes.bool, // Si vous ajoutez la prop pour recherche au montage
};

export default SearchBar;