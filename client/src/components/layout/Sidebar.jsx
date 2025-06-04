// frontend/src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Nav, Collapse } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import Icon from '../common/Icon';
import './Sidebar.scss';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (menuKey) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  if (!isAuthenticated) return null;

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Tableau de Bord',
      to: '/dashboard',
      icon: 'BsGrid1X2Fill',
      roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
    },
    {
      key: 'commercial',
      label: 'Espace Commercial',
      icon: 'BsBriefcaseFill',
      roles: ['ADMIN', 'MANAGER'],
      submenu: [
        { key: 'clients', label: 'Clients', to: '/clients', icon: 'BsPeopleFill' },
        { key: 'suppliers', label: 'Fournisseurs', to: '/suppliers', icon: 'BsTruck' },
        { key: 'products', label: 'Produits & Stock', to: '/products', icon: 'BsBoxSeam' },
        { key: 'quotes', label: 'Devis', to: '/quotes', icon: 'BsFileEarmarkRuledFill' },
        { key: 'delivery-notes', label: 'Bons de Livraison', to: '/delivery-notes', icon: 'BsFileEarmarkZipFill' },
      ],
    },
    {
      key: 'invoices',
      label: 'Facturation',
      to: '/invoices',
      icon: 'BsFileEarmarkTextFill',
      roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
    },
    {
      key: 'accounting',
      label: 'Comptabilité',
      icon: 'BsCalculatorFill',
      roles: ['ADMIN', 'ACCOUNTANT'],
      submenu: [
        { key: 'journal', label: 'Journal', to: '/accounting/journal', icon: 'BsJournalText' },
        { key: 'ledger', label: 'Grand Livre', to: '/accounting/ledger', icon: 'BsBookHalf' },
        { key: 'balance-sheet', label: 'Bilan', to: '/accounting/balance-sheet', icon: 'BsBarChartLineFill' },
        { key: 'chart-of-accounts', label: 'Plan Comptable', to: '/accounting/chart-of-accounts', icon: 'BsDiagram3Fill' },
      ],
    },
    {
      key: 'admin',
      label: 'Administration',
      icon: 'BsGearFill',
      roles: ['ADMIN'],
      submenu: [
        { key: 'user-management', label: 'Gestion Utilisateurs', to: '/admin/user-management', icon: 'BsPersonLinesFill' },
        { key: 'security-logs', label: 'Journaux Sécurité', to: '/admin/security-logs', icon: 'BsShieldLockFill' },
      ],
    },
  ];

  const renderMenuItem = (item, level = 0) => {
    if (item.roles && !hasRole(item.roles)) return null;

    const hasSubmenu = item.submenu?.length > 0;
    const isSubmenuOpen = openSubmenus[item.key] || false;

    if (hasSubmenu) {
      return (
        <React.Fragment key={item.key}>
          <Nav.Link
            onClick={() => toggleSubmenu(item.key)}
            aria-expanded={isSubmenuOpen}
            aria-controls={`submenu-${item.key}`}
            className={`sidebar-link level-${level} ${isSubmenuOpen ? 'submenu-open' : ''}`}
          >
            {item.icon && <Icon name={item.icon} className="sidebar-icon" />}
            <span className="sidebar-label">{item.label}</span>
            <Icon name={isSubmenuOpen ? 'BsChevronUp' : 'BsChevronDown'} className="sidebar-submenu-arrow" />
          </Nav.Link>
          <Collapse in={isSubmenuOpen}>
            <div id={`submenu-${item.key}`} className="sidebar-submenu">
              <Nav className="flex-column">
                {item.submenu.map((subItem) => renderMenuItem(subItem, level + 1))}
              </Nav>
            </div>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <Nav.Link
        as={NavLink}
        to={item.to}
        key={item.key}
        className={`sidebar-link level-${level}`}
        onClick={toggleSidebar}
        end={level === 0}
      >
        {item.icon && <Icon name={item.icon} className="sidebar-icon" />}
        <span className="sidebar-label">{item.label}</span>
      </Nav.Link>
    );
  };

  return (
    <div className={`sidebar-wrapper ${isOpen ? 'open' : 'closed'}`}>
      <Nav className="flex-column sidebar-nav">
        {menuItems.map(item => renderMenuItem(item))}
      </Nav>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Sidebar;
