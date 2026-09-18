/**
 * EvoriaBloom - Main Application Controller
 * Handles UI interactions, state management, drag & drop, tabs, and PDF operations.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    platform: 'meesho', // 'meesho' | 'amazon' | 'flipkart'
    uploadedFiles: [],
    sourceFiles: [],
    orders: [],
    skuSummary: [], // Array of { sku, count, orders: [] }
    skuOrder: [], // Array of SKU strings in current order
    sortType: 'sku', // 'sku' | 'courier'
    sortBy: 'name', // 'name' | 'count'
    sortDirection: 'asc', // 'asc' | 'desc'
    cropLabels: false,
    trimWhitespace: false,
    dropInvoicePages: true,
    stampSku: false,
    comboSetting: 'no_preference', // 'no_preference' | 'keep_on_top' | 'separate_pdf'
    customMessageEnabled: false,
    customMessageText: 'Thank you for your order! - EvoriaBloom',
    isProcessing: false,
    sortableInstance: null,
    currentUser: null
  };

  // DOM Elements
  const tabMeesho = document.getElementById('tab-meesho');
  const tabAmazon = document.getElementById('tab-amazon');
  const tabFlipkart = document.getElementById('tab-flipkart');

  const heroPlatformTitle = document.getElementById('hero-platform-title');
  const heroDescription = document.getElementById('hero-description');
  const heroWhatIsTitle = document.getElementById('hero-what-is-title');
  const heroWhatIsText = document.getElementById('hero-what-is-text');

  const uploadSection = document.getElementById('upload-section');
  const workspaceSection = document.getElementById('workspace-section');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const selectFileBtn = document.getElementById('select-file-btn');
  const uploadPrepareBtn = document.getElementById('upload-prepare-btn');
  const dropzonePlatformName = document.getElementById('dropzone-platform-name');
  const selectedFilesList = document.getElementById('selected-files-list');
  const trySampleBtn = document.getElementById('try-sample-btn');

  // Auth & Profile Elements
  const authGateCard = document.getElementById('auth-gate-card');
  const uploadCardWrapper = document.getElementById('upload-card-wrapper');
  const gateGoogleLoginBtn = document.getElementById('gate-google-login-btn');
  const navGoogleLoginBtn = document.getElementById('nav-google-login-btn');
  const navUserProfile = document.getElementById('nav-user-profile');
  const navUserAvatar = document.getElementById('nav-user-avatar');
  const navUserName = document.getElementById('nav-user-name');
  const navLogoutBtn = document.getElementById('nav-logout-btn');
  const userBadgeEmail = document.getElementById('user-badge-email');

  // Admin Panel & Database Elements
  const navDatabaseBtn = document.getElementById('nav-database-btn');
  const navDbCountBadge = document.getElementById('nav-db-count-badge');
  const databaseModal = document.getElementById('database-modal');
  const closeDatabaseModalBtn = document.getElementById('close-database-modal-btn');
  const closeDatabaseModalBottomBtn = document.getElementById('close-database-modal-bottom-btn');
  const dbStatTotalUsers = document.getElementById('db-stat-total-users');
  const dbStatTotalLabels = document.getElementById('db-stat-total-labels');
  const dbStatTotalBatches = document.getElementById('db-stat-total-batches');
  const adminTabUsersBtn = document.getElementById('admin-tab-users-btn');
  const adminTabActivitiesBtn = document.getElementById('admin-tab-activities-btn');
  const adminUsersBadgeCount = document.getElementById('admin-users-badge-count');
  const adminActivitiesBadgeCount = document.getElementById('admin-activities-badge-count');
  const adminExportUsersBtn = document.getElementById('admin-export-users-btn');
  const dbExportCsvBtn = document.getElementById('db-export-csv-btn');
  const dbClearHistoryBtn = document.getElementById('db-clear-history-btn');
  const adminViewUsers = document.getElementById('admin-view-users');
  const adminViewActivities = document.getElementById('admin-view-activities');
  const adminUsersTableBody = document.getElementById('admin-users-table-body');
  const dbActivityTableBody = document.getElementById('db-activity-table-body');

  // Firebase Config Modal Elements
  const firebaseConfigModal = document.getElementById('firebase-config-modal');
  const closeFirebaseConfigBtn = document.getElementById('close-firebase-config-btn');
  const cancelFirebaseConfigBtn = document.getElementById('cancel-firebase-config-btn');
  const saveFirebaseConfigBtn = document.getElementById('save-firebase-config-btn');
  const resetFirebaseConfigBtn = document.getElementById('reset-firebase-config-btn');
  const gateFirebaseConfigBtn = document.getElementById('gate-firebase-config-btn');
  const uploadFirebaseConfigBtn = document.getElementById('upload-firebase-config-btn');

  const fbCfgApiKey = document.getElementById('fb-cfg-apiKey');
  const fbCfgAuthDomain = document.getElementById('fb-cfg-authDomain');
  const fbCfgProjectId = document.getElementById('fb-cfg-projectId');
  const fbCfgStorageBucket = document.getElementById('fb-cfg-storageBucket');
  const fbCfgMessagingSenderId = document.getElementById('fb-cfg-messagingSenderId');
  const fbCfgAppId = document.getElementById('fb-cfg-appId');

  // Workspace Stats
  const statLabelsCount = document.getElementById('stat-labels-count');
  const statSkusCount = document.getElementById('stat-skus-count');
  const statCourierBadge = document.getElementById('stat-courier-badge');
  const statCourierCount = document.getElementById('stat-courier-count');

  // Action Buttons
  const startOverBtn = document.getElementById('start-over-btn');
  const generatePdfBtn = document.getElementById('generate-pdf-btn');
  const previewMapBtn = document.getElementById('preview-map-btn');

  // Left Controls
  const sortTypeContainer = document.getElementById('sort-type-container');
  const sortTypeSkuBtn = document.getElementById('sort-type-sku');
  const sortTypeCourierBtn = document.getElementById('sort-type-courier');
  const howSortingWorksBtn = document.getElementById('how-sorting-works-btn');

  const sortByNameBtn = document.getElementById('sort-by-name');
  const sortByCountBtn = document.getElementById('sort-by-count');
  const sortDirAscBtn = document.getElementById('sort-dir-asc');
  const sortDirDescBtn = document.getElementById('sort-dir-desc');

  // Checkboxes
  const meeshoFlipkartCropOptions = document.getElementById('meesho-flipkart-crop-options');
  const amazonCropOptions = document.getElementById('amazon-crop-options');
  const chkCropLabels = document.getElementById('chk-crop-labels');
  const chkTrimWhitespace = document.getElementById('chk-trim-whitespace');
  const chkDropInvoiceStampSku = document.getElementById('chk-drop-invoice-stamp');

  // Combo
  const comboNoPrefBtn = document.getElementById('combo-no-pref');
  const comboKeepTopBtn = document.getElementById('combo-keep-top');
  const comboSeparateBtn = document.getElementById('combo-separate');
  const comboHelperText = document.getElementById('combo-helper-text');

  // Custom Message
  const chkCustomMessage = document.getElementById('chk-custom-message');
  const customMessageInputWrapper = document.getElementById('custom-message-input-wrapper');
  const txtCustomMessage = document.getElementById('txt-custom-message');
  const viewSampleMessageBtn = document.getElementById('view-sample-message-btn');

  // Right Panel
  const skuListContainer = document.getElementById('sku-list-container');
  const skuSearchInput = document.getElementById('sku-search-input');

  // Modals
  const progressModal = document.getElementById('progress-modal');
  const progressModalTitle = document.getElementById('progress-modal-title');
  const progressModalBar = document.getElementById('progress-modal-bar');
  const progressModalStatus = document.getElementById('progress-modal-status');

  const previewModal = document.getElementById('preview-modal');
  const closePreviewModalBtn = document.getElementById('close-preview-modal');
  const previewCanvasContainer = document.getElementById('preview-canvas-container');
  const previewTotalPages = document.getElementById('preview-total-pages');

  const infoModal = document.getElementById('info-modal');
  const infoModalTitle = document.getElementById('info-modal-title');
  const infoModalContent = document.getElementById('info-modal-content');
  const closeInfoModalBtn = document.getElementById('close-info-modal');

  // ==========================================
  // 0. Firebase Authentication & Role-Based Access
  // ==========================================
  const ADMIN_EMAIL = 'viraltada2001@gmail.com';

  function isAdmin(user) {
    if (!user || !user.email) return false;
    return user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
  }

  function updateAuthUI(user) {
    state.currentUser = user;

    if (user) {
      if (window.EvoriaDB) {
        window.EvoriaDB.saveUser(user);
        window.EvoriaDB.setActiveUser(user);
      }

      const userIsAdmin = isAdmin(user);

      if (authGateCard) authGateCard.classList.add('hidden');
      if (uploadCardWrapper) uploadCardWrapper.classList.remove('hidden');
      if (navGoogleLoginBtn) navGoogleLoginBtn.classList.add('hidden');
      if (navUserProfile) navUserProfile.classList.remove('hidden');
      if (navUserAvatar) {
        navUserAvatar.src = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.displayName || user.email || 'Seller')}`;
      }

      if (userIsAdmin) {
        // ADMIN SPECIFIC ACCESS (viraltada2001@gmail.com)
        if (navUserName) navUserName.textContent = '👑 Admin (Viral Tada)';
        if (userBadgeEmail) userBadgeEmail.textContent = `👑 Admin: ${user.email}`;
        // Show Database Button for Admin ONLY
        if (navDatabaseBtn) {
          navDatabaseBtn.classList.remove('hidden');
          navDatabaseBtn.classList.add('flex');
        }
        if (uploadFirebaseConfigBtn) uploadFirebaseConfigBtn.classList.remove('hidden');
        updateDatabaseBadge();
      } else {
        // REGULAR SELLER ACCESS (Any Google user)
        if (navUserName) navUserName.textContent = user.displayName || user.email.split('@')[0];
        if (userBadgeEmail) userBadgeEmail.textContent = user.email;
        // HIDE Database Button completely from regular users
        if (navDatabaseBtn) {
          navDatabaseBtn.classList.add('hidden');
          navDatabaseBtn.classList.remove('flex');
        }
        if (uploadFirebaseConfigBtn) uploadFirebaseConfigBtn.classList.add('hidden');
      }
    } else {
      // LOGGED OUT STATE
      if (authGateCard) authGateCard.classList.remove('hidden');
      if (uploadCardWrapper) uploadCardWrapper.classList.add('hidden');
      if (navGoogleLoginBtn) navGoogleLoginBtn.classList.remove('hidden');
      if (navUserProfile) navUserProfile.classList.add('hidden');
      if (navDatabaseBtn) {
        navDatabaseBtn.classList.add('hidden');
        navDatabaseBtn.classList.remove('flex');
      }
      if (userBadgeEmail) userBadgeEmail.textContent = '';

      // If user was inside workspace, kick back to upload section to enforce login gate
      if (workspaceSection && !workspaceSection.classList.contains('hidden')) {
        workspaceSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        state.orders = [];
        state.uploadedFiles = [];
        state.sourceFiles = [];
        if (selectedFilesList) {
          selectedFilesList.classList.add('hidden');
          selectedFilesList.innerHTML = '';
        }
        if (uploadPrepareBtn) {
          uploadPrepareBtn.disabled = true;
          uploadPrepareBtn.className = 'mt-5 w-full py-3.5 px-6 rounded-xl font-semibold text-slate-400 bg-slate-200 transition-all cursor-not-allowed text-sm';
        }
      }
    }
  }

  // Initialize Firebase Auth
  if (window.EvoriaAuth) {
    window.EvoriaAuth.init();
    window.EvoriaAuth.onAuthChange(user => {
      updateAuthUI(user);
    });
  }

  // Login Handlers (All Google users welcome - Mobile Redirect & Desktop Popup)
  async function triggerGoogleLogin() {
    if (!window.EvoriaAuth) return;
    const originalText = gateGoogleLoginBtn ? gateGoogleLoginBtn.innerHTML : '';
    try {
      if (gateGoogleLoginBtn) {
        gateGoogleLoginBtn.disabled = true;
        gateGoogleLoginBtn.classList.add('opacity-75', 'cursor-wait');
      }
      showToast('📱 Initiating Google Sign-In...');
      const user = await window.EvoriaAuth.loginWithGoogle();
      if (user) {
        updateAuthUI(user);
        if (isAdmin(user)) {
          showToast(`👑 Welcome, Viral Tada! Admin Access Unlocked.`);
        } else {
          showToast(`👋 Welcome, ${user.displayName || 'Seller'}! Tool unlocked.`);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      if (gateGoogleLoginBtn) {
        gateGoogleLoginBtn.disabled = false;
        gateGoogleLoginBtn.classList.remove('opacity-75', 'cursor-wait');
      }
    }
  }

  if (gateGoogleLoginBtn) gateGoogleLoginBtn.addEventListener('click', triggerGoogleLogin);
  if (navGoogleLoginBtn) navGoogleLoginBtn.addEventListener('click', triggerGoogleLogin);

  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async () => {
      if (window.EvoriaAuth) {
        await window.EvoriaAuth.logout();
      }
      if (window.EvoriaDB) {
        window.EvoriaDB.setActiveUser(null);
      }
      updateAuthUI(null);
      showToast('Successfully logged out.');
    });
  }

  // ==========================================
  // Admin Panel & History Controllers
  // ==========================================
  function updateDatabaseBadge() {
    if (!window.EvoriaDB || !navDbCountBadge) return;
    const stats = window.EvoriaDB.getStats();
    navDbCountBadge.textContent = `${stats.totalUsers || 1} Users`;
  }

  function switchAdminTab(tab) {
    if (tab === 'users') {
      if (adminTabUsersBtn) {
        adminTabUsersBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 transition-all';
      }
      if (adminTabActivitiesBtn) {
        adminTabActivitiesBtn.className = 'px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-all';
      }
      if (adminViewUsers) adminViewUsers.classList.remove('hidden');
      if (adminViewActivities) adminViewActivities.classList.add('hidden');
    } else {
      if (adminTabActivitiesBtn) {
        adminTabActivitiesBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 transition-all';
      }
      if (adminTabUsersBtn) {
        adminTabUsersBtn.className = 'px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-all';
      }
      if (adminViewActivities) adminViewActivities.classList.remove('hidden');
      if (adminViewUsers) adminViewUsers.classList.add('hidden');
    }
  }

  async function openDatabaseModal() {
    if (!isAdmin(state.currentUser)) {
      alert(`⚠️ This Admin Panel is exclusively accessible to Admin (${ADMIN_EMAIL}).`);
      return;
    }
    if (!window.EvoriaDB || !databaseModal) return;

    let users = window.EvoriaDB.getUsers();
    let activities = window.EvoriaDB.getActivities();

    // Fetch from Firestore if connected to get cloud registered users
    if (window.EvoriaAuth && window.EvoriaAuth.fetchAllUsers) {
      try {
        const firestoreUsers = await window.EvoriaAuth.fetchAllUsers();
        if (firestoreUsers && firestoreUsers.length > 0) {
          firestoreUsers.forEach(fu => {
            if (!users.some(u => (u.email || '').toLowerCase() === (fu.email || '').toLowerCase())) {
              users.push({
                displayName: fu.displayName,
                email: fu.email,
                photoURL: fu.photoURL || '',
                role: (fu.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'seller',
                lastLoginAt: fu.lastLoginAt ? new Date(fu.lastLoginAt.toDate ? fu.lastLoginAt.toDate() : fu.lastLoginAt).toISOString() : new Date().toISOString()
              });
            }
          });
        }
      } catch (e) {}
    }

    // Fetch from Firestore if connected to get cloud activities (what PDFs are used)
    if (window.EvoriaAuth && window.EvoriaAuth.fetchAllActivities) {
      try {
        const cloudActs = await window.EvoriaAuth.fetchAllActivities();
        if (cloudActs && cloudActs.length > 0) {
          cloudActs.forEach(ca => {
            if (!activities.some(a => a.id === ca.id)) {
              const dt = ca.timestamp && ca.timestamp.toDate ? ca.timestamp.toDate() : new Date();
              activities.unshift({
                id: ca.id,
                dateStr: ca.timestampStr ? ca.timestampStr.split(',')[0] : dt.toLocaleDateString('en-GB'),
                timeStr: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                userEmail: ca.userEmail || '',
                userName: ca.userName || 'Seller',
                platform: (ca.platform || 'meesho').toUpperCase(),
                fileName: ca.fileName || 'Labels.pdf',
                labelCount: ca.labelCount || ca.totalLabels || 0,
                skuCount: ca.skuCount || 0,
                type: ca.type || 'PDF Processing'
              });
            }
          });
        }
      } catch (e) {}
    }

    const stats = window.EvoriaDB.getStats();

    if (dbStatTotalUsers) dbStatTotalUsers.textContent = users.length;
    if (dbStatTotalLabels) dbStatTotalLabels.textContent = stats.totalLabels;
    if (dbStatTotalBatches) dbStatTotalBatches.textContent = stats.totalBatches;
    if (adminUsersBadgeCount) adminUsersBadgeCount.textContent = users.length;
    if (adminActivitiesBadgeCount) adminActivitiesBadgeCount.textContent = activities.length;

    // Render Tab 1: Registered Users Table
    if (adminUsersTableBody) {
      if (users.length === 0) {
        adminUsersTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-400">No registered sellers found.</td>
          </tr>
        `;
      } else {
        adminUsersTableBody.innerHTML = users.map(u => {
          const isUserAdmin = (u.email || '').toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
          const roleBadge = isUserAdmin
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">👑 Admin</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Seller</span>`;

          const avatarUrl = u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.displayName || u.email || 'User')}`;
          const lastActiveStr = u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : (u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Recent');

          return `
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-2.5 flex items-center gap-2">
                <img src="${avatarUrl}" class="w-6 h-6 rounded-full border border-slate-200 object-cover" alt="User">
                <span class="font-bold text-slate-900 truncate max-w-[140px]">${u.displayName || 'Seller'}</span>
              </td>
              <td class="p-2.5 font-mono text-[11px] text-slate-600">${u.email || ''}</td>
              <td class="p-2.5">${roleBadge}</td>
              <td class="p-2.5 text-slate-400 text-[11px]">${lastActiveStr}</td>
              <td class="p-2.5 text-center font-bold text-slate-900">${u.totalLabels || 0}</td>
              <td class="p-2.5 text-center font-mono text-slate-600">${u.totalBatches || 0}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Tab 2: Activity Logs Table (What PDFs are being used)
    if (dbActivityTableBody) {
      if (activities.length === 0) {
        dbActivityTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="p-8 text-center text-slate-400">
              No label batches processed yet. Upload and crop labels to see records here!
            </td>
          </tr>
        `;
      } else {
        dbActivityTableBody.innerHTML = activities
          .map(a => {
            let badgeColor = 'bg-pink-100 text-pink-700';
            if (a.platform === 'AMAZON') badgeColor = 'bg-amber-100 text-amber-800';
            if (a.platform === 'FLIPKART') badgeColor = 'bg-blue-100 text-blue-700';

            return `
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">${a.dateStr} <span class="text-slate-400">${a.timeStr}</span></td>
                <td class="p-2.5 text-slate-700 text-xs truncate max-w-[140px]" title="${a.userEmail}">
                  <div class="font-bold text-slate-900 truncate">${a.userName || 'Seller'}</div>
                  <div class="text-[10px] font-mono text-slate-400 truncate">${a.userEmail || ''}</div>
                </td>
                <td class="p-2.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}">${a.platform}</span></td>
                <td class="p-2.5 text-slate-700 text-[11px] font-mono truncate max-w-[140px]" title="${a.fileName || 'Labels.pdf'}">
                  📄 ${a.fileName || 'Labels.pdf'}
                </td>
                <td class="p-2.5 text-center font-bold text-slate-900">${a.labelCount}</td>
                <td class="p-2.5 text-center font-mono text-slate-600">${a.skuCount}</td>
                <td class="p-2.5 text-slate-600 text-[11px] font-medium">${a.type}</td>
              </tr>
            `;
          })
          .join('');
      }
    }

    switchAdminTab('users');
    databaseModal.classList.remove('hidden');
  }

  function closeDatabaseModal() {
    if (databaseModal) databaseModal.classList.add('hidden');
  }

  if (navDatabaseBtn) navDatabaseBtn.addEventListener('click', openDatabaseModal);
  if (closeDatabaseModalBtn) closeDatabaseModalBtn.addEventListener('click', closeDatabaseModal);
  if (closeDatabaseModalBottomBtn) closeDatabaseModalBottomBtn.addEventListener('click', closeDatabaseModal);

  if (adminTabUsersBtn) {
    adminTabUsersBtn.addEventListener('click', () => switchAdminTab('users'));
  }
  if (adminTabActivitiesBtn) {
    adminTabActivitiesBtn.addEventListener('click', () => switchAdminTab('activities'));
  }

  if (adminExportUsersBtn) {
    adminExportUsersBtn.addEventListener('click', () => {
      if (window.EvoriaDB) window.EvoriaDB.exportUsersCSV();
    });
  }

  if (dbExportCsvBtn) {
    dbExportCsvBtn.addEventListener('click', () => {
      if (window.EvoriaDB) window.EvoriaDB.exportToCSV();
    });
  }

  if (dbClearHistoryBtn) {
    dbClearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all stored PDF processing records?')) {
        if (window.EvoriaDB) {
          window.EvoriaDB.clearActivities();
          openDatabaseModal();
          updateDatabaseBadge();
          showToast('PDF processing history cleared.');
        }
      }
    });
  }

  // Check saved session on load
  if (window.EvoriaDB) {
    const savedUser = window.EvoriaDB.getActiveUser();
    if (savedUser) {
      updateAuthUI(savedUser);
    }
    updateDatabaseBadge();
  }

  // Firebase Config Modal Handlers
  function openFirebaseConfigModal() {
    if (!isAdmin(state.currentUser)) {
      alert(`⚠️ Firebase Settings can only be modified by Admin (${ADMIN_EMAIL}).`);
      return;
    }
    if (!window.EvoriaFirebaseConfig || !firebaseConfigModal) return;
    const cfg = window.EvoriaFirebaseConfig.getConfig();
    if (fbCfgApiKey) fbCfgApiKey.value = cfg.apiKey || '';
    if (fbCfgAuthDomain) fbCfgAuthDomain.value = cfg.authDomain || '';
    if (fbCfgProjectId) fbCfgProjectId.value = cfg.projectId || '';
    if (fbCfgStorageBucket) fbCfgStorageBucket.value = cfg.storageBucket || '';
    if (fbCfgMessagingSenderId) fbCfgMessagingSenderId.value = cfg.messagingSenderId || '';
    if (fbCfgAppId) fbCfgAppId.value = cfg.appId || '';
    firebaseConfigModal.classList.remove('hidden');
  }

  function closeFirebaseConfigModal() {
    if (firebaseConfigModal) firebaseConfigModal.classList.add('hidden');
  }

  if (gateFirebaseConfigBtn) gateFirebaseConfigBtn.addEventListener('click', openFirebaseConfigModal);
  if (uploadFirebaseConfigBtn) uploadFirebaseConfigBtn.addEventListener('click', openFirebaseConfigModal);
  if (closeFirebaseConfigBtn) closeFirebaseConfigBtn.addEventListener('click', closeFirebaseConfigModal);
  if (cancelFirebaseConfigBtn) cancelFirebaseConfigBtn.addEventListener('click', closeFirebaseConfigModal);

  if (saveFirebaseConfigBtn) {
    saveFirebaseConfigBtn.addEventListener('click', () => {
      const newCfg = {
        apiKey: fbCfgApiKey.value.trim(),
        authDomain: fbCfgAuthDomain.value.trim(),
        projectId: fbCfgProjectId.value.trim(),
        storageBucket: fbCfgStorageBucket.value.trim(),
        messagingSenderId: fbCfgMessagingSenderId.value.trim(),
        appId: fbCfgAppId.value.trim()
      };

      if (!newCfg.apiKey || !newCfg.projectId) {
        alert('Please enter both API Key and Project ID.');
        return;
      }

      window.EvoriaFirebaseConfig.setCustomConfig(newCfg);
      closeFirebaseConfigModal();
      showToast('✅ Firebase Configuration Saved! Re-connecting...');
      if (window.EvoriaAuth) {
        window.EvoriaAuth.init();
      }
    });
  }

  if (resetFirebaseConfigBtn) {
    resetFirebaseConfigBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to restore default Firebase settings?')) {
        localStorage.removeItem('evoriabloom_firebase_config');
        openFirebaseConfigModal();
        showToast('Default settings restored.');
      }
    });
  }

  // Platform Content Dictionary
  const platformContent = {
    meesho: {
      name: 'Meesho',
      title: 'Free Meesho Label Crop & Sort Tool',
      description:
        'Every Meesho seller faces the same daily problem: shipping label PDFs include both the shipping label and tax invoice on the same page. EvoriaBloom helps you crop Meesho labels away from the invoice section, sort labels by SKU or courier partner, and download a clean, print-ready file for free with no signup needed.',
      whatIsTitle: "What is EvoriaBloom's Meesho Label Crop Tool?",
      whatIsText:
        'It is a free Meesho label crop tool: it crops the shipping label away from the tax invoice, sorts labels by SKU or courier partner (Delhivery, Shadowfax, Xpressbees, Valmo), and exports a clean PDF ready for thermal or A4 printing.'
    },
    amazon: {
      name: 'Amazon',
      title: 'Free Amazon Label Crop & Sort Tool',
      description:
        'Every Amazon seller knows the problem: Seller Central label PDFs can include shipping labels, tax invoice pages, and packing slips in one file. EvoriaBloom removes invoice pages, sorts Amazon labels by SKU, stamps SKU and quantity on every label, and gives you a clean print-ready PDF for free with no signup needed.',
      whatIsTitle: "What is EvoriaBloom's Amazon Label Crop Tool?",
      whatIsText:
        'It removes tax invoice and packing slip pages, stamps SKU and quantity on each label, sorts labels by SKU, and exports a clean PDF ready for thermal or A4 printing.'
    },
    flipkart: {
      name: 'Flipkart',
      title: 'Free Flipkart Label Crop & Sort Tool',
      description:
        'Flipkart shipping label PDFs often bundle the label with an invoice block on the same page, so every page has to be trimmed by hand before it can be printed cleanly. EvoriaBloom is a free Flipkart label crop tool: a quick label crop that removes the invoice, sorts labels by SKU, and downloads a print-ready PDF for thermal or A4 printers with no signup needed.',
      whatIsTitle: "What is EvoriaBloom's Flipkart Label Crop Tool?",
      whatIsText:
        "It's a free Flipkart label crop tool for a quick label crop: it crops the shipping label away from the invoice, sorts labels by SKU, and exports a clean PDF ready for thermal or A4 printing."
    }
  };

  // ==========================================
  // 1. Platform Switching Logic
  // ==========================================
  function switchPlatform(newPlatform) {
    state.platform = newPlatform;

    // Update active tab buttons
    [tabMeesho, tabAmazon, tabFlipkart].forEach(btn => {
      btn.className = 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all';
    });

    if (newPlatform === 'meesho') {
      tabMeesho.className = 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold active-meesho';
    } else if (newPlatform === 'amazon') {
      tabAmazon.className = 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold active-amazon';
    } else if (newPlatform === 'flipkart') {
      tabFlipkart.className = 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold active-flipkart';
    }

    // Update copy
    const info = platformContent[newPlatform];
    heroPlatformTitle.textContent = info.title;
    heroDescription.textContent = info.description;
    heroWhatIsTitle.textContent = info.whatIsTitle;
    heroWhatIsText.textContent = info.whatIsText;
    dropzonePlatformName.textContent = info.name;

    // Platform-specific options toggling
    if (newPlatform === 'amazon') {
      sortTypeContainer.classList.add('hidden');
      meeshoFlipkartCropOptions.classList.add('hidden');
      amazonCropOptions.classList.remove('hidden');
      state.stampSku = chkDropInvoiceStampSku.checked;
      state.dropInvoicePages = chkDropInvoiceStampSku.checked;
      state.cropLabels = false;
    } else {
      sortTypeContainer.classList.remove('hidden');
      meeshoFlipkartCropOptions.classList.remove('hidden');
      amazonCropOptions.classList.add('hidden');
      state.cropLabels = chkCropLabels.checked;
      state.trimWhitespace = chkTrimWhitespace.checked;
      state.stampSku = false;
    }
  }

  tabMeesho.addEventListener('click', () => switchPlatform('meesho'));
  tabAmazon.addEventListener('click', () => switchPlatform('amazon'));
  tabFlipkart.addEventListener('click', () => switchPlatform('flipkart'));

  // ==========================================
  // 2. Drag & Drop and File Handling
  // ==========================================
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleSelectedFiles(Array.from(files));
  });

  selectFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    handleSelectedFiles(Array.from(e.target.files));
  });

  function handleSelectedFiles(files) {
    if (!state.currentUser) {
      alert('Please Sign In with Google first. EvoriaBloom tools require a free login.');
      triggerGoogleLogin();
      return;
    }

    const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      alert('Please select valid PDF shipping label files.');
      return;
    }

    state.uploadedFiles = pdfFiles;
    renderSelectedFilesList();

    uploadPrepareBtn.disabled = false;
    uploadPrepareBtn.className =
      'w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer';
  }

  function renderSelectedFilesList() {
    if (state.uploadedFiles.length === 0) {
      selectedFilesList.classList.add('hidden');
      selectedFilesList.innerHTML = '';
      return;
    }

    selectedFilesList.classList.remove('hidden');
    selectedFilesList.innerHTML = `
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selected Files (${state.uploadedFiles.length})</div>
        <div class="space-y-1.5 max-h-32 overflow-y-auto">
          ${state.uploadedFiles
            .map(
              (f, idx) => `
            <div class="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded border border-slate-100">
              <span class="truncate max-w-[200px] font-medium">${f.name}</span>
              <span class="text-slate-400 font-mono">${(f.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  uploadPrepareBtn.addEventListener('click', async () => {
    if (!state.currentUser) {
      alert('Please Sign In with Google first to process labels.');
      triggerGoogleLogin();
      return;
    }
    if (state.uploadedFiles.length === 0) return;
    await processUploadedPdfFiles();
  });

  // ==========================================
  // 3. Demo / Sample Labels Generator
  // ==========================================
  trySampleBtn.addEventListener('click', async () => {
    if (!state.currentUser) {
      alert('Please Sign In with Google first. EvoriaBloom tools require a free login.');
      triggerGoogleLogin();
      return;
    }

    showProgress('Creating Sample Label PDF...', 10, 'Generating realistic sample labels for testing...');

    try {
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      const sampleData = [
        { sku: 'CHARWEE_114', courier: 'Delhivery', city: 'Surat', qty: 1 },
        { sku: 'NEW PX EMIRATES 48', courier: 'Shadowfax', city: 'Mumbai', qty: 1 },
        { sku: 'CHARWEE_114', courier: 'Delhivery', city: 'Ahmedabad', qty: 2 },
        { sku: 'uvidox single 1', courier: 'Xpressbees', city: 'Jaipur', qty: 1 },
        { sku: 'avo nw 20', courier: 'Delhivery', city: 'Delhi', qty: 1 },
        { sku: 'uvidox single 20', courier: 'Valmo', city: 'Bengaluru', qty: 1 }
      ];

      for (let i = 0; i < sampleData.length; i++) {
        const item = sampleData[i];
        // Standard A4 page: 595 x 842 pt
        const page = doc.addPage([595, 842]);
        const w = 595;
        const h = 842;

        // Draw top half: Shipping Label
        page.drawRectangle({
          x: 20,
          y: 430,
          width: w - 40,
          height: 390,
          borderColor: rgb(0.1, 0.1, 0.1),
          borderWidth: 1.5,
          color: rgb(1, 1, 1)
        });

        // Platform Header Banner
        page.drawRectangle({
          x: 20,
          y: 775,
          width: w - 40,
          height: 45,
          color: state.platform === 'meesho' ? rgb(0.55, 0.1, 0.35) : rgb(0.1, 0.3, 0.8)
        });

        page.drawText(`${state.platform.toUpperCase()} SHIPPING LABEL`, {
          x: 40,
          y: 790,
          size: 16,
          font: font,
          color: rgb(1, 1, 1)
        });

        // Barcode placeholder simulation
        for (let b = 0; b < 45; b++) {
          const bw = (b % 3 === 0 ? 3.5 : 1.5);
          page.drawRectangle({
            x: 40 + b * 6.5,
            y: 690,
            width: bw,
            height: 50,
            color: rgb(0, 0, 0)
          });
        }
        page.drawText(`AWB: EVB${10000000 + i * 4321}`, {
          x: 40,
          y: 675,
          size: 11,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2)
        });

        // Courier Partner info
        page.drawText(`Courier Partner: ${item.courier}`, {
          x: 350,
          y: 710,
          size: 14,
          font: font,
          color: rgb(0.05, 0.1, 0.3)
        });
        page.drawText(`Destination: ${item.city}`, {
          x: 350,
          y: 690,
          size: 11,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3)
        });

        // Product Details box inside shipping label
        page.drawRectangle({
          x: 35,
          y: 445,
          width: w - 70,
          height: 100,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
          color: rgb(0.97, 0.98, 0.99)
        });

        page.drawText(`Order ID: ORD-${202600 + i}`, { x: 50, y: 520, size: 10, font: fontRegular });
        page.drawText(`SKU: ${item.sku}`, { x: 50, y: 495, size: 13, font: font, color: rgb(0, 0, 0) });
        page.drawText(`Qty: ${item.qty}`, { x: 50, y: 470, size: 11, font: font, color: item.qty > 1 ? rgb(0.8, 0.2, 0.2) : rgb(0, 0, 0) });
        page.drawText(`Customer: Verified Buyer - ${item.city}`, { x: 320, y: 495, size: 10, font: fontRegular });

        // Draw dotted separator between Shipping Label and Tax Invoice
        for (let dot = 20; dot < w - 20; dot += 15) {
          page.drawText('-', { x: dot, y: 415, size: 12, font: fontRegular, color: rgb(0.6, 0.6, 0.6) });
        }
        page.drawText('--- TEAR HERE (TAX INVOICE SECTION BELOW) ---', {
          x: 180,
          y: 415,
          size: 9,
          font: fontRegular,
          color: rgb(0.5, 0.5, 0.5)
        });

        // Bottom Half: Tax Invoice (This will be cropped away!)
        page.drawRectangle({
          x: 20,
          y: 20,
          width: w - 40,
          height: 380,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 1,
          color: rgb(0.99, 0.99, 0.99)
        });

        page.drawText('TAX INVOICE / BILL OF SUPPLY', {
          x: 40,
          y: 370,
          size: 12,
          font: font,
          color: rgb(0.3, 0.3, 0.3)
        });
        page.drawText(`Invoice No: INV-2026-${1000 + i}`, { x: 40, y: 345, size: 9, font: fontRegular });
        page.drawText('Sold By: EvoriaBloom Apparels & Lifestyle', { x: 40, y: 330, size: 9, font: fontRegular });
        page.drawText('GSTIN: 24AAAFE1234F1Z5', { x: 40, y: 315, size: 9, font: fontRegular });
        page.drawText(`Invoice Amount: Rs. ${499 * item.qty}.00`, { x: 40, y: 295, size: 10, font: font });
      }

      const pdfBytes = await doc.save();
      const sampleBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const sampleFile = new File([sampleBlob], `EvoriaBloom_${state.platform}_Sample_Labels.pdf`, {
        type: 'application/pdf'
      });

      state.uploadedFiles = [sampleFile];
      renderSelectedFilesList();
      hideProgress();
      await processUploadedPdfFiles();
    } catch (err) {
      console.error('Error creating sample PDF:', err);
      hideProgress();
      alert('Could not generate sample PDF: ' + err.message);
    }
  });

  // ==========================================
  // 4. PDF Processing & Extraction
  // ==========================================
  async function processUploadedPdfFiles() {
    showProgress('Reading Shipping Labels...', 15, 'Extracting SKUs, quantities, and courier info...');

    try {
      const result = await window.EvoriaPDF.parseFiles(
        state.uploadedFiles,
        state.platform,
        (current, total, msg) => {
          const pct = Math.min(95, Math.round((current / total) * 80) + 15);
          updateProgress(pct, msg);
        }
      );

      state.orders = result.orders;
      state.sourceFiles = result.sourceFiles;

      // Group by SKU
      buildSkuSummary();

      hideProgress();
      showWorkspace();
    } catch (err) {
      console.error('Error parsing PDF:', err);
      hideProgress();
      alert('Failed to parse PDF files. Error: ' + err.message);
    }
  }

  function buildSkuSummary() {
    const map = new Map();
    state.orders.forEach(ord => {
      // Don't count invoice pages in Amazon mode
      if (state.platform === 'amazon' && state.dropInvoicePages && ord.isInvoice) {
        return;
      }

      const s = ord.sku;
      if (!map.has(s)) {
        map.set(s, { sku: s, count: 0, orders: [] });
      }
      const item = map.get(s);
      item.count++;
      item.orders.push(ord);
    });

    state.skuSummary = Array.from(map.values());

    // Initial SKU ordering
    applySorting();
  }

  function applySorting() {
    if (state.sortBy === 'name') {
      state.skuSummary.sort((a, b) => {
        return state.sortDirection === 'asc'
          ? a.sku.localeCompare(b.sku)
          : b.sku.localeCompare(a.sku);
      });
    } else if (state.sortBy === 'count') {
      state.skuSummary.sort((a, b) => {
        return state.sortDirection === 'asc'
          ? a.count - b.count
          : b.count - a.count;
      });
    }

    state.skuOrder = state.skuSummary.map(i => i.sku);
    renderSkuList();
  }

  // ==========================================
  // 5. Workspace UI Updates
  // ==========================================
  function showWorkspace() {
    uploadSection.classList.add('hidden');
    workspaceSection.classList.remove('hidden');

    // Smooth scroll to workspace
    workspaceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update Stats
    const validOrders = state.orders.filter(o => !(state.platform === 'amazon' && state.dropInvoicePages && o.isInvoice));
    statLabelsCount.textContent = `${validOrders.length} labels`;
    statSkusCount.textContent = `${state.skuSummary.length} unique SKUs`;

    // Courier count (Meesho)
    const couriers = new Set(validOrders.map(o => o.courier));
    statCourierCount.textContent = `${couriers.size} courier partners`;

    if (state.platform === 'meesho') {
      statCourierBadge.classList.remove('hidden');
    } else {
      statCourierBadge.classList.add('hidden');
    }

    renderSkuList();
    initSortable();
  }

  function renderSkuList(filterText = '') {
    skuListContainer.innerHTML = '';

    const query = filterText.toLowerCase().trim();
    const filteredItems = state.skuSummary.filter(item =>
      item.sku.toLowerCase().includes(query)
    );

    if (filteredItems.length === 0) {
      skuListContainer.innerHTML = `
        <div class="py-10 text-center text-slate-400 text-sm">
          No SKUs matching "${filterText}"
        </div>
      `;
      return;
    }

    filteredItems.forEach((item, index) => {
      const el = document.createElement('div');
      el.className =
        'sku-item flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing';
      el.dataset.sku = item.sku;

      el.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-slate-400 text-lg cursor-grab hover:text-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
            </svg>
          </span>
          <span class="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono">
            ${index + 1}
          </span>
          <div class="min-w-0">
            <div class="font-semibold text-slate-800 text-sm truncate max-w-[280px]" title="${item.sku}">
              ${item.sku}
            </div>
            <div class="text-[11px] text-slate-400">
              ${item.orders.length > 0 && item.orders[0].courier ? item.orders[0].courier : 'Standard Delivery'}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
            ${item.count} ${item.count === 1 ? 'label' : 'labels'}
          </span>
          <button class="remove-sku-btn p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" title="Exclude this SKU">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      `;

      // Remove / exclude button
      el.querySelector('.remove-sku-btn').addEventListener('click', e => {
        e.stopPropagation();
        removeSku(item.sku);
      });

      skuListContainer.appendChild(el);
    });
  }

  function initSortable() {
    if (state.sortableInstance) {
      state.sortableInstance.destroy();
    }

    if (window.Sortable) {
      state.sortableInstance = new window.Sortable(skuListContainer, {
        animation: 180,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        handle: '.sku-item',
        onEnd: () => {
          // Update skuOrder array based on DOM order
          const items = skuListContainer.querySelectorAll('.sku-item');
          const newOrder = [];
          items.forEach((it, idx) => {
            newOrder.push(it.dataset.sku);
            const indexBadge = it.querySelector('.font-mono');
            if (indexBadge) indexBadge.textContent = idx + 1;
          });
          state.skuOrder = newOrder;
        }
      });
    }
  }

  function removeSku(skuToRemove) {
    state.skuSummary = state.skuSummary.filter(item => item.sku !== skuToRemove);
    state.skuOrder = state.skuOrder.filter(s => s !== skuToRemove);
    renderSkuList(skuSearchInput.value);
    statSkusCount.textContent = `${state.skuSummary.length} unique SKUs`;
  }

  // SKU Search filter
  skuSearchInput.addEventListener('input', e => {
    renderSkuList(e.target.value);
  });

  // ==========================================
  // 6. Sorting & Option Controls
  // ==========================================
  sortTypeSkuBtn.addEventListener('click', () => {
    state.sortType = 'sku';
    sortTypeSkuBtn.className =
      'flex-1 py-2 rounded-lg text-sm font-semibold bg-white text-blue-700 shadow-sm border border-slate-200/80 transition-all';
    sortTypeCourierBtn.className =
      'flex-1 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 transition-all';
  });

  sortTypeCourierBtn.addEventListener('click', () => {
    state.sortType = 'courier';
    sortTypeCourierBtn.className =
      'flex-1 py-2 rounded-lg text-sm font-semibold bg-white text-blue-700 shadow-sm border border-slate-200/80 transition-all';
    sortTypeSkuBtn.className =
      'flex-1 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 transition-all';
  });

  // Sort by Name vs Count
  sortByNameBtn.addEventListener('click', () => {
    state.sortBy = 'name';
    sortByNameBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-700 shadow-sm border border-slate-200';
    sortByCountBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900';
    applySorting();
  });

  sortByCountBtn.addEventListener('click', () => {
    state.sortBy = 'count';
    sortByCountBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-700 shadow-sm border border-slate-200';
    sortByNameBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900';
    applySorting();
  });

  // Sort Direction
  sortDirAscBtn.addEventListener('click', () => {
    state.sortDirection = 'asc';
    sortDirAscBtn.className = 'p-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200';
    sortDirDescBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-slate-700';
    applySorting();
  });

  sortDirDescBtn.addEventListener('click', () => {
    state.sortDirection = 'desc';
    sortDirDescBtn.className = 'p-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200';
    sortDirAscBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-slate-700';
    applySorting();
  });

  // Checkboxes
  chkCropLabels.addEventListener('change', e => {
    state.cropLabels = e.target.checked;
  });

  chkTrimWhitespace.addEventListener('change', e => {
    state.trimWhitespace = e.target.checked;
  });

  chkDropInvoiceStampSku.addEventListener('change', e => {
    state.dropInvoicePages = e.target.checked;
    state.stampSku = e.target.checked;
  });

  // Combo Orders Segmented Buttons
  function updateComboButtons(active) {
    state.comboSetting = active;
    [comboNoPrefBtn, comboKeepTopBtn, comboSeparateBtn].forEach(btn => {
      btn.className = 'flex-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-all';
    });

    if (active === 'no_preference') {
      comboNoPrefBtn.className = 'flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-sm';
      comboHelperText.textContent = 'Combos mixed in normally with single-qty orders.';
    } else if (active === 'keep_on_top') {
      comboKeepTopBtn.className = 'flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-sm';
      comboHelperText.textContent = 'Multi-quantity & combo orders will be placed at the very top of your print file.';
    } else if (active === 'separate_pdf') {
      comboSeparateBtn.className = 'flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-sm';
      comboHelperText.textContent = 'Combos will be separated into a distinct section for easy batching.';
    }
  }

  comboNoPrefBtn.addEventListener('click', () => updateComboButtons('no_preference'));
  comboKeepTopBtn.addEventListener('click', () => updateComboButtons('keep_on_top'));
  comboSeparateBtn.addEventListener('click', () => updateComboButtons('separate_pdf'));

  // Custom Message
  chkCustomMessage.addEventListener('change', e => {
    state.customMessageEnabled = e.target.checked;
    if (e.target.checked) {
      customMessageInputWrapper.classList.remove('hidden');
    } else {
      customMessageInputWrapper.classList.add('hidden');
    }
  });

  txtCustomMessage.addEventListener('input', e => {
    state.customMessageText = e.target.value;
  });

  // Start Over Button
  startOverBtn.addEventListener('click', () => {
    if (confirm('Start over and upload fresh shipping labels?')) {
      state.uploadedFiles = [];
      state.sourceFiles = [];
      state.orders = [];
      state.skuSummary = [];
      state.skuOrder = [];
      fileInput.value = '';
      renderSelectedFilesList();
      uploadPrepareBtn.disabled = true;
      uploadPrepareBtn.className =
        'w-full py-3.5 px-6 rounded-xl font-semibold text-slate-400 bg-slate-200 transition-all cursor-not-allowed';

      workspaceSection.classList.add('hidden');
      uploadSection.classList.remove('hidden');
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // ==========================================
  // 7. Preview Map Modal
  // ==========================================
  previewMapBtn.addEventListener('click', async () => {
    const validOrders = state.orders.filter(o => !(state.platform === 'amazon' && state.dropInvoicePages && o.isInvoice));
    if (validOrders.length === 0) {
      alert('No labels available to preview.');
      return;
    }

    previewModal.classList.remove('hidden');
    previewTotalPages.textContent = `${validOrders.length} labels in total`;
    previewCanvasContainer.innerHTML = `
      <div class="py-12 flex flex-col items-center justify-center text-slate-400">
        <div class="spinner w-8 h-8 border-blue-600 mb-3"></div>
        <div class="text-sm font-medium">Generating visual preview...</div>
      </div>
    `;

    // Render first 6 labels as preview cards
    const previewCount = Math.min(6, validOrders.length);
    previewCanvasContainer.innerHTML = '';

    for (let i = 0; i < previewCount; i++) {
      const ord = validOrders[i];
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center';

      const canvas = document.createElement('canvas');
      canvas.className = 'w-full max-h-[340px] object-contain rounded-lg border border-slate-200 bg-white shadow-sm';

      const caption = document.createElement('div');
      caption.className = 'mt-2 text-center text-xs font-semibold text-slate-700';
      caption.innerHTML = `
        <span class="text-blue-600 font-bold">#${i + 1}</span> | SKU: <span class="font-mono text-slate-900">${ord.sku}</span>
        <div class="text-[10px] text-slate-400 font-normal mt-0.5">${ord.courier} · Qty: ${ord.qty}</div>
      `;

      card.appendChild(canvas);
      card.appendChild(caption);
      previewCanvasContainer.appendChild(card);

      // Render onto canvas
      await window.EvoriaPDF.renderPageThumbnail(ord, state.sourceFiles, canvas, {
        scale: 0.8,
        cropHalf: state.cropLabels || state.trimWhitespace
      });
    }
  });

  closePreviewModalBtn.addEventListener('click', () => {
    previewModal.classList.add('hidden');
  });

  // ==========================================
  // 8. Info & Sample Modals
  // ==========================================
  howSortingWorksBtn.addEventListener('click', () => {
    showInfoModal(
      'How Sorting Saves Hours for Sellers',
      `
      <div class="space-y-4 text-sm text-slate-600">
        <p>
          <strong>Without Sorting:</strong> Sellers waste 2-3 hours walking back and forth in their warehouse looking for inventory because orders are randomly ordered.
        </p>
        <p>
          <strong>With EvoriaBloom SKU Sorting:</strong> All identical items are grouped sequentially. You pick 10 units of Product A once, pack 10 bags in a single flow, and apply labels in exact serial order!
        </p>
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
          💡 <strong>Pro Tip:</strong> Use Courier Partner sorting when scheduling separate pickup handovers for Delhivery, Shadowfax, and Valmo.
        </div>
      </div>
    `
    );
  });

  viewSampleMessageBtn.addEventListener('click', () => {
    showInfoModal(
      'Custom Message Preview',
      `
      <div class="space-y-3 text-sm text-slate-600">
        <p>Your custom message will be neatly printed at the bottom of each shipping label without covering the barcode or recipient details.</p>
        <div class="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl text-center">
          <div class="text-xs text-slate-400 mb-2">[ Shipping Label Barcode & Address Area ]</div>
          <div class="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs font-semibold text-yellow-900">
            ${state.customMessageText || 'Thank you for your order! - EvoriaBloom'}
          </div>
        </div>
        <p class="text-xs text-slate-400">Great for customer care contact, return guidelines, or brand greeting!</p>
      </div>
    `
    );
  });

  function showInfoModal(title, html) {
    infoModalTitle.textContent = title;
    infoModalContent.innerHTML = html;
    infoModal.classList.remove('hidden');
  }

  closeInfoModalBtn.addEventListener('click', () => {
    infoModal.classList.add('hidden');
  });

  const downloadPicklistBtn = document.getElementById('download-picklist-btn');

  function triggerDownload(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  }

  // ==========================================
  // 9. Generate & Download Sorted PDF
  // ==========================================
  generatePdfBtn.addEventListener('click', async () => {
    if (!state.currentUser) {
      alert('Please Sign In with Google first. EvoriaBloom tools require a free login.');
      triggerGoogleLogin();
      return;
    }

    if (state.orders.length === 0) {
      alert('Please upload shipping labels first.');
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const config = {
      orders: state.orders,
      sourceFiles: state.sourceFiles,
      platform: state.platform,
      skuOrder: state.skuOrder,
      sortType: state.sortType,
      cropLabels: state.cropLabels,
      trimWhitespace: state.trimWhitespace,
      dropInvoicePages: state.dropInvoicePages,
      stampSku: state.stampSku,
      comboSetting: state.comboSetting,
      customMessage: state.customMessageEnabled ? state.customMessageText : ''
    };

    if (state.comboSetting === 'separate_pdf') {
      showProgress('Generating Separate PDFs (Single & Combo)...', 20, 'Preparing 2 separate PDF files...');

      try {
        const result = await window.EvoriaPDF.generateSplitPDFs(config, (pct, msg) => updateProgress(pct, msg));

        let downloadCount = 0;
        if (result.singlePdfBytes && result.singleCount > 0) {
          triggerDownload(result.singlePdfBytes, `EvoriaBloom_${state.platform.toUpperCase()}_Single_Orders_${timestamp}.pdf`);
          downloadCount++;
        }

        if (result.comboPdfBytes && result.comboCount > 0) {
          setTimeout(() => {
            triggerDownload(result.comboPdfBytes, `EvoriaBloom_${state.platform.toUpperCase()}_Combo_Orders_${timestamp}.pdf`);
          }, 800);
          downloadCount++;
        }

        hideProgress();
        if (window.confetti) window.confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        showToast(`🎉 Successfully generated ${downloadCount} separate PDFs (Single & Combo)!`);

        const activeFileNames = (state.uploadedFiles && state.uploadedFiles.length > 0)
          ? state.uploadedFiles.map(f => f.name).join(', ')
          : 'Labels.pdf';

        // Log Activity to Free EvoriaDB & Cloud Sync
        if (window.EvoriaDB) {
          window.EvoriaDB.logActivity({
            type: 'Split PDF Generation',
            fileName: activeFileNames,
            platform: state.platform,
            labelCount: state.orders.length,
            skuCount: state.skuSummary.length,
            cropLabels: state.cropLabels,
            comboSetting: state.comboSetting
          });
          updateDatabaseBadge();
        }

        // Log Activity to Firestore Database
        if (window.EvoriaAuth && state.currentUser) {
          window.EvoriaAuth.logActivity(state.currentUser.uid, {
            type: 'Split PDF Generation',
            fileName: activeFileNames,
            userEmail: state.currentUser.email || '',
            userName: state.currentUser.displayName || 'Seller',
            platform: state.platform,
            totalLabels: state.orders.length,
            labelCount: state.orders.length,
            singleCount: result.singleCount,
            comboCount: result.comboCount,
            skuCount: state.skuSummary.length,
            cropLabels: state.cropLabels,
            timestampStr: new Date().toLocaleString()
          });
        }
      } catch (err) {
        console.error('Error generating split PDFs:', err);
        hideProgress();
        alert('Failed to generate split PDFs: ' + err.message);
      }
    } else {
      showProgress('Generating Clean Sorted PDF...', 20, 'Assembling print-ready thermal pages...');

      try {
        const finalPdfBytes = await window.EvoriaPDF.generateSortedPDF(
          config,
          (pct, msg) => updateProgress(pct, msg)
        );

        triggerDownload(
          finalPdfBytes,
          `EvoriaBloom_${state.platform.toUpperCase()}_Sorted_Labels_${timestamp}.pdf`
        );

        hideProgress();
        if (window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        showToast('🎉 Print-ready sorted PDF downloaded successfully!');

        const activeFileNames = (state.uploadedFiles && state.uploadedFiles.length > 0)
          ? state.uploadedFiles.map(f => f.name).join(', ')
          : 'Labels.pdf';

        // Log Activity to Free EvoriaDB & Cloud Sync
        if (window.EvoriaDB) {
          window.EvoriaDB.logActivity({
            type: 'Sorted PDF Generation',
            fileName: activeFileNames,
            platform: state.platform,
            labelCount: state.orders.length,
            skuCount: state.skuSummary.length,
            cropLabels: state.cropLabels,
            comboSetting: state.comboSetting
          });
          updateDatabaseBadge();
        }

        // Log Activity to Firestore Database
        if (window.EvoriaAuth && state.currentUser) {
          window.EvoriaAuth.logActivity(state.currentUser.uid, {
            type: 'Sorted PDF Generation',
            fileName: activeFileNames,
            userEmail: state.currentUser.email || '',
            userName: state.currentUser.displayName || 'Seller',
            platform: state.platform,
            labelCount: state.orders.length,
            skuCount: state.skuSummary.length,
            cropLabels: state.cropLabels,
            comboSetting: state.comboSetting,
            timestampStr: new Date().toLocaleString()
          });
        }
      } catch (err) {
        console.error('Error generating PDF:', err);
        hideProgress();
        alert('Failed to generate PDF: ' + err.message);
      }
    }
  });

  // ==========================================
  // 10. Generate & Download SKU Pick List (Manifest)
  // ==========================================
  if (downloadPicklistBtn) {
    downloadPicklistBtn.addEventListener('click', async () => {
      if (!state.currentUser) {
        alert('Please Sign In with Google first to download the warehouse pick list.');
        triggerGoogleLogin();
        return;
      }

      if (state.orders.length === 0) {
        alert('Please upload shipping labels first.');
        return;
      }

      showProgress('Generating SKU Pick List...', 30, 'Creating warehouse inventory sheet...');

      try {
        const picklistBytes = await window.EvoriaPDF.generatePickListPDF({
          orders: state.orders,
          platform: state.platform
        });

        const timestamp = new Date().toISOString().slice(0, 10);
        triggerDownload(
          picklistBytes,
          `EvoriaBloom_${state.platform.toUpperCase()}_SKU_PickList_${timestamp}.pdf`
        );

        hideProgress();
        showToast('📋 Warehouse SKU Pick List downloaded!');

        const activeFileNames = (state.uploadedFiles && state.uploadedFiles.length > 0)
          ? state.uploadedFiles.map(f => f.name).join(', ')
          : 'Labels.pdf';

        // Log Activity to Free EvoriaDB & Cloud Sync
        if (window.EvoriaDB) {
          window.EvoriaDB.logActivity({
            type: 'SKU Picklist Download',
            fileName: activeFileNames,
            platform: state.platform,
            labelCount: state.orders.length,
            skuCount: state.skuSummary.length
          });
          updateDatabaseBadge();
        }

        // Log Activity to Firestore Database
        if (window.EvoriaAuth && state.currentUser) {
          window.EvoriaAuth.logActivity(state.currentUser.uid, {
            type: 'SKU Picklist Download',
            fileName: activeFileNames,
            userEmail: state.currentUser.email || '',
            userName: state.currentUser.displayName || 'Seller',
            platform: state.platform,
            labelCount: state.orders.length,
            skuCount: state.skuSummary.length,
            timestampStr: new Date().toLocaleString()
          });
        }
      } catch (err) {
        console.error('Error generating picklist:', err);
        hideProgress();
        alert('Failed to generate pick list: ' + err.message);
      }
    });
  }

  // ==========================================
  // Helpers: Progress & Toast
  // ==========================================
  function showProgress(title, pct, status) {
    progressModalTitle.textContent = title;
    updateProgress(pct, status);
    progressModal.classList.remove('hidden');
  }

  function updateProgress(pct, status) {
    progressModalBar.style.width = `${pct}%`;
    progressModalStatus.textContent = status;
  }

  function hideProgress() {
    progressModal.classList.add('hidden');
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce text-sm font-medium';
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4500);
  }
});
