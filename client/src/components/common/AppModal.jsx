// frontend/src/components/common/AppModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
// import Button from 'react-bootstrap/Button'; // Plus nécessaire si on utilise AppButton partout dans le footer
import AppButton from './AppButton'; // Assurez-vous que le chemin est correct

/**
 * Composant de fenêtre modale générique.
 */
const AppModal = ({
  show,
  onHide,
  title = '',
  children,
  size,
  centered = false,
  backdrop = 'static', // Empêche la fermeture en cliquant à l'extérieur par défaut
  keyboard = true,     // Permet la fermeture avec la touche Échap par défaut
  footerContent,       // Pour un contenu de pied de page entièrement personnalisé
  closeButtonText = 'Fermer',
  onConfirm,
  confirmButtonText = 'Confirmer',
  confirmButtonVariant = 'primary',
  confirmButtonLoadingText = 'Traitement...', // Texte spécifique pour le chargement du bouton de confirmation
  isConfirmButtonLoading = false,
  hideFooter = false,
  className,
  dialogClassName,
  contentClassName,
  ...otherProps
}) => {
  // La logique de handleConfirm peut rester ici ou être gérée directement dans l'attribut onClick du bouton
  // const handleConfirm = () => {
  //   if (onConfirm) {
  //     onConfirm();
  //   }
  // };

  return (
    <Modal
      show={show}
      onHide={onHide} // La fonction onHide est appelée par React-Bootstrap Modal (ex: sur clic du closeButton de l'en-tête, touche Echap)
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      className={className}
      dialogClassName={dialogClassName}
      contentClassName={contentClassName}
      {...otherProps}
    >
      <Modal.Header closeButton> {/* `closeButton` ajoute le 'x' de fermeture géré par React-Bootstrap */}
        {title && <Modal.Title>{title}</Modal.Title>}
      </Modal.Header>

      <Modal.Body>{children}</Modal.Body>

      {!hideFooter && (
        <Modal.Footer>
          {footerContent ? ( // Si un contenu de footer personnalisé est fourni
            footerContent
          ) : (
            // Footer par défaut
            <>
              <AppButton variant="secondary" onClick={onHide}>
                {closeButtonText}
              </AppButton>

              {onConfirm && ( // Afficher le bouton de confirmation seulement si onConfirm est fourni
                <AppButton
                  variant={confirmButtonVariant}
                  onClick={onConfirm} // Appel direct de la fonction onConfirm
                  isLoading={isConfirmButtonLoading}
                  loadingText={confirmButtonLoadingText}
                >
                  {confirmButtonText}
                </AppButton>
              )}
            </>
          )}
        </Modal.Footer>
      )}
    </Modal>
  );
};

AppModal.propTypes = {
  /** Contrôle la visibilité de la modale */
  show: PropTypes.bool.isRequired,
  /** Fonction appelée lorsque la modale demande à être fermée (clic sur 'x', touche Echap, clic sur backdrop si non 'static') */
  onHide: PropTypes.func.isRequired,
  /** Titre de la modale (optionnel) */
  title: PropTypes.string,
  /** Contenu principal de la modale */
  children: PropTypes.node,
  /** Taille de la modale */
  size: PropTypes.oneOf(['sm', 'lg', 'xl', undefined]),
  /** Si la modale doit être centrée verticalement */
  centered: PropTypes.bool,
  /** Comportement du fond lors de l'affichage ('static' pour ne pas fermer au clic, true pour fermer, false pour pas de fond) */
  backdrop: PropTypes.oneOf([true, false, 'static']),
  /** Si la modale peut être fermée avec la touche Échap */
  keyboard: PropTypes.bool,
  /** Permet de surcharger complètement le contenu du pied de page */
  footerContent: PropTypes.node,
  /** Texte pour le bouton de fermeture par défaut */
  closeButtonText: PropTypes.string,
  /** Fonction à appeler lors du clic sur le bouton de confirmation. Si non fournie, le bouton de confirmation n'est pas affiché. */
  onConfirm: PropTypes.func,
  /** Texte pour le bouton de confirmation par défaut */
  confirmButtonText: PropTypes.string,
  /** Variante de style pour le bouton de confirmation par défaut */
  confirmButtonVariant: PropTypes.string,
  /** Texte de chargement pour le bouton de confirmation */
  confirmButtonLoadingText: PropTypes.string,
  /** État de chargement pour le bouton de confirmation par défaut */
  isConfirmButtonLoading: PropTypes.bool,
  /** Si vrai, le pied de page n'est pas affiché */
  hideFooter: PropTypes.bool,
  /** Classes CSS pour le composant Modal racine */
  className: PropTypes.string,
  /** Classes CSS pour le composant Modal.Dialog interne */
  dialogClassName: PropTypes.string,
  /** Classes CSS pour le composant Modal.Content interne */
  contentClassName: PropTypes.string,
};

export default AppModal;