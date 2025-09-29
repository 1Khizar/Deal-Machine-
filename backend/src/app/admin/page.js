'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchUsers();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        calculateStats(data.users);
      } else if (response.status === 401) {
        router.push('/admin/login');
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userList) => {
    const total = userList.length;
    const approved = userList.filter(user => user.isApproved).length;
    const pending = total - approved;
    setStats({ total, approved, pending });
  };

  const handleApproveUser = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        showToast('User approved successfully', 'success');
      } else {
        showToast('Failed to approve user', 'error');
      }
    } catch (error) {
      showToast('Connection error', 'error');
    }
  };

  const handleRevokeUser = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        showToast('User access revoked', 'success');
      } else {
        showToast('Failed to revoke user access', 'error');
      }
    } catch (error) {
      showToast('Connection error', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const showToast = (message, type) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded border font-mono text-sm z-50 ${
      type === 'success' 
        ? 'bg-green-500/20 border-green-500 text-green-400' 
        : 'bg-red-500/20 border-red-500 text-red-400'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 font-mono text-xl">LOADING SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-cyan-500/30 bg-gray-900/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="text-2xl text-cyan-400 animate-pulse">⚡</div>
                <div>
                  <h1 className="text-xl font-bold text-cyan-400 tracking-wider font-mono">
                    ADMIN CONTROL PANEL
                  </h1>
                  <p className="text-gray-400 text-sm font-mono">User Management System</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded font-mono text-sm hover:bg-red-500/30 transition-colors"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-xl">
              <div className="text-3xl font-bold text-cyan-400 font-mono">{stats.total}</div>
              <div className="text-gray-400 text-sm font-mono tracking-wide">TOTAL USERS</div>
            </div>
            <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-6 backdrop-blur-xl">
              <div className="text-3xl font-bold text-green-400 font-mono">{stats.approved}</div>
              <div className="text-gray-400 text-sm font-mono tracking-wide">APPROVED</div>
            </div>
            <div className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-6 backdrop-blur-xl">
              <div className="text-3xl font-bold text-yellow-400 font-mono">{stats.pending}</div>
              <div className="text-gray-400 text-sm font-mono tracking-wide">PENDING</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 font-mono text-center">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="bg-gray-900/50 border border-cyan-500/30 rounded-lg backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-cyan-500/20">
              <h2 className="text-lg font-bold text-cyan-400 font-mono tracking-wider">
                USER REGISTRY
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white font-mono">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-300 font-mono text-sm">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded font-mono ${
                          user.isApproved
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {user.isApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        {!user.isApproved ? (
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-1 rounded text-xs font-mono hover:bg-green-500/30 transition-colors"
                          >
                            APPROVE
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevokeUser(user.id)}
                            className="bg-red-500/20 border border-red-500 text-red-400 px-3 py-1 rounded text-xs font-mono hover:bg-red-500/30 transition-colors"
                          >
                            REVOKE
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-400 font-mono">
                  NO USERS REGISTERED
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}

