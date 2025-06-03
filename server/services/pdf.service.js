// gestion-commerciale-app/backend/services/pdf.service.js

const PDFDocument = require('pdfkit');
const fs = require('fs'); // Pour sauvegarder le fichier temporairement si nécessaire
const path = require('path');
// const { format } = require('date-fns'); // Optionnel, pour formater les dates
// const { fr } = require('date-fns/locale'); // Optionnel, pour la locale française

// Vous pouvez définir des constantes pour les styles, polices, etc.
const FONT_NORMAL = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const LOGO_PATH = path.join(__dirname, '../assets/images/logo.png'); // Assurez-vous que ce chemin est correct

class PDFService {
  /**
   * Génère un buffer PDF pour une facture.
   * @param {object} invoiceData - Les données de la facture (client, items, totaux, etc.).
   * @param {object} [companyInfo] - Les informations de votre entreprise.
   * @returns {Promise<Buffer>} Une promesse qui se résout avec le buffer PDF.
   */
  static async generateInvoicePDF(invoiceData, companyInfo) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        // bufferPages: true, // Utile si vous voulez accéder aux pages avant la fin
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        console.error('Erreur lors de la génération du PDF:', err);
        reject(err);
      });

      // --- En-tête de la facture ---
      this._generateHeader(doc, companyInfo, invoiceData);

      // --- Informations sur la facture et le client ---
      this._generateCustomerInformation(doc, invoiceData, companyInfo);

      // --- Tableau des articles de la facture ---
      this._generateInvoiceTable(doc, invoiceData);

      // --- Pied de page (totaux, notes, conditions) ---
      this._generateFooter(doc, invoiceData);

      // Finaliser le PDF
      doc.end();
    });
  }

  /**
   * Section d'en-tête du document PDF.
   * @param {PDFDocument} doc - L'instance du document PDF.
   * @param {object} companyInfo - Informations de l'entreprise.
   * @param {object} invoiceData - Données de la facture.
   */
  static _generateHeader(doc, companyInfo, invoiceData) {
    // Logo (si disponible et le fichier existe)
    if (companyInfo && companyInfo.logoPath && fs.existsSync(companyInfo.logoPath)) {
      doc.image(companyInfo.logoPath, 50, 45, { width: 100 })
         .fontSize(20);
    } else if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, 45, { width: 100 })
           .fontSize(20);
    }


    // Nom de l'entreprise
    if (companyInfo && companyInfo.name) {
      doc.font(FONT_BOLD)
         .text(companyInfo.name, 200, 50, { align: 'right' })
         .font(FONT_NORMAL);
    } else {
      doc.font(FONT_BOLD)
         .text('VOTRE ENTREPRISE', 200, 50, { align: 'right' })
         .font(FONT_NORMAL);
    }

    // Adresse de l'entreprise
    if (companyInfo && companyInfo.address) {
      this._generateAddress(doc, companyInfo.address, 200, 68, 'right');
    } else {
      doc.text('123 Rue Principale', 200, 68, { align: 'right' })
         .text('75000 Ville, Pays', 200, 81, { align: 'right' });
    }

    doc.moveDown(2); // Espace après l'en-tête
  }

  /**
   * Section d'informations client et facture.
   * @param {PDFDocument} doc - L'instance du document PDF.
   * @param {object} invoiceData - Données de la facture.
   * @param {object} companyInfo - Informations de l'entreprise (pour SIREN, TVA etc.).
   */
  static _generateCustomerInformation(doc, invoiceData, companyInfo) {
    doc.fillColor('#444444').fontSize(16).font(FONT_BOLD).text('FACTURE', 50, 160);
    doc.fillColor('#000000').fontSize(10).font(FONT_NORMAL);

    const customerInformationTop = 185;
    const invoiceDetailsTop = 185;

    // Informations client (colonne de gauche)
    doc.font(FONT_BOLD).text('Client :', 50, customerInformationTop);
    doc.font(FONT_NORMAL)
       .text(invoiceData.client?.companyName || 'N/A', 50, customerInformationTop + 15)
    if (invoiceData.client?.contactName) {
        doc.text(invoiceData.client.contactName, 50, customerInformationTop + 30);
    }
    this._generateAddress(doc, invoiceData.client?.address, 50, customerInformationTop + (invoiceData.client?.contactName ? 45 : 30));


    // Informations facture (colonne de droite)
    const rightColumnX = 350;
    doc.font(FONT_BOLD).text('Numéro de facture :', rightColumnX, invoiceDetailsTop)
       .font(FONT_NORMAL).text(invoiceData.invoiceNumber || 'N/A', rightColumnX + 110, invoiceDetailsTop);

    doc.font(FONT_BOLD).text('Date d\'émission :', rightColumnX, invoiceDetailsTop + 15)
       .font(FONT_NORMAL).text(this._formatDate(invoiceData.issueDate), rightColumnX + 110, invoiceDetailsTop + 15);

    doc.font(FONT_BOLD).text('Date d\'échéance :', rightColumnX, invoiceDetailsTop + 30)
       .font(FONT_NORMAL).text(this._formatDate(invoiceData.dueDate), rightColumnX + 110, invoiceDetailsTop + 30);

    if (companyInfo?.siren) {
        doc.font(FONT_BOLD).text('SIREN :', rightColumnX, invoiceDetailsTop + 45)
           .font(FONT_NORMAL).text(companyInfo.siren, rightColumnX + 110, invoiceDetailsTop + 45);
    }
    if (companyInfo?.vatNumber) { // Numéro de TVA Intracommunautaire
        doc.font(FONT_BOLD).text('N° TVA Intra. :', rightColumnX, invoiceDetailsTop + 60)
           .font(FONT_NORMAL).text(companyInfo.vatNumber, rightColumnX + 110, invoiceDetailsTop + 60);
    }


    doc.moveDown(3); // Espace avant le tableau
  }

  /**
   * Génère le tableau des articles de la facture.
   * @param {PDFDocument} doc - L'instance du document PDF.
   * @param {object} invoiceData - Données de la facture.
   */
  static _generateInvoiceTable(doc, invoiceData) {
    const tableTop = 280; // Position Y de départ du tableau
    const itemDescX = 50;
    const itemQtyX = 300;
    const itemPriceX = 350;
    const itemVATX = 410;
    const itemTotalX = 470;

    doc.font(FONT_BOLD);
    this._generateTableRow(
      doc,
      tableTop,
      'Description',
      'Qté',
      'Prix U. HT',
      'TVA %',
      'Total HT',
      itemDescX, itemQtyX, itemPriceX, itemVATX, itemTotalX
    );
    this._generateHr(doc, tableTop + 15);
    doc.font(FONT_NORMAL);

    let position = tableTop + 25;
    invoiceData.items.forEach(item => {
      this._generateTableRow(
        doc,
        position,
        item.description || item.product?.name || 'Article N/A', // Utiliser la description surchargée si elle existe
        item.quantity,
        this._formatCurrency(item.unitPriceHT),
        `${item.vatRate}%`,
        this._formatCurrency(item.totalHT),
        itemDescX, itemQtyX, itemPriceX, itemVATX, itemTotalX
      );
      position += 20; // Augmenter Y pour la prochaine ligne
      // Gérer le saut de page si nécessaire
      if (position > 700) {
        doc.addPage();
        position = 50; // Réinitialiser Y en haut de la nouvelle page
        // Recréer l'en-tête du tableau si souhaité sur la nouvelle page
      }
    });
    this._generateHr(doc, position + 5);
    doc.moveDown();

    // --- Totaux ---
    const totalsTop = position + 20;
    const totalsXLabel = 350;
    const totalsXValue = 470;

    doc.font(FONT_BOLD).text('Total HT :', totalsXLabel, totalsTop, { width: 100, align: 'right' })
       .font(FONT_NORMAL).text(this._formatCurrency(invoiceData.totalHT), totalsXValue, totalsTop, { width: 100, align: 'right' });

    doc.font(FONT_BOLD).text('Total TVA :', totalsXLabel, totalsTop + 15, { width: 100, align: 'right' })
       .font(FONT_NORMAL).text(this._formatCurrency(invoiceData.totalVAT), totalsXValue, totalsTop + 15, { width: 100, align: 'right' });

    doc.font(FONT_BOLD).fontSize(12).text('Total TTC :', totalsXLabel, totalsTop + 30, { width: 100, align: 'right' })
       .font(FONT_NORMAL).fontSize(12).text(this._formatCurrency(invoiceData.totalTTC), totalsXValue, totalsTop + 30, { width: 100, align: 'right' });
    doc.fontSize(10); // Reset font size
  }

  /**
   * Génère le pied de page de la facture.
   * @param {PDFDocument} doc - L'instance du document PDF.
   * @param {object} invoiceData - Données de la facture.
   */
  static _generateFooter(doc, invoiceData) {
    const footerY = 720; // Position Y approximative pour le pied de page (ajuster selon contenu)
    this._generateHr(doc, footerY - 10, 50, 550);

    if (invoiceData.notes) {
      doc.fontSize(9).text('Notes :', 50, footerY);
      doc.fontSize(8).text(invoiceData.notes, 50, footerY + 12, { width: 500 });
    }

    // Informations bancaires ou conditions de paiement
    doc.fontSize(8).text(
      'Conditions de paiement : Paiement à réception, sauf accord contraire. Merci de votre confiance.',
      50,
      doc.y + 15 > footerY + 40 ? doc.y + 5 : footerY + 40, // S'assurer que ce n'est pas trop bas
      { align: 'center', width: 500 }
    );
    // Vous pouvez ajouter ici des informations légales, bancaires, etc.
    // Par exemple:
    // doc.text('RIB: FR76 XXXX XXXX XXXX XXXX XXXX XXX | BIC: XXXXFRCCXXX', 50, 750, { align: 'center', width: 500 });
  }

  // --- Fonctions utilitaires ---

  static _generateTableRow(doc, y, c1, c2, c3, c4, c5, x1, x2, x3, x4, x5) {
    doc.fontSize(9)
       .text(c1.toString(), x1, y, { width: x2 - x1 - 10}) // Description
       .text(c2.toString(), x2, y, { width: x3 - x2 - 5, align: 'right' })  // Quantité
       .text(c3.toString(), x3, y, { width: x4 - x3 - 5, align: 'right' })  // Prix U. HT
       .text(c4.toString(), x4, y, { width: x5 - x4 - 5, align: 'right' })  // TVA %
       .text(c5.toString(), x5, y, { width: 550 - x5, align: 'right' }); // Total HT
  }

  static _generateHr(doc, y, startX = 50, endX = 550) {
    doc.strokeColor('#aaaaaa')
       .lineWidth(0.5)
       .moveTo(startX, y)
       .lineTo(endX, y)
       .stroke();
  }

  static _formatCurrency(amount, currency = 'EUR') {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(amount);
  }

  static _formatDate(date) {
    if (!date) return 'N/A';
    try {
      // Utiliser date-fns si disponible pour un formatage plus robuste et localisé
      // return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      return 'Date invalide';
    }
  }

  static _generateAddress(doc, address, x, y, align = 'left') {
    if (address) {
        let currentY = y;
        if (address.street) {
            doc.text(address.street, x, currentY, { align });
            currentY += 13;
        }
        if (address.zipCode && address.city) {
            doc.text(`${address.zipCode} ${address.city}`, x, currentY, { align });
            currentY += 13;
        } else if (address.city) {
            doc.text(address.city, x, currentY, { align });
            currentY += 13;
        }
        if (address.country) {
            doc.text(address.country, x, currentY, { align });
        }
    } else {
        doc.text('Adresse non fournie', x, y, { align });
    }
  }
}

module.exports = PDFService;

// --- Exemple d'utilisation (à mettre dans un contrôleur ou une route de test) ---
/*
async function testGenerateInvoice() {
  const sampleInvoiceData = {
    invoiceNumber: 'FAC2023-0001',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours plus tard
    client: {
      companyName: 'Client Test SARL',
      contactName: 'Jean Dupont',
      address: {
        street: '45 Avenue des Tests',
        city: 'Testville',
        zipCode: '12345',
        country: 'France',
      },
    },
    items: [
      { product: { name: 'Service de Développement Web' }, description: 'Création site vitrine', quantity: 1, unitPriceHT: 1200, vatRate: 20, totalHT: 1200 },
      { product: { name: 'Hébergement Annuel' }, description: 'Pack Hébergement Pro', quantity: 1, unitPriceHT: 150, vatRate: 20, totalHT: 150 },
      { product: { name: 'Formation Utilisateur' }, description: '2h de formation à distance', quantity: 2, unitPriceHT: 75, vatRate: 20, totalHT: 150 },
    ],
    totalHT: 1500,
    totalVAT: 300,
    totalTTC: 1800,
    notes: 'Merci de régler cette facture sous 30 jours.\nPour toute question, contactez-nous.',
  };

  const sampleCompanyInfo = {
    name: 'Ma Super Entreprise SAS',
    address: {
        street: '10 Boulevard des Entrepreneurs',
        city: 'Innovacity',
        zipCode: '98765',
        country: 'France'
    },
    siren: '123 456 789',
    vatNumber: 'FR00123456789',
    logoPath: LOGO_PATH // Chemin vers votre logo
  };

  try {
    const pdfBuffer = await PDFService.generateInvoicePDF(sampleInvoiceData, sampleCompanyInfo);
    // Sauvegarder le PDF (pour le test)
    fs.writeFileSync(path.join(__dirname, '../temp/test_invoice.pdf'), pdfBuffer);
    console.log('Facture PDF de test générée dans temp/test_invoice.pdf');

    // Dans une vraie application, vous enverriez ce buffer dans la réponse HTTP:
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename=facture-${sampleInvoiceData.invoiceNumber}.pdf`);
    // res.send(pdfBuffer);

  } catch (error) {
    console.error('Erreur lors du test de génération de PDF:', error);
  }
}

// Décommentez pour tester localement (nécessite de créer un dossier 'temp' à la racine de 'backend')
// if (process.env.NODE_ENV === 'test_pdf') { // Ou une autre condition pour exécuter le test
//    if (!fs.existsSync(path.join(__dirname, '../temp'))){
//        fs.mkdirSync(path.join(__dirname, '../temp'));
//    }
//    testGenerateInvoice();
// }
*/