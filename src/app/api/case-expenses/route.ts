import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { caseExpenses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// الحصول على مصاريف قضية
export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId');
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const expense = await db.select().from(caseExpenses).where(eq(caseExpenses.id, parseInt(id))).limit(1);
      return NextResponse.json(expense[0] || null);
    }

    if (!caseId) {
      return NextResponse.json({ error: 'معرف القضية مطلوب' }, { status: 400 });
    }

    const expenses = await db.select().from(caseExpenses)
      .where(eq(caseExpenses.caseId, parseInt(caseId)))
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
    const body = await request.json();
    const { caseId, description, amount, expenseDate, notes } = body;

    if (!caseId || !description || !amount) {
      return NextResponse.json({ error: 'القضية والوصف والمبلغ مطلوبون' }, { status: 400 });
    }

    const result = await db.insert(caseExpenses).values({
      caseId: parseInt(caseId),
      description,
      amount: parseFloat(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : null,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const body = await request.json();
    const { id, description, amount, expenseDate, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف المصروف مطلوب' }, { status: 400 });
    }

    const result = await db.update(caseExpenses)
      .set({
        description,
        amount: parseFloat(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : null,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(caseExpenses.id, parseInt(id)))
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
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'معرف المصروف مطلوب' }, { status: 400 });
    }

    await db.delete(caseExpenses).where(eq(caseExpenses.id, parseInt(id)));

    return NextResponse.json({ message: 'تم حذف المصروف بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف المصروف:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف المصروف' }, { status: 500 });
  }
}
