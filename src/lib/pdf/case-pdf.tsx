import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// تسجيل خط عربي (نستخدم الخط الافتراضي مع دعم RTL)
Font.register({
  family: 'Arabic',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.1/files/noto-sans-arabic-arabic-400-normal.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.1/files/noto-sans-arabic-arabic-700-normal.woff2',
      fontWeight: 700,
    },
  ],
});

// أنماط PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'rtl',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Arabic',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    borderBottomStyle: 'solid',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1e40af',
    backgroundColor: '#f1f5f9',
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row-reverse',
    marginBottom: 6,
    gap: 10,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    width: 120,
    flexShrink: 0,
  },
  value: {
    fontSize: 10,
    color: '#1e293b',
    flex: 1,
    fontWeight: 600,
  },
  partyBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    borderLeftStyle: 'solid',
  },
  partyBoxDefendant: {
    borderLeftColor: '#ef4444',
  },
  partyName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  sessionBox: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
    gap: 20,
  },
  expenseRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#f8fafc',
    marginBottom: 4,
    borderRadius: 4,
  },
  summaryBox: {
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    fontSize: 8,
    color: '#94a3b8',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeAdjourned: {
    backgroundColor: '#fef9c3',
    color: '#854d0e',
  },
  badgeJudged: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  badgeClosed: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
});

interface CasePDFProps {
  data: {
    caseInfo: {
      caseNumber: string;
      caseType: string;
      subject: string;
      status: string;
      fees: number;
      registrationDate: string;
      firstSessionDate: string;
      judicialBody: string;
      chamber: string;
      wilaya: string;
      notes: string;
      judgmentNumber: string | null;
      judgmentDate: string;
      issuingCourt: string | null;
      originalCaseNumber: string | null;
      originalCourt: string | null;
    };
    parties: {
      plaintiffs: Array<{
        name: string;
        description: string | null;
      }>;
      defendants: Array<{
        name: string;
        description: string | null;
        lawyer: string | null;
        lawyerOrganization: string | null;
      }>;
    };
    upcomingSession: {
      date: string;
      notes: string | null;
    } | null;
    sessions: Array<{
      date: string;
      adjournmentReason: string | null;
      decision: string | null;
      notes: string | null;
    }>;
    files: Array<{
      name: string;
      type: string;
      size: string;
    }>;
    expenses: {
      items: Array<{
        description: string;
        amount: number;
        date: string;
      }>;
      total: number;
    };
    summary: {
      totalFees: number;
      totalExpenses: number;
      balance: number;
      totalSessions: number;
      totalFiles: number;
    };
    office: {
      name: string;
      lawyerName: string;
    };
    exportedAt: string;
  };
}

export const CasePDFDocument: React.FC<CasePDFProps> = ({ data }) => {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; color: string }> = {
      active: { bg: '#dcfce7', color: '#166534' },
      adjourned: { bg: '#fef9c3', color: '#854d0e' },
      judged: { bg: '#dbeafe', color: '#1e40af' },
      closed: { bg: '#f1f5f9', color: '#475569' },
      archived: { bg: '#f3e8ff', color: '#7c3aed' },
    };
    return statusMap[status] || statusMap.active;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-DZ')} د.ج`;
  };

  const statusStyle = getStatusBadge(data.caseInfo.status);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* الترويسة */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.office.name}</Text>
          <Text style={styles.subtitle}>بطاقة القضية</Text>
        </View>

        {/* معلومات القضية الأساسية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات القضية</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>رقم القضية:</Text>
            <Text style={styles.value}>{data.caseInfo.caseNumber}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>نوع القضية:</Text>
            <Text style={styles.value}>{data.caseInfo.caseType}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>الحالة:</Text>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg, color: statusStyle.color }]}>
              <Text>{data.caseInfo.status}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>الموضوع:</Text>
            <Text style={styles.value}>{data.caseInfo.subject}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>الهيئة القضائية:</Text>
            <Text style={styles.value}>{data.caseInfo.judicialBody}</Text>
          </View>
          
          {data.caseInfo.chamber !== '-' && (
            <View style={styles.row}>
              <Text style={styles.label}>الغرفة/القسم:</Text>
              <Text style={styles.value}>{data.caseInfo.chamber}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>الولاية:</Text>
            <Text style={styles.value}>{data.caseInfo.wilaya}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>تاريخ التسجيل:</Text>
            <Text style={styles.value}>{data.caseInfo.registrationDate}</Text>
          </View>
          
          {data.upcomingSession && (
            <View style={styles.row}>
              <Text style={styles.label}>الجلسة القادمة:</Text>
              <Text style={[styles.value, { color: '#dc2626' }]}>{data.upcomingSession.date}</Text>
            </View>
          )}
        </View>

        {/* أطراف القضية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أطراف القضية</Text>
          
          {/* المدعين */}
          {data.parties.plaintiffs.map((plaintiff, index) => (
            <View key={`plaintiff-${index}`} style={styles.partyBox}>
              <Text style={styles.partyName}>👤 المدعي: {plaintiff.name}</Text>
              {plaintiff.description && (
                <Text style={styles.partyDetail}>الصفة: {plaintiff.description}</Text>
              )}
            </View>
          ))}
          
          {/* المدعى عليهم */}
          {data.parties.defendants.map((defendant, index) => (
            <View key={`defendant-${index}`} style={[styles.partyBox, styles.partyBoxDefendant]}>
              <Text style={styles.partyName}>👤 المدعى عليه: {defendant.name}</Text>
              {defendant.description && (
                <Text style={styles.partyDetail}>الصفة: {defendant.description}</Text>
              )}
              {defendant.lawyer && (
                <Text style={styles.partyDetail}>
                  المحامي: {defendant.lawyer}
                  {defendant.lawyerOrganization && ` (${defendant.lawyerOrganization})`}
                </Text>
              )}
            </View>
          ))}
          
          {data.parties.plaintiffs.length === 0 && data.parties.defendants.length === 0 && (
            <Text style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
              لا توجد أطراف مسجلة
            </Text>
          )}
        </View>

        {/* الملخص المالي */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الملخص المالي</Text>
          
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>الأتعاب المتفق عليها:</Text>
              <Text style={styles.value}>{formatCurrency(data.summary.totalFees)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.label}>إجمالي المصروفات:</Text>
              <Text style={styles.value}>{formatCurrency(data.summary.totalExpenses)}</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={[styles.label, { fontWeight: 700 }]}>الرصيد المتبقي:</Text>
              <Text style={[styles.value, { color: data.summary.balance >= 0 ? '#16a34a' : '#dc2626' }]}>
                {formatCurrency(data.summary.balance)}
              </Text>
            </View>
          </View>
        </View>

        {/* الجلسات */}
        {data.sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الجلسات ({data.sessions.length})</Text>
            
            {data.sessions.slice(0, 5).map((session, index) => (
              <View key={index} style={styles.sessionBox}>
                <Text style={[styles.value, { width: 100 }]}>{session.date}</Text>
                <Text style={[styles.value, { flex: 1 }]}>
                  {session.decision || session.adjournmentReason || session.notes || '-'}
                </Text>
              </View>
            ))}
            
            {data.sessions.length > 5 && (
              <Text style={{ fontSize: 9, color: '#64748b', textAlign: 'center', marginTop: 5 }}>
                ... و {data.sessions.length - 5} جلسات أخرى
              </Text>
            )}
          </View>
        )}

        {/* الملاحظات */}
        {data.caseInfo.notes && data.caseInfo.notes !== '-' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <Text style={{ fontSize: 10, color: '#475569', lineHeight: 1.5 }}>
              {data.caseInfo.notes}
            </Text>
          </View>
        )}

        {/* التذييل */}
        <View style={styles.footer} fixed>
          <Text>صادرة من {data.office.name} - {data.office.lawyerName}</Text>
          <Text>تم التصدير في: {data.exportedAt}</Text>
        </View>
      </Page>
    </Document>
  );
};
