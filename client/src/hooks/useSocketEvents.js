// frontend/src/hooks/useSocketEvents.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSocket } from '../app/socket';
// import { addNotification } from '../features/ui/uiSlice'; // Exemple d'action Redux

export const useSocketEvents = () => {
  const dispatch = useDispatch();
  const socket = getSocket(); // Obtenir l'instance du socket

  useEffect(() => {
    if (!socket) return;

    const handleNewInvoice = (invoiceData) => {
      console.log('Nouvelle facture reçue via Socket.IO:', invoiceData);
      // dispatch(addNotification({ message: `Nouvelle facture ${invoiceData.invoiceNumber} créée!`, type: 'info' }));
      // Mettre à jour l'état Redux pour les factures si nécessaire
    };

    const handleStockAlert = (productData) => {
      console.log('Alerte de stock critique reçue:', productData);
      // dispatch(addNotification({ message: `Stock critique pour ${productData.name}!`, type: 'warning' }));
    };

    socket.on('new_invoice', handleNewInvoice);
    socket.on('stock_alert', handleStockAlert);
    // ... écouter d'autres événements

    return () => {
      // Nettoyer les écouteurs d'événements lorsque le composant est démonté
      socket.off('new_invoice', handleNewInvoice);
      socket.off('stock_alert', handleStockAlert);
      // ...
    };
  }, [dispatch, socket]); // Dépendances de l'effet

  // Vous pouvez retourner des fonctions pour émettre des événements si nécessaire
  // const sendMessage = (event, data) => {
  //   if (socket) socket.emit(event, data);
  // };
  // return { sendMessage };
};