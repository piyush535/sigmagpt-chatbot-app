import './App.css';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import AuthModal from './AuthModal.jsx';
import ProfileModal from './ProfileModal.jsx';
import SettingsModal from './SettingsModal.jsx';
import { MyContext } from './MyContext.jsx';
import { useState, useEffect, useCallback } from 'react';
import { v1 as uuidv1 } from 'uuid';
import { API_URL } from './config';

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  // Theme state: "system" | "dark" | "light"
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("sigmagpt_theme") || "system";
  });

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("sigmagpt_theme", newTheme);
  }, []);

  // Synchronize active theme with document attribute & system media query
  useEffect(() => {
    const applyResolvedTheme = () => {
      let resolved = theme;
      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
    };

    applyResolvedTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (theme === "system") {
        applyResolvedTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem("sigmagpt_token"));
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const openProfileModal = useCallback(() => setIsProfileModalOpen(true), []);
  const closeProfileModal = useCallback(() => setIsProfileModalOpen(false), []);

  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("appearance"); // "appearance" | "account"
  const openSettingsModal = useCallback((tab = "appearance") => {
    setSettingsTab(tab);
    setIsSettingsModalOpen(true);
  }, []);
  const closeSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);

  const openAuthModal = useCallback((mode = "login") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem("sigmagpt_token");
    setToken(null);
    setUser(null);
    setAllThreads([]);
    setPrevChats([]);
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
  }, []);

  // Delete account handler
  const deleteAccount = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`${API_URL}/api/auth/account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete account");
    }

    // Success: clear session
    localStorage.removeItem("sigmagpt_token");
    setToken(null);
    setUser(null);
    setAllThreads([]);
    setPrevChats([]);
    setNewChat(true);
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
  }, [token]);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("sigmagpt_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setIsAuthModalOpen(false);
  }, []);

  // Verify stored token on initial load
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Token is expired or invalid
          localStorage.removeItem("sigmagpt_token");
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to verify user session:", error);
      }
    };

    verifyUser();
  }, [token]);

  // Sidebar open/close state (persisted)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sigmagpt_sidebar_open");
    return saved !== null ? saved === "true" : true;
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("sigmagpt_sidebar_open", String(next));
      return next;
    });
  }, []);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    user, setUser,
    token, setToken,
    isAuthModalOpen, setIsAuthModalOpen,
    authMode, setAuthMode,
    openAuthModal,
    closeAuthModal,
    login,
    logout,
    deleteAccount,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    theme,
    changeTheme,
    isProfileModalOpen,
    openProfileModal,
    closeProfileModal,
    isSettingsModalOpen,
    settingsTab,
    setSettingsTab,
    openSettingsModal,
    closeSettingsModal
  };

  return (
    <div className="app">
      <MyContext.Provider value={providerValues}>
        <Sidebar />
        <ChatWindow />
        <AuthModal />
        <ProfileModal />
        <SettingsModal />
      </MyContext.Provider>
    </div>
  );
}

export default App;
