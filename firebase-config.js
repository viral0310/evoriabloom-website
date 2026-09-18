/**
 * EvoriaBloom - Firebase Authentication & Database Configuration
 * 
 * To connect your own Firebase project:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Create or select your Project -> Project Settings -> General -> Your apps -> Web app (</>)
 * 3. Copy the firebaseConfig object and paste it below.
 * 4. Enable Google Sign-In in Firebase Console -> Authentication -> Sign-in method -> Google (Enable).
 * 5. Enable Firestore in Firebase Console -> Firestore Database -> Create database.
 */

window.EvoriaFirebaseConfig = (function () {
  // Stored or Default Firebase Credentials
  // You can paste your credentials directly here:
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyD-YOUR-API-KEY-HERE",
    authDomain: "evoriabloom-seller.firebaseapp.com",
    projectId: "evoriabloom-seller",
    storageBucket: "evoriabloom-seller.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
  };

  // Check if user has saved custom config in localStorage
  function getConfig() {
    try {
      const custom = localStorage.getItem('evoriabloom_firebase_config');
      if (custom) {
        return JSON.parse(custom);
      }
    } catch (e) {
      console.warn('Could not read custom Firebase config:', e);
    }
    return DEFAULT_CONFIG;
  }

  function setCustomConfig(cfg) {
    localStorage.setItem('evoriabloom_firebase_config', JSON.stringify(cfg));
  }

  return {
    getConfig,
    setCustomConfig,
    DEFAULT_CONFIG
  };
})();

// Initialize Firebase
window.EvoriaAuth = (function () {
  let app = null;
  let auth = null;
  let db = null;
  let isConfigured = false;

  function init() {
    if (!window.firebase) {
      console.error('Firebase SDK not loaded.');
      return false;
    }

    const config = window.EvoriaFirebaseConfig.getConfig();

    // Verify if default dummy key is still used
    if (config.apiKey.includes('YOUR-API-KEY')) {
      isConfigured = false;
      console.info('EvoriaBloom: Firebase is using placeholder credentials. Please set your Firebase config.');
    } else {
      isConfigured = true;
    }

    try {
      if (!firebase.apps.length) {
        app = firebase.initializeApp(config);
      } else {
        app = firebase.app();
      }
      auth = firebase.auth();
      db = firebase.firestore();
      return true;
    } catch (err) {
      console.warn('Firebase initialization note:', err.message);
      return false;
    }
  }

  /**
   * Sign In With Google Popup
   */
  async function loginWithGoogle() {
    if (!auth) {
      init();
    }

    if (!isConfigured) {
      // If user hasn't configured Firebase yet, prompt them to configure or provide mock demo session
      const promptConfig = confirm(
        "તમારા Firebase પ્રોજેક્ટનું Configuration બાકી છે.\n\nશું તમે અત્યારે Firebase Configuration સેટ કરવા માંગો છો?\n(Cancel કરવાથી એક ટેસ્ટ લોગિન સેશન ચાલુ થશે)"
      );

      if (promptConfig) {
        const modal = document.getElementById('firebase-config-modal');
        if (modal) modal.classList.remove('hidden');
        return null;
      } else {
        // Provide mock authenticated user for instant local testing
        const mockUser = {
          uid: "demo_seller_101",
          displayName: "Viral Tada (EvoriaBloom)",
          email: "seller@evoriabloom.com",
          photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=EvoriaBloom",
          isDemo: true
        };
        localStorage.setItem('evoriabloom_demo_user', JSON.stringify(mockUser));
        if (window._authChangeCallback) {
          window._authChangeCallback(mockUser);
        }
        return mockUser;
      }
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      // Save user to Firebase Database
      await saveUserToDatabase(user);

      return user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Google Login નિષ્ફળ થયું: ' + error.message);
      throw error;
    }
  }

  /**
   * Log Out User
   */
  async function logout() {
    localStorage.removeItem('evoriabloom_demo_user');
    if (auth) {
      try {
        await auth.signOut();
      } catch (e) {
        console.warn('Sign out note:', e);
      }
    }
    if (window._authChangeCallback) {
      window._authChangeCallback(null);
    }
  }

  /**
   * Save / Update User Profile in Firestore Database
   */
  async function saveUserToDatabase(user) {
    if (!db || !user || user.isDemo) return;

    try {
      const userRef = db.collection('users').doc(user.uid);
      await userRef.set({
        uid: user.uid,
        displayName: user.displayName || 'Seller',
        email: user.email,
        photoURL: user.photoURL || '',
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Error updating user document in Firestore:', err);
    }
  }

  /**
   * Log Processing Activity in Firestore Database
   */
  async function logActivity(userId, data) {
    if (!db || !userId) return;

    try {
      const activityRef = db.collection('users').doc(userId).collection('activities');
      await activityRef.add({
        ...data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.warn('Error recording activity in Firestore:', err);
    }
  }

  /**
   * Listen to Authentication Changes
   */
  function onAuthChange(callback) {
    window._authChangeCallback = callback;

    // Check for demo user session
    const demo = localStorage.getItem('evoriabloom_demo_user');
    if (demo) {
      try {
        callback(JSON.parse(demo));
        return;
      } catch (e) {}
    }

    if (auth) {
      auth.onAuthStateChanged(user => {
        callback(user);
        if (user) {
          saveUserToDatabase(user);
        }
      });
    } else {
      callback(null);
    }
  }

  function getIsConfigured() {
    return isConfigured;
  }

  return {
    init,
    loginWithGoogle,
    logout,
    onAuthChange,
    saveUserToDatabase,
    logActivity,
    getIsConfigured
  };
})();
