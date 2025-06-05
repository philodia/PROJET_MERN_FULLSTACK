// frontend/src/components/users/UserListItem.jsx
// Ce composant serait utilisé si vous n'affichez PAS les utilisateurs dans un DataTable,
// mais plutôt dans une liste simple ou une liste de cartes.

import React from 'react';
import PropTypes from 'prop-types';
import { ListGroup, Button, Stack } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Icon from '../common/Icon';
import StatusBadge from '../common/StatusBadge'; // Pour afficher rôle et statut

/**
 * Affiche un résumé d'un utilisateur dans un format de liste (non-tabulaire).
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.user - L'objet utilisateur.
 * @param {function} [props.onEdit] - Callback pour éditer l'utilisateur.
 * @param {function} [props.onDelete] - Callback pour supprimer l'utilisateur.
 * @param {function} [props.onToggleStatus] - Callback pour changer le statut.
 */
const UserListItem = ({ user, onEdit, onDelete, onToggleStatus }) => {
  const navigate = useNavigate();

  if (!user) return null;

  const { id, username, email, role, isActive, lastLogin } = user;

  const roleColors = {
    ADMIN: 'danger',
    MANAGER: 'primary',
    ACCOUNTANT: 'info',
    USER: 'secondary',
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(id);
    else navigate(`/admin/user-management/edit/${id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer l'utilisateur "${username}" ?`)) {
      if (onDelete) onDelete(id);
    }
  };

  const handleToggleStatusClick = (e) => {
    e.stopPropagation();
     if (window.confirm(`Changer le statut de "${username}" à ${isActive ? '"Inactif"' : '"Actif"'} ?`)) {
        if (onToggleStatus) onToggleStatus(id, !isActive);
    }
  };

  const handleItemClick = () => {
    // Naviguer vers une page de détail ou d'édition par défaut si aucun onEdit spécifique
    if (!onEdit && !onToggleStatus && !onDelete) {
        navigate(`/admin/user-management/edit/${id}`); // ou une page de vue détaillée
    }
    // Si des actions sont définies, le clic sur l'item lui-même pourrait ne rien faire
    // ou ouvrir un aperçu rapide. Pour cet exemple, on ne fait rien si des actions existent.
  };

  return (
    <ListGroup.Item
      action={!onEdit && !onDelete && !onToggleStatus} // Rend l'item cliquable s'il n'y a pas d'actions spécifiques
      onClick={handleItemClick}
      className="user-list-item d-flex justify-content-between align-items-center p-3"
    >
      <div className="flex-grow-1 me-3">
        <h6 className="mb-1 username">{username}</h6>
        <p className="mb-1 text-muted small email">
          <Icon name="BsEnvelope" className="me-1" /> {email}
        </p>
        {lastLogin && (
          <p className="mb-0 text-muted x-small last-login">
            <Icon name="BsClockHistory" className="me-1" />
            Dernière connexion: {format(new Date(lastLogin), 'dd/MM/yy HH:mm', { locale: fr })}
          </p>
        )}
      </div>

      <Stack direction="horizontal" gap={2} className="align-items-center user-item-info">
        <StatusBadge variant={roleColors[role?.toUpperCase()] || 'secondary'} pillSize="sm">
          {role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'N/A'}
        </StatusBadge>
        <StatusBadge variant={isActive ? 'success' : 'secondary'} pillSize="sm">
          {isActive ? 'Actif' : 'Inactif'}
        </StatusBadge>
      </Stack>

      <div className="user-item-actions ms-3">
        {onEdit && (
          <Button variant="link" size="sm" onClick={handleEditClick} title="Modifier" className="p-1 text-primary">
            <Icon name="FaPencilAlt" size="1.1em" />
          </Button>
        )}
        {onToggleStatus && (
          <Button variant="link" size="sm" onClick={handleToggleStatusClick} title={isActive ? "Désactiver" : "Activer"} className={`p-1 ${isActive ? 'text-warning' : 'text-success'}`}>
            <Icon name={isActive ? "FaToggleOff" : "FaToggleOn"} size="1.1em" />
          </Button>
        )}
        {onDelete && (
          <Button variant="link" size="sm" onClick={handleDeleteClick} title="Supprimer" className="p-1 text-danger">
            <Icon name="FaTrash" size="1.1em" />
          </Button>
        )}
      </div>
    </ListGroup.Item>
  );
};

UserListItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string,
    isActive: PropTypes.bool,
    lastLogin: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleStatus: PropTypes.func,
};

export default UserListItem;