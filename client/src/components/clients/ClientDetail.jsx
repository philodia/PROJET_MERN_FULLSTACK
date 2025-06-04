// frontend/src/components/clients/ClientDetails.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, ListGroup} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // Pour formater les dates
import { fr } from 'date-fns/locale';

import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge';
import AppButton from '../common/AppButton';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import './ClientDetails.scss'; // Fichier SCSS pour des styles personnalisés

/**
 * Affiche les détails complets d'un client.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.client - L'objet client contenant les détails.
 * @param {boolean} [props.isLoading=false] - Si les données du client sont en cours de chargement.
 * @param {object|string} [props.error] - Erreur à afficher si le chargement a échoué.
 * @param {function} [props.onEdit] - Callback pour déclencher le mode édition (reçoit l'ID du client).
 * @param {function} [props.onDelete] - Callback pour déclencher la suppression (reçoit l'ID du client).
 * @param {string} [props.className] - Classes CSS supplémentaires.
 */
const ClientDetails = ({
  client,
  isLoading = false,
  error,
  onEdit,
  onDelete,
  className = '',
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner message="Chargement des détails du client..." />;
  }

  if (error) {
    return <AlertMessage variant="danger">{typeof error === 'string' ? error : error.message || "Erreur lors du chargement du client."}</AlertMessage>;
  }

  if (!client) {
    return <AlertMessage variant="warning">Aucun client sélectionné ou trouvé.</AlertMessage>;
  }

  const {
    id,
    companyName,
    contactName,
    email,
    phone,
    siren,
    tvaIntracom,
    address,
    notes,
    status, // Supposons un champ 'status'
    createdAt, // Supposons une date de création
    updatedAt, // Supposons une date de mise à jour
    // ... autres champs potentiels (historique interactions, etc.)
  } = client;

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(id);
    } else {
      navigate(`/clients/edit/${id}`);
    }
  };

  const handleDeleteClick = () => {
    // Idéalement, afficher une modale de confirmation ici
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le client "${companyName}" ? Cette action est irréversible.`)) {
      if (onDelete) {
        onDelete(id);
      } else {
        console.warn("Fonction onDelete non fournie à ClientDetails.");
        // Logique de suppression par défaut ou navigation si nécessaire
      }
    }
  };

  const formatClientDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`client-details-wrapper ${className}`}>
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center client-details-header">
          <div>
            <h4 className="mb-0">{companyName}</h4>
            {contactName && <Card.Subtitle className="mt-1 text-muted">{contactName}</Card.Subtitle>}
          </div>
          <div className="client-actions">
            {onEdit && (
              <AppButton variant="outline-primary" size="sm" onClick={handleEditClick} className="me-2">
                <Icon name="FaPencilAlt" className="me-1" /> Modifier
              </AppButton>
            )}
            {onDelete && (
              <AppButton variant="outline-danger" size="sm" onClick={handleDeleteClick}>
                <Icon name="FaTrash" className="me-1" /> Supprimer
              </AppButton>
            )}
          </div>
        </Card.Header>

        <Card.Body>
          <Row>
            {/* Colonne Informations de Contact & Légales */}
            <Col md={6} className="mb-4 mb-md-0">
              <h5 className="section-title"><Icon name="BsPersonLinesFill" className="me-2" />Contact & Légal</h5>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Icon name="BsEnvelopeFill" className="me-2 text-muted" />
                  <strong>Email :</strong> {email || '-'}
                </ListGroup.Item>
                <ListGroup.Item>
                  <Icon name="BsTelephoneFill" className="me-2 text-muted" />
                  <strong>Téléphone :</strong> {phone || '-'}
                </ListGroup.Item>
                {siren && (
                  <ListGroup.Item>
                    <Icon name="BsBuilding" className="me-2 text-muted" /> {/* Icône générique pour SIREN */}
                    <strong>SIREN :</strong> {siren}
                  </ListGroup.Item>
                )}
                {tvaIntracom && (
                  <ListGroup.Item>
                    <Icon name="BsGlobeEuropeAfrica" className="me-2 text-muted" /> {/* Icône pour TVA Intra */}
                    <strong>N° TVA Intracom. :</strong> {tvaIntracom}
                  </ListGroup.Item>
                )}
                {status && (
                    <ListGroup.Item className="d-flex align-items-center">
                        <Icon name="BsToggleOn" className="me-2 text-muted" /> {/* Ou une icône plus spécifique */}
                        <strong>Statut :</strong>
                        <StatusBadge variant={status} pillSize="sm" className="ms-2">{status}</StatusBadge>
                    </ListGroup.Item>
                )}
              </ListGroup>
            </Col>

            {/* Colonne Adresse */}
            <Col md={6}>
              <h5 className="section-title"><Icon name="BsGeoAltFill" className="me-2" />Adresse</h5>
              {address ? (
                <ListGroup variant="flush">
                  <ListGroup.Item>{address.street || '-'}</ListGroup.Item>
                  <ListGroup.Item>
                    {address.zipCode || '-'} {address.city || '-'}
                  </ListGroup.Item>
                  {address.state && <ListGroup.Item>{address.state}</ListGroup.Item>}
                  <ListGroup.Item>{address.country || '-'}</ListGroup.Item>
                </ListGroup>
              ) : (
                <p className="text-muted">Aucune adresse renseignée.</p>
              )}
            </Col>
          </Row>

          {notes && (
            <Row className="mt-4">
              <Col>
                <h5 className="section-title"><Icon name="BsChatSquareText" className="me-2" />Notes</h5>
                <Card bg="light" className="p-3 notes-card">
                  <Card.Text style={{ whiteSpace: 'pre-wrap' }}>{notes}</Card.Text>
                </Card>
              </Col>
            </Row>
          )}

          {/* Section Historique (à développer si nécessaire) */}
          {/*
          <Row className="mt-4">
            <Col>
              <h5 className="section-title"><Icon name="BsClockHistory" className="me-2" />Historique des Interactions</h5>
              <ListGroup>
                {client.interactionHistory?.map(entry => (
                  <ListGroup.Item key={entry.id}>
                    <strong>{formatClientDate(entry.date)}:</strong> {entry.action}
                    {entry.documentId && <Link to={`/documents/${entry.documentId}`}> (Voir doc)</Link>}
                  </ListGroup.Item>
                ))}
                {!client.interactionHistory?.length && <ListGroup.Item>Aucune interaction enregistrée.</ListGroup.Item>}
              </ListGroup>
            </Col>
          </Row>
          */}

        </Card.Body>

        {(createdAt || updatedAt) && (
            <Card.Footer className="text-muted small client-details-footer">
                {createdAt && <span>Créé le : {formatClientDate(createdAt)}</span>}
                {updatedAt && createdAt && <span className="mx-2">|</span>}
                {updatedAt && <span>Dernière modification : {formatClientDate(updatedAt)}</span>}
            </Card.Footer>
        )}
      </Card>
    </div>
  );
};

ClientDetails.propTypes = {
  client: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    companyName: PropTypes.string.isRequired,
    contactName: PropTypes.string,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string,
    siren: PropTypes.string,
    tvaIntracom: PropTypes.string,
    address: PropTypes.shape({
      street: PropTypes.string,
      city: PropTypes.string,
      zipCode: PropTypes.string,
      state: PropTypes.string,
      country: PropTypes.string,
    }),
    notes: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string, // Date ISO string
    updatedAt: PropTypes.string, // Date ISO string
    // interactionHistory: PropTypes.array, // Exemple
  }), // client peut être null ou undefined si pas encore chargé
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
};

export default ClientDetails;