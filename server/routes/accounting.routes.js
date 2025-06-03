// gestion-commerciale-app/backend/routes/accounting.routes.js

const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');

// Importer les contrôleurs pertinents
const chartOfAccountsController = require('../controllers/chartOfAccounts.controller');
const journalEntryController = require('../controllers/journalEntry.controller');
const reportController = require('../controllers/report.controller'); // Pour Grand Livre et Bilan

const router = express.Router();

// Appliquer le middleware 'protect' à toutes les routes de ce module comptable.
// Des autorisations plus spécifiques seront appliquées à chaque route.
router.use(protect);

// --- Routes pour le Plan Comptable (Chart of Accounts) ---
// Préfixe: /api/accounting/chart-of-accounts
const coaRouter = express.Router(); // Sous-routeur pour le plan comptable
coaRouter.route('/')
    .get(authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), chartOfAccountsController.getAllAccounts)
    .post(authorize('ADMIN', 'ACCOUNTANT'), chartOfAccountsController.createAccount); // Seuls Admin/Comptable peuvent créer

coaRouter.route('/:id')
    .get(authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), chartOfAccountsController.getAccountById)
    .put(authorize('ADMIN', 'ACCOUNTANT'), chartOfAccountsController.updateAccount)    // Seuls Admin/Comptable peuvent modifier
    .delete(authorize('ADMIN'), chartOfAccountsController.deleteAccount);           // Seul Admin peut supprimer

coaRouter.get('/number/:accountNumber', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), chartOfAccountsController.getAccountByNumber);

router.use('/chart-of-accounts', coaRouter);


// --- Routes pour les Écritures de Journal (Journal Entries) ---
// Préfixe: /api/accounting/journal-entries
const journalRouter = express.Router(); // Sous-routeur pour les écritures
journalRouter.route('/')
    .get(authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), journalEntryController.getAllJournalEntries)
    .post(authorize('ADMIN', 'ACCOUNTANT'), journalEntryController.createManualJournalEntry); // Création manuelle par Admin/Comptable

journalRouter.route('/:id')
    .get(authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), journalEntryController.getJournalEntryById)
    // La mise à jour et la suppression d'écritures sont très sensibles et généralement non recommandées.
    // Si vous les activez, assurez-vous que les permissions sont extrêmement strictes.
    .put(authorize('ADMIN'), journalEntryController.updateManualJournalEntry) // Extrêmement restreint
    .delete(authorize('ADMIN'), journalEntryController.deleteJournalEntry);    // Extrêmement restreint

router.use('/journal-entries', journalRouter);


// --- Routes pour les Rapports Comptables (Grand Livre, Bilan) ---
// Préfixe: /api/accounting/reports
const reportRouter = express.Router(); // Sous-routeur pour les rapports
reportRouter.get('/general-ledger', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportController.getGeneralLedger);
reportRouter.get('/balance-sheet', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportController.getBalanceSheet);
// Ajouter ici d'autres routes de rapports (ex: Compte de Résultat)
// reportRouter.get('/income-statement', authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportController.getIncomeStatement);

router.use('/reports', reportRouter);


// Route de statut pour ce module (optionnel)
router.get('/status', (req, res) => {
    res.json({ status: 'OK', message: 'Accounting module is active.' });
});

module.exports = router;