// gestion-commerciale-app/backend/utils/apiFeatures.js

class APIFeatures {
  /**
   * Construit une instance de APIFeatures pour chaîner les opérations sur une requête Mongoose.
   * @param {mongoose.Query} mongooseQuery - La requête Mongoose initiale (ex: Model.find()).
   * @param {object} queryString - L'objet de la chaîne de requête de la requête HTTP (req.query).
   */
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery; // La requête Mongoose (ex: Product.find())
    this.queryString = queryString;     // L'objet req.query
  }

  /**
   * Applique le filtrage à la requête Mongoose.
   * Gère les opérateurs de comparaison (gte, gt, lte, lt) et la recherche textuelle simple.
   * @returns {APIFeatures} L'instance actuelle de APIFeatures pour le chaînage.
   */
  filter() {
    // 1A) Filtrage de base
    const queryObj = { ...this.queryString }; // Créer une copie superficielle
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search']; // Champs à exclure du filtrage direct
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Filtrage avancé (pour les opérateurs comme gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    // Remplace gte, gt, lte, lt par $gte, $gt, $lte, $lt de MongoDB
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this; // Permet le chaînage des méthodes
  }

  /**
   * Applique la recherche textuelle (simple) à la requête Mongoose.
   * Recherche sur des champs spécifiés (nécessite un index texte sur ces champs dans le modèle).
   * Ou une recherche plus générique si aucun champ n'est spécifié.
   * @param {string[]} [searchFields] - Optionnel. Tableau de champs sur lesquels effectuer la recherche.
   *                                   Si non fourni, et si 'search' est dans queryString,
   *                                   tente une recherche globale (nécessite un index texte global `$**`).
   * @returns {APIFeatures} L'instance actuelle de APIFeatures pour le chaînage.
   */
  search(searchFields = []) {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      let searchQuery = {};

      if (searchFields && searchFields.length > 0) {
        // Crée une condition $or pour rechercher dans plusieurs champs spécifiés
        searchQuery.$or = searchFields.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' } // 'i' pour insensible à la casse
        }));
      } else {
        // Recherche textuelle MongoDB (nécessite un index texte sur le modèle)
        // Exemple d'index: ProductSchema.index({ name: 'text', description: 'text' });
        // Ou un index global: ProductSchema.index({ '$**': 'text' });
        // Si vous utilisez un index texte, la syntaxe est différente:
        // searchQuery = { $text: { $search: searchTerm } };
        // Pour une recherche regex plus simple sans index texte spécifique (peut être moins performant sur de gros datasets):
        // Cette partie est une approche simple, à adapter si vous avez des index textes.
        // Pour l'instant, on suppose que `searchFields` sera fourni si une recherche ciblée est voulue.
        // Si `searchFields` est vide, cette implémentation ne fera rien par défaut pour éviter des requêtes non optimisées.
        // Vous pourriez vouloir une logique par défaut ici, par exemple, rechercher sur un champ 'name'.
        // console.warn("Recherche globale sans searchFields n'est pas implémentée avec $text par défaut. Spécifiez searchFields.");
        // Ou, si vous voulez une recherche regex sur un champ par défaut si searchFields est vide :
        // searchQuery = { name: { $regex: searchTerm, $options: 'i' } }; // Exemple
      }
      if (Object.keys(searchQuery).length > 0) {
        this.mongooseQuery = this.mongooseQuery.find(searchQuery);
      }
    }
    return this;
  }


  /**
   * Applique le tri à la requête Mongoose.
   * Permet de trier par plusieurs champs.
   * @returns {APIFeatures} L'instance actuelle de APIFeatures pour le chaînage.
   */
  sort() {
    if (this.queryString.sort) {
      // Permet de trier par plusieurs champs, ex: sort=price,-ratingsAverage
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      // Tri par défaut (par exemple, par date de création décroissante)
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt'); // Assurez-vous que createdAt existe (timestamps: true)
    }
    return this;
  }

  /**
   * Limite les champs retournés par la requête Mongoose (projection).
   * @returns {APIFeatures} L'instance actuelle de APIFeatures pour le chaînage.
   */
  limitFields() {
    if (this.queryString.fields) {
      // Permet de sélectionner des champs spécifiques, ex: fields=name,price,description
      const fields = this.queryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      // Exclure le champ __v par défaut (souvent non nécessaire pour le client)
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  /**
   * Applique la pagination à la requête Mongoose.
   * @returns {APIFeatures} L'instance actuelle de APIFeatures pour le chaînage.
   */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 100; // Limite par défaut à 100 documents
    const skip = (page - 1) * limit;

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    // Optionnel: Si vous voulez vérifier si la page demandée est hors limites
    // (nécessite de connaître le nombre total de documents avant la pagination)
    // if (this.queryString.page) {
    //   const numDocuments = await this.mongooseQuery.model.countDocuments(this.mongooseQuery.getFilter());
    //   if (skip >= numDocuments && numDocuments > 0) { // Vérifier numDocuments > 0 pour éviter erreur si db vide
    //     throw new Error('Cette page n\'existe pas'); // Ou renvoyer une réponse appropriée
    //   }
    // }

    return this;
  }

  /**
   * Exécute la requête Mongoose construite et retourne les résultats.
   * @returns {Promise<Array<mongoose.Document>>} Les documents trouvés.
   */
  async exec() {
    return this.mongooseQuery;
  }

  /**
   * Exécute la requête Mongoose pour compter le nombre total de documents correspondant aux filtres (avant pagination).
   * @returns {Promise<number>} Le nombre total de documents.
   */
  async count() {
    // Pour compter, il faut cloner la requête AVANT d'appliquer skip et limit
    // et enlever les options de tri et de sélection de champs qui ne sont pas pertinentes pour countDocuments.
    const countQuery = this.mongooseQuery.model.countDocuments(this.mongooseQuery.getFilter());
    return countQuery;
  }
}

module.exports = APIFeatures;