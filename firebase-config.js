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
    apiKey: "AIzaSyB5YDvsvyiqLK8w0Qo__i6Fuz9sB1RFIJI",
    authDomain: "evoriabloom-9dd11.firebaseapp.com",
    projectId: "evoriabloom-9dd11",
    storageBucket: "evoriabloom-9dd11.firebasestorage.app",
    messagingSenderId: "638623635142",
    appId: "1:638623635142:web:e195d002efd207b524a9c7",
    measurementId: "G-MEQ7G2LJ56"
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
      alert("તમારા Firebase પ્રોજેક્ટનું Configuration બાકી છે. કૃપા કરીને Firebase Config સેટ કરો.");
      const modal = document.getElementById('firebase-config-modal');
      if (modal) modal.classList.remove('hidden');
      return null;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      // Save user to Firebase Database
      await saveUserToDatabase(user);

      return user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        alert('Firebase સેટિંગ નોંધ: તમારા Firebase Console -> Authentication -> Settings -> Authorized Domains માં "orealuxe.in" ઉમેરવું પડશે.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.info('Google Sign-in popup was closed by user.');
      } else {
        alert('Google Login: ' + error.message);
      }
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

    // Purge any legacy demo user session
    localStorage.removeItem('evoriabloom_demo_user');

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
