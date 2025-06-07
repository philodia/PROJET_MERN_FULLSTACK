// frontend/src/components/common/SearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';
import debounce from 'lodash.debounce';

const SearchBar = ({
  onSearch,
  placeholder = 'Rechercher...',
  delay = 300,
  initialValue = '',
  showClearButton = true,
  className = '',
  size, // 'sm' ou 'lg'
  searchOnMountIfInitialValue = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const isMountedRef = useRef(false);
  const inputRef = useRef(null);
  const onSearchRef = useRef(onSearch);
  const debouncedSearchRef = useRef();

  // Mise à jour des références
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Initialisation et mise à jour du debounce
  useEffect(() => {
    debouncedSearchRef.current = debounce(
      (term) => onSearchRef.current(term),
      delay
    );

    return () => {
      debouncedSearchRef.current.cancel();
    };
  }, [delay]);

  // Synchronisation avec la valeur initiale externe
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Gestion des recherches
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (searchOnMountIfInitialValue && initialValue) {
        onSearchRef.current(initialValue);
      }
      return;
    }

    debouncedSearchRef.current(searchTerm);
  }, [searchTerm, initialValue, searchOnMountIfInitialValue]);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    debouncedSearchRef.current.cancel();
    onSearchRef.current('');
    inputRef.current?.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    debouncedSearchRef.current.cancel();
    onSearchRef.current(searchTerm);
  };

  return (
    <Form onSubmit={handleSubmit} className={`d-flex ${className}`}>
      <InputGroup size={size}>
        <Form.Control
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleChange}
          aria-label={placeholder}
        />
        {showClearButton && searchTerm && (
          <Button
            variant="outline-secondary"
            onClick={handleClear}
            title="Effacer la recherche"
            type="button"
          >
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
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  delay: PropTypes.number,
  initialValue: PropTypes.string,
  showClearButton: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'lg']),
  searchOnMountIfInitialValue: PropTypes.bool,
};

export default SearchBar;