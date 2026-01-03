import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Dummy authentication - accept any password (even empty)
    const authHeader = request.headers.get('authorization');
    // Accept any Bearer token (even empty) for dummy authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Still allow access with empty Bearer token
      console.warn('No Bearer token provided, but allowing access (dummy auth)');
    }
    // Any password is accepted (dummy authentication for development)
    
    // Rate limiting for analytics endpoint (prevent abuse)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Allow 30 requests per minute for analytics (admin dashboard refreshes every 5 seconds)
    const { checkRateLimit } = await import('@/lib/utils');
    if (!checkRateLimit(`analytics_${ip}`, 30, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Try to get database, but handle gracefully if not available
    let totalPledges = 0;
    let totalDownloads = 0;
    let totalUniqueVisitors = 0;
    let totalRepeatedVisitors = 0;
    let districtStats: any[] = [];
    let hourWiseStats: any[] = [];
    let dayWiseStats: any[] = [];
    let peakHour: number | null = null;

    try {
      const db = await getDatabase();
      const collection = db.collection('pledges');
      const visitorsCollection = db.collection('visitors');

      // Total pledges
      totalPledges = await collection.countDocuments({});

      // Total unique visitors
      const uniqueVisitorDoc = await visitorsCollection.findOne({ _id: 'counter' as any });
      totalUniqueVisitors = uniqueVisitorDoc?.count || 0;

      // Total repeated visitors
      const repeatedVisitorDoc = await visitorsCollection.findOne({ _id: 'repeatedCounter' as any });
      totalRepeatedVisitors = repeatedVisitorDoc?.count || 0;

      // Total downloads = count of unique users who downloaded (downloadCount > 0)
      // One download per pledge - count pledges that have been downloaded
      const downloadStats = await collection
        .aggregate([
          {
            $group: {
              _id: null,
              totalDownloads: {
                $sum: {
                  $cond: [
                    { $gt: [{ $ifNull: ['$downloadCount', 0] }, 0] },
                    1, // Count this pledge as downloaded
                    0
                  ]
                }
              }
            },
          },
        ])
        .toArray();
      
      totalDownloads = downloadStats[0]?.totalDownloads || 0;
      console.log(`Analytics: Total unique users who downloaded = ${totalDownloads}`);

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

      // Hour-wise count (last 24 hours) - Convert UTC to IST (UTC+5:30)
      const hourWiseStatsRaw = await collection
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
      
      // Convert UTC hours to IST (UTC+5:30) - add 5 hours and wrap around
      hourWiseStats = hourWiseStatsRaw.map((stat: any) => ({
        hour: (stat._id.hour + 5) % 24, // Convert UTC to IST (simplified: +5 hours)
        day: stat._id.day,
        count: stat.count,
      }));

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

      // Peak time analysis (convert UTC to IST - UTC+5:30)
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
      
      // Convert UTC hour to IST (UTC+5:30)
      if (peakHourResult[0]?._id !== undefined) {
        const utcHour = peakHourResult[0]._id;
        // Add 5 hours 30 minutes and wrap around 24 hours
        peakHour = (utcHour + 5) % 24; // Simplified: add 5 hours (30 min offset handled in display)
      } else {
        peakHour = null;
      }
    } catch (dbError: any) {
      // If MongoDB is not available, return empty data
      console.warn('MongoDB not available for analytics:', dbError.message);
    }

    return NextResponse.json({
      totalPledges,
      totalDownloads,
      totalUniqueVisitors,
      totalRepeatedVisitors,
      districtStats: districtStats.map((s) => ({
        district: s._id,
        count: s.count,
      })),
      hourWiseStats: hourWiseStats, // Already transformed above
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

