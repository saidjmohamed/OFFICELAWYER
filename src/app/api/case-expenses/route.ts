import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { caseExpenses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { caseExpenseSchema, caseExpenseUpdateSchema, safeParseInt } from '@/lib/validations';

// الحصول على مصاريف قضية
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const caseId = request.nextUrl.searchParams.get('caseId');
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const parsedId = safeParseInt(id);
      if (!parsedId) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
      const expense = await db.select().from(caseExpenses).where(eq(caseExpenses.id, parsedId)).limit(1);
      return NextResponse.json(expense[0] || null);
    }

    if (!caseId) {
      return NextResponse.json({ error: 'معرف القضية مطلوب' }, { status: 400 });
    }

    const parsedCaseId = safeParseInt(caseId);
    if (!parsedCaseId) return NextResponse.json({ error: 'معرف القضية غير صالح' }, { status: 400 });

    const expenses = await db.select().from(caseExpenses)
      .where(eq(caseExpenses.caseId, parsedCaseId))
      .orderBy(desc(caseExpenses.expenseDate));
    
    // حساب المجموع
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    return NextResponse.json({ data: expenses, total });
  } catch (error) {
    console.error('خطأ في جلب المصاريف:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب المصاريف' }, { status: 500 });
  }
}

// إضافة مصروف جديد
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    const validation = caseExpenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { caseId, description, amount, expenseDate, notes } = validation.data;

    const result = await db.insert(caseExpenses).values({
      caseId,
      description,
      amount,
      expenseDate: expenseDate ? new Date(expenseDate) : null,
      notes: notes || null,
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('خطأ في إضافة المصروف:', error);
    return NextResponse.json({ error: 'حدث خطأ في إضافة المصروف' }, { status: 500 });
  }
}

// تحديث مصروف
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    const validation = caseExpenseUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { id, description, amount, expenseDate, notes } = validation.data;

    const result = await db.update(caseExpenses)
      .set({
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        expenseDate: expenseDate ? new Date(expenseDate) : null,
        notes: notes || null,
      })
      .where(eq(caseExpenses.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('خطأ في تحديث المصروف:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحديث المصروف' }, { status: 500 });
  }
}

// حذف مصروف
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'معرف المصروف مطلوب' }, { status: 400 });
    }

    const parsedId = safeParseInt(id);
    if (!parsedId) return NextResponse.json({ error: 'معرف المصروف غير صالح' }, { status: 400 });

    await db.delete(caseExpenses).where(eq(caseExpenses.id, parsedId));

    return NextResponse.json({ message: 'تم حذف المصروف بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف المصروف:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف المصروف' }, { status: 500 });
  }
}
