// frontend/src/components/forms/FormSection.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';
import './FormSection.scss';

/**
 * Composant pour grouper visuellement des champs de formulaire sous un titre.
 */
const FormSection = ({
  title,
  children,
  useCard = true,
  cardClassName = 'mb-4',
  cardHeaderClassName = '',
  cardBodyClassName = '',
  className = '',
  style = {},
  titleLevel = 4,
}) => {
  const isHtmlTitleTag = typeof titleLevel === 'number' && titleLevel >= 1 && titleLevel <= 6;
  const TitleComponent = isHtmlTitleTag ? `h${titleLevel}` : 'div';

  const sanitizedId = title
    ? `section-title-${title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase()}`
    : undefined;

  const renderTitle = () => (
    <TitleComponent
      id={sanitizedId}
      className={`form-section-title${useCard ? '' : '-no-card'} ${!useCard ? 'mb-3' : ''}`}
    >
      {title}
    </TitleComponent>
  );

  if (useCard) {
    return (
      <Card className={`form-section-card ${cardClassName}`} style={style}>
        {title && (
          <Card.Header className={cardHeaderClassName}>
            {renderTitle()}
          </Card.Header>
        )}
        <Card.Body className={cardBodyClassName}>
          {children}
        </Card.Body>
      </Card>
    );
  }

  return (
    <section
      className={`form-section ${className}`}
      style={style}
      aria-labelledby={sanitizedId}
    >
      {title && renderTitle()}
      {children}
    </section>
  );
};

FormSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  useCard: PropTypes.bool,
  cardClassName: PropTypes.string,
  cardHeaderClassName: PropTypes.string,
  cardBodyClassName: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  titleLevel: PropTypes.oneOfType([
    PropTypes.number, // h1-h6
    PropTypes.string, // pour d'autres types comme 'div'
  ]),
};

export default FormSection;
