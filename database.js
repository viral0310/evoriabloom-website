/**
 * EvoriaBloom - Universal Free Database & Storage Engine
 * Provides persistent local database storage (users, activity logs, statistics)
 * and optional Cloud Webhook synchronization (Google Sheets / REST API)
 * with zero-configuration required.
 */

window.EvoriaDB = (function () {
  const STORAGE_KEY_USERS = 'evoriabloom_db_users';
  const STORAGE_KEY_ACTIVITIES = 'evoriabloom_db_activities';
  const STORAGE_KEY_SESSION = 'evoriabloom_db_current_user';
  const STORAGE_KEY_CLOUD_WEBHOOK = 'evoriabloom_cloud_webhook_url';

  // In-memory cache
  let activitiesCache = null;
  let usersCache = null;

  function _loadJSON(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('EvoriaDB load error:', e);
      return fallback;
    }
  }

  function _saveJSON(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('EvoriaDB save error:', e);
    }
  }

  const ADMIN_EMAIL = 'viraltada2001@gmail.com';

  // Initialize default admin user if none exists
  function init() {
    usersCache = _loadJSON(STORAGE_KEY_USERS, []);
    activitiesCache = _loadJSON(STORAGE_KEY_ACTIVITIES, []);

    if (usersCache.length === 0) {
      usersCache.push({
        uid: 'admin_viraltada',
        displayName: 'Viral Tada (Admin)',
        email: ADMIN_EMAIL,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      _saveJSON(STORAGE_KEY_USERS, usersCache);
    }

    console.info('EvoriaDB initialized. Total stored activities:', activitiesCache.length);
    return true;
  }

  /**
   * Save or update a user in the database
   */
  function saveUser(user) {
    if (!user || !user.email) return;
    init();

    const existingIdx = usersCache.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    const userData = {
      uid: user.uid || 'usr_' + Date.now(),
      displayName: user.displayName || user.email.split('@')[0],
      email: user.email.toLowerCase(),
      photoURL: user.photoURL || '',
      lastLoginAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      usersCache[existingIdx] = { ...usersCache[existingIdx], ...userData };
    } else {
      usersCache.unshift(userData);
    }

    _saveJSON(STORAGE_KEY_USERS, usersCache);
    _saveJSON(STORAGE_KEY_SESSION, userData);
    return userData;
  }

  /**
   * Check if a user has admin privileges (viraltada2001@gmail.com)
   */
  function isAdmin(user) {
    const u = user || getActiveUser();
    return !!(u && u.email && u.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase());
  }

  /**
   * Get currently authenticated user session
   */
  function getActiveUser() {
    return _loadJSON(STORAGE_KEY_SESSION, null);
  }

  /**
   * Set or clear active session
   */
  function setActiveUser(user) {
    if (user) {
      _saveJSON(STORAGE_KEY_SESSION, user);
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }

  /**
   * Log an activity record to the database
   */
  function logActivity(entry) {
    init();

    const now = new Date();
    const record = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: now.toISOString(),
      dateStr: now.toLocaleDateString('en-GB'),
      timeStr: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userEmail: entry.userEmail || (getActiveUser() ? getActiveUser().email : 'anonymous'),
      userName: entry.userName || (getActiveUser() ? getActiveUser().displayName : 'Seller'),
      platform: (entry.platform || 'meesho').toUpperCase(),
      type: entry.type || 'PDF Processing',
      labelCount: Number(entry.labelCount || 0),
      skuCount: Number(entry.skuCount || 0),
      cropLabels: Boolean(entry.cropLabels),
      comboSetting: entry.comboSetting || 'no_preference',
      note: entry.note || ''
    };

    activitiesCache.unshift(record);
    // Keep max 500 records locally
    if (activitiesCache.length > 500) {
      activitiesCache = activitiesCache.slice(0, 500);
    }
    _saveJSON(STORAGE_KEY_ACTIVITIES, activitiesCache);

    // Sync to Cloud Webhook if configured (e.g. Google Sheets)
    _syncToCloudWebhook(record);

    return record;
  }

  /**
   * Sync a record to the Cloud Webhook (e.g. Google Sheet / Serverless DB)
   */
  function _syncToCloudWebhook(record) {
    const webhookUrl = getCloudWebhookUrl();
    if (!webhookUrl || !webhookUrl.startsWith('http')) return;

    try {
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).catch(err => {
        console.warn('Cloud webhook sync note:', err);
      });
    } catch (e) {
      console.warn('Cloud webhook network error:', e);
    }
  }

  /**
   * Get stored activities (Admin sees all, sellers see only their own)
   */
  function getActivities() {
    init();
    const active = getActiveUser();
    if (isAdmin(active)) {
      return activitiesCache;
    }
    if (active && active.email) {
      return activitiesCache.filter(a => (a.userEmail || '').toLowerCase() === active.email.toLowerCase());
    }
    return [];
  }

  /**
   * Get database statistics (Admin sees total across all sellers)
   */
  function getStats() {
    init();
    const active = getActiveUser();
    const list = isAdmin(active)
      ? activitiesCache
      : (active && active.email ? activitiesCache.filter(a => (a.userEmail || '').toLowerCase() === active.email.toLowerCase()) : []);

    const totalBatches = list.length;
    let totalLabels = 0;
    let totalSkus = 0;
    const platformBreakdown = { MEESHO: 0, AMAZON: 0, FLIPKART: 0 };

    list.forEach(a => {
      totalLabels += a.labelCount || 0;
      totalSkus += a.skuCount || 0;
      const p = a.platform ? a.platform.toUpperCase() : 'MEESHO';
      if (platformBreakdown[p] !== undefined) {
        platformBreakdown[p] += a.labelCount || 0;
      }
    });

    return {
      totalBatches,
      totalLabels,
      totalSkus,
      platformBreakdown
    };
  }

  /**
   * Export all database records to CSV (Admin Only)
   */
  function exportToCSV() {
    init();
    const active = getActiveUser();
    if (!isAdmin(active)) {
      alert('⚠️ ડેટાબેઝ એક્સપોર્ટ ફક્ત Admin (viraltada2001@gmail.com) માટે જ ઉપલબ્ધ છે.');
      return;
    }

    if (activitiesCache.length === 0) {
      alert('No database records to export yet.');
      return;
    }

    const headers = ['ID', 'Date', 'Time', 'User Email', 'User Name', 'Platform', 'Type', 'Labels Processed', 'Unique SKUs', 'Crop Invoice', 'Combo Setting'];
    const rows = activitiesCache.map(a => [
      `"${a.id}"`,
      `"${a.dateStr}"`,
      `"${a.timeStr}"`,
      `"${a.userEmail}"`,
      `"${a.userName}"`,
      `"${a.platform}"`,
      `"${a.type}"`,
      a.labelCount,
      a.skuCount,
      a.cropLabels ? 'Yes' : 'No',
      `"${a.comboSetting}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EvoriaBloom_Database_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /**
   * Clear all activities (Admin Only)
   */
  function clearActivities() {
    if (!isAdmin(getActiveUser())) {
      alert('⚠️ Clear History ફક્ત Admin માટે જ ઉપલબ્ધ છે.');
      return;
    }
    activitiesCache = [];
    _saveJSON(STORAGE_KEY_ACTIVITIES, []);
  }

  /**
   * Cloud Webhook getter & setter
   */
  function getCloudWebhookUrl() {
    return localStorage.getItem(STORAGE_KEY_CLOUD_WEBHOOK) || '';
  }

  function setCloudWebhookUrl(url) {
    if (!isAdmin(getActiveUser())) return;
    localStorage.setItem(STORAGE_KEY_CLOUD_WEBHOOK, (url || '').trim());
  }

  // Auto initialize on load
  init();

  return {
    init,
    isAdmin,
    saveUser,
    getActiveUser,
    setActiveUser,
    logActivity,
    getActivities,
    getStats,
    exportToCSV,
    clearActivities,
    getCloudWebhookUrl,
    setCloudWebhookUrl
  };
})();
