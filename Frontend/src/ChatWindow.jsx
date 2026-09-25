import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
    user,
    token,
    openAuthModal,
    logout,
    setAllThreads,
    isSidebarOpen,
    toggleSidebar,
    openProfileModal,
    openSettingsModal
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getReply = async () => {
    if (!prompt.trim() || loading) return;

    const currentMessage = prompt;
    setLoading(true);
    setNewChat(false);

    const headers = {
      "Content-Type": "application/json"
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: currentMessage,
        threadId: currThreadId
      })
    };

    try {
      const response = await fetch("http://localhost:8080/api/chat", options);
      const res = await response.json();
      setReply(res.reply);

      // If user is authenticated, refresh sidebar threads
      if (token) {
        try {
          const threadRes = await fetch("http://localhost:8080/api/thread", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (threadRes.ok) {
            const threadData = await threadRes.json();
            if (Array.isArray(threadData)) {
              setAllThreads(threadData.map(t => ({
                threadId: t.threadId,
                title: t.title,
                primaryCategory: t.primaryCategory || "General"
              })));
            }
          }
        } catch (err) {
          console.error("Failed to sync threads:", err);
        }
      }
    } catch (error) {
      console.error("Error getting reply:", error);
    } finally {
      setLoading(false);
    }
  };

  // Append new chat to prevChats
  useEffect(() => {
    if (prompt && reply) {
      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "user",
          content: prompt
        },
        {
          role: "assistant",
          content: reply
        }
      ]);
    }

    setPrompt("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply]);

  const handleProfileClick = () => {
    setIsOpen((prev) => !prev);
  };

  const getUserInitial = () => {
    if (!user || !user.name) return "U";
    return user.name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="chatWindow">
      <div className="navbar">
        <div className="navLeft">
          {user && (
            <button
              type="button"
              className="sidebarToggleBtn"
              onClick={toggleSidebar}
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <i className={`fa-solid ${isSidebarOpen ? "fa-bars-staggered" : "fa-bars"}`}></i>
            </button>
          )}
          <span className="navBrand">
            SigmaGPT
          </span>
        </div>

        <div className="navRight" ref={dropdownRef}>
          {!user && (
            <div className="navGuestActions">
              <button
                type="button"
                className="navSignInBtn"
                onClick={() => openAuthModal("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className="navSignUpBtn"
                onClick={() => openAuthModal("register")}
              >
                Sign up
              </button>
            </div>
          )}

          <div className="userIconDiv" onClick={handleProfileClick} title={user ? user.name : "Account options"}>
            <span className={`userIcon ${user ? "authenticated" : ""}`}>
              {user ? (
                user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="userIconImg" />
                ) : (
                  getUserInitial()
                )
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </span>
          </div>

          {isOpen && (
            <div className="dropDown">
              {user ? (
                <>
                  <div className="dropDownUserHeader">
                    <div className="dropDownAvatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="dropDownAvatarImg" />
                      ) : (
                        getUserInitial()
                      )}
                    </div>
                    <div className="dropDownUserInfo">
                      <span className="dropDownUserName">{user.name}</span>
                      <span className="dropDownUserEmail">{user.email}</span>
                    </div>
                  </div>
                  <div className="dropDownDivider" />
                  <div
                    className="dropDownItem"
                    onClick={() => {
                      setIsOpen(false);
                      openSettingsModal("appearance");
                    }}
                  >
                    <i className="fa-solid fa-gear"></i> Settings
                  </div>
                  <div
                    className="dropDownItem"
                    onClick={() => {
                      setIsOpen(false);
                      openProfileModal();
                    }}
                  >
                    <i className="fa-regular fa-user"></i> Profile
                  </div>
                  <div className="dropDownDivider" />
                  <div
                    className="dropDownItem dropDownLogout"
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                  </div>
                </>
              ) : (
                <>
                  <div className="dropDownUserHeader">
                    <div className="dropDownUserInfo">
                      <span className="dropDownUserName">Guest Mode</span>
                      <span className="dropDownUserEmail">Chats are temporary</span>
                    </div>
                  </div>
                  <div className="dropDownDivider" />
                  <div
                    className="dropDownItem"
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal("login");
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-to-bracket"></i> Sign in
                  </div>
                  <div
                    className="dropDownItem"
                    onClick={() => {
                      setIsOpen(false);
                      openAuthModal("register");
                    }}
                  >
                    <i className="fa-solid fa-user-plus"></i> Create account
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Chat />
      <ScaleLoader color="#808080" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          <input
            type="text"
            placeholder="Ask anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent?.isComposing && prompt.trim()) {
                getReply();
              }
            }}
          />
          <div id="submit" onClick={getReply} title="Send message">
            <i className="fa-solid fa-paper-plane"></i>
          </div>
        </div>
        <p className="info">
          SigmaGPT may occasionally provide inaccurate information. Please verify important details.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
