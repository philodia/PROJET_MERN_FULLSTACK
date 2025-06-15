// frontend/src/components/common/ErrorBoundary.jsx
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AlertMessage from './AlertMessage'; // Votre composant AlertMessage
import AppButton from './AppButton';       // Votre composant AppButton
import Icon from './Icon';                 // Votre composant Icon

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,        // L'objet erreur
      errorInfo: null,    // Informations sur la pile des composants
    };
  }

  // Cette méthode de cycle de vie est invoquée après qu'un descendant
  // a levé une erreur. Elle reçoit l'erreur levée comme paramètre
  // et doit retourner une valeur pour mettre à jour l'état.
  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour que le prochain rendu affiche l'UI de repli.
    return { hasError: true, error: error };
  }

  // Cette méthode de cycle de vie est aussi invoquée après qu'un descendant
  // a levé une erreur. Elle reçoit deux paramètres :
  // 1. error - L'erreur levée.
  // 2. errorInfo - Un objet avec une clé componentStack contenant
  //    des informations sur le composant qui a levé l'erreur.
  componentDidCatch(error, errorInfo) {
    // Vous pouvez également logger l'erreur vers un service de reporting d'erreurs externe
    console.error("ErrorBoundary a attrapé une erreur:", error, errorInfo);
    this.setState({
      errorInfo: errorInfo,
    });
    // Exemple: logErrorToMyService(error, errorInfo.componentStack);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleResetError = () => {
    // Tenter de réinitialiser l'état d'erreur pour permettre à l'utilisateur de réessayer.
    // Cela ne fonctionnera que si la cause de l'erreur a été résolue ou était temporaire.
    if (this.props.onReset) {
      this.props.onReset(); // Laisser le parent gérer la réinitialisation si nécessaire
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Vous pouvez rendre n'importe quelle UI de repli.
      // Utiliser la prop fallbackUI si fournie, sinon une UI par défaut.
      if (this.props.fallbackUI) {
        // Si fallbackUI est un élément React
        if (React.isValidElement(this.props.fallbackUI)) {
            return this.props.fallbackUI;
        }
        // Si fallbackUI est une fonction qui retourne un élément React
        if (typeof this.props.fallbackUI === 'function') {
            return this.props.fallbackUI({
                error: this.state.error,
                errorInfo: this.state.errorInfo,
                resetError: this.handleResetError
            });
        }
      }

      // UI de repli par défaut
      return (
        <div
          className="error-boundary-fallback d-flex flex-column align-items-center justify-content-center text-center p-4"
          style={{ minHeight: '80vh', border: '1px solid var(--bs-danger-border-subtle)', borderRadius: 'var(--bs-border-radius)', margin: '20px', backgroundColor: 'var(--bs-danger-bg-subtle)' }}
          role="alert"
        >
          <Icon name="BsExclamationOctagonFill" size="3em" color="var(--bs-danger)" className="mb-3" />
          <h2 className="mb-3 text-danger">Oups ! Une erreur est survenue.</h2>
          <p className="text-muted mb-3">
            Nous sommes désolés pour ce désagrément. Notre équipe a été notifiée.
            Veuillez essayer de rafraîchir la page ou de revenir plus tard.
          </p>
          {this.state.error && (
            <AlertMessage variant="danger-light" className="mb-3 text-start" style={{maxWidth: '600px', fontSize: '0.9em'}}>
              <strong>Détails de l'erreur :</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '150px', overflowY: 'auto', marginTop: '0.5rem', backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '4px' }}>
                {this.state.error.toString()}
                {this.state.errorInfo && `\n\nStack de composants:\n${this.state.errorInfo.componentStack}`}
              </pre>
            </AlertMessage>
          )}
          <div className="d-flex gap-2">
            <AppButton variant="primary" onClick={() => window.location.reload()}>
              <Icon name="BsArrowClockwise" className="me-2" />
              Rafraîchir la Page
            </AppButton>
            {this.props.showResetButton && (
                <AppButton variant="outline-secondary" onClick={this.handleResetError}>
                    <Icon name="BsEraserFill" className="me-2" />
                    Réessayer
                </AppButton>
            )}
          </div>
        </div>
      );
    }

    // Normalement, affiche juste les enfants
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackUI: PropTypes.oneOfType([PropTypes.node, PropTypes.func]), // Peut être un élément ou une fonction retournant un élément
  onError: PropTypes.func, // Callback optionnel appelé avec error et errorInfo
  onReset: PropTypes.func, // Callback optionnel pour gérer la logique de réinitialisation
  showResetButton: PropTypes.bool, // Afficher un bouton "Réessayer"
};

ErrorBoundary.defaultProps = {
    fallbackUI: null,
    onError: () => {},
    onReset: () => {},
    showResetButton: false,
};

export default ErrorBoundary;