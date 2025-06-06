// frontend/src/components/invoices/InvoicePDFViewer.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useReactToPrint } from 'react-to-print';
import InvoiceView from './InvoiceView'; // Votre composant d'affichage de facture
import AppButton from '../common/AppButton'; // Votre composant bouton
import Icon from '../common/Icon';

/**
 * Composant qui prépare une facture pour l'impression (ou sauvegarde en PDF via la boîte de dialogue d'impression)
 * en utilisant le composant InvoiceView.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.invoiceData - L'objet facture complet à afficher et imprimer.
 * @param {object} [props.companyInfo] - Informations sur l'entreprise émettrice.
 * @param {string} [props.buttonText='Télécharger / Imprimer PDF'] - Texte du bouton de déclenchement.
 * @param {string} [props.buttonVariant='primary'] - Variante du bouton.
 * @param {string} [props.buttonClassName] - Classes CSS pour le bouton.
 * @param {React.ReactNode} [props.triggerComponent] - Composant personnalisé pour déclencher l'impression.
 */
const InvoicePDFViewer = ({
  invoiceData,
  companyInfo, // Sera passé à InvoiceView
  buttonText = 'Télécharger / Imprimer PDF',
  buttonVariant = 'outline-primary',
  buttonClassName = '',
  triggerComponent, // Permet de passer un bouton ou lien personnalisé
}) => {
  const componentRef = useRef(null); // Réf pour le composant à imprimer

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Facture-${invoiceData?.invoiceNumber || 'INV'}-${invoiceData?.client?.companyName || 'Client'}`,
    onBeforeGetContent: () => {
      // Optionnel: Peut être utilisé pour préparer le contenu avant l'impression.
      // Par exemple, si vous devez charger des images ou faire des calculs.
      // console.log('Préparation du contenu pour impression...');
      return Promise.resolve();
    },
    onBeforePrint: () => {
      // Optionnel: Exécuté juste avant que la boîte de dialogue d'impression ne s'ouvre.
      // console.log('Avant impression...');
    },
    onAfterPrint: () => {
      // Optionnel: Exécuté après que la boîte de dialogue d'impression soit fermée (ou impression annulée).
      // console.log('Après impression...');
    },
    removeAfterPrint: false, // Mettre à true si le composant est monté uniquement pour l'impression
                           // et doit être retiré du DOM après. Souvent false si c'est une vue existante.
  });

  if (!invoiceData) {
    return <p className="text-muted">Aucune donnée de facture à imprimer.</p>;
  }

  const Trigger = triggerComponent ? (
    React.cloneElement(triggerComponent, { onClick: handlePrint })
  ) : (
    <AppButton
      variant={buttonVariant}
      onClick={handlePrint}
      className={buttonClassName}
    >
      <Icon name="BsPrinterFill" className="me-1" /> {buttonText}
    </AppButton>
  );

  return (
    <div className="invoice-pdf-viewer-container">
      {Trigger}

      {/*
        Le composant InvoiceView est rendu ici mais caché.
        react-to-print le prendra et l'utilisera pour la fenêtre d'impression.
        Si vous voulez qu'il soit visible sur la page ET imprimable, vous ne le cachez pas.
        Si c'est juste un "bouton PDF", alors il peut être caché.
      */}
      <div style={{ display: 'none' }}> {/* Cache la version pour impression si non désirée à l'écran */}
      {/* Ou si vous voulez une prévisualisation, ne pas cacher :
      <div className="pdf-preview-area border p-3 my-3"> */}
        <div ref={componentRef} className="printable-invoice-content">
          {/*
            Passer isForPDF={true} à InvoiceView pour appliquer les styles PDF
            définis dans InvoiceView.scss
          */}
          <InvoiceView
            invoice={invoiceData}
            companyInfo={companyInfo || invoiceData.companyInfo}
            isForPDF={true} // Très important pour les styles d'impression
          />
        </div>
      </div>
    </div>
  );
};

InvoicePDFViewer.propTypes = {
  invoiceData: PropTypes.object.isRequired, // La structure exacte est validée par InvoiceView
  companyInfo: PropTypes.object,
  buttonText: PropTypes.string,
  buttonVariant: PropTypes.string,
  buttonClassName: PropTypes.string,
  triggerComponent: PropTypes.element,
};

export default InvoicePDFViewer;