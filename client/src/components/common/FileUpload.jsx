// frontend/src/components/common/FileUpload.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { FaFileUpload, FaTimesCircle, FaFileAlt } from 'react-icons/fa';
import './FileUpload.css';

const FileUpload = ({
  onFilesSelected,
  label = 'Glissez-déposez des fichiers ici, ou cliquez pour sélectionner',
  multiple = true,
  accept,
  maxSize = 5 * 1024 * 1024,
  maxFiles = 0,
  showPreviews = true,
  className = '',
  initialFiles = [],
}) => {
  const [selectedFiles, setSelectedFiles] = useState(initialFiles);
  const [fileRejections, setFileRejections] = useState([]);
  const inputRef = useRef(null);

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setFileRejections(rejectedFiles);

      let newFiles = multiple ? [...selectedFiles, ...acceptedFiles] : acceptedFiles.slice(0, 1);

      if (maxFiles > 0 && newFiles.length > maxFiles) {
        const excessFiles = newFiles.slice(maxFiles);
        setFileRejections(prev => [
          ...prev,
          ...excessFiles.map(file => ({
            file,
            errors: [{ code: 'too-many-files', message: `Maximum ${maxFiles} fichiers autorisés.` }],
          })),
        ]);
        newFiles = newFiles.slice(0, maxFiles);
      }

      setSelectedFiles(newFiles);
      onFilesSelected?.(newFiles);
    },
    [onFilesSelected, multiple, maxFiles, selectedFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: typeof accept === 'string' ? { [accept]: [] } : accept,
    multiple,
    maxSize,
    disabled: maxFiles > 0 && selectedFiles.length >= maxFiles && multiple,
  });

  const removeFile = (fileToRemove, event) => {
    event.stopPropagation();
    const updatedFiles = selectedFiles.filter(file => file !== fileToRemove);
    setSelectedFiles(updatedFiles);
    onFilesSelected?.(updatedFiles);
    setFileRejections([]);
  };

  useEffect(() => {
    setSelectedFiles(initialFiles);
  }, [initialFiles]);

  const fileList = selectedFiles.map((file, index) => {
    const objectURL = file.preview || URL.createObjectURL(file);
    return (
      <li key={`${file.name}-${file.size}-${index}`} className="file-upload-item">
        {showPreviews && file.type.startsWith('image/') ? (
          <img
            src={objectURL}
            alt={`Aperçu de ${file.name}`}
            className="file-preview-image"
            onLoad={() => URL.revokeObjectURL(objectURL)}
          />
        ) : (
          <FaFileAlt className="file-preview-icon" />
        )}
        <span className="file-name" title={file.name}>
          {file.name.length > 30 ? `${file.name.substring(0, 27)}...` : file.name}
        </span>
        <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
        <button
          type="button"
          className="file-remove-button"
          onClick={(e) => removeFile(file, e)}
          title="Supprimer le fichier"
        >
          <FaTimesCircle />
        </button>
      </li>
    );
  });

  const rejectionItems = fileRejections.map(({ file, errors }, index) => (
    <li key={`${file.name}-${index}-rejected`} className="file-upload-rejection-item">
      <FaFileAlt className="file-preview-icon rejected" />
      <span className="file-name rejected" title={file.name}>
        {file.name.length > 30 ? `${file.name.substring(0, 27)}...` : file.name} (Rejeté)
      </span>
      <ul className="file-rejection-errors">
        {errors.map((e) => (
          <li key={e.code}>{e.message}</li>
        ))}
      </ul>
    </li>
  ));

  return (
    <div className={`file-upload-container ${className}`}>
      <div
        {...getRootProps({
          className: `file-upload-dropzone
            ${isDragActive ? 'active' : ''}
            ${isDragAccept ? 'accept' : ''}
            ${isDragReject ? 'reject' : ''}
            ${maxFiles > 0 && selectedFiles.length >= maxFiles && multiple ? 'disabled' : ''}`,
        })}
      >
        <input {...getInputProps()} ref={inputRef} />
        <FaFileUpload className="upload-icon" />
        <p>{label}</p>
        {isDragActive && !isDragReject && <p>Relâchez pour déposer les fichiers...</p>}
        {isDragReject && <p className="text-danger">Type de fichier non autorisé ou taille dépassée.</p>}
        {maxFiles > 0 && multiple && (
          <p className="small text-muted">
            Maximum {maxFiles} fichiers. ({selectedFiles.length}/{maxFiles})
          </p>
        )}
      </div>

      {(selectedFiles.length > 0 || fileRejections.length > 0) && showPreviews && (
        <aside className="file-upload-preview-list">
          <h4>Fichiers sélectionnés :</h4>
          {selectedFiles.length > 0 && <ul>{fileList}</ul>}
          {fileRejections.length > 0 && (
            <>
              <h5 className="text-danger">Fichiers rejetés :</h5>
              <ul>{rejectionItems}</ul>
            </>
          )}
        </aside>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onFilesSelected: PropTypes.func.isRequired,
  label: PropTypes.string,
  multiple: PropTypes.bool,
  accept: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  maxSize: PropTypes.number,
  maxFiles: PropTypes.number,
  showPreviews: PropTypes.bool,
  className: PropTypes.string,
  initialFiles: PropTypes.array,
};

export default FileUpload;
