import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import PageContainer from '../../components/layout/PageContainer';
import InvoiceForm from '../../components/invoices/InvoiceForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import AppButton from '../../components/common/AppButton'; // Import ajouté ici

import { showSuccessToast, showErrorToast } from '../../components/common/NotificationToast';

const InvoiceCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const quoteId = searchParams.get('fromQuoteId');
  const deliveryNoteId = searchParams.get('fromDeliveryNoteId');

  const [initialDataForForm, setInitialDataForForm] = useState(null);
  const [isLoadingSourceData, setIsLoadingSourceData] = useState(false);
  const [sourceDataError, setSourceDataError] = useState(null);

  useEffect(() => {
    const loadSourceData = async () => {
      if (!quoteId && !deliveryNoteId) {
        setInitialDataForForm({});
        return;
      }

      setIsLoadingSourceData(true);
      setSourceDataError(null);

      try {
        if (quoteId) {
          // Logique de chargement du devis
          console.log(`Chargement du devis avec ID: ${quoteId}`);
          showErrorToast("Logique de chargement de devis non implémentée.");
          setInitialDataForForm({ quote: quoteId });
        } else if (deliveryNoteId) {
          // Logique de chargement du bon de livraison
          console.log(`Chargement du BL avec ID: ${deliveryNoteId}`);
          showErrorToast("Logique de chargement de BL non implémentée.");
          setInitialDataForForm({ deliveryNotes: [deliveryNoteId] });
        }
      } catch (error) {
        console.error("Erreur chargement données source:", error);
        const errorMsg = error.message || "Impossible de charger les données du document source.";
        setSourceDataError(errorMsg);
        showErrorToast(errorMsg);
        setInitialDataForForm({});
      } finally {
        setIsLoadingSourceData(false);
      }
    };

    loadSourceData();
  }, [dispatch, quoteId, deliveryNoteId]);

  const handleFormSuccess = (createdInvoice) => {
    showSuccessToast(`Facture "${createdInvoice.invoiceNumber}" créée avec succès !`);
    navigate(`/invoices/view/${createdInvoice._id}`);
  };

  const handleFormCancel = () => {
    navigate('/invoices');
  };

  // État de chargement principal
  if (isLoadingSourceData) {
    return (
      <PageContainer title="Nouvelle Facture" fluid>
        <LoadingSpinner fullPage message="Chargement des données sources..." />
      </PageContainer>
    );
  }

  // Erreur bloquante (sans données initiales)
  if (sourceDataError && !initialDataForForm) {
    return (
      <PageContainer title="Nouvelle Facture" fluid>
        <AlertMessage variant="danger">{sourceDataError}</AlertMessage>
        <AppButton onClick={() => navigate('/invoices')} variant="secondary">
          Retour à la liste
        </AppButton>
      </PageContainer>
    );
  }

  // État intermédiaire lors de la préparation du formulaire
  if (initialDataForForm === null && (quoteId || deliveryNoteId)) {
    return (
      <PageContainer title="Nouvelle Facture" fluid>
        <LoadingSpinner fullPage message="Préparation du formulaire..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Créer une Nouvelle Facture"
      fluid
      breadcrumbs={[
        { label: 'Facturation', path: '/invoices' },
        { label: 'Nouvelle Facture', isActive: true },
      ]}
    >
      {sourceDataError && (
        <AlertMessage variant="warning" className="mb-3" dismissible>
          Impossible de pré-remplir à partir du document source: {sourceDataError}
        </AlertMessage>
      )}

      <div className="invoice-create-form-wrapper mt-2">
        <InvoiceForm
          initialInvoiceData={initialDataForForm || {}}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    </PageContainer>
  );
};

export default InvoiceCreatePage;