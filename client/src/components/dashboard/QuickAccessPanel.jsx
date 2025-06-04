// frontend/src/components/dashboard/QuickAccessPanel.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, ListGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon'; // Votre composant Icon
import { useAuth } from '../../hooks/useAuth';
import './QuickAccessPanel.scss';

/**
 * @typedef {object} QuickAccessItem
 * @property {string} id
 * @property {string} label
 * @property {string} iconName
 * @property {string} [iconLib]
 * @property {string} [iconColor]
 * @property {string} [linkTo]
 * @property {function} [onClick]
 * @property {Array<string>} [roles]
 * @property {string} [variant='primary']
 */

const QuickAccessPanel = ({
  title = 'Accès Rapide',
  items = [],
  className = '',
  cardStyle = {},
}) => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const defaultIconColorMap = {
    primary: 'var(--bs-primary)',
    success: 'var(--bs-success)',
    info: 'var(--bs-info)',
    warning: 'var(--bs-warning)',
    danger: 'var(--bs-danger)',
    secondary: 'var(--bs-secondary)',
  };

  const filteredItems = items.filter(item => !item.roles || hasRole(item.roles));

  if (filteredItems.length === 0) return null;

  return (
    <Card className={`quick-access-panel-card shadow-sm h-100 ${className}`} style={cardStyle}>
      <Card.Header as="h6" className="py-3">{title}</Card.Header>
      <ListGroup variant="flush" className="quick-access-list">
        {filteredItems.map((item) => {
          const content = (
            <div className="d-flex justify-content-between align-items-center quick-access-item">
              <div className="d-flex align-items-center">
                {item.iconName && (
                  <Icon
                    name={item.iconName}
                    lib={item.iconLib}
                    size="1.3em"
                    color={item.iconColor || defaultIconColorMap[item.variant || 'primary']}
                    className="me-3 quick-access-item-icon"
                  />
                )}
                <span className="quick-access-item-label">{item.label}</span>
              </div>
              <Icon name="BsChevronRight" className="quick-access-item-arrow text-muted" size="0.9em" />
            </div>
          );

          const handleClick = (e) => {
            if (item.onClick) {
              e.preventDefault(); // Empêche la navigation si onClick est défini
              item.onClick();
            } else if (item.linkTo) {
              navigate(item.linkTo);
            }
          };

          if (item.linkTo && !item.onClick) {
            return (
              <ListGroup.Item
                as={Link}
                to={item.linkTo}
                key={item.id}
                className="quick-access-item"
              >
                {content}
              </ListGroup.Item>
            );
          }

          return (
            <ListGroup.Item
              key={item.id}
              action
              onClick={handleClick}
              className="quick-access-item"
            >
              {content}
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Card>
  );
};

QuickAccessPanel.propTypes = {
  title: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      iconName: PropTypes.string.isRequired,
      iconLib: PropTypes.string,
      iconColor: PropTypes.string,
      linkTo: PropTypes.string,
      onClick: PropTypes.func,
      roles: PropTypes.arrayOf(PropTypes.string),
      variant: PropTypes.string,
    })
  ).isRequired,
  className: PropTypes.string,
  cardStyle: PropTypes.object,
};

export default QuickAccessPanel;
