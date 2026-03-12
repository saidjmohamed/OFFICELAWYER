import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, clients, caseClients, sessions, caseFiles, caseExpenses, judicialBodies, chambers, wilayas, lawyers, organizations, officeSettings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

// أسماء أنواع القضايا
const CASE_TYPE_LABELS: Record<string, string> = {
  opening_petition: 'عريضة افتتاحية',
  opposition: 'معارضة',
  appeal: 'استئناف',
  cassation: 'طعن بالنقض',
  new_claim: 'دعوى جديدة',
};

// أسماء حالات القضايا
const STATUS_LABELS: Record<string, string> = {
  active: 'نشطة',
  adjourned: 'مؤجلة',
  judged: 'محكوم فيها',
  closed: 'مغلقة',
  archived: 'مؤرشفة',
};

export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get('id');
    const preview = searchParams.get('preview') === 'true';

    if (!caseId) {
      return NextResponse.json({ error: 'معرف القضية مطلوب' }, { status: 400 });
    }

    // جلب بيانات القضية الأساسية
    const caseData = await db.select()
      .from(cases)
      .where(eq(cases.id, parseInt(caseId)))
      .limit(1);

    if (!caseData.length) {
      return NextResponse.json({ error: 'القضية غير موجودة' }, { status: 404 });
    }

    const caseItem = caseData[0];

    // جلب الهيئة القضائية
    let judicialBody: { name: string; type: string } | null = null;
    if (caseItem.judicialBodyId) {
      const bodyData = await db.select()
        .from(judicialBodies)
        .where(eq(judicialBodies.id, caseItem.judicialBodyId))
        .limit(1);
      judicialBody = bodyData[0] || null;
    }

    // جلب الغرفة
    let chamber: { name: string } | null = null;
    if (caseItem.chamberId) {
      const chamberData = await db.select()
        .from(chambers)
        .where(eq(chambers.id, caseItem.chamberId))
        .limit(1);
      chamber = chamberData[0] || null;
    }

    // جلب الولاية
    let wilaya: { name: string } | null = null;
    if (caseItem.wilayaId) {
      const wilayaData = await db.select()
        .from(wilayas)
        .where(eq(wilayas.id, caseItem.wilayaId))
        .limit(1);
      wilaya = wilayaData[0] || null;
    }

    // جلب أطراف القضية
    const parties = await db.select({
      id: caseClients.id,
      role: caseClients.role,
      clientId: caseClients.clientId,
      clientName: clients.fullName,
      clientDescription: caseClients.clientDescription,
      opponentFirstName: caseClients.opponentFirstName,
      opponentLastName: caseClients.opponentLastName,
      opponentPhone: caseClients.opponentPhone,
      opponentAddress: caseClients.opponentAddress,
      description: caseClients.description,
      lawyerId: caseClients.lawyerId,
      lawyerFirstName: lawyers.firstName,
      lawyerLastName: lawyers.lastName,
      lawyerPhone: lawyers.phone,
      lawyerOrganization: organizations.name,
      lawyerDescription: caseClients.lawyerDescription,
    })
      .from(caseClients)
      .leftJoin(clients, eq(caseClients.clientId, clients.id))
      .leftJoin(lawyers, eq(caseClients.lawyerId, lawyers.id))
      .leftJoin(organizations, eq(lawyers.organizationId, organizations.id))
      .where(eq(caseClients.caseId, parseInt(caseId)));

    // جلب الجلسات
    const sessionsList = await db.select({
      id: sessions.id,
      sessionDate: sessions.sessionDate,
      adjournmentReason: sessions.adjournmentReason,
      decision: sessions.decision,
      rulingText: sessions.rulingText,
      notes: sessions.notes,
    })
      .from(sessions)
      .where(eq(sessions.caseId, caseItem.id))
      .orderBy(desc(sessions.sessionDate));

    // جلب الجلسة القادمة
    const now = new Date();
    const upcomingSession = sessionsList.find(s => s.sessionDate && new Date(s.sessionDate) > now);

    // جلب المصروفات
    const expenses = await db.select({
      id: caseExpenses.id,
      description: caseExpenses.description,
      amount: caseExpenses.amount,
      expenseDate: caseExpenses.expenseDate,
      notes: caseExpenses.notes,
    })
      .from(caseExpenses)
      .where(eq(caseExpenses.caseId, parseInt(caseId)));

    // حساب مجموع المصروفات
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // جلب إعدادات المكتب
    const settingsData = await db.select().from(officeSettings).limit(1);
    const office = settingsData[0] || {
      officeName: 'مكتب المحامي',
      lawyerName: 'المحامي',
    };

    // تنسيق التاريخ
    const formatDate = (date: Date | string | number | null): string => {
      if (!date) return '-';
      const d = new Date(date);
      return d.toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // تنسيق العملة
    const formatCurrency = (amount: number) => {
      return `${amount.toLocaleString('ar-DZ')} د.ج`;
    };

    // المدعين
    const plaintiffs = parties.filter(p => p.role === 'plaintiff');
    // المدعى عليهم
    const defendants = parties.filter(p => p.role === 'defendant');

    // إنشاء HTML للطباعة
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بطاقة القضية - ${caseItem.caseNumber || 'بدون رقم'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #fff;
      color: #1e293b;
      line-height: 1.6;
      padding: 20px;
      font-size: 12px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header h1 {
      color: #1e40af;
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .header .subtitle {
      color: #64748b;
      font-size: 14px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      background: #f1f5f9;
      color: #1e40af;
      padding: 8px 12px;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      padding: 4px 0;
    }
    
    .info-label {
      color: #64748b;
      width: 140px;
      flex-shrink: 0;
    }
    
    .info-value {
      color: #1e293b;
      font-weight: 500;
      flex: 1;
    }
    
    .party-box {
      background: #f8fafc;
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 4px;
      border-right: 4px solid #22c55e;
    }
    
    .party-box.defendant {
      border-right-color: #ef4444;
    }
    
    .party-name {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 4px;
    }
    
    .party-detail {
      color: #64748b;
      font-size: 11px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .status-active { background: #dcfce7; color: #166534; }
    .status-adjourned { background: #fef9c3; color: #854d0e; }
    .status-judged { background: #dbeafe; color: #1e40af; }
    .status-closed { background: #f1f5f9; color: #475569; }
    
    .summary-box {
      background: #eff6ff;
      padding: 15px;
      border-radius: 8px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
    }
    
    .summary-total {
      border-top: 1px solid #cbd5e1;
      margin-top: 8px;
      padding-top: 8px;
      font-weight: bold;
    }
    
    .session-row {
      display: flex;
      background: #f8fafc;
      padding: 8px;
      margin-bottom: 6px;
      border-radius: 4px;
    }
    
    .session-date {
      width: 120px;
      color: #1e40af;
      font-weight: 500;
    }
    
    .session-info {
      flex: 1;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 10px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    .print-button {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #1e40af;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    }
    
    .print-button:hover {
      background: #1e3a8a;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- الترويسة -->
    <div class="header">
      <h1>${office.officeName || 'مكتب المحامي'}</h1>
      <div class="subtitle">بطاقة القضية</div>
    </div>

    <!-- معلومات القضية -->
    <div class="section">
      <div class="section-title">معلومات القضية</div>
      
      <div class="info-row">
        <span class="info-label">رقم القضية:</span>
        <span class="info-value">${caseItem.caseNumber || 'بدون رقم'}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">نوع القضية:</span>
        <span class="info-value">${CASE_TYPE_LABELS[caseItem.caseType || ''] || caseItem.caseType || '-'}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">الحالة:</span>
        <span class="info-value">
          <span class="status-badge status-${caseItem.status || 'active'}">
            ${STATUS_LABELS[caseItem.status || 'active'] || caseItem.status}
          </span>
        </span>
      </div>
      
      <div class="info-row">
        <span class="info-label">الموضوع:</span>
        <span class="info-value">${caseItem.subject || '-'}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">الهيئة القضائية:</span>
        <span class="info-value">${judicialBody?.name || '-'}</span>
      </div>
      
      ${chamber ? `
      <div class="info-row">
        <span class="info-label">الغرفة/القسم:</span>
        <span class="info-value">${chamber.name}</span>
      </div>
      ` : ''}
      
      <div class="info-row">
        <span class="info-label">الولاية:</span>
        <span class="info-value">${wilaya?.name || '-'}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">تاريخ التسجيل:</span>
        <span class="info-value">${formatDate(caseItem.registrationDate)}</span>
      </div>
      
      ${upcomingSession ? `
      <div class="info-row">
        <span class="info-label">الجلسة القادمة:</span>
        <span class="info-value" style="color: #dc2626; font-weight: bold;">${formatDate(upcomingSession.sessionDate)}</span>
      </div>
      ` : ''}
    </div>

    <!-- أطراف القضية -->
    <div class="section">
      <div class="section-title">أطراف القضية</div>
      
      <!-- المدعين -->
      ${plaintiffs.map(p => `
      <div class="party-box">
        <div class="party-name">👤 المدعي: ${p.clientName || 'غير محدد'}</div>
        ${p.clientDescription ? `<div class="party-detail">الصفة: ${p.clientDescription}</div>` : ''}
      </div>
      `).join('')}
      
      <!-- المدعى عليهم -->
      ${defendants.map(p => {
        const name = p.clientName || [p.opponentFirstName, p.opponentLastName].filter(Boolean).join(' ') || 'غير محدد';
        return `
        <div class="party-box defendant">
          <div class="party-name">👤 المدعى عليه: ${name}</div>
          ${p.description ? `<div class="party-detail">الصفة: ${p.description}</div>` : ''}
          ${p.lawyerFirstName && p.lawyerLastName ? `
            <div class="party-detail">المحامي: ${p.lawyerFirstName} ${p.lawyerLastName}${p.lawyerOrganization ? ` (${p.lawyerOrganization})` : ''}</div>
          ` : ''}
        </div>
        `;
      }).join('')}
      
      ${plaintiffs.length === 0 && defendants.length === 0 ? `
        <div style="text-align: center; color: #94a3b8; padding: 20px;">لا توجد أطراف مسجلة</div>
      ` : ''}
    </div>

    <!-- الملخص المالي -->
    <div class="section">
      <div class="section-title">الملخص المالي</div>
      
      <div class="summary-box">
        <div class="summary-row">
          <span>الأتعاب المتفق عليها:</span>
          <span>${formatCurrency(caseItem.fees || 0)}</span>
        </div>
        <div class="summary-row">
          <span>إجمالي المصروفات:</span>
          <span>${formatCurrency(totalExpenses)}</span>
        </div>
        <div class="summary-row summary-total">
          <span>الرصيد المتبقي:</span>
          <span style="color: ${(caseItem.fees || 0) - totalExpenses >= 0 ? '#16a34a' : '#dc2626'};">
            ${formatCurrency((caseItem.fees || 0) - totalExpenses)}
          </span>
        </div>
      </div>
    </div>

    <!-- الجلسات -->
    ${sessionsList.length > 0 ? `
    <div class="section">
      <div class="section-title">الجلسات (${sessionsList.length})</div>
      
      ${sessionsList.slice(0, 5).map(s => `
      <div class="session-row">
        <div class="session-date">${formatDate(s.sessionDate)}</div>
        <div class="session-info">${s.decision || s.adjournmentReason || s.notes || '-'}</div>
      </div>
      `).join('')}
      
      ${sessionsList.length > 5 ? `
        <div style="text-align: center; color: #64748b; font-size: 11px; margin-top: 5px;">
          ... و ${sessionsList.length - 5} جلسات أخرى
        </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- الملاحظات -->
    ${caseItem.notes ? `
    <div class="section">
      <div class="section-title">ملاحظات</div>
      <div style="color: #475569; line-height: 1.8;">${caseItem.notes}</div>
    </div>
    ` : ''}

    <!-- التذييل -->
    <div class="footer">
      <span>صادرة من ${office.officeName || 'مكتب المحامي'} - ${office.lawyerName || 'المحامي'}</span>
      <span>تم التصدير في: ${new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  </div>
  
  <button class="print-button no-print" onclick="window.print()">
    🖨️ طباعة / حفظ PDF
  </button>
</body>
</html>
    `;

    // إرجاع HTML للطباعة
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('خطأ في تصدير القضية:', error);
    return NextResponse.json({ error: 'حدث خطأ في التصدير' }, { status: 500 });
  }
}
