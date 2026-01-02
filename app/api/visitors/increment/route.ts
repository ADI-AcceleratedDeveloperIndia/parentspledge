import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('visitors');

    // Increment visitor count atomically
    const result = await collection.findOneAndUpdate(
      { _id: 'counter' as any },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    const count = result?.count || 1;

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error incrementing visitor count:', error);
    // Return a cached/default value instead of failing
    return NextResponse.json({ count: 0, error: 'Unable to fetch count' }, { status: 200 });
  }
}

// POST endpoint to get count without incrementing (for admin)
export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('visitors');

    const result = await collection.findOne({ _id: 'counter' as any });
    const count = result?.count || 0;

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error fetching visitor count:', error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}

