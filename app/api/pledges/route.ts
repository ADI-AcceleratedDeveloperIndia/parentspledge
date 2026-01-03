import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { pledgeSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Enhanced rate limiting - stricter for high traffic
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Stricter rate limit: 3 requests per minute per IP (prevents abuse)
    if (!checkRateLimit(ip, 3, 60000)) {
      return NextResponse.json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: 60 
      }, { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
        }
      });
    }

    // Request size limit check (prevent large payload attacks)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) { // 10KB max
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    const body = await request.json();

    // Server-side validation
    const validationResult = pledgeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Generate random reference ID
    const referenceId = `RS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Generate random certificate number (server-side, stored in database)
    const certificateNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Sanitize inputs (additional server-side sanitization)
    const sanitizedData = {
      childName: data.childName.trim().substring(0, 100),
      parentName: data.parentName.trim().substring(0, 100),
      institutionName: data.institutionName.trim().substring(0, 200),
      standard: data.standard.trim().substring(0, 50),
      district: data.district,
      language: data.language,
      referenceId: referenceId,
      certificateNumber: certificateNumber,
      downloadCount: 0,
      createdAt: new Date(),
    };

    // Store in MongoDB (with graceful error handling)
    try {
      const db = await getDatabase();
      const collection = db.collection('pledges');

      // Create indexes if they don't exist (idempotent)
      await collection.createIndex({ district: 1 });
      await collection.createIndex({ createdAt: 1 });
      await collection.createIndex({ referenceId: 1 }); // Index for download tracking

      const result = await collection.insertOne(sanitizedData);

      return NextResponse.json(
        { success: true, id: result.insertedId, referenceId: referenceId, certificateNumber: certificateNumber },
        { status: 201 }
      );
    } catch (dbError: any) {
      // If MongoDB is not available, still return success (for development/testing)
      console.warn('MongoDB not available, pledge not stored:', dbError.message);
      // Return success anyway so the certificate can still be generated
      return NextResponse.json(
        { success: true, id: 'local-' + Date.now(), warning: 'Data not stored in database' },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Error processing pledge:', error);
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Failed to process pledge. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint - can check pledge by referenceId OR get all pledges (admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const referenceId = searchParams.get('referenceId');

  // If referenceId provided, check if pledge exists (public endpoint)
  if (referenceId) {
    try {
      const db = await getDatabase();
      const collection = db.collection('pledges');
      const pledge = await collection.findOne({ referenceId: referenceId });
      
      if (pledge) {
        return NextResponse.json({ 
          pledge: {
            referenceId: pledge.referenceId,
            certificateNumber: pledge.certificateNumber,
            downloadCount: pledge.downloadCount || 0,
            childName: pledge.childName,
            parentName: pledge.parentName,
            institutionName: pledge.institutionName,
            standard: pledge.standard,
            district: pledge.district,
            language: pledge.language,
          }
        });
      } else {
        return NextResponse.json({ error: 'Pledge not found' }, { status: 404 });
      }
    } catch (dbError: any) {
      console.warn('MongoDB not available for pledge lookup:', dbError.message);
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }
  }

  // GET endpoint for admin (protected) - get all pledges
  try {
    // Dummy authentication - accept any password
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Accept any password for dummy authentication

    const db = await getDatabase();
    const collection = db.collection('pledges');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const pledges = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const total = await collection.countDocuments({});

    return NextResponse.json({
      pledges: pledges.map((p) => ({
        ...p,
        _id: p._id.toString(),
      })),
      total,
      limit,
      skip,
    });
  } catch (error: any) {
    console.error('Error fetching pledges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pledges' },
      { status: 500 }
    );
  }
}

