// components/AdminDashboard.jsx - Fixed search functionality and data fetching
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
  
  // Pagination states
  const [domainPagination, setDomainPagination] = useState({ page: 1, totalPages: 1, loading: false });
  const [ideaPagination, setIdeaPagination] = useState({ page: 1, totalPages: 1, loading: false });
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, loading: false });
  
  // Search states
  const [searchFilters, setSearchFilters] = useState({
    domainSearch: '',
    ideaSearch: '',
    userSearch: ''
  });

  // Search loading states
  const [searchLoading, setSearchLoading] = useState({
    domains: false,
    ideas: false,
    users: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'domains' && domains.length === 0) {
      loadAllDomains(1);
    } else if (activeTab === 'ideas' && ideas.length === 0) {
      loadAllIdeas(1);
    } else if (activeTab === 'users' && users.length === 0) {
      loadAllUsers(1);
    }
  }, [activeTab]);

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

      const dashboardRes = await axios.get('http://localhost:5000/api/admin/dashboard', config);
      setDashboardData(dashboardRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set default data if API fails
      setDashboardData({
        stats: { totalUsers: 0, totalDomains: 0, totalIdeas: 0 },
        recent: { users: [], domains: [], ideas: [] }
      });
    } finally {
      setLoading(false);
    }
  };

  // Fixed load ALL domains with pagination and search
  const loadAllDomains = async (page = 1, search = '') => {
    try {
      setDomainPagination(prev => ({ ...prev, loading: true }));
      if (search !== undefined) {
        setSearchLoading(prev => ({ ...prev, domains: true }));
      }

      const token = localStorage.getItem('token');
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page, 
          limit: 20, 
          search: search?.trim() || ''
        }
      };

      console.log('Loading domains with params:', config.params);

      const response = await axios.get('http://localhost:5000/api/admin/domains', config);
      const data = response.data.data;
      
      if (page === 1) {
        setDomains(data.domains || []);
      } else {
        setDomains(prev => [...prev, ...(data.domains || [])]);
      }
      
      setDomainPagination({
        page: data.pagination?.current || page,
        totalPages: data.pagination?.total || 1,
        loading: false
      });

      console.log('Domains loaded:', data.domains?.length || 0, 'Total pages:', data.pagination?.total || 1);

    } catch (error) {
      console.error('Failed to load all domains:', error);
      setDomains([]);
      setDomainPagination(prev => ({ ...prev, loading: false }));
    } finally {
      if (search !== undefined) {
        setSearchLoading(prev => ({ ...prev, domains: false }));
      }
    }
  };

  // Fixed load ALL ideas with pagination and search
  const loadAllIdeas = async (page = 1, search = '') => {
    try {
      setIdeaPagination(prev => ({ ...prev, loading: true }));
      if (search !== undefined) {
        setSearchLoading(prev => ({ ...prev, ideas: true }));
      }

      const token = localStorage.getItem('token');
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page, 
          limit: 20, 
          search: search?.trim() || ''
        }
      };

      console.log('Loading ideas with params:', config.params);

      const response = await axios.get('http://localhost:5000/api/admin/ideas', config);
      const data = response.data.data;
      
      if (page === 1) {
        setIdeas(data.ideas || []);
      } else {
        setIdeas(prev => [...prev, ...(data.ideas || [])]);
      }
      
      setIdeaPagination({
        page: data.pagination?.current || page,
        totalPages: data.pagination?.total || 1,
        loading: false
      });

      console.log('Ideas loaded:', data.ideas?.length || 0, 'Total pages:', data.pagination?.total || 1);

    } catch (error) {
      console.error('Failed to load all ideas:', error);
      setIdeas([]);
      setIdeaPagination(prev => ({ ...prev, loading: false }));
    } finally {
      if (search !== undefined) {
        setSearchLoading(prev => ({ ...prev, ideas: false }));
      }
    }
  };

  // Fixed load ALL users with pagination and search
  const loadAllUsers = async (page = 1, search = '') => {
    try {
      setUserPagination(prev => ({ ...prev, loading: true }));
      if (search !== undefined) {
        setSearchLoading(prev => ({ ...prev, users: true }));
      }

      const token = localStorage.getItem('token');
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page, 
          limit: 20, 
          search: search?.trim() || ''
        }
      };

      console.log('Loading users with params:', config.params);

      const response = await axios.get('http://localhost:5000/api/admin/users/all', config);
      const data = response.data.data;
      
      if (page === 1) {
        setUsers(data.users || []);
      } else {
        setUsers(prev => [...prev, ...(data.users || [])]);
      }
      
      setUserPagination({
        page: data.pagination?.current || page,
        totalPages: data.pagination?.total || 1,
        loading: false
      });

      console.log('Users loaded:', data.users?.length || 0, 'Total pages:', data.pagination?.total || 1);

    } catch (error) {
      console.error('Failed to load all users:', error);
      setUsers([]);
      setUserPagination(prev => ({ ...prev, loading: false }));
    } finally {
      if (search !== undefined) {
        setSearchLoading(prev => ({ ...prev, users: false }));
      }
    }
  };

  // Enhanced delete domain with force delete option
  const deleteDomain = async (domainId, force = false) => {
    const confirmMessage = force 
      ? 'Are you sure you want to PERMANENTLY DELETE this domain and ALL its ideas from the database? This action cannot be undone!'
      : 'Are you sure you want to delete this domain?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/admin/domains/${domainId}${force ? '?force=true&hardDelete=true' : ''}`;
      
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(force ? 'Domain permanently deleted from database' : 'Domain deleted successfully');
      loadAllDomains(1, searchFilters.domainSearch); // Reload domains
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete domain:', error);
      
      if (error.response?.status === 400 && error.response?.data?.data?.activeIdeasCount) {
        const { activeIdeasCount } = error.response.data.data;
        if (confirm(`This domain has ${activeIdeasCount} active ideas. Do you want to PERMANENTLY DELETE everything from the database?`)) {
          deleteDomain(domainId, true);
        }
      } else {
        alert('Failed to delete domain: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Enhanced delete idea with hard delete option
  const deleteIdea = async (ideaId, hardDelete = false) => {
    const confirmMessage = hardDelete
      ? 'Are you sure you want to PERMANENTLY DELETE this idea from the database? This action cannot be undone!'
      : 'Are you sure you want to delete this idea?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/admin/ideas/${ideaId}${hardDelete ? '?hardDelete=true' : ''}`;
      
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(hardDelete ? 'Idea permanently deleted from database' : 'Idea deleted successfully');
      loadAllIdeas(1, searchFilters.ideaSearch); // Reload ideas
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete idea:', error);
      alert('Failed to delete idea: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete user function
  const deleteUser = async (userId, hardDelete = false) => {
    const user = users.find(u => u._id === userId);
    const confirmMessage = hardDelete
      ? `Are you sure you want to PERMANENTLY DELETE user "${user?.username}" from the database? This will also delete all their domains and ideas. This action cannot be undone!`
      : `Are you sure you want to delete user "${user?.username}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/admin/users/${userId}${hardDelete ? '?hardDelete=true' : ''}`;
      
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(hardDelete ? 'User permanently deleted from database' : 'User deleted successfully');
      loadAllUsers(1, searchFilters.userSearch); // Reload users
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
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
      loadAllUsers(1, searchFilters.userSearch); // Reload users
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
      loadAllUsers(1, searchFilters.userSearch); // Reload users
    } catch (error) {
      console.error('Failed to promote user:', error);
      alert('Failed to promote user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Fixed search handlers
  const handleDomainSearch = (e) => {
    e.preventDefault();
    console.log('Domain search triggered:', searchFilters.domainSearch);
    loadAllDomains(1, searchFilters.domainSearch);
  };

  const handleIdeaSearch = (e) => {
    e.preventDefault();
    console.log('Idea search triggered:', searchFilters.ideaSearch);
    loadAllIdeas(1, searchFilters.ideaSearch);
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    console.log('User search triggered:', searchFilters.userSearch);
    loadAllUsers(1, searchFilters.userSearch);
  };

  // Fixed clear handlers
  const clearDomainSearch = () => {
    setSearchFilters(prev => ({ ...prev, domainSearch: '' }));
    loadAllDomains(1, '');
  };

  const clearIdeaSearch = () => {
    setSearchFilters(prev => ({ ...prev, ideaSearch: '' }));
    loadAllIdeas(1, '');
  };

  const clearUserSearch = () => {
    setSearchFilters(prev => ({ ...prev, userSearch: '' }));
    loadAllUsers(1, '');
  };

  // Load more handlers
  const loadMoreDomains = () => {
    if (domainPagination.page < domainPagination.totalPages && !domainPagination.loading) {
      loadAllDomains(domainPagination.page + 1, searchFilters.domainSearch);
    }
  };

  const loadMoreIdeas = () => {
    if (ideaPagination.page < ideaPagination.totalPages && !ideaPagination.loading) {
      loadAllIdeas(ideaPagination.page + 1, searchFilters.ideaSearch);
    }
  };

  const loadMoreUsers = () => {
    if (userPagination.page < userPagination.totalPages && !userPagination.loading) {
      loadAllUsers(userPagination.page + 1, searchFilters.userSearch);
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
          All Domains ({dashboardData?.stats?.totalDomains || 0})
        </button>
        <button 
          className={activeTab === 'ideas' ? 'active' : ''}
          onClick={() => setActiveTab('ideas')}
        >
          All Ideas ({dashboardData?.stats?.totalIdeas || 0})
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          All Users ({dashboardData?.stats?.totalUsers || 0})
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
                  )) || <div className="no-items">No recent users</div>}
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
                  )) || <div className="no-items">No recent domains</div>}
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
                  )) || <div className="no-items">No recent ideas</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="domains-management">
            <div className="section-header">
              <h2>All Domains Management</h2>
              <form onSubmit={handleDomainSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search domains by title, description..."
                  value={searchFilters.domainSearch}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, domainSearch: e.target.value }))}
                  disabled={searchLoading.domains}
                />
                <button type="submit" disabled={searchLoading.domains}>
                  {searchLoading.domains ? 'Searching...' : 'Search'}
                </button>
                <button type="button" onClick={clearDomainSearch} disabled={searchLoading.domains}>
                  Clear
                </button>
              </form>
              <div className="results-info">
                Showing {domains.length} domains {searchFilters.domainSearch && `(filtered by "${searchFilters.domainSearch}")`}
              </div>
            </div>
            
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Creator</th>
                    <th>Ideas Count</th>
                    <th>Category</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.length > 0 ? domains.map(domain => (
                    <tr key={domain._id}>
                      <td>
                        <div className="item-info">
                          <span className="title">{domain.title}</span>
                          <span className="description">
                            {domain.description?.substring(0, 100)}{domain.description?.length > 100 ? '...' : ''}
                          </span>
                        </div>
                      </td>
                      <td>{domain.createdBy?.username || 'Unknown'}</td>
                      <td>{domain.ideaCount || 0}</td>
                      <td>
                        <span className="category-badge">{domain.category}</span>
                      </td>
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
                            onClick={() => deleteDomain(domain._id, false)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={() => deleteDomain(domain._id, true)}
                            className="hard-delete-btn"
                            title="Permanently delete from database"
                          >
                            Hard Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchLoading.domains ? 'Searching domains...' : 
                         domainPagination.loading ? 'Loading domains...' : 
                         searchFilters.domainSearch ? 'No domains found matching your search.' : 
                         'No domains available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {domainPagination.page < domainPagination.totalPages && (
              <div className="load-more-container">
                <button 
                  onClick={loadMoreDomains}
                  className="load-more-btn"
                  disabled={domainPagination.loading}
                >
                  {domainPagination.loading ? 'Loading...' : 'Load More Domains'}
                </button>
                <span className="pagination-info">
                  Page {domainPagination.page} of {domainPagination.totalPages}
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="ideas-management">
            <div className="section-header">
              <h2>All Ideas Management</h2>
              <form onSubmit={handleIdeaSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search ideas by title, description..."
                  value={searchFilters.ideaSearch}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, ideaSearch: e.target.value }))}
                  disabled={searchLoading.ideas}
                />
                <button type="submit" disabled={searchLoading.ideas}>
                  {searchLoading.ideas ? 'Searching...' : 'Search'}
                </button>
                <button type="button" onClick={clearIdeaSearch} disabled={searchLoading.ideas}>
                  Clear
                </button>
              </form>
              <div className="results-info">
                Showing {ideas.length} ideas {searchFilters.ideaSearch && `(filtered by "${searchFilters.ideaSearch}")`}
              </div>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Domain</th>
                    <th>Author</th>
                    <th>Creator</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.length > 0 ? ideas.map(idea => (
                    <tr key={idea._id}>
                      <td>
                        <div className="item-info">
                          <span className="title">{idea.title}</span>
                          <span className="description">
                            {idea.description?.substring(0, 100)}{idea.description?.length > 100 ? '...' : ''}
                          </span>
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
                      <td>
                        <span className="status-badge">{idea.status}</span>
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
                            onClick={() => deleteIdea(idea._id, false)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={() => deleteIdea(idea._id, true)}
                            className="hard-delete-btn"
                            title="Permanently delete from database"
                          >
                            Hard Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="no-data">
                        {searchLoading.ideas ? 'Searching ideas...' : 
                         ideaPagination.loading ? 'Loading ideas...' : 
                         searchFilters.ideaSearch ? 'No ideas found matching your search.' : 
                         'No ideas available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {ideaPagination.page < ideaPagination.totalPages && (
              <div className="load-more-container">
                <button 
                  onClick={loadMoreIdeas}
                  className="load-more-btn"
                  disabled={ideaPagination.loading}
                >
                  {ideaPagination.loading ? 'Loading...' : 'Load More Ideas'}
                </button>
                <span className="pagination-info">
                  Page {ideaPagination.page} of {ideaPagination.totalPages}
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-management">
            <div className="section-header">
              <h2>All Users Management</h2>
              <form onSubmit={handleUserSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search users by name, email, username..."
                  value={searchFilters.userSearch}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, userSearch: e.target.value }))}
                  disabled={searchLoading.users}
                />
                <button type="submit" disabled={searchLoading.users}>
                  {searchLoading.users ? 'Searching...' : 'Search'}
                </button>
                <button type="button" onClick={clearUserSearch} disabled={searchLoading.users}>
                  Clear
                </button>
              </form>
              <div className="results-info">
                Showing {users.length} users {searchFilters.userSearch && `(filtered by "${searchFilters.userSearch}")`}
              </div>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Info</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Admin</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-info">
                          <img 
                            src={user.profileImage ? `http://localhost:5000${user.profileImage}` : '/default-avatar.png'} 
                            alt={user.username}
                            className="user-avatar"
                            onError={(e) => {
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                          <div className="user-details">
                            <span className="username">{user.username}</span>
                            <span className="full-name">{user.fullName}</span>
                          </div>
                        </div>
                      </td>
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
                      <td>
                        <div className="date-info">
                          <span className="date">{new Date(user.createdAt).toLocaleDateString()}</span>
                          <span className="time">{new Date(user.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-info">
                          <span className="date">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </span>
                          {user.lastLogin && (
                            <span className="time">{new Date(user.lastLogin).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </td>
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
                              <button 
                                onClick={() => deleteUser(user._id, false)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                              <button 
                                onClick={() => deleteUser(user._id, true)}
                                className="hard-delete-btn"
                                title="Permanently delete from database with all content"
                              >
                                Hard Delete
                              </button>
                            </>
                          )}
                          {user._id === currentUser?.id && (
                            <span className="current-user-badge">Current User</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {searchLoading.users ? 'Searching users...' : 
                         userPagination.loading ? 'Loading users...' : 
                         searchFilters.userSearch ? 'No users found matching your search.' : 
                         'No users available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {userPagination.page < userPagination.totalPages && (
              <div className="load-more-container">
                <button 
                  onClick={loadMoreUsers}
                  className="load-more-btn"
                  disabled={userPagination.loading}
                >
                  {userPagination.loading ? 'Loading...' : 'Load More Users'}
                </button>
                <span className="pagination-info">
                  Page {userPagination.page} of {userPagination.totalPages}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;