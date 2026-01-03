import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Dummy authentication - accept any password (even empty)
    const authHeader = request.headers.get('authorization');
    // Accept any non-empty Bearer token for dummy authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Any password is accepted (dummy authentication for development)

    // Try to get database, but handle gracefully if not available
    let totalPledges = 0;
    let totalDownloads = 0;
    let districtStats: any[] = [];
    let hourWiseStats: any[] = [];
    let dayWiseStats: any[] = [];
    let peakHour: number | null = null;

    try {
      const db = await getDatabase();
      const collection = db.collection('pledges');

      // Total pledges
      totalPledges = await collection.countDocuments({});

      // Total downloads (sum of all downloadCount fields)
      // Also count pledges that have been downloaded at least once
      const downloadStats = await collection
        .aggregate([
          {
            $group: {
              _id: null,
              totalDownloads: { $sum: { $ifNull: ['$downloadCount', 0] } },
              pledgesWithDownloads: {
                $sum: {
                  $cond: [{ $gt: [{ $ifNull: ['$downloadCount', 0] }, 0] }, 1, 0]
                }
              }
            },
          },
        ])
        .toArray();
      
      totalDownloads = downloadStats[0]?.totalDownloads || 0;
      console.log(`Analytics: Total downloads = ${totalDownloads}, Pledges with downloads = ${downloadStats[0]?.pledgesWithDownloads || 0}`);

      // District-wise analytics
      districtStats = await collection
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

      // Time-based analytics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Hour-wise count (last 24 hours)
      hourWiseStats = await collection
        .aggregate([
          {
            $match: {
              createdAt: { $gte: oneDayAgo },
            },
          },
          {
            $group: {
              _id: {
                hour: { $hour: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.day': 1, '_id.hour': 1 },
          },
        ])
        .toArray();

      // Day-wise trend (last 7 days)
      dayWiseStats = await collection
        .aggregate([
          {
            $match: {
              createdAt: { $gte: oneWeekAgo },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
          },
        ])
        .toArray();

      // Peak time analysis
      const peakHourResult = await collection
        .aggregate([
          {
            $group: {
              _id: { $hour: '$createdAt' },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { count: -1 },
          },
          {
            $limit: 1,
          },
        ])
        .toArray();
      
      peakHour = peakHourResult[0]?._id || null;
    } catch (dbError: any) {
      // If MongoDB is not available, return empty data
      console.warn('MongoDB not available for analytics:', dbError.message);
    }

    return NextResponse.json({
      totalPledges,
      totalDownloads,
      districtStats: districtStats.map((s) => ({
        district: s._id,
        count: s.count,
      })),
      hourWiseStats: hourWiseStats.map((s) => ({
        hour: s._id.hour,
        day: s._id.day,
        count: s.count,
      })),
      dayWiseStats: dayWiseStats.map((s) => ({
        date: `${s._id.year}-${String(s._id.month).padStart(2, '0')}-${String(s._id.day).padStart(2, '0')}`,
        count: s.count,
      })),
      peakHour,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

