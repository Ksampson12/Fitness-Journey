import { useState, useEffect } from 'react';

interface UserProfile {
  id: number;
  userId: string;
  displayName: string;
  fitnessLevel: string;
  xp: number;
  coins: number;
  streak: number;
  createdAt: string;
  aiRequests?: number;
  lastAiRequest?: string;
}

interface AiUsageStats {
  totalRequests: number;
  totalCost: number;
  requestsToday: number;
  costToday: number;
  topUsers: Array<{
    userId: string;
    displayName: string;
    requests: number;
    cost: number;
  }>;
}

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [aiStats, setAiStats] = useState<AiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch both users and AI stats
    Promise.all([
      fetch('/api/admin/users').then(res => res.json()),
      fetch('/api/admin/ai-usage').then(res => res.json()).catch(() => null)
    ])
      .then(([usersData, aiData]) => {
        setUsers(usersData);
        setAiStats(aiData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch admin data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading admin data...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* AI Usage Stats */}
      {aiStats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🤖 AI Usage Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{aiStats.totalRequests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">${aiStats.totalCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{aiStats.requestsToday}</div>
              <div className="text-sm text-gray-600">Requests Today</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">${aiStats.costToday.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Cost Today</div>
            </div>
          </div>
          
          {aiStats.topUsers.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Top AI Users</h3>
              <div className="space-y-2">
                {aiStats.topUsers.map((user, index) => (
                  <div key={user.userId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="font-medium">{index + 1}. {user.displayName}</span>
                    <span className="text-sm text-gray-600">{user.requests} requests (${user.cost.toFixed(2)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fitness Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coins</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Requests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last AI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.userId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.displayName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.fitnessLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.xp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.coins}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.streak}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.aiRequests || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.lastAiRequest ? new Date(user.lastAiRequest).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
