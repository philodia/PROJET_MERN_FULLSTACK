// gestion-commerciale-app/backend/services/sftp.service.js

const Client = require('ssh2-sftp-client');
const fs = require('fs').promises; // Utiliser la version promesse de fs
const path = require('path');
const os = require('os'); // Pour créer des répertoires temporaires
const config = require('../config'); // Pour les identifiants SFTP

class SFTPService {
  /**
   * Se connecte à un serveur SFTP.
   * @returns {Promise<Client>} Une promesse qui se résout avec l'instance du client SFTP connecté.
   * @throws {Error} Si la connexion échoue ou si la configuration SFTP est manquante.
   * @private
   */
  static async _connect() {
    if (!config.SFTP_HOST || !config.SFTP_USER) {
      throw new Error('Configuration SFTP (hôte, utilisateur) manquante. Vérifiez vos variables d\'environnement.');
    }

    const sftp = new Client();
    const sftpConfig = {
      host: config.SFTP_HOST,
      port: config.SFTP_PORT || 22,
      username: config.SFTP_USER,
      // Différentes méthodes d'authentification:
      // 1. Mot de passe (moins sécurisé, à éviter en production si possible)
      ...(config.SFTP_PASSWORD && { password: config.SFTP_PASSWORD }),
      // 2. Clé privée (plus sécurisé)
      // ...(config.SFTP_PRIVATE_KEY_PATH && { privateKey: await fs.readFile(config.SFTP_PRIVATE_KEY_PATH) }),
      // Vous pourriez avoir besoin d'ajouter `passphrase` si votre clé privée est protégée par une passphrase.
      // ...(config.SFTP_PRIVATE_KEY_PASSPHRASE && { passphrase: config.SFTP_PRIVATE_KEY_PASSPHRASE }),
      // retry: 2, // Nombre de tentatives de reconnexion
      // readyTimeout: 20000, // Délai d'attente pour la connexion
    };

    // Si vous utilisez une clé privée, assurez-vous que SFTP_PRIVATE_KEY_PATH est défini
    // et que le fichier de clé est lisible.
    if (config.SFTP_PRIVATE_KEY_PATH) {
      try {
        sftpConfig.privateKey = await fs.readFile(path.resolve(config.SFTP_PRIVATE_KEY_PATH));
        if (config.SFTP_PRIVATE_KEY_PASSPHRASE) {
          sftpConfig.passphrase = config.SFTP_PRIVATE_KEY_PASSPHRASE;
        }
        // Supprimer le mot de passe si la clé privée est utilisée pour éviter les conflits
        delete sftpConfig.password;
      } catch (err) {
        console.error(`Erreur lors de la lecture de la clé privée SFTP: ${config.SFTP_PRIVATE_KEY_PATH}`.red, err);
        throw new Error(`Impossible de lire la clé privée SFTP: ${err.message}`);
      }
    } else if (!config.SFTP_PASSWORD) {
        throw new Error('Configuration SFTP (mot de passe ou clé privée) manquante.');
    }


    try {
      await sftp.connect(sftpConfig);
      console.log(`Connecté au serveur SFTP: ${config.SFTP_HOST}`.cyan);
      return sftp;
    } catch (err) {
      console.error(`Erreur de connexion SFTP à ${config.SFTP_HOST}:`.red, err);
      throw new Error(`Impossible de se connecter au serveur SFTP: ${err.message}`);
    }
  }

  /**
   * Exporte des données (contenu d'un fichier) vers un serveur SFTP.
   * @param {string|Buffer} dataToUpload - Les données à uploader (contenu du fichier).
   * @param {string} remoteFileName - Le nom du fichier sur le serveur distant (incluant le chemin si nécessaire).
   * @param {string} [remoteDirectory] - Le répertoire distant où uploader le fichier.
   *                                     Sera créé s'il n'existe pas. Utilise SFTP_REMOTE_PATH de la config par défaut.
   * @returns {Promise<string>} Une promesse qui se résout avec le chemin complet du fichier sur le serveur distant.
   * @throws {Error} Si l'upload échoue.
   */
  static async exportData(dataToUpload, remoteFileName, remoteDirectory) {
    if (!dataToUpload || !remoteFileName) {
      throw new Error('Données à uploader et nom de fichier distant sont requis.');
    }

    const sftp = await this._connect();
    let localTempFilePath = null; // Pour stocker le chemin du fichier temporaire

    try {
      const targetDirectory = remoteDirectory || config.SFTP_REMOTE_PATH || '/upload'; // Répertoire distant par défaut
      const remotePath = path.join(targetDirectory, remoteFileName).replace(/\\/g, '/'); // Assurer des slashs Unix

      // S'assurer que le répertoire distant existe, le créer sinon
      // La méthode `sftp.exists` peut être peu fiable sur certains serveurs, `mkdir` avec `recursive` est mieux.
      try {
        await sftp.mkdir(targetDirectory, true); // true pour récursif (comme mkdir -p)
        console.log(`Répertoire distant '${targetDirectory}' assuré/créé.`.grey);
      } catch (mkdirError) {
        // Certaines implémentations SFTP peuvent retourner une erreur si le dossier existe déjà,
        // même avec le mode récursif. On peut essayer de continuer si l'erreur n'est pas critique.
        // Ou vérifier si c'est une erreur "déjà existant" si le code d'erreur est disponible.
        console.warn(`Avertissement lors de la création du répertoire distant '${targetDirectory}':`.yellow, mkdirError.message);
      }


      let dataSource;
      if (Buffer.isBuffer(dataToUpload)) {
        dataSource = dataToUpload;
      } else if (typeof dataToUpload === 'string') {
        dataSource = Buffer.from(dataToUpload, 'utf-8');
      } else {
        throw new Error('Les données à uploader doivent être une chaîne de caractères ou un Buffer.');
      }

      // Uploader les données directement depuis le buffer
      await sftp.put(dataSource, remotePath);
      console.log(`Fichier '${remoteFileName}' uploadé avec succès vers ${remotePath}`.green);

      return remotePath;

    } catch (err) {
      console.error(`Erreur lors de l'export SFTP du fichier '${remoteFileName}':`.red, err);
      throw new Error(`Échec de l'upload SFTP: ${err.message}`);
    } finally {
      if (sftp) {
        try {
          await sftp.end();
          // console.log('Connexion SFTP fermée.'.grey);
        } catch (endErr) {
          console.error('Erreur lors de la fermeture de la connexion SFTP:'.yellow, endErr);
        }
      }
      // Supprimer le fichier temporaire s'il a été créé
      if (localTempFilePath) {
        try {
          await fs.unlink(localTempFilePath);
          // console.log(`Fichier temporaire '${localTempFilePath}' supprimé.`.grey);
        } catch (unlinkErr) {
          console.warn(`Impossible de supprimer le fichier temporaire '${localTempFilePath}':`.yellow, unlinkErr);
        }
      }
    }
  }

  /**
   * Exporte un fichier local vers un serveur SFTP.
   * @param {string} localFilePath - Le chemin du fichier local à uploader.
   * @param {string} remoteFileName - Le nom du fichier sur le serveur distant.
   * @param {string} [remoteDirectory] - Le répertoire distant. Utilise SFTP_REMOTE_PATH par défaut.
   * @returns {Promise<string>} Le chemin complet du fichier sur le serveur distant.
   */
  static async exportFile(localFilePath, remoteFileName, remoteDirectory) {
    if (!localFilePath || !remoteFileName) {
      throw new Error('Chemin du fichier local et nom de fichier distant sont requis.');
    }
    try {
      const fileData = await fs.readFile(localFilePath);
      return this.exportData(fileData, remoteFileName, remoteDirectory);
    } catch (readError) {
      console.error(`Erreur lors de la lecture du fichier local '${localFilePath}' pour l'export SFTP:`.red, readError);
      throw new Error(`Impossible de lire le fichier local: ${readError.message}`);
    }
  }


  // --- Fonctions optionnelles (lister des fichiers, télécharger, etc.) ---
  /**
   * Liste les fichiers et répertoires dans un répertoire distant.
   * @param {string} [remotePath=''] - Le chemin du répertoire distant à lister. Par défaut, le répertoire racine.
   * @returns {Promise<Array<Object>>} Une promesse qui se résout avec un tableau d'objets décrivant les entrées.
   */
  static async listDirectory(remotePath = '.') {
    const sftp = await this._connect();
    try {
      const list = await sftp.list(remotePath);
      return list;
    } catch (err) {
      console.error(`Erreur lors du listage du répertoire SFTP '${remotePath}':`.red, err);
      throw new Error(`Impossible de lister le répertoire SFTP: ${err.message}`);
    } finally {
      if (sftp) await sftp.end();
    }
  }
}

module.exports = SFTPService;

// --- Exemple d'utilisation (à mettre dans un contrôleur ou une tâche planifiée) ---
/*
async function testSFTPExport() {
  const testData = `Ceci est un fichier de test pour SFTP.\nDate: ${new Date().toISOString()}\nLigne 2\nLigne 3`;
  const testFileName = `test_export_${Date.now()}.txt`;
  // Le répertoire distant sera pris depuis config.SFTP_REMOTE_PATH ou '/upload' par défaut

  try {
    // S'assurer que les variables d'environnement SFTP sont configurées dans .env
    if (!config.SFTP_HOST || !config.SFTP_USER || !(config.SFTP_PASSWORD || config.SFTP_PRIVATE_KEY_PATH)) {
      console.warn("Variables d'environnement SFTP (SFTP_HOST, SFTP_USER, et SFTP_PASSWORD ou SFTP_PRIVATE_KEY_PATH) non configurées. Test SFTP sauté.".yellow);
      return;
    }

    const remoteFilePath = await SFTPService.exportData(testData, testFileName);
    console.log(`Test d'export SFTP réussi. Fichier disponible à: ${remoteFilePath}`.green);

    // Lister le répertoire pour vérifier (optionnel)
    // const dirList = await SFTPService.listDirectory(config.SFTP_REMOTE_PATH || '/upload');
    // console.log('Liste du répertoire distant:', dirList.map(item => item.name));

  } catch (error) {
    console.error('Échec du test d'export SFTP:'.red, error.message);
  }
}

// Décommentez pour tester localement
// Assurez-vous d'avoir configuré vos variables d'environnement SFTP dans .env
// (SFTP_HOST, SFTP_PORT, SFTP_USER, SFTP_PASSWORD ou SFTP_PRIVATE_KEY_PATH)
// if (process.env.NODE_ENV === 'test_sftp') {
//   testSFTPExport();
// }
*/