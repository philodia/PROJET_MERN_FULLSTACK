// frontend/src/components/stock/StockAdjustmentModal.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap'; // Utiliser Modal de React-Bootstrap
import StockAdjustmentForm from './StockAdjustmentForm'; // Votre formulaire
// import { useAdjustStockMutation } from '../../features/products/productApiSlice'; // Exemple avec RTK Query

/**
 * Modale pour effectuer un ajustement manuel du stock d'un produit.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {boolean} props.show - Contrôle la visibilité de la modale.
 * @param {function} props.onHide - Fonction pour fermer la modale.
 * @param {object} props.product - Le produit concerné par l'ajustement.
 *                                 { id, name, stockQuantity, isService }
 * @param {function} [props.onAdjustmentSuccess] - Callback optionnel après une soumission réussie.
 */
const StockAdjustmentModal = ({
  show,
  onHide,
  product,
  onAdjustmentSuccess,
}) => {
  const [submitError, setSubmitError] = useState(null);
  // Pour gérer l'état de chargement si l'appel API est fait ici
  const [isSubmittingOperation, setIsSubmittingOperation] = useState(false);

  // Exemple avec RTK Query (si vous l'utilisez)
  // const [adjustStock, { isLoading: isAdjustingStock }] = useAdjustStockMutation();

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    setSubmitError(null);
    setIsSubmittingOperation(true); // Indiquer le début de l'opération
    console.log('Données d\'ajustement de stock à soumettre:', values);

    try {
      // Simulation d'un appel API
      // const result = await adjustStock(values).unwrap(); // Avec RTK Query
      await new Promise(resolve => setTimeout(resolve, 1500));
      // throw new Error("Erreur simulée lors de l'ajustement du stock !"); // Décommenter pour tester l'erreur

      // Si succès:
      // toast.success('Stock ajusté avec succès !'); // Si vous utilisez des toasts
      alert('Stock ajusté avec succès ! (Simulation)');

      if (onAdjustmentSuccess) {
        onAdjustmentSuccess(values.productId, values); // Passer l'ID et les données de l'ajustement
      }
      resetForm();
      onHide(); // Fermer la modale
    } catch (err) {
      console.error('Erreur lors de l\'ajustement du stock:', err);
      // Gérer les erreurs spécifiques du backend si elles existent
      if (err.data && err.data.fieldErrors) {
        setErrors(err.data.fieldErrors); // Erreurs par champ
      } else {
        setSubmitError(err.message || 'Une erreur est survenue lors de l\'ajustement du stock.');
      }
    } finally {
      setIsSubmittingOperation(false);
      // setSubmitting(false); // Géré par Formik si onSubmit est async
    }
  };

  // S'assurer que la modale ne s'affiche pas si aucun produit n'est fourni
  // ou si le produit est un service (StockAdjustmentForm gère aussi ce cas)
  if (!product) {
    return null;
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static"> {/* static pour ne pas fermer au clic extérieur */}
      <Modal.Header closeButton>
        <Modal.Title>
          Ajustement Manuel du Stock : <span className="fw-normal">{product.name}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {product.isService ? (
             <p className="text-warning">Les services n'ont pas de stock physique à ajuster.</p>
        ) : (
            <StockAdjustmentForm
                product={product}
                onSubmit={handleSubmit}
                onCancel={onHide} // Le formulaire peut appeler onCancel pour fermer
                submitError={submitError}
                isSubmittingOp={isSubmittingOperation /* || isAdjustingStock */} // Passer l'état de chargement
            />
        )}
      </Modal.Body>
      {/*
        Les boutons "Annuler" et "Enregistrer" sont maintenant gérés DANS StockAdjustmentForm.
        Si vous voulez les avoir ici, vous devriez soumettre le formulaire via une ref
        ou déplacer la logique de soumission ici.
        Il est généralement plus propre de laisser le formulaire gérer ses propres boutons de soumission/annulation.
      */}
      {/* <Modal.Footer>
        <AppButton variant="outline-secondary" onClick={onHide} disabled={isSubmittingOperation}>
          Annuler
        </AppButton>
        <AppButton variant="primary" type="submit" form="stockAdjustmentFormId" isLoading={isSubmittingOperation}>
          Enregistrer l'Ajustement
        </AppButton>
      </Modal.Footer> */}
    </Modal>
  );
};

StockAdjustmentModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    stockQuantity: PropTypes.number,
    isService: PropTypes.bool,
  }), // Peut être null avant sélection
  onAdjustmentSuccess: PropTypes.func,
};

export default StockAdjustmentModal;