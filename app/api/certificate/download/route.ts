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
        { 
          returnDocument: 'after',
          upsert: false // Don't create if doesn't exist
        }
      );

      if (!result || !result.downloadCount) {
        console.warn(`Pledge with referenceId ${referenceId} not found or downloadCount not set`);
        // Try to find the pledge to see if it exists
        const existingPledge = await collection.findOne({ referenceId: referenceId });
        if (existingPledge) {
          console.log('Pledge exists but update failed, trying again...');
          // Try once more with explicit set
          const retryResult = await collection.findOneAndUpdate(
            { referenceId: referenceId },
            { 
              $set: { downloadCount: (existingPledge.downloadCount || 0) + 1 }
            },
            { returnDocument: 'after' }
          );
          if (retryResult) {
            console.log(`Download tracked (retry) for referenceId ${referenceId}, new count: ${retryResult.downloadCount}`);
            return NextResponse.json({ 
              success: true, 
              downloadCount: retryResult.downloadCount || 0 
            });
          }
        }
        return NextResponse.json({ 
          error: 'Pledge not found',
          referenceId: referenceId 
        }, { status: 404 });
      }

      console.log(`Download tracked for referenceId ${referenceId}, new count: ${result.downloadCount}`);
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

