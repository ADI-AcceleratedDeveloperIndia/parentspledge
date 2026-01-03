'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  totalPledges: number;
  totalDownloads: number;
  districtStats: Array<{ district: string; count: number }>;
  hourWiseStats: Array<{ hour: number; day: number; count: number }>;
  dayWiseStats: Array<{ date: string; count: number }>;
  peakHour: number | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Dummy authentication - accept any password (even empty)
      const authPassword = password.trim() || 'dummy';
      const response = await fetch('/api/analytics', {
        headers: {
          Authorization: `Bearer ${authPassword}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setIsAuthenticated(true);
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics', {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      setError('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async (type: 'all' | 'district') => {
    try {
      const response = await fetch(`/api/export?type=${type}`, {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pledges_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
      // Refresh analytics every 30 seconds
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, password]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F0F5F9' }}>
        <div className="max-w-md w-full rounded-lg p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
          <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#0D3A5C' }}>Admin Login</h1>
          <p className="text-sm text-center mb-6" style={{ color: '#2C3E50' }}>
            Enter any password to continue
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#0D3A5C' }}>
                Password (any password works)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: '1px solid #B8D4E8',
                  backgroundColor: '#FFFFFF',
                  color: '#0D3A5C',
                  '--tw-ring-color': '#1E5A8A'
                } as React.CSSProperties}
                placeholder="Enter any password"
                required
              />
            </div>
            {error && <p className="text-sm" style={{ color: '#FF6B35' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: loading ? '#4A90C2' : '#1E5A8A' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F5F9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#1E5A8A' }}></div>
          <p className="mt-4" style={{ color: '#2C3E50' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#F0F5F9' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#0D3A5C' }}>Admin Dashboard</h1>
              <p className="mt-1" style={{ color: '#2C3E50' }}>Road Safety Pledge Analytics</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportCSV('all')}
                className="px-4 py-2 text-white rounded-lg transition-opacity"
                style={{ backgroundColor: '#4A90C2' }}
              >
                Export All CSV
              </button>
              <button
                onClick={() => exportCSV('district')}
                className="px-4 py-2 text-white rounded-lg transition-opacity"
                style={{ backgroundColor: '#1E5A8A' }}
              >
                Export District CSV
              </button>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="px-4 py-2 text-white rounded-lg transition-opacity"
                style={{ backgroundColor: '#2C3E50' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Total Pledges and Downloads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#0D3A5C' }}>Total Pledges</h2>
            <div className="text-5xl font-bold" style={{ color: '#1E5A8A' }}>{analytics.totalPledges.toLocaleString()}</div>
            <p className="mt-2" style={{ color: '#2C3E50' }}>Live counter</p>
          </div>
          <div className="rounded-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#0D3A5C' }}>Total Downloads</h2>
            <div className="text-5xl font-bold" style={{ color: '#FF6B35' }}>{(analytics.totalDownloads || 0).toLocaleString()}</div>
            <p className="mt-2" style={{ color: '#2C3E50' }}>Certificate downloads</p>
          </div>
        </div>

        {/* District-wise Analytics */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#0D3A5C' }}>District-wise Analytics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ borderColor: '#B8D4E8' }}>
              <thead style={{ backgroundColor: '#F0F5F9' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#2C3E50' }}>
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#2C3E50' }}>
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#2C3E50' }}>
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#2C3E50' }}>
                    Bar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#B8D4E8' }}>
                {analytics.districtStats.map((stat) => {
                  const percentage =
                    analytics.totalPledges > 0
                      ? ((stat.count / analytics.totalPledges) * 100).toFixed(1)
                      : '0';
                  return (
                    <tr key={stat.district}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: '#0D3A5C' }}>
                        {stat.district}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#2C3E50' }}>
                        {stat.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#2C3E50' }}>
                        {percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full rounded-full h-4" style={{ backgroundColor: '#B8D4E8' }}>
                          <div
                            className="h-4 rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: '#1E5A8A' }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time-based Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Hour-wise Stats */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#0D3A5C' }}>Hour-wise Count (Last 24 Hours)</h2>
            <div className="space-y-2">
              {analytics.hourWiseStats.length > 0 ? (
                analytics.hourWiseStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 text-sm" style={{ color: '#2C3E50' }}>
                      {String(stat.hour).padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 rounded-full h-6" style={{ backgroundColor: '#B8D4E8' }}>
                      <div
                        className="h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${
                            analytics.hourWiseStats.length > 0
                              ? (stat.count / Math.max(...analytics.hourWiseStats.map((s) => s.count))) * 100
                              : 0
                          }%`,
                          backgroundColor: '#4A90C2'
                        }}
                      >
                        <span className="text-xs text-white font-medium">{stat.count}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: '#2C3E50' }}>No data available</p>
              )}
            </div>
          </div>

          {/* Day-wise Trend */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#0D3A5C' }}>Day-wise Trend (Last 7 Days)</h2>
            <div className="space-y-2">
              {analytics.dayWiseStats.length > 0 ? (
                analytics.dayWiseStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm" style={{ color: '#2C3E50' }}>{stat.date}</div>
                    <div className="flex-1 rounded-full h-6" style={{ backgroundColor: '#B8D4E8' }}>
                      <div
                        className="h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${
                            analytics.dayWiseStats.length > 0
                              ? (stat.count / Math.max(...analytics.dayWiseStats.map((s) => s.count))) * 100
                              : 0
                          }%`,
                          backgroundColor: '#1E5A8A'
                        }}
                      >
                        <span className="text-xs text-white font-medium">{stat.count}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: '#2C3E50' }}>No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Peak Time Analysis */}
        {analytics.peakHour !== null && (
          <div className="rounded-lg p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#0D3A5C' }}>Peak Time Analysis</h2>
            <p className="text-lg" style={{ color: '#2C3E50' }}>
              Peak hour: <span className="font-bold" style={{ color: '#1E5A8A' }}>{analytics.peakHour}:00</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

