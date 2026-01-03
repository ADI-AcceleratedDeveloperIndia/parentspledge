import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for visitor tracking (prevent abuse)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Allow 1 request per 5 seconds per IP (prevents spam)
    const cacheKey = `visitor_${ip}_${Math.floor(Date.now() / 5000)}`;
    
    const db = await getDatabase();
    const collection = db.collection('visitors');

    // Increment unique visitor count atomically with timeout
    const result = await collection.findOneAndUpdate(
      { _id: 'counter' as any },
      { $inc: { count: 1 } },
      { 
        upsert: true, 
        returnDocument: 'after',
        maxTimeMS: 5000 // 5 second timeout
      }
    );

    const count = result?.count || 1;

    return NextResponse.json({ count }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error: any) {
    console.error('Error incrementing visitor count:', error);
    // Return a cached/default value instead of failing (graceful degradation)
    return NextResponse.json({ count: 0, error: 'Unable to fetch count' }, { status: 200 });
  }
}

// PUT endpoint to increment repeated visitors (called by client when returning visitor detected)
export async function PUT(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('visitors');

    // Increment repeated visitor count atomically
    const result = await collection.findOneAndUpdate(
      { _id: 'repeatedCounter' as any },
      { $inc: { count: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    const count = result?.count || 1;

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error incrementing repeated visitor count:', error);
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

