// frontend/src/components/securityLogs/SecurityLogListItem.jsx
// Ce composant est pour un affichage de log en liste simple, PAS pour DataTable.

import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Icon from '../common/Icon'; // Votre composant Icon
import TooltipWrapper from '../common/TooltipWrapper'; // Pour les tooltips

/**
 * Affiche un item individuel d'un journal de sécurité dans un format de liste.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.log - L'objet log.
 *        { id, timestamp, user: { username }, action, ipAddress, details, success }
 * @param {function} [props.onViewDetails] - Callback pour voir plus de détails (ex: ouvrir une modale).
 */
const SecurityLogListItem = ({ log, onViewDetails }) => {
  if (!log) return null;

  const { timestamp, user, usernameAttempt, action, ipAddress, details, success } = log;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yy HH:mm:ss', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const actionTypeStyles = (logAction) => {
    if (logAction?.includes('FAILURE') || logAction?.includes('ERROR') || success === false) return { bg: 'danger', text: 'white' };
    if (logAction?.includes('SUCCESS') || logAction?.includes('CREATED') || logAction?.includes('UPDATED') || success === true) return { bg: 'success', text: 'white' };
    if (logAction?.includes('LOGIN')) return { bg: 'info', text: 'white' };
    if (logAction?.includes('DELETED') || logAction?.includes('REVOKED')) return { bg: 'warning', text: 'dark' };
    return { bg: 'secondary', text: 'white' };
  };

  const actionStyle = actionTypeStyles(action);
  const displayUser = user?.username || usernameAttempt || 'Système/Anonyme';
  const displayDetails = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

  return (
    <ListGroup.Item
      action={!!onViewDetails} // Rendre cliquable si un handler est fourni
      onClick={onViewDetails ? () => onViewDetails(log) : undefined}
      className="security-log-list-item p-3"
    >
      <div className="d-flex justify-content-between align-items-start">
        <div className="log-main-info flex-grow-1 me-3">
          <div className="log-action-user mb-1">
            <Badge bg={actionStyle.bg} text={actionStyle.text === 'white' ? undefined : actionStyle.text} className="me-2">
              {action}
            </Badge>
            <span className="log-user fw-medium">
              <Icon name={user ? "BsPersonFill" : "BsHddNetworkFill"} className="me-1 text-muted" />
              {displayUser}
            </span>
          </div>
          <p className="log-details text-muted small mb-1" title={displayDetails}>
            {displayDetails.length > 100 ? `${displayDetails.substring(0, 97)}...` : displayDetails}
          </p>
        </div>
        <div className="log-meta-info text-end text-muted small" style={{minWidth: '130px'}}>
          <div>{formatDate(timestamp)}</div>
          {ipAddress && (
            <TooltipWrapper tooltipText={`Adresse IP: ${ipAddress}`} id={`ip-${log.id}`}>
              <div className="log-ip mt-1">
                <Icon name="BsGlobe" className="me-1" />
                {ipAddress}
              </div>
            </TooltipWrapper>
          )}
        </div>
      </div>
      {onViewDetails && (
        <div className="text-end mt-1">
            <a href="#!" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewDetails(log);}} className="small">Voir détails</a>
        </div>
      )}
    </ListGroup.Item>
  );
};

SecurityLogListItem.propTypes = {
  log: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    user: PropTypes.shape({ username: PropTypes.string }),
    usernameAttempt: PropTypes.string,
    action: PropTypes.string.isRequired,
    ipAddress: PropTypes.string,
    details: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    success: PropTypes.bool,
  }).isRequired,
  onViewDetails: PropTypes.func,
};

export default SecurityLogListItem;