import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { FormAnswers, Document as DocType } from './types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1e293b',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0f172a',
  },
  headerBlock: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 70,
    color: '#475569',
  },
  headerValue: {
    flex: 1,
    color: '#1e293b',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 20,
    marginBottom: 12,
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
  },
  summaryBlock: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  summaryLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 150,
    color: '#475569',
  },
  summaryValue: {
    flex: 1,
    color: '#1e293b',
  },
  categoryTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 8,
    color: '#334155',
  },
  documentItem: {
    marginBottom: 6,
    marginLeft: 8,
  },
  documentName: {
    fontSize: 11,
    color: '#1e293b',
  },
  documentNote: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    marginLeft: 12,
  },
  bullet: {
    marginRight: 6,
    color: '#475569',
  },
});

interface PdfReportParams {
  formData: FormAnswers;
  documents: DocType[];
  reportDate: string;
}

const transactionTypeLabels: Record<string, string> = {
  purchase_resale: 'Purchase - Resale',
  purchase_new: 'Purchase - New Construction',
  renewal_refinance: 'Renewal / Refinance',
};

const incomeSourceLabels: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self-Employed',
  retired: 'Retired',
  rental: 'Rental Income',
  other: 'Other Income',
};

const downPaymentLabels: Record<string, string> = {
  savings: 'Savings',
  sale_of_property: 'Sale of Property',
  gift: 'Gift',
  rrsp_hbp: 'RRSP HBP',
  other: 'Other',
};

const netWorthLabels: Record<string, string> = {
  rrsp: 'RRSP',
  rdsp: 'RDSP',
  spousal_rrsp: 'Spousal RRSP',
  tfsa: 'TFSA',
  fhsa: 'FHSA',
  non_registered: 'Non-Registered',
};

const selfEmployedLabels: Record<string, string> = {
  incorporated: 'Incorporated',
  sole_proprietor: 'Sole Proprietor',
};

const otherIncomeLabels: Record<string, string> = {
  child_care_benefit: 'Child Care Benefit',
  alimony: 'Alimony',
  investment_income: 'Investment Income',
  disability: 'Disability',
  survivors_pension: "Survivor's Pension",
  maternity_leave: 'Maternity Leave',
};

const categoryOrder = ['transaction', 'property', 'income', 'net_worth', 'existing_properties'] as const;

const categoryLabels: Record<string, string> = {
  transaction: 'Transaction',
  property: 'Property',
  income: 'Income',
  net_worth: 'Assets',
  existing_properties: 'Existing Properties',
};

function MortgagePdfDocument({ formData, documents, reportDate }: PdfReportParams) {
  const isPurchase =
    formData.transactionType === 'purchase_resale' ||
    formData.transactionType === 'purchase_new';

  const groupedDocs = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<string, DocType[]>
  );

  const formatList = (items: string[], labelMap: Record<string, string>): string => {
    if (items.length === 0) return 'None';
    return items.map((item) => labelMap[item] || item).join(', ');
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mortgage Document Checklist</Text>

        {/* Header Block */}
        <View style={styles.headerBlock}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Broker:</Text>
            <Text style={styles.headerValue}>{formData.brokerName || 'Ousmaan'}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Client:</Text>
            <Text style={styles.headerValue}>
              {formData.clientFirstName} {formData.clientLastName}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Email:</Text>
            <Text style={styles.headerValue}>{formData.clientEmail}</Text>
          </View>
          {formData.clientPhone && (
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Phone:</Text>
              <Text style={styles.headerValue}>{formData.clientPhone}</Text>
            </View>
          )}
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Date:</Text>
            <Text style={styles.headerValue}>{reportDate}</Text>
          </View>
        </View>

        {/* Selections Summary */}
        <Text style={styles.sectionTitle}>Selections Summary</Text>
        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transaction Type:</Text>
            <Text style={styles.summaryValue}>
              {transactionTypeLabels[formData.transactionType] || 'Not selected'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Condo:</Text>
            <Text style={styles.summaryValue}>
              {formData.isCondo === true ? 'Yes' : formData.isCondo === false ? 'No' : 'Not specified'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Down Payment Sources:</Text>
            <Text style={styles.summaryValue}>
              {isPurchase ? formatList(formData.downPaymentSources, downPaymentLabels) : 'N/A'}
            </Text>
          </View>
          {isPurchase && formData.downPaymentOtherDetails ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Down Payment (Other):</Text>
              <Text style={styles.summaryValue}>{formData.downPaymentOtherDetails}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Income Sources:</Text>
            <Text style={styles.summaryValue}>
              {formatList(formData.incomeSources, incomeSourceLabels)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Self Employed Type:</Text>
            <Text style={styles.summaryValue}>
              {formData.selfEmployedType
                ? selfEmployedLabels[formData.selfEmployedType]
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Other Income Types:</Text>
            <Text style={styles.summaryValue}>
              {formData.otherIncomeTypes.length > 0
                ? formatList(formData.otherIncomeTypes, otherIncomeLabels)
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Worth Accounts:</Text>
            <Text style={styles.summaryValue}>
              {formatList(formData.netWorthAccounts, netWorthLabels)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Other Properties:</Text>
            <Text style={styles.summaryValue}>
              {formData.hasOtherProperties === true ? 'Yes' : formData.hasOtherProperties === false ? 'No' : 'Not specified'}
            </Text>
          </View>
          {formData.hasOtherProperties === true && formData.numberOfOtherProperties && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Number of Other Properties:</Text>
              <Text style={styles.summaryValue}>{formData.numberOfOtherProperties}</Text>
            </View>
          )}
        </View>

        {/* Documents Block */}
        <Text style={styles.sectionTitle}>Required Documents</Text>
        {categoryOrder.map((category) => {
          const docs = groupedDocs[category];
          if (!docs || docs.length === 0) return null;

          return (
            <View key={category}>
              <Text style={styles.categoryTitle}>{categoryLabels[category]}</Text>
              {docs.map((doc) => (
                <View key={doc.id} style={styles.documentItem}>
                  <Text style={styles.documentName}>
                    <Text style={styles.bullet}>•</Text> {doc.name}
                  </Text>
                  {doc.note && <Text style={styles.documentNote}>{doc.note}</Text>}
                </View>
              ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export async function buildPdfBlob(params: PdfReportParams): Promise<Blob> {
  const doc = <MortgagePdfDocument {...params} />;
  return await pdf(doc).toBlob();
}

export function generatePdfFilename(
  firstName: string,
  lastName: string
): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  if (firstName.trim() || lastName.trim()) {
    const lastPart = lastName.trim().toLowerCase().replace(/\s+/g, '-');
    const firstPart = firstName.trim().toLowerCase().replace(/\s+/g, '-');
    return `mortgage-docs-${lastPart}-${firstPart}-${dateStr}.pdf`;
  }

  return `mortgage-docs-${dateStr}.pdf`;
}

export function formatReportDate(): string {
  const today = new Date();
  return today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
