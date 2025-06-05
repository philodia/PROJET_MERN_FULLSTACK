// frontend/src/components/accounting/LedgerAccountView.jsx
import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Form as BootstrapForm, Button } from 'react-bootstrap'; // Renommer Form
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import DataTable from '../common/DataTable/DataTable';
import LoadingSpinner from '../common/LoadingSpinner';
import AlertMessage from '../common/AlertMessage';
import Icon from '../common/Icon';
// import DatePickerField from '../common/DatePickerField'; // Si vous voulez un sélecteur de date pour la période

/**
 * Affiche les mouvements (écritures de journal) pour un compte spécifique du grand livre.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {object} props.account - L'objet du compte sélectionné { id, accountNumber, accountName }.
 * @param {Array<object>} props.transactions - Tableau des transactions/écritures pour ce compte.
 *        Chaque transaction: { journalEntryId, date, description, debit, credit, balanceAfter }
 * @param {Date | string} props.startDate - Date de début de la période.
 * @param {Date | string} props.endDate - Date de fin de la période.
 * @param {number} [props.openingBalance=0] - Solde d'ouverture du compte pour la période.
 * @param {boolean} [props.isLoading=false] - Si les données sont en cours de chargement.
 * @param {object|string} [props.error] - Erreur à afficher.
 * @param {string} [props.currencySymbol='€'] - Symbole de la devise.
 * @param {function} [props.onViewJournalEntry] - Callback pour voir les détails d'une écriture de journal.
 */
const LedgerAccountView = ({
  account,
  transactions = [],
  startDate,
  endDate,
  openingBalance = 0,
  isLoading = false,
  error,
  currencySymbol = '€',
  onViewJournalEntry,
}) => {
  const [currentBalance, setCurrentBalance] = useState(openingBalance);

  // Calculer le solde courant après chaque transaction
  const transactionsWithBalance = useMemo(() => {
    let runningBalance = openingBalance;
    return transactions.map(tx => {
      runningBalance += (tx.debit || 0) - (tx.credit || 0);
      return { ...tx, balanceAfter: runningBalance };
    });
  }, [transactions, openingBalance]);

  useEffect(() => {
    if (transactionsWithBalance.length > 0) {
      setCurrentBalance(transactionsWithBalance[transactionsWithBalance.length - 1].balanceAfter);
    } else {
      setCurrentBalance(openingBalance);
    }
  }, [transactionsWithBalance, openingBalance]);


  const formatLedgerDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return ''; // Afficher vide pour 0
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


  const columns = useMemo(() => [
    {
      Header: 'Date',
      accessor: 'date',
      isSortable: true, // Tri sur la date de l'écriture de journal
      dataType: 'custom', // Pour utiliser notre formatage spécifique
      render: (item) => formatLedgerDate(item.date),
      cellStyle: { width: '120px' },
    },
    {
      Header: 'Réf. Écriture',
      accessor: 'journalEntryId',
      isSortable: true,
      render: (item) => (
        onViewJournalEntry ? (
          <Link to="#" onClick={(e) => { e.preventDefault(); onViewJournalEntry(item.journalEntryId); }} title="Voir l'écriture">
            {item.journalEntryId.substring(0,12)}{item.journalEntryId.length > 12 ? '...' : ''}
          </Link>
        ) : (
            <span title={item.journalEntryId}>{item.journalEntryId.substring(0,12)}{item.journalEntryId.length > 12 ? '...' : ''}</span>
        )
      ),
      cellStyle: { width: '150px' },
    },
    {
      Header: 'Description',
      accessor: 'description', // Description de la ligne de l'écriture de journal ou de l'écriture elle-même
    },
    {
      Header: `Débit (${currencySymbol})`,
      accessor: 'debit',
      dataType: 'custom',
      render: (item) => formatAmount(item.debit),
      isSortable: true,
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right' },
      cellStyle: { width: '130px' },
    },
    {
      Header: `Crédit (${currencySymbol})`,
      accessor: 'credit',
      dataType: 'custom',
      render: (item) => formatAmount(item.credit),
      isSortable: true,
      cellClassName: 'text-end',
      headerStyle: { textAlign: 'right' },
      cellStyle: { width: '130px' },
    },
    {
      Header: `Solde (${currencySymbol})`,
      accessor: 'balanceAfter',
      dataType: 'custom',
      render: (item) => item.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      isSortable: false, // Le solde courant n'est généralement pas triable directement
      cellClassName: 'text-end fw-bold',
      headerStyle: { textAlign: 'right' },
      cellStyle: { width: '150px' },
    },
  ], [currencySymbol, onViewJournalEntry]);


  if (isLoading) {
    return <LoadingSpinner message="Chargement des mouvements du compte..." />;
  }

  if (error) {
    return <AlertMessage variant="danger">{typeof error === 'string' ? error : error.message || "Erreur lors du chargement des mouvements."}</AlertMessage>;
  }

  if (!account) {
    return <AlertMessage variant="info">Veuillez sélectionner un compte pour afficher son grand livre.</AlertMessage>;
  }

  return (
    <Card className="ledger-account-view-card shadow-sm">
      <Card.Header>
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">Grand Livre du Compte : {account.accountNumber} - {account.accountName}</h5>
            <small className="text-muted">
              Période du {formatLedgerDate(startDate)} au {formatLedgerDate(endDate)}
            </small>
          </Col>
          {/* Optionnel: Boutons d'export ou de filtrage de période ici */}
        </Row>
      </Card.Header>
      <Card.Body>
        <div className="ledger-summary mb-3 p-3 bg-light rounded">
            <Row>
                <Col md={4}>
                    <strong>Solde d'Ouverture :</strong>
                    <span className="ms-2">{openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</span>
                </Col>
                <Col md={4} className="text-md-center">
                    <strong>Mouvements Période (Débit - Crédit) :</strong>
                    <span className="ms-2">
                        {(transactionsWithBalance.reduce((sum, tx) => sum + (tx.debit || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {' '}-{' '}
                        {(transactionsWithBalance.reduce((sum, tx) => sum + (tx.credit || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {' '}{currencySymbol}
                    </span>
                </Col>
                <Col md={4} className="text-md-end">
                    <strong>Solde de Clôture :</strong>
                    <span className={`ms-2 fw-bold ${currentBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                    </span>
                </Col>
            </Row>
        </div>

        <DataTable
          columns={columns}
          data={transactionsWithBalance}
          isLoading={false} // Le chargement principal est géré par ce composant
          noDataMessage="Aucun mouvement pour ce compte sur la période sélectionnée."
          isPaginated
          itemsPerPage={20}
          isSortable // Permettre le tri sur les colonnes configurées
          isHover
          responsive
          size="sm"
        />
      </Card.Body>
    </Card>
  );
};

LedgerAccountView.propTypes = {
  account: PropTypes.shape({
    id: PropTypes.string.isRequired,
    accountNumber: PropTypes.string.isRequired,
    accountName: PropTypes.string.isRequired,
  }), // Peut être null si aucun compte sélectionné
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      journalEntryId: PropTypes.string.isRequired, // ID de l'écriture de journal d'origine
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      description: PropTypes.string, // Description de la ligne ou de l'écriture
      debit: PropTypes.number,
      credit: PropTypes.number,
      // balanceAfter est calculé, pas nécessaire en prop
    })
  ).isRequired,
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  openingBalance: PropTypes.number,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  currencySymbol: PropTypes.string,
  onViewJournalEntry: PropTypes.func,
};

export default LedgerAccountView;