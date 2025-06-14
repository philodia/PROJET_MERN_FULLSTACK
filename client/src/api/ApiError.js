// frontend/src/api/ApiError.js
export class ApiError extends Error {
  constructor(
    message,
    status = null,
    details = null,
    isNetworkError = false,
    isCancel = false,
    originalError = null
  ) {
    super(message);
    this.name = this.constructor.name; // 'ApiError'
    this.status = status;
    this.details = details; // Peut contenir des erreurs de validation par champ
    this.isNetworkError = isNetworkError;
    this.isCancel = isCancel; // Si la requête Axios a été annulée
    this.originalError = originalError; // L'erreur Axios ou JS originale

    // Assurer une trace de pile correcte
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}