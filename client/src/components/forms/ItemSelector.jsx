// frontend/src/components/forms/ItemSelector.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Row,
  Col,
  Form as BootstrapForm,
  Button,
  InputGroup,
  Card
} from 'react-bootstrap';
import SelectField from '../common/SelectField';
import Icon from '../common/Icon';
import AppButton from '../common/AppButton';
import './ItemSelector.scss';

const ItemSelector = ({
  availableItems = [],
  selectedItems = [],
  onItemsChange,
  currencySymbol = '€',
  disabled = false,
}) => {
  const [currentItem, setCurrentItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customDescription, setCustomDescription] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const itemOptions = availableItems.map(item => ({
    value: item.id,
    label: `${item.name} (${item.unitPriceHT?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || 'N/A'} ${currencySymbol}) ${item.sku ? `[${item.sku}]` : ''}`,
    fullItem: item,
  }));

  const handleItemSelect = (selectedOption) => {
    setCurrentItem(selectedOption);
    if (selectedOption) {
      setCustomDescription(selectedOption.fullItem.description || '');
      setCustomPrice(selectedOption.fullItem.unitPriceHT?.toString() || '');
      setQuantity(1);
    } else {
      setCustomDescription('');
      setCustomPrice('');
    }
  };

  const handleAddItem = () => {
    if (!currentItem || quantity <= 0) {
      console.warn("Veuillez sélectionner un produit et spécifier une quantité valide.");
      return;
    }

    const { value: productId, fullItem } = currentItem;
    const unitPrice = parseFloat(customPrice) || fullItem.unitPriceHT;
    const vatRate = fullItem.vatRate !== undefined ? fullItem.vatRate : 20;

    const newItem = {
      tempId: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      productId,
      productName: fullItem.name,
      description: customDescription || fullItem.description || '',
      quantity: Number(quantity),
      unitPriceHT: unitPrice,
      vatRate,
      totalHT: Number(quantity) * unitPrice,
    };

    onItemsChange([...selectedItems, newItem]);
    setCurrentItem(null);
    setQuantity(1);
    setCustomDescription('');
    setCustomPrice('');
  };

  const handleRemoveItem = (tempIdToRemove) => {
    onItemsChange(selectedItems.filter(item => item.tempId !== tempIdToRemove));
  };

  const handleQuantityChange = (tempId, newQuantity) => {
    const updatedQuantity = Math.max(1, Number(newQuantity));
    onItemsChange(
      selectedItems.map(item =>
        item.tempId === tempId
          ? { ...item, quantity: updatedQuantity, totalHT: updatedQuantity * item.unitPriceHT }
          : item
      )
    );
  };

  const handlePriceChange = (tempId, newPrice) => {
    const updatedPrice = parseFloat(newPrice) || 0;
    onItemsChange(
      selectedItems.map(item =>
        item.tempId === tempId
          ? { ...item, unitPriceHT: updatedPrice, totalHT: item.quantity * updatedPrice }
          : item
      )
    );
  };

  const handleDescriptionChange = (tempId, newDescription) => {
    onItemsChange(
      selectedItems.map(item =>
        item.tempId === tempId ? { ...item, description: newDescription } : item
      )
    );
  };

  return (
    <div className="item-selector-wrapper">
      {!disabled && (
        <Card className="mb-3 item-adder-card">
          <Card.Header as="h6">Ajouter un Produit / Service</Card.Header>
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col md={5}>
                <BootstrapForm.Group controlId="itemSelect">
                  <BootstrapForm.Label>Produit/Service</BootstrapForm.Label>
                  <SelectField
                    name="itemSelector"
                    options={itemOptions}
                    value={currentItem}
                    onChange={handleItemSelect}
                    placeholder="Rechercher ou sélectionner un item..."
                    isClearable
                  />
                </BootstrapForm.Group>
              </Col>
              <Col md={3} sm={6}>
                <BootstrapForm.Group controlId="itemCustomPrice">
                  <BootstrapForm.Label>Prix Unitaire HT</BootstrapForm.Label>
                  <InputGroup>
                    <BootstrapForm.Control
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder={currentItem?.fullItem.unitPriceHT?.toString() || '0.00'}
                      min="0"
                      step="0.01"
                      disabled={!currentItem}
                    />
                    <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                  </InputGroup>
                </BootstrapForm.Group>
              </Col>
              <Col md={2} sm={6}>
                <BootstrapForm.Group controlId="itemQuantity">
                  <BootstrapForm.Label>Quantité</BootstrapForm.Label>
                  <BootstrapForm.Control
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1"
                    disabled={!currentItem}
                  />
                </BootstrapForm.Group>
              </Col>
              <Col md={2} sm={12} className="d-flex align-items-end">
                <AppButton
                  onClick={handleAddItem}
                  disabled={!currentItem || quantity <= 0}
                  className="w-100"
                >
                  <Icon name="BsPlusLg" className="me-1" /> Ajouter
                </AppButton>
              </Col>
              {currentItem && (
                <Col md={12} className="mt-2">
                  <BootstrapForm.Group controlId="itemCustomDescription">
                    <BootstrapForm.Label>Description personnalisée (optionnel)</BootstrapForm.Label>
                    <BootstrapForm.Control
                      as="textarea"
                      rows={2}
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Description du produit/service telle qu'elle apparaîtra sur le document"
                    />
                  </BootstrapForm.Group>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}

      {selectedItems.length > 0 && (
        <div className="selected-items-list">
          <h6 className="mb-2">Éléments du document :</h6>
          {selectedItems.map(item => (
            <Card key={item.tempId} className="mb-2 selected-item-card">
              <Card.Body className="p-2 p-md-3">
                <Row className="align-items-center g-2">
                  <Col xs={12} md={4}>
                    <strong>{item.productName}</strong>
                    {!disabled ? (
                      <BootstrapForm.Control
                        as="textarea"
                        rows={2}
                        value={item.description}
                        onChange={(e) => handleDescriptionChange(item.tempId, e.target.value)}
                        placeholder="Description"
                        className="form-control-sm mt-1 item-description-input"
                      />
                    ) : (
                      item.description && <p className="text-muted small mb-0 item-description-text">{item.description}</p>
                    )}
                  </Col>
                  <Col xs={5} sm={4} md={2}>
                    <BootstrapForm.Label className="small text-muted d-block mb-0">Qté</BootstrapForm.Label>
                    {disabled ? (
                      <span className="item-value">{item.quantity}</span>
                    ) : (
                      <BootstrapForm.Control
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.tempId, e.target.value)}
                        min="1"
                        className="form-control-sm text-center item-input"
                      />
                    )}
                  </Col>
                  <Col xs={7} sm={4} md={2}>
                    <BootstrapForm.Label className="small text-muted d-block mb-0">Prix U. HT</BootstrapForm.Label>
                    {disabled ? (
                      <span className="item-value">{item.unitPriceHT?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencySymbol}</span>
                    ) : (
                      <InputGroup size="sm">
                        <BootstrapForm.Control
                          type="number"
                          value={item.unitPriceHT}
                          onChange={(e) => handlePriceChange(item.tempId, e.target.value)}
                          min="0"
                          step="0.01"
                          className="text-end item-input"
                        />
                        <InputGroup.Text>{currencySymbol}</InputGroup.Text>
                      </InputGroup>
                    )}
                  </Col>
                  <Col xs={12} sm={4} md={3}>
                    <div className="text-end">
                      <span className="fw-bold">{(item.totalHT || 0).toFixed(2)} {currencySymbol}</span>
                      {!disabled && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => handleRemoveItem(item.tempId)}
                        >
                          <Icon name="BsTrash" />
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

ItemSelector.propTypes = {
  availableItems: PropTypes.array.isRequired,
  selectedItems: PropTypes.array.isRequired,
  onItemsChange: PropTypes.func.isRequired,
  currencySymbol: PropTypes.string,
  disabled: PropTypes.bool,
};

export default ItemSelector;
