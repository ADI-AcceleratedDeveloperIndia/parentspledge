import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Dummy authentication - accept any password
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Accept any password for dummy authentication
    
    // Rate limiting for export endpoint (prevent abuse)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const { checkRateLimit } = await import('@/lib/utils');
    if (!checkRateLimit(`export_${ip}`, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all' or 'district'

    let data: any[] = [];

    try {
      const db = await getDatabase();
      const collection = db.collection('pledges');

      if (type === 'district') {
        // District-wise summary
        data = await collection
          .aggregate([
            {
              $group: {
                _id: '$district',
                count: { $sum: 1 },
              },
            },
            {
              $sort: { count: -1 },
            },
          ])
          .toArray();

        // Convert to CSV format
        const csvRows = ['District,Count'];
        data.forEach((item) => {
          csvRows.push(`${item._id},${item.count}`);
        });

        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="pledges_district_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      } else {
        // All pledges with timestamps
        data = await collection.find({}).sort({ createdAt: -1 }).toArray();

        // Convert to CSV format
        const csvRows = [
          'Child Name,Parent Name,Institution Name,Standard/Class,District,Language,Certificate Number,Reference ID,Created At',
        ];
        data.forEach((item) => {
          const date = new Date(item.createdAt).toISOString();
          csvRows.push(
            `"${item.childName}","${item.parentName}","${item.institutionName}","${item.standard || ''}","${item.district}","${item.language}","${item.certificateNumber || ''}","${item.referenceId || ''}","${date}"`
          );
        });

        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="pledges_all_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }
    } catch (dbError: any) {
      // If MongoDB is not available, return empty CSV
      console.warn('MongoDB not available for export:', dbError.message);
      if (type === 'district') {
        return new NextResponse('District,Count\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="pledges_district_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      } else {
        return new NextResponse('Child Name,Parent Name,Institution Name,Standard/Class,District,Language,Certificate Number,Reference ID,Created At\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="pledges_all_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }
    }
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

