// frontend/src/components/common/ConfirmationModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import AppModal from './AppModal'; // Votre wrapper de modale de base
import AppButton from './AppButton';
//import Icon from './Icon';

const ConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirmation',
  body = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmButtonText = 'Confirmer',
  cancelButtonText = 'Annuler',
  confirmButtonVariant = 'primary',
  isConfirming = false, // Pour l'état de chargement du bouton de confirmation
  children // Pour un contenu body plus complexe si besoin
}) => {
  if (!show) return null;

  return (
    <AppModal
      show={show}
      onHide={onHide}
      title={title}
      size="md" // Ou 'sm' pour les confirmations rapides
      // Le footer est personnalisé ici
      hideFooter
    >
      {children || <p>{body}</p>}
      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
        <AppButton variant="outline-secondary" onClick={onHide} disabled={isConfirming}>
          {cancelButtonText}
        </AppButton>
        <AppButton
          variant={confirmButtonVariant}
          onClick={onConfirm}
          isLoading={isConfirming}
          loadingText="Traitement..."
        >
          {confirmButtonText}
        </AppButton>
      </div>
    </AppModal>
  );
};

ConfirmationModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  body: PropTypes.node, // Peut être une chaîne ou du JSX
  children: PropTypes.node, // Alternative à 'body' pour un contenu plus riche
  confirmButtonText: PropTypes.string,
  cancelButtonText: PropTypes.string,
  confirmButtonVariant: PropTypes.string,
  isConfirming: PropTypes.bool,
};

export default ConfirmationModal;