import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceId } = body;

    if (!referenceId) {
      return NextResponse.json({ error: 'Reference ID is required' }, { status: 400 });
    }

    try {
      const db = await getDatabase();
      const collection = db.collection('pledges');

      // Increment download count atomically
      const result = await collection.findOneAndUpdate(
        { referenceId: referenceId },
        { $inc: { downloadCount: 1 } },
        { returnDocument: 'after' }
      );

      if (!result) {
        return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
      }

      return NextResponse.json({ 
        success: true, 
        downloadCount: result.downloadCount || 0 
      });
    } catch (dbError: any) {
      console.warn('MongoDB not available for download tracking:', dbError.message);
      // Still return success even if DB fails
      return NextResponse.json({ success: true, downloadCount: 0 });
    }
  } catch (error: any) {
    console.error('Error tracking download:', error);
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    );
  }
}

