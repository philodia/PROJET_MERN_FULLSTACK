// frontend/src/components/common/FileInput.jsx
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form, Button } from 'react-bootstrap';
import { FaUpload, FaTimes, FaFileAlt } from 'react-icons/fa'; // Icônes optionnelles

/**
 * Composant de champ de saisie de fichier personnalisé.
 * S'intègre avec Formik en utilisant la prop `form` et `field.name`
 * pour appeler `form.setFieldValue`.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} [props.field] - Objet field de Formik (contient name). Non utilisé pour `value`, `onChange`, `onBlur` directs.
 * @param {object} [props.form] - Objet form de Formik (contient setFieldValue, errors, touched).
 * @param {string} props.name - Nom du champ, utilisé pour Formik et comme ID.
 * @param {string} [props.label] - Étiquette à afficher au-dessus du champ.
 * @param {string} [props.placeholder='Aucun fichier sélectionné'] - Texte affiché lorsque aucun fichier n'est sélectionné.
 * @param {string} [props.buttonText='Choisir un fichier'] - Texte du bouton de sélection.
 * @param {string} [props.accept] - Attribut 'accept' pour le type de fichier (ex: 'image/*, .pdf').
 * @param {boolean} [props.multiple=false] - Permet la sélection de plusieurs fichiers.
 * @param {function} [props.onChange] - Callback personnalisé appelé avec l'objet File ou un tableau de FileList.
 * @param {number} [props.maxSizeMB=5] - Taille maximale autorisée par fichier en Mo.
 * @param {string} [props.className] - Classes CSS pour le conteneur du composant.
 * @param {boolean} [props.disabled=false] - Désactive le champ.
 */
const FileInput = ({
  field, // Contient { name } de Formik
  form,  // Contient { setFieldValue, errors, touched } de Formik
  name: propsName, // Fallback si field n'est pas là (utilisation non-Formik)
  label,
  placeholder = 'Aucun fichier sélectionné',
  buttonText = 'Choisir un fichier',
  accept,
  multiple = false,
  onChange: customOnChange,
  maxSizeMB = 5,
  className = '',
  disabled = false,
  ...otherProps
}) => {
  const name = field ? field.name : propsName;
  const [selectedFilesInfo, setSelectedFilesInfo] = useState(placeholder);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = maxSizeMB * 1024 * 1024; // Convertir Mo en octets

  const handleFileChange = (event) => {
    const files = event.target.files;
    let currentFileError = '';
    let validFiles = [];

    if (files && files.length > 0) {
      if (multiple) {
        validFiles = Array.from(files).filter(file => {
          if (file.size > MAX_FILE_SIZE) {
            currentFileError = `Un ou plusieurs fichiers dépassent la taille limite de ${maxSizeMB}Mo.`;
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          setSelectedFilesInfo(`${validFiles.length} fichier(s) sélectionné(s)`);
        } else if (!currentFileError) { // Si tous les fichiers étaient invalides mais pas à cause de la taille
            setSelectedFilesInfo(placeholder);
        }
      } else { // Fichier unique
        const file = files[0];
        if (file.size > MAX_FILE_SIZE) {
          currentFileError = `Le fichier dépasse la taille limite de ${maxSizeMB}Mo.`;
          setSelectedFilesInfo(placeholder); // Réinitialiser l'affichage
        } else {
          validFiles.push(file);
          setSelectedFilesInfo(file.name);
        }
      }
    } else {
      validFiles = [];
      setSelectedFilesInfo(placeholder);
    }

    setFileError(currentFileError);

    // Mettre à jour Formik ou appeler le callback personnalisé
    const filesToPass = multiple ? validFiles : (validFiles.length > 0 ? validFiles[0] : null);

    if (form && name) {
      form.setFieldValue(name, filesToPass);
      // On pourrait vouloir toucher le champ ici aussi
      // form.setFieldTouched(name, true, false); // le troisième argument 'false' pour ne pas valider tout de suite
    }
    if (customOnChange) {
      customOnChange(filesToPass);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = (e) => {
    e.stopPropagation(); // Empêcher le déclenchement du clic sur l'input caché
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Réinitialiser la valeur de l'input fichier
    }
    setSelectedFilesInfo(placeholder);
    setFileError('');
    if (form && name) {
      form.setFieldValue(name, multiple ? [] : null);
    }
    if (customOnChange) {
      customOnChange(multiple ? [] : null);
    }
  };

  // Gestion de l'affichage des erreurs Formik
  const formikError = form && form.touched[name] && form.errors[name];
  const displayError = fileError || formikError;

  return (
    <Form.Group className={`mb-3 ${className}`} controlId={name}>
      {label && <Form.Label>{label}</Form.Label>}
      <div
        className={`form-control file-input-display ${disabled ? 'disabled' : ''} ${displayError ? 'is-invalid' : ''}`}
        onClick={!disabled ? handleButtonClick : undefined}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => { if (e.key === 'Enter' && !disabled) handleButtonClick();}}
        role="button"
        aria-disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <FaFileAlt className="me-2 file-input-icon" />
        <span className="file-input-text">{selectedFilesInfo}</span>
        {selectedFilesInfo !== placeholder && !disabled && (
          <Button
            variant="link"
            size="sm"
            onClick={handleClearFile}
            className="file-input-clear-btn p-0"
            aria-label="Effacer la sélection"
            disabled={disabled}
          >
            <FaTimes />
          </Button>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        name={name} // Important pour la sémantique du formulaire, même si géré via JS
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }} // Caché, on interagit via le div stylé
        disabled={disabled}
        {...otherProps}
      />
      <Button
        variant="outline-secondary"
        size="sm"
        className="mt-2"
        onClick={handleButtonClick}
        disabled={disabled}
      >
        <FaUpload className="me-1" /> {buttonText}
      </Button>

      {displayError && (
        <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
          {displayError}
        </Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

FileInput.propTypes = {
  field: PropTypes.object,
  form: PropTypes.object,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  buttonText: PropTypes.string,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  onChange: PropTypes.func,
  maxSizeMB: PropTypes.number,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default FileInput;