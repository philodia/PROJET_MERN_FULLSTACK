import React from 'react';
import PropTypes from 'prop-types';
import { Table as BootstrapTable, Card, Row, Col } from 'react-bootstrap';
import Icon from '../common/Icon'; // Assure-toi que ce composant existe bien
import './BalanceSheetTable.scss';

const BalanceSheetTable = ({
  assets,
  liabilities,
  equity,
  reportDate,
  currencySymbol = '€',
  title = 'Bilan Comptable',
  className = '',
}) => {
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderSectionItems = (items, level = 0) =>
    items.map((item, index) => (
      <React.Fragment key={`${item.name}-${index}`}>
        <tr
          className={`balance-sheet-item level-${level} ${
            item.isTotal ? 'fw-bold total-row' : ''
          }`}
        >
          <td style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}>{item.name}</td>
          <td className="text-end">{formatAmount(item.amount)}</td>
        </tr>
        {item.subItems?.length > 0 && renderSectionItems(item.subItems, level + 1)}
      </React.Fragment>
    ));

  const totalLiabilitiesAndEquity = (liabilities?.totalAmount || 0) + (equity?.totalAmount || 0);
  const isBalanced = Math.abs((assets?.totalAmount || 0) - totalLiabilitiesAndEquity) < 0.01;

  return (
    <Card className={`balance-sheet-card shadow-sm ${className}`}>
      <Card.Header as="h5" className="py-3">
        {title}
        {reportDate && <div className="small text-muted mt-1">{reportDate}</div>}
      </Card.Header>
      <Card.Body>
        <Row>
          {/* Actif */}
          <Col md={6} className="balance-sheet-section mb-4 mb-md-0">
            <h6 className="section-title text-primary">{assets?.title || 'ACTIF'}</h6>
            <BootstrapTable striped hover size="sm" className="mb-0">
              <tbody>
                {assets?.items && renderSectionItems(assets.items)}
                <tr className="fw-bold total-section-row">
                  <td>Total {assets?.title || 'Actif'}</td>
                  <td className="text-end">
                    {formatAmount(assets?.totalAmount)} {currencySymbol}
                  </td>
                </tr>
              </tbody>
            </BootstrapTable>
          </Col>

          {/* Passif + Capitaux propres */}
          <Col md={6} className="balance-sheet-section">
            <h6 className="section-title text-success">{liabilities?.title || 'PASSIF'}</h6>
            <BootstrapTable striped hover size="sm" className="mb-3">
              <tbody>
                {liabilities?.items && renderSectionItems(liabilities.items)}
                <tr className="fw-bold total-row">
                  <td>Total {liabilities?.title || 'Passif'}</td>
                  <td className="text-end">{formatAmount(liabilities?.totalAmount)} {currencySymbol}</td>
                </tr>
              </tbody>
            </BootstrapTable>

            <h6 className="section-title text-info mt-4">{equity?.title || 'CAPITAUX PROPRES'}</h6>
            <BootstrapTable striped hover size="sm">
              <tbody>
                {equity?.items && renderSectionItems(equity.items)}
                <tr className="fw-bold total-row">
                  <td>Total {equity?.title || 'Capitaux Propres'}</td>
                  <td className="text-end">{formatAmount(equity?.totalAmount)} {currencySymbol}</td>
                </tr>
              </tbody>
            </BootstrapTable>

            <BootstrapTable size="sm" className="mt-3 total-summary-table">
              <tbody>
                <tr className="fw-bold total-section-row">
                  <td>
                    Total {liabilities?.title || 'Passif'} + {equity?.title || 'Capitaux Propres'}
                  </td>
                  <td className="text-end">
                    {formatAmount(totalLiabilitiesAndEquity)} {currencySymbol}
                  </td>
                </tr>
              </tbody>
            </BootstrapTable>
          </Col>
        </Row>

        <hr className="my-4" />

        <Row className="balance-check-summary justify-content-center">
          <Col md={8}>
            <Card
              body
              className={
                isBalanced
                  ? 'bg-success-subtle text-success-emphasis'
                  : 'bg-danger-subtle text-danger-emphasis'
              }
            >
              <div className="d-flex justify-content-between align-items-center">
                <strong className="h5">Vérification : Actif = Passif + Capitaux Propres</strong>
                {isBalanced ? (
                  <Icon name="BsCheckCircleFill" size="1.5em" />
                ) : (
                  <Icon name="BsExclamationTriangleFill" size="1.5em" />
                )}
              </div>
              <div className="mt-2 small">
                Total Actif : {formatAmount(assets?.totalAmount)} {currencySymbol}
                <br />
                Total Passif + C.P. : {formatAmount(totalLiabilitiesAndEquity)} {currencySymbol}
                <br />
                Différence : {formatAmount((assets?.totalAmount || 0) - totalLiabilitiesAndEquity)}{' '}
                {currencySymbol}
              </div>
            </Card>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

// Définition récursive du type via une fonction
const balanceSheetItemPropType = () => {
  return PropTypes.shape({
    name: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    isTotal: PropTypes.bool,
    subItems: PropTypes.arrayOf(balanceSheetItemPropType()),
  });
};

BalanceSheetTable.propTypes = {
  assets: PropTypes.shape({
    title: PropTypes.string,
    items: PropTypes.arrayOf(balanceSheetItemPropType()).isRequired,
    totalAmount: PropTypes.number.isRequired,
  }).isRequired,
  liabilities: PropTypes.shape({
    title: PropTypes.string,
    items: PropTypes.arrayOf(balanceSheetItemPropType()).isRequired,
    totalAmount: PropTypes.number.isRequired,
  }).isRequired,
  equity: PropTypes.shape({
    title: PropTypes.string,
    items: PropTypes.arrayOf(balanceSheetItemPropType()).isRequired,
    totalAmount: PropTypes.number.isRequired,
  }).isRequired,
  reportDate: PropTypes.string,
  currencySymbol: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
};

export default BalanceSheetTable;
