import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Row, Col, Form as BootstrapForm } from 'react-bootstrap';
import { addDays, format as formatDateFns, parseISO } from 'date-fns';

import FormSection from '../forms/FormSection';
import SelectField from '../common/SelectField';
import ItemSelector from '../forms/ItemSelector';
import AppButton from '../common/AppButton';
import AlertMessage from '../common/AlertMessage';
import QuoteTotals from '../quotes/QuoteTotals';
import Icon from '../common/Icon';

const todayISO = new Date().toISOString().split('T')[0];
const defaultDueDateISO = formatDateFns(addDays(new Date(), 30), 'yyyy-MM-dd');

// Composant FormField réutilisable
const FormField = ({ label, name, as = 'input', children, ...props }) => (
  <BootstrapForm.Group controlId={name} className="mb-3">
    {label && <BootstrapForm.Label>{label}</BootstrapForm.Label>}
    <Field name={name} as={as} {...props}>
      {children}
    </Field>
    <ErrorMessage name={name} component={BootstrapForm.Text} className="text-danger" />
  </BootstrapForm.Group>
);

const DEFAULT_INITIAL_VALUES = {
  clientId: '',
  invoiceNumber: '',
  issueDate: todayISO,
  dueDate: defaultDueDateISO,
  status: 'DRAFT',
  items: [],
  paymentTerms: 'Net 30 jours',
  notes: "Merci pour votre confiance. Conditions de règlement : ...",
  sourceQuoteId: null,
  sourceDeliveryNoteId: null,
  totalHT: 0,
  totalVAT: 0,
  totalTTC: 0,
};

const buildFormInitialValues = (initialValuesFromProps, defaultInvoiceNum) => {
  let baseValues = { ...DEFAULT_INITIAL_VALUES, invoiceNumber: defaultInvoiceNum || '' };

  if (initialValuesFromProps) {
    baseValues = { ...baseValues, ...initialValuesFromProps };

    if (initialValuesFromProps.issueDate) {
      baseValues.issueDate = formatDateFns(
        initialValuesFromProps.issueDate instanceof Date 
          ? initialValuesFromProps.issueDate 
          : parseISO(initialValuesFromProps.issueDate),
        'yyyy-MM-dd'
      );
    }
    
    if (initialValuesFromProps.dueDate) {
      baseValues.dueDate = formatDateFns(
        initialValuesFromProps.dueDate instanceof Date 
          ? initialValuesFromProps.dueDate 
          : parseISO(initialValuesFromProps.dueDate),
        'yyyy-MM-dd'
      );
    }

    if (initialValuesFromProps.sourceDocumentData) {
      const { sourceDoc, type } = initialValuesFromProps.sourceDocumentData;
      baseValues.clientId = sourceDoc.client?._id || sourceDoc.client || '';

      if (sourceDoc.clientSnapshot) {
        baseValues.clientSnapshot = sourceDoc.clientSnapshot;
      }

      const mapItem = (item, sourceType) => ({
        tempId: `item-from-${sourceType}-${item.product?._id || item.productId}-${Math.random().toString(16).slice(2)}`,
        productId: item.product?._id || item.productId,
        productName: item.productName || item.product?.name,
        description: item.description || item.product?.description || '',
        quantity: sourceType === 'DELIVERY_NOTE' 
          ? (item.quantityDelivered || item.quantity) 
          : item.quantity,
        unitPriceHT: item.unitPriceHT || item.product?.unitPriceHT || 0,
        vatRate: item.vatRate !== undefined 
          ? item.vatRate 
          : (item.product?.vatRate !== undefined ? item.product.vatRate : 20),
        discountRate: item.discountRate || 0,
      });

      if (type === 'DELIVERY_NOTE' && sourceDoc) {
        baseValues.sourceDeliveryNoteId = sourceDoc._id;
        baseValues.items = (sourceDoc.items || []).map(item => mapItem(item, 'DN'));
      } else if (type === 'QUOTE' && sourceDoc) {
        baseValues.sourceQuoteId = sourceDoc._id;
        baseValues.items = (sourceDoc.items || []).map(item => mapItem(item, 'QUOTE'));
      }
    } else if (initialValuesFromProps.items) {
      baseValues.items = initialValuesFromProps.items.map(item => ({
        ...item,
        tempId: item.tempId || item._id || `item-edit-${Date.now()}-${Math.random().toString(16).slice(2)}`
      }));
    }
  }
  return baseValues;
};

const InvoiceForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
  submitError,
  clientOptions = [],
  productOptions = [],
  defaultInvoiceNumber = '',
  currencySymbol = '€',
  paymentTermsOptions = [
    { value: 'À réception', label: 'À réception' },
    { value: 'Net 15 jours', label: 'Net 15 jours' },
    { value: 'Net 30 jours', label: 'Net 30 jours' },
  ],
  onCancel,
}) => {
  const memoizedInitialValues = useMemo(() =>
    buildFormInitialValues(initialValues, defaultInvoiceNumber),
    [initialValues, defaultInvoiceNumber]
  );

  // Mémoïsation de la fonction de calcul des totaux
  const calculatedTotalsForDisplay = useCallback((items) => {
    let subTotalHTBeforeDiscount = 0;
    let totalDiscountAmount = 0;
    let subTotalHT = 0;
    let totalVatAmount = 0;
    const vatSummary = {};

    items.forEach(item => {
      const itemQty = Number(item.quantity) || 0;
      const itemPrice = Number(item.unitPriceHT) || 0;
      const itemVatRate = Number(item.vatRate) || 0;
      const itemDiscountRate = Number(item.discountRate) || 0;

      const lineTotalHTBeforeDiscount = itemQty * itemPrice;
      const lineDiscountAmount = lineTotalHTBeforeDiscount * (itemDiscountRate / 100);
      const lineTotalHT = lineTotalHTBeforeDiscount - lineDiscountAmount;
      const lineVatAmount = lineTotalHT * (itemVatRate / 100);

      subTotalHTBeforeDiscount += lineTotalHTBeforeDiscount;
      totalDiscountAmount += lineDiscountAmount;
      subTotalHT += lineTotalHT;
      totalVatAmount += lineVatAmount;

      if (itemVatRate > 0) {
        if (!vatSummary[itemVatRate]) {
          vatSummary[itemVatRate] = { base: 0, amount: 0, rate: itemVatRate };
        }
        vatSummary[itemVatRate].base += lineTotalHT;
        vatSummary[itemVatRate].amount += lineVatAmount;
      }
    });
    
    const totalTTC = subTotalHT + totalVatAmount;
    const vatDetails = Object.values(vatSummary)
      .sort((a, b) => b.rate - a.rate)
      .map(detail => ({
        ...detail,
        base: parseFloat(detail.base.toFixed(2)),
        amount: parseFloat(detail.amount.toFixed(2)),
      }));

    return {
      subTotalHTBeforeDiscount: parseFloat(subTotalHTBeforeDiscount.toFixed(2)),
      totalDiscountAmount: parseFloat(totalDiscountAmount.toFixed(2)),
      subTotalHT: parseFloat(subTotalHT.toFixed(2)),
      totalVAT: parseFloat(totalVatAmount.toFixed(2)),
      totalTTC: parseFloat(totalTTC.toFixed(2)),
      vatDetails,
    };
  }, []);

  const validationSchema = Yup.object().shape({
    clientId: Yup.string().required('Le client est requis.'),
    invoiceNumber: Yup.string().required('Le numéro de facture est requis.').max(50, 'Max 50 caractères.'),
    issueDate: Yup.date().typeError("Date invalide").required("La date d'émission est requise."),
    dueDate: Yup.date().typeError("Date invalide")
      .required("La date d'échéance est requise.")
      .min(Yup.ref('issueDate'), "La date d'échéance doit être après la date d'émission."),
    status: Yup.string().required('Le statut est requis.')
      .oneOf(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED', 'VOIDED']),
    items: Yup.array()
      .of(
        Yup.object().shape({
          productId: Yup.string().required('Produit/Service requis.'),
          productName: Yup.string().required('Nom requis.'),
          quantity: Yup.number().typeError("Qté invalide").min(0.01, 'Qté > 0').required('Qté requise.'),
          unitPriceHT: Yup.number().typeError("Prix invalide").min(0, 'Prix >= 0').required('Prix requis.'),
          vatRate: Yup.number().typeError("TVA invalide").min(0, 'TVA >= 0').required('TVA requise.'),
          discountRate: Yup.number().typeError("Remise invalide").min(0, "Remise >=0").max(100, "Remise <=100"),
        })
      )
      .min(1, 'Au moins un article est requis dans la facture.')
      .required('Les articles sont requis.'),
    paymentTerms: Yup.string().max(255, 'Max 255 caractères').nullable(),
    notes: Yup.string().max(5000, 'Maximum 5000 caractères.').nullable(),
  });

  return (
    <Formik
      initialValues={memoizedInitialValues}
      validationSchema={validationSchema}
      onSubmit={(values, formikHelpers) => {
        const finalTotals = calculatedTotalsForDisplay(values.items);
        const dataToSubmit = {
          ...values,
          items: values.items.map(({ tempId, productName, ...itemData }) => ({
            ...itemData,
            productId: itemData.productId,
          })),
          subTotalHT: finalTotals.subTotalHT,
          totalVatAmount: finalTotals.totalVAT,
          totalTTC: finalTotals.totalTTC,
          subTotalHTBeforeDiscount: finalTotals.subTotalHTBeforeDiscount,
          totalDiscountAmount: finalTotals.totalDiscountAmount,
        };
        
        if (!dataToSubmit.sourceQuoteId) delete dataToSubmit.sourceQuoteId;
        if (!dataToSubmit.sourceDeliveryNoteId) delete dataToSubmit.sourceDeliveryNoteId;

        onSubmit(dataToSubmit, formikHelpers);
      }}
      enableReinitialize
    >
      {({ errors, touched, isSubmitting, values, setFieldValue, dirty, isValid }) => {
        // Calcul direct sans useMemo (correction de l'erreur des hooks)
        const displayTotals = calculatedTotalsForDisplay(values.items);

        return (
          <Form noValidate className="invoice-form">
            {submitError && <AlertMessage variant="danger" className="mb-3">{submitError}</AlertMessage>}

            <FormSection title="Informations Générales" useCard cardClassName="mb-3">
              <Row>
                <Col md={6} lg={4} className="mb-3">
                  <SelectField
                    label="Client *"
                    name="clientId"
                    options={clientOptions}
                    placeholder="Sélectionner un client"
                    isDisabled={isEditing && (!!values.sourceQuoteId || !!values.sourceDeliveryNoteId) && !!values.clientId}
                  />
                  <ErrorMessage name="clientId" component={BootstrapForm.Text} className="text-danger" />
                </Col>
                <Col md={6} lg={4} className="mb-3">
                  <FormField 
                    label="N° de Facture *" 
                    name="invoiceNumber" 
                    readOnly={isEditing} 
                  />
                </Col>
                <Col md={6} lg={4} className="mb-3">
                  <FormField label="Statut *" name="status" as="select">
                    <option value="DRAFT">Brouillon</option>
                    <option value="SENT">Envoyée</option>
                    {isEditing && <option value="PAID">Payée</option>}
                    {isEditing && <option value="PARTIALLY_PAID">Part. Payée</option>}
                    {isEditing && <option value="OVERDUE">En Retard</option>}
                    {isEditing && <option value="CANCELLED">Annulée</option>}
                    {isEditing && <option value="VOIDED">Invalidée</option>}
                  </FormField>
                </Col>
                <Col md={6} lg={4} className="mb-3">
                  <FormField label="Date d'Émission *" name="issueDate" type="date" />
                </Col>
                <Col md={6} lg={4} className="mb-3">
                  <FormField label="Date d'Échéance *" name="dueDate" type="date" />
                </Col>
                <Col md={6} lg={4} className="mb-3">
                  <SelectField
                    label="Conditions de Paiement"
                    name="paymentTerms"
                    options={paymentTermsOptions}
                    isClearable
                    placeholder="Ex: Net 30 jours"
                  />
                </Col>
              </Row>
            </FormSection>

            <FormSection title="Articles de la Facture" useCard cardClassName="mb-3" cardBodyClassName="p-0">
              <ItemSelector
                name="items"
                productOptions={productOptions}
                currencySymbol={currencySymbol}
              />
              <ErrorMessage name="items" component={BootstrapForm.Text} className="text-danger p-3 d-block" />
            </FormSection>

            <FormSection title="Récapitulatif et Notes" useCard cardClassName="mb-3">
              <Row>
                <Col lg={7} className="mb-3 mb-lg-0">
                  <FormField 
                    label="Notes / Mentions Légales" 
                    name="notes" 
                    as="textarea" 
                    rows={5} 
                    placeholder="Termes, conditions, TVA non applicable..." 
                  />
                </Col>
                <Col lg={5}>
                  <QuoteTotals
                    subTotalHT={displayTotals.subTotalHT}
                    totalDiscount={displayTotals.totalDiscountAmount}
                    totalHT={displayTotals.subTotalHT}
                    totalVAT={displayTotals.totalVAT}
                    totalTTC={displayTotals.totalTTC}
                    currencySymbol={currencySymbol}
                    vatDetails={displayTotals.vatDetails}
                  />
                </Col>
              </Row>
            </FormSection>

            <div className="d-flex justify-content-end mt-4 gap-2">
              {onCancel && (
                <AppButton 
                  type="button" 
                  variant="outline-secondary" 
                  onClick={onCancel} 
                  disabled={isSubmitting}
                >
                  Annuler
                </AppButton>
              )}
              <AppButton 
                type="submit" 
                variant="primary" 
                isLoading={isSubmitting} 
                disabled={!dirty || !isValid || isSubmitting}
              >
                <Icon name={isEditing ? "FaSave" : "FaPlusCircle"} className="me-2" />
                {isEditing ? 'Sauvegarder les Modifications' : 'Créer la Facture'}
              </AppButton>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

InvoiceForm.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  submitError: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  clientOptions: PropTypes.arrayOf(PropTypes.shape({ 
    value: PropTypes.string.isRequired, 
    label: PropTypes.string.isRequired 
  })).isRequired,
  productOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
    unitPriceHT: PropTypes.number,
    vatRate: PropTypes.number,
  })).isRequired,
  defaultInvoiceNumber: PropTypes.string,
  currencySymbol: PropTypes.string,
  paymentTermsOptions: PropTypes.arrayOf(PropTypes.shape({ 
    value: PropTypes.string.isRequired, 
    label: PropTypes.string.isRequired 
  })),
  onCancel: PropTypes.func,
};

export default InvoiceForm;