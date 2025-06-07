// frontend/src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Nav, Collapse } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import Icon from '../common/Icon';
//import './Sidebar.scss';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (key) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Tableau de Bord',
      to: '/dashboard',
      icon: 'BsGrid1X2Fill',
      roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
      exact: true,
    },
    {
      key: 'commercial',
      label: 'Espace Commercial',
      icon: 'BsBriefcaseFill',
      roles: ['ADMIN', 'MANAGER'],
      submenu: [
        { key: 'clients', label: 'Clients', to: '/clients', icon: 'BsPeopleFill', roles: ['ADMIN', 'MANAGER'] },
        { key: 'suppliers', label: 'Fournisseurs', to: '/suppliers', icon: 'BsTruck', roles: ['ADMIN', 'MANAGER'] },
        { key: 'products', label: 'Produits & Stock', to: '/products', icon: 'BsBoxSeam', roles: ['ADMIN', 'MANAGER'] },
        { key: 'quotes', label: 'Devis', to: '/quotes', icon: 'BsFileEarmarkRuledFill', roles: ['ADMIN', 'MANAGER'] },
        { key: 'delivery-notes', label: 'Bons de Livraison', to: '/delivery-notes', icon: 'BsFileEarmarkZipFill', roles: ['ADMIN', 'MANAGER'] },
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
        { key: 'journal', label: 'Journal', to: '/accounting/journal', icon: 'BsJournalText', roles: ['ADMIN', 'ACCOUNTANT'] },
        { key: 'ledger', label: 'Grand Livre', to: '/accounting/ledger', icon: 'BsBookHalf', roles: ['ADMIN', 'ACCOUNTANT'] },
        { key: 'balance-sheet', label: 'Bilan', to: '/accounting/balance-sheet', icon: 'BsBarChartLineFill', roles: ['ADMIN', 'ACCOUNTANT'] },
        { key: 'chart-of-accounts', label: 'Plan Comptable', to: '/accounting/chart-of-accounts', icon: 'BsDiagram3Fill', roles: ['ADMIN', 'ACCOUNTANT'] },
      ],
    },
    {
      key: 'admin',
      label: 'Administration',
      icon: 'BsGearFill',
      roles: ['ADMIN'],
      submenu: [
        { key: 'user-management', label: 'Utilisateurs', to: '/admin/users', icon: 'BsPersonLinesFill', roles: ['ADMIN'] },
        { key: 'security-logs', label: 'Journaux Sécurité', to: '/admin/security-logs', icon: 'BsShieldLockFill', roles: ['ADMIN'] },
      ],
    },
    {
      key: 'profile',
      label: 'Mon Profil',
      to: '/profile',
      icon: 'BsPersonCircle',
      roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'],
    },
  ];

  const renderMenuItem = (item, level = 0) => {
    const hasAccess = !item.roles || hasRole(item.roles);
    if (!hasAccess) return null;

    const visibleSubItems = item.submenu?.filter(sub => !sub.roles || hasRole(sub.roles)) || [];
    const hasSubmenu = visibleSubItems.length > 0;
    const isSubmenuOpen = openSubmenus[item.key] || false;

    const handleLinkClick = () => {
      if (window.innerWidth < 992 && toggleSidebar) {
        toggleSidebar();
      }
    };

    if (hasSubmenu) {
      return (
        <React.Fragment key={item.key}>
          <Nav.Link
            onClick={() => toggleSubmenu(item.key)}
            aria-expanded={isSubmenuOpen}
            className={`sidebar-link level-${level}`}
          >
            {item.icon && <Icon name={item.icon} className="sidebar-icon" />}
            <span className="sidebar-label">{item.label}</span>
            <Icon name={isSubmenuOpen ? 'BsChevronUp' : 'BsChevronDown'} className="sidebar-submenu-arrow" />
          </Nav.Link>
          <Collapse in={isSubmenuOpen}>
            <div className="sidebar-submenu ps-3">
              <Nav className="flex-column">
                {visibleSubItems.map(sub => renderMenuItem(sub, level + 1))}
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
        className={({ isActive }) =>
          `sidebar-link level-${level} ${isActive ? 'active' : ''}`
        }
        onClick={handleLinkClick}
        end={item.exact}
      >
        {item.icon && <Icon name={item.icon} className="sidebar-icon" />}
        <span className="sidebar-label">{item.label}</span>
      </Nav.Link>
    );
  };

  if (!isAuthenticated) return null;

  const visibleMenuItems = menuItems.filter(item => {
    const parentAccess = !item.roles || hasRole(item.roles);
    const subAccess = item.submenu?.some(sub => !sub.roles || hasRole(sub.roles)) || false;
    return parentAccess || subAccess;
  });

  return (
    <aside className={`app-sidebar shadow-sm ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header p-3 border-bottom d-flex justify-content-between align-items-center">
        <NavLink to="/dashboard" className="sidebar-brand text-decoration-none">
          <Icon name="BsBootstrapFill" size="1.5em" className="me-2" />
          <span className="fw-bold fs-5">GestionApp</span>
        </NavLink>
        <button className="btn btn-sm d-lg-none" onClick={toggleSidebar}>
          <Icon name="BsX" />
        </button>
      </div>
      <Nav className="flex-column sidebar-nav p-2">
        {visibleMenuItems.map(item => renderMenuItem(item))}
      </Nav>
    </aside>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Sidebar;
