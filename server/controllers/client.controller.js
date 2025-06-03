// gestion-commerciale-app/backend/controllers/client.controller.js

const Client = require('../models/Client.model');
const { AppError } = require('../middleware/error.middleware');
const asyncHandler = require('../middleware/asyncHandler.middleware');
const APIFeatures = require('../utils/apiFeatures');
const { generateDocumentNumber } = require('../utils/generateNumber'); // Pour générer clientNumber

// @desc    Récupérer tous les clients
// @route   GET /api/clients
// @access  Private (Manager, Accountant, Admin)
exports.getAllClients = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Client.find().populate('assignedTo', 'username email'), req.query)
    .filter()
    .search(['companyName', 'clientNumber', 'email', 'contactLastName', 'contactFirstName', 'siren', 'vatNumber'])
    .sort()
    .limitFields()
    .paginate();

  const clients = await features.mongooseQuery;

  const totalClients = await new APIFeatures(Client.find(features.mongooseQuery.getFilter()), req.query)
                                .filter()
                                .search(['companyName', 'clientNumber', 'email', 'contactLastName', 'contactFirstName', 'siren', 'vatNumber'])
                                .count();

  res.status(200).json({
    success: true,
    count: clients.length,
    total: totalClients,
    pagination: {
        currentPage: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 25, // Limite par défaut pour les clients
        totalPages: Math.ceil(totalClients / (parseInt(req.query.limit, 10) || 25)) || 1
    },
    data: clients,
  });
});

// @desc    Récupérer un client par son ID
// @route   GET /api/clients/:id
// @access  Private (Manager, Accountant, Admin)
exports.getClientById = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.params.id)
    .populate('assignedTo', 'username email')
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email')
    .populate('history.recordedBy', 'username'); // Populer l'auteur des interactions

  if (!client) {
    return next(new AppError(`Client non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: client,
  });
});

// @desc    Créer un nouveau client
// @route   POST /api/clients
// @access  Private (Manager, Admin)
exports.createClient = asyncHandler(async (req, res, next) => {
  const clientData = { ...req.body };
  clientData.createdBy = req.user.id; // Assigner l'utilisateur connecté comme créateur

  // Générer un numéro de client si non fourni et si la logique est activée
  if (!clientData.clientNumber) {
    try {
        // Utiliser un préfixe 'CLI' et un padding de 5 par exemple
        clientData.clientNumber = await generateDocumentNumber('CLIENT', 'CLI', 5);
    } catch (error) {
        console.error("Erreur lors de la génération du numéro de client:", error);
        // Décider si c'est une erreur bloquante ou si on continue sans clientNumber
        // return next(new AppError('Impossible de générer le numéro de client.', 500));
    }
  } else {
    // Vérifier l'unicité si clientNumber est fourni manuellement
    const existingClientByNumber = await Client.findOne({ clientNumber: clientData.clientNumber });
    if (existingClientByNumber) {
        return next(new AppError(`Un client avec le numéro '${clientData.clientNumber}' existe déjà.`, 400));
    }
  }

  // Vérifier l'unicité de l'email si un email est fourni et si vous voulez qu'il soit unique
  // (Le modèle actuel ne force pas l'unicité de l'email client)
  // if (clientData.email) {
  //   const existingClientByEmail = await Client.findOne({ email: clientData.email });
  //   if (existingClientByEmail) {
  //     return next(new AppError(`Un client avec l'email '${clientData.email}' existe déjà.`, 400));
  //   }
  // }

  const client = await Client.create(clientData);

  res.status(201).json({
    success: true,
    message: 'Client créé avec succès.',
    data: client,
  });
});

// @desc    Mettre à jour un client
// @route   PUT /api/clients/:id
// @access  Private (Manager, Admin)
exports.updateClient = asyncHandler(async (req, res, next) => {
  const clientId = req.params.id;
  const updateData = { ...req.body };
  updateData.updatedBy = req.user.id; // Assigner l'utilisateur connecté comme modificateur

  let client = await Client.findById(clientId);

  if (!client) {
    return next(new AppError(`Client non trouvé avec l'ID ${clientId}`, 404));
  }

  // Gérer la mise à jour de clientNumber si fourni et différent
  if (updateData.clientNumber && updateData.clientNumber !== client.clientNumber) {
    const existingClientByNumber = await Client.findOne({ clientNumber: updateData.clientNumber, _id: { $ne: clientId } });
    if (existingClientByNumber) {
        return next(new AppError(`Un autre client avec le numéro '${updateData.clientNumber}' existe déjà.`, 400));
    }
  }

  // Utiliser findByIdAndUpdate pour une mise à jour plus simple si les hooks ne sont pas complexes
  // Ou mettre à jour les champs manuellement et utiliser client.save() pour déclencher tous les hooks/validations
  // client = Object.assign(client, updateData); // Met à jour les champs de l'objet client
  // const updatedClient = await client.save();

  // Option alternative avec findByIdAndUpdate (moins de contrôle sur les hooks Mongoose spécifiques au save)
  const updatedClient = await Client.findByIdAndUpdate(clientId, updateData, {
    new: true, // Retourner le document mis à jour
    runValidators: true, // Exécuter les validateurs du schéma
  });

  if (!updatedClient) { // Double vérification au cas où findByIdAndUpdate échouerait silencieusement après la recherche initiale
      return next(new AppError(`Client non trouvé avec l'ID ${clientId} lors de la tentative de mise à jour.`, 404));
  }

  res.status(200).json({
    success: true,
    message: 'Client mis à jour avec succès.',
    data: updatedClient,
  });
});

// @desc    Supprimer un client
// @route   DELETE /api/clients/:id
// @access  Private (Admin)
exports.deleteClient = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return next(new AppError(`Client non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Avant de supprimer, vous pourriez vouloir vérifier s'il y a des documents liés (factures, devis)
  // et décider de la politique (suppression en cascade, archivage, interdiction de suppression).
  // Exemple (nécessite d'importer les modèles Invoice, Quote, etc.):
  // const activeInvoices = await Invoice.countDocuments({ client: client._id, status: { $nin: ['PAID', 'CANCELLED'] } });
  // if (activeInvoices > 0) {
  //   return next(new AppError('Ce client a des factures actives et ne peut pas être supprimé.', 400));
  // }

  // Pour une suppression réelle :
  await client.deleteOne();
  // Ou Client.findByIdAndDelete(req.params.id);

  // Pour une suppression logique (soft delete), mettre à jour le statut:
  // client.status = 'ARCHIVED'; // Ou un statut 'DELETED'
  // client.updatedBy = req.user.id;
  // await client.save();

  res.status(200).json({
    success: true,
    message: 'Client supprimé avec succès.',
    data: {},
  });
});


// --- Gestion des Interactions Client ---

// @desc    Ajouter une interaction à un client
// @route   POST /api/clients/:id/interactions
// @access  Private (Manager, Admin)
exports.addClientInteraction = asyncHandler(async (req, res, next) => {
    const clientId = req.params.id;
    const { type, summary, documentType, documentId } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
        return next(new AppError(`Client non trouvé avec l'ID ${clientId}`, 404));
    }

    if (!type || !summary) {
        return next(new AppError('Le type et le résumé de l\'interaction sont requis.', 400));
    }

    const newInteraction = {
        type,
        summary,
        documentType: documentType || null,
        documentId: documentId || null,
        recordedBy: req.user.id, // Utilisateur connecté
    };

    client.history.push(newInteraction);
    await client.save();

    // Renvoyer uniquement la dernière interaction ajoutée ou le client complet
    // Pour renvoyer la dernière interaction, il faut la récupérer après la sauvegarde
    const updatedClient = await Client.findById(clientId).populate('history.recordedBy', 'username');
    const addedInteraction = updatedClient.history[updatedClient.history.length - 1];


    res.status(201).json({
        success: true,
        message: 'Interaction ajoutée avec succès.',
        data: addedInteraction, // Ou client si vous préférez
    });
});

// @desc    Supprimer une interaction d'un client
// @route   DELETE /api/clients/:id/interactions/:interactionId
// @access  Private (Manager, Admin)
exports.deleteClientInteraction = asyncHandler(async (req, res, next) => {
    const { id: clientId, interactionId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
        return next(new AppError(`Client non trouvé avec l'ID ${clientId}`, 404));
    }

    const interactionIndex = client.history.findIndex(
        (hist) => hist._id.toString() === interactionId
    );

    if (interactionIndex === -1) {
        return next(new AppError(`Interaction non trouvée avec l'ID ${interactionId} pour ce client.`, 404));
    }

    // Vérifier si l'utilisateur a le droit de supprimer cette interaction (ex: créateur ou admin)
    // if (client.history[interactionIndex].recordedBy.toString() !== req.user.id && req.user.role !== 'ADMIN') {
    //     return next(new AppError('Vous n\'êtes pas autorisé à supprimer cette interaction.', 403));
    // }

    client.history.splice(interactionIndex, 1); // Supprimer l'interaction du tableau
    await client.save();

    res.status(200).json({
        success: true,
        message: 'Interaction supprimée avec succès.',
        data: {},
    });
});