import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { getDetectedTenantCode } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pawn_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [customerCode, setCustomerCode] = useState(getDetectedTenantCode());
  const [shopConfig, setShopConfig] = useState(() => {
    try {
      const savedConfig = localStorage.getItem('pawn_shop_config');
      return savedConfig ? JSON.parse(savedConfig) : null;
    } catch (e) {
      return null;
    }
  });
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [oauthStatus, setOauthStatus] = useState({
    configured: false,
    verified: false,
    clientId: '',
    hasClientSecret: false,
    customerCode: getDetectedTenantCode(),
    licenseStatus: 'unregistered',
    lastVerifiedAt: null
  });
  const [loading, setLoading] = useState(true);

  const fetchOauthStatus = async () => {
    try {
      const res = await api.get('/settings/oauth-status');
      if (res.data?.success) {
        setOauthStatus({
          configured: res.data.configured,
          verified: res.data.verified,
          clientId: res.data.clientId || '',
          hasClientSecret: res.data.hasClientSecret,
          customerCode: res.data.customerCode || getDetectedTenantCode(),
          licenseStatus: res.data.licenseStatus || (res.data.verified ? 'active' : 'unregistered'),
          lastVerifiedAt: res.data.lastVerifiedAt
        });
        if (res.data.screenPermissions) {
          setShopConfig(prev => ({
            ...(prev || {}),
            screenPermissions: res.data.screenPermissions
          }));
        }
      }
    } catch (e) {
      console.warn('Unable to load OAuth registration status:', e.message);
    }
  };

  // Initialize session from token & verify in background
  useEffect(() => {
    async function initSession() {
      await fetchOauthStatus();

      const token = localStorage.getItem('pawn_auth_token');
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          if (res.data?.success) {
            setUser(res.data.user);
            setCustomerCode(res.data.customerCode || getDetectedTenantCode());
            setShopConfig(res.data.shopConfig);
            localStorage.setItem('pawn_user', JSON.stringify(res.data.user));
            if (res.data.shopConfig) {
              localStorage.setItem('pawn_shop_config', JSON.stringify(res.data.shopConfig));
            }
            // Load branch settings
            try {
              const branchRes = await api.get('/settings').catch(() => null);
              if (branchRes?.data?.branches) {
                setBranches(branchRes.data.branches);
                setCurrentBranch(branchRes.data.branches[0]);
              }
            } catch (e) {}
          }
        } catch (e) {
          // Only clear session on explicit 401 Unauthorized
          if (e.response && e.response.status === 401) {
            localStorage.removeItem('pawn_auth_token');
            localStorage.removeItem('pawn_user');
            localStorage.removeItem('pawn_shop_config');
            setUser(null);
          }
        }
      }

      setLoading(false);
    }
    initSession();
  }, []);

  const login = async (mobile, password) => {
    const res = await api.post('/auth/login', { mobile, password });
    if (res.data?.success) {
      localStorage.setItem('pawn_auth_token', res.data.token);
      localStorage.setItem('pawn_tenant_code', res.data.customerCode);
      localStorage.setItem('pawn_user', JSON.stringify(res.data.user));
      if (res.data.shopConfig) {
        localStorage.setItem('pawn_shop_config', JSON.stringify(res.data.shopConfig));
      }
      setUser(res.data.user);
      setCustomerCode(res.data.customerCode);
      setShopConfig(res.data.shopConfig);
      if (res.data.branches) {
        setBranches(res.data.branches);
        setCurrentBranch(res.data.branches[0]);
      }
      await fetchOauthStatus();
      return { success: true };
    }
    return { success: false, message: res.data?.message || 'Login failed' };
  };

  const verifyOauth = async (clientId, clientSecret) => {
    try {
      const res = await api.post('/settings/verify-oauth', { clientId, clientSecret });
      if (res.data?.success && res.data.verified) {
        await fetchOauthStatus();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Verification failed' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    sessionStorage.setItem('pb_explicit_logout', 'true');
    localStorage.removeItem('pawn_auth_token');
    localStorage.removeItem('pawn_user');
    localStorage.removeItem('pawn_shop_config');
    setUser(null);
    window.location.href = '/login';
  };


  const switchBranch = (branch) => {
    setCurrentBranch(branch);
  };

  const isScreenPermitted = (screenKey) => {
    if (!shopConfig?.screenPermissions) return true;
    return shopConfig.screenPermissions[screenKey] !== false;
  };

  const isRegistered = Boolean(oauthStatus?.verified);

  const updateUser = (newUserData) => {
    setUser(prev => ({ ...(prev || {}), ...newUserData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customerCode,
        shopConfig,
        branches,
        currentBranch,
        oauthStatus,
        isRegistered,
        loading,
        login,
        logout,
        switchBranch,
        isScreenPermitted,
        verifyOauth,
        updateUser,
        refreshOauthStatus: fetchOauthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
