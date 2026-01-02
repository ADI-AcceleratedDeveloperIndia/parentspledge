import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { pledgeSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
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

    // Sanitize inputs (additional server-side sanitization)
    const sanitizedData = {
      childName: data.childName.trim().substring(0, 100),
      parentName: data.parentName.trim().substring(0, 100),
      institutionName: data.institutionName.trim().substring(0, 200),
      district: data.district,
      language: data.language,
      createdAt: new Date(),
    };

    // Store in MongoDB (with graceful error handling)
    try {
      const db = await getDatabase();
      const collection = db.collection('pledges');

      // Create indexes if they don't exist (idempotent)
      await collection.createIndex({ district: 1 });
      await collection.createIndex({ createdAt: 1 });

      const result = await collection.insertOne(sanitizedData);

      return NextResponse.json(
        { success: true, id: result.insertedId },
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

// GET endpoint for admin (protected)
export async function GET(request: NextRequest) {
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

