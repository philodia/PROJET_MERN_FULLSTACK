// frontend/src/components/common/ConfirmationModal.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AppModal from './AppModal'; // Notre composant de modale générique
// import AppButton from './AppButton'; // Si vous utilisez AppButton pour les boutons de la modale
import {
  closeConfirmationModal,
  selectIsConfirmationModalOpen,
  selectConfirmationModalProps,
  setConfirmationModalLoading, // Pour gérer l'état de chargement
} from '../../features/ui/uiSlice'; // Ajustez le chemin

/**
 * Modale de confirmation globale gérée par l'état Redux (uiSlice).
 * Ce composant doit être inclus une seule fois dans votre layout principal.
 */
const ConfirmationModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsConfirmationModalOpen);
  const {
    title,
    message,
    onConfirm,
    confirmText,
    cancelText, // Peut être utilisé si AppModal le supporte ou si on personnalise le footer
    confirmButtonVariant,
    isLoading,
  } = useSelector(selectConfirmationModalProps);

  const handleHide = () => {
    // Ne pas appeler onConfirm si on ferme via la croix ou Echap, seulement via le bouton Annuler/Fermer
    // ou si onConfirm n'est pas défini
    dispatch(closeConfirmationModal());
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      dispatch(setConfirmationModalLoading(true));
      try {
        await onConfirm(); // Exécute l'action de confirmation (peut être asynchrone)
        // La fonction onConfirm devrait idéalement dispatcher closeConfirmationModal après succès
        // ou si elle ne le fait pas, on pourrait le faire ici.
        // Cependant, il est souvent préférable que l'action de confirmation contrôle la fermeture.
      } catch (error) {
        console.error("Erreur lors de la confirmation :", error);
        // Gérer l'erreur si nécessaire (par exemple, afficher une notification d'erreur)
      } finally {
        dispatch(setConfirmationModalLoading(false));
        // Ne pas fermer la modale automatiquement ici, laisser l'action onConfirm le faire.
        // Si onConfirm ne ferme pas, l'utilisateur peut réessayer ou annuler.
        // Si l'action onConfirm réussit et que la modale doit se fermer,
        // cette action (onConfirm) devrait elle-même dispatcher closeConfirmationModal().
      }
    } else {
      dispatch(closeConfirmationModal()); // Si pas d'action onConfirm, fermer simplement.
    }
  };


  if (!isOpen) {
    return null;
  }

  return (
    <AppModal
      show={isOpen}
      onHide={handleHide}
      title={title}
      onConfirm={onConfirm ? handleConfirm : undefined} // Passer handleConfirm seulement si onConfirm existe
      confirmButtonText={confirmText}
      closeButtonText={cancelText || 'Annuler'} // Utiliser cancelText s'il est fourni
      confirmButtonVariant={confirmButtonVariant || 'primary'}
      isConfirmButtonLoading={isLoading}
      // Si vous voulez que le clic sur backdrop ferme la modale (et annule), mettez `backdrop={true}`
      // Si vous ne voulez pas le bouton "Fermer" (X) dans l'en-tête de AppModal,
      // vous devriez modifier AppModal pour qu'il ait une prop `hideCloseButtonHeader` ou similaire.
    >
      {/* Le message peut être du JSX simple ou plus complexe */}
      {typeof message === 'string' ? <p>{message}</p> : message}
    </AppModal>
  );
};

export default ConfirmationModal;