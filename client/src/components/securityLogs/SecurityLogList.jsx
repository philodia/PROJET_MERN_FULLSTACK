// frontend/src/components/securityLogs/SecurityLogList.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, Badge } from 'react-bootstrap';

import DataTable from '../common/DataTable/DataTable';
import TooltipWrapper from '../common/TooltipWrapper';
import TableActions from '../common/TableActions'; // Assurez-vous que ce composant existe

/**
 * Composant d'affichage des journaux de sécurité.
 */
const SecurityLogList = ({
  logs = [],
  isLoading = false,
  error,
  noDataMessage = "Aucun journal de sécurité trouvé pour les filtres actuels.",
  onViewUserDetails,
  onViewLogDetails,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const actionTypeStyles = (action) => {
    if (action?.includes('FAILURE') || action?.includes('ERROR')) return { variant: 'danger', text: 'Échec' };
    if (action?.includes('SUCCESS') || action?.includes('CREATED') || action?.includes('UPDATED')) return { variant: 'success', text: 'Succès' };
    if (action?.includes('LOGIN')) return { variant: 'info', text: 'Connexion' };
    if (action?.includes('DELETED')) return { variant: 'warning', text: 'Suppression' };
    return { variant: 'secondary', text: 'Autre' };
  };

  const columns = useMemo(() => [
    {
      Header: 'Horodatage',
      accessor: 'timestamp',
      isSortable: true,
      dataType: 'custom',
      render: (item) => formatDate(item.timestamp),
      cellStyle: { width: '180px', whiteSpace: 'nowrap' },
    },
    {
      Header: 'Utilisateur',
      accessor: 'user.username',
      isSortable: true,
      render: (item) => {
        if (item.user) {
          return onViewUserDetails ? (
            <a
              href="#!"
              onClick={(e) => {
                e.preventDefault();
                onViewUserDetails(item.user.id);
              }}
              title={`Voir l'utilisateur ${item.user.username}`}
            >
              {item.user.username}
            </a>
          ) : (
            item.user.username
          );
        }
        return item.usernameAttempt || <span className="text-muted fst-italic">Système/Anonyme</span>;
      },
      cellStyle: { width: '150px' },
    },
    {
      Header: 'Action',
      accessor: 'action',
      isSortable: true,
      render: (item) => {
        const styleInfo = actionTypeStyles(item.action);
        return (
          <TooltipWrapper tooltipText={item.action} id={`action-${item.id}`}>
            <Badge
              pill
              bg={styleInfo.variant.startsWith('text-') ? 'light' : styleInfo.variant}
              className={styleInfo.variant.startsWith('text-') ? styleInfo.variant : ''}
              style={{ fontSize: '0.8em' }}
            >
              {item.action.length > 30 ? `${item.action.substring(0, 27)}...` : item.action}
            </Badge>
          </TooltipWrapper>
        );
      },
      cellStyle: { width: '200px' },
    },
    {
      Header: 'Adresse IP',
      accessor: 'ipAddress',
      isSortable: true,
      render: (item) => item.ipAddress || '-',
      cellStyle: { width: '130px' },
    },
    {
      Header: 'Détails',
      accessor: 'details',
      isSortable: false,
      render: (item) => {
        const detailsText = typeof item.details === 'object' ? JSON.stringify(item.details, null, 2) : String(item.details || '-');
        if (detailsText.length > 70) {
          return (
            <TooltipWrapper
              tooltipText={<pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{detailsText}</pre>}
              id={`details-${item.id}`}
              placement="left"
            >
              <span className="d-inline-block text-truncate" style={{ maxWidth: '300px' }}>
                {detailsText}
              </span>
            </TooltipWrapper>
          );
        }
        return detailsText;
      },
    },
    {
      Header: 'Actions',
      id: 'logActions',
      render: (item) => {
        const actionsConfig = [];
        if (onViewLogDetails) {
          actionsConfig.push({
            id: 'viewLog',
            iconName: 'FaSearchPlus',
            label: 'Voir Détails du Log',
            onClick: () => onViewLogDetails(item),
          });
        }
        return <TableActions item={item} actionsConfig={actionsConfig} />;
      },
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right', paddingRight: '1.5rem' },
      cellStyle: { width: '80px' },
    },
  ], [onViewUserDetails, onViewLogDetails]);

  if (error) {
    return (
      <Alert variant="danger">
        {typeof error === 'string' ? error : error?.message || "Erreur lors du chargement des journaux."}
      </Alert>
    );
  }

  return (
    <div className="security-log-list-container">
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        noDataMessage={noDataMessage}
        isPaginated
        itemsPerPage={25}
        isSortable
        isHover
        responsive
        size="sm"
      />
    </div>
  );
};

SecurityLogList.propTypes = {
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      user: PropTypes.shape({
        id: PropTypes.string,
        username: PropTypes.string,
      }),
      usernameAttempt: PropTypes.string,
      action: PropTypes.string.isRequired,
      ipAddress: PropTypes.string,
      details: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      success: PropTypes.bool,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  noDataMessage: PropTypes.string,
  onViewUserDetails: PropTypes.func,
  onViewLogDetails: PropTypes.func,
};

export default SecurityLogList;
