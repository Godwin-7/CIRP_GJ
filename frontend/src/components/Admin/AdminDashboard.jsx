// components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [domains, setDomains] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    loadDashboardData();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data.data.user.isAdmin) {
        alert('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      setCurrentUser(response.data.data.user);
    } catch (error) {
      console.error('Admin check failed:', error);
      navigate('/login');
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [dashboardRes, domainsRes, ideasRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/dashboard', config),
        axios.get('http://localhost:5000/api/admin/domains', config),
        axios.get('http://localhost:5000/api/admin/ideas', config),
        axios.get('http://localhost:5000/api/admin/users', config)
      ]);

      setDashboardData(dashboardRes.data.data);
      setDomains(domainsRes.data.data.domains);
      setIdeas(ideasRes.data.data.ideas);
      setUsers(usersRes.data.data.admins);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDomain = async (domainId, force = false) => {
    if (!confirm(`Are you sure you want to ${force ? 'PERMANENTLY' : ''} delete this domain?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/admin/domains/${domainId}${force ? '?force=true' : ''}`;
      
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Domain deleted successfully');
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Failed to delete domain:', error);
      
      if (error.response?.status === 400 && error.response?.data?.data?.activeIdeasCount) {
        const { activeIdeasCount } = error.response.data.data;
        if (confirm(`This domain has ${activeIdeasCount} active ideas. Do you want to force delete everything?`)) {
          deleteDomain(domainId, true);
        }
      } else {
        alert('Failed to delete domain: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const deleteIdea = async (ideaId) => {
    if (!confirm('Are you sure you want to permanently delete this idea?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/ideas/${ideaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Idea deleted successfully');
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Failed to delete idea:', error);
      alert('Failed to delete idea: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/admin/users/${userId}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`User ${action}d successfully`);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user: ` + (error.response?.data?.message || error.message));
    }
  };

  const promoteToAdmin = async (userId) => {
    if (!confirm('Are you sure you want to promote this user to admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/users/${userId}/promote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('User promoted to admin successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to promote user:', error);
      alert('Failed to promote user: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-info">
          <span>Welcome, {currentUser?.fullName || currentUser?.username}</span>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Main Site
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'domains' ? 'active' : ''}
          onClick={() => setActiveTab('domains')}
        >
          Domains
        </button>
        <button 
          className={activeTab === 'ideas' ? 'active' : ''}
          onClick={() => setActiveTab('ideas')}
        >
          Ideas
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Users</h3>
                <p className="stat-number">{dashboardData?.stats?.totalUsers || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Domains</h3>
                <p className="stat-number">{dashboardData?.stats?.totalDomains || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Total Ideas</h3>
                <p className="stat-number">{dashboardData?.stats?.totalIdeas || 0}</p>
              </div>
            </div>

            <div className="recent-activity">
              <div className="recent-section">
                <h3>Recent Users</h3>
                <div className="recent-items">
                  {dashboardData?.recent?.users?.map(user => (
                    <div key={user._id} className="recent-item">
                      <span>{user.username}</span>
                      <span className="date">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recent-section">
                <h3>Recent Domains</h3>
                <div className="recent-items">
                  {dashboardData?.recent?.domains?.map(domain => (
                    <div key={domain._id} className="recent-item">
                      <span>{domain.title}</span>
                      <span className="author">by {domain.createdBy?.username}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recent-section">
                <h3>Recent Ideas</h3>
                <div className="recent-items">
                  {dashboardData?.recent?.ideas?.map(idea => (
                    <div key={idea._id} className="recent-item">
                      <span>{idea.title}</span>
                      <span className="domain">{idea.domain?.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="domains-management">
            <h2>Domain Management</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Creator</th>
                    <th>Ideas Count</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map(domain => (
                    <tr key={domain._id}>
                      <td>
                        <div className="item-info">
                          <span className="title">{domain.title}</span>
                          <span className="description">{domain.description?.substring(0, 100)}...</span>
                        </div>
                      </td>
                      <td>{domain.createdBy?.username || 'Unknown'}</td>
                      <td>{domain.ideaCount || 0}</td>
                      <td>{new Date(domain.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => navigate(`/domains/${domain._id}`)}
                            className="view-btn"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => deleteDomain(domain._id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="ideas-management">
            <h2>Idea Management</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Domain</th>
                    <th>Author</th>
                    <th>Creator</th>
                    <th>Difficulty</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.map(idea => (
                    <tr key={idea._id}>
                      <td>
                        <div className="item-info">
                          <span className="title">{idea.title}</span>
                          <span className="description">{idea.description?.substring(0, 100)}...</span>
                        </div>
                      </td>
                      <td>{idea.domain?.title || 'Unknown'}</td>
                      <td>{idea.author?.authorName || 'Unknown'}</td>
                      <td>{idea.createdBy?.username || 'Unknown'}</td>
                      <td>
                        <span className={`difficulty-badge ${idea.difficulty}`}>
                          {idea.difficulty?.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(idea.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => navigate(`/domains/${idea.domain?._id}/ideas/${idea._id}`)}
                            className="view-btn"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => deleteIdea(idea._id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <h2>User Management</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Admin</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <div className="action-buttons">
                          {user._id !== currentUser?.id && (
                            <>
                              <button 
                                onClick={() => toggleUserStatus(user._id, user.isActive)}
                                className={user.isActive ? 'deactivate-btn' : 'activate-btn'}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              {!user.isAdmin && (
                                <button 
                                  onClick={() => promoteToAdmin(user._id)}
                                  className="promote-btn"
                                >
                                  Make Admin
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;