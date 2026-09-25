import { useState, useEffect, useContext } from "react";
import "./SettingsModal.css";
import { MyContext } from "./MyContext.jsx";

function SettingsModal() {
    const {
        isSettingsModalOpen,
        closeSettingsModal,
        settingsTab,
        setSettingsTab,
        theme,
        changeTheme,
        user,
        openProfileModal,
        deleteAccount
    } = useContext(MyContext);

    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isSettingsModalOpen) {
                if (showDeleteConfirm) {
                    setShowDeleteConfirm(false);
                } else {
                    closeSettingsModal();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSettingsModalOpen, showDeleteConfirm, closeSettingsModal]);

    if (!isSettingsModalOpen) return null;

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setDeleteError("");
        try {
            await deleteAccount();
            setShowDeleteConfirm(false);
            closeSettingsModal();
        } catch (err) {
            console.error("Account deletion failed:", err);
            setDeleteError("Failed to delete account. Please try again.");
            setIsDeleting(false);
        }
    };

    const displayUsername = user?.username 
        ? `@${user.username.replace(/^@/, "")}` 
        : (user?.email ? `@${user.email.split("@")[0]}` : "@user");

    return (
        <div className="settingsModalOverlay" onClick={closeSettingsModal}>
            <div
                className="settingsModalCard"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-dialog-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="settingsModalHeader">
                    <h2 id="settings-dialog-title" className="settingsModalTitle">Settings</h2>
                    <button
                        type="button"
                        className="settingsCloseBtn"
                        onClick={closeSettingsModal}
                        aria-label="Close settings"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="settingsModalBody">
                    {/* Navigation Sidebar / Tabs */}
                    <nav className="settingsNav" aria-label="Settings navigation">
                        <button
                            type="button"
                            className={`settingsNavItem ${settingsTab === "appearance" ? "active" : ""}`}
                            onClick={() => setSettingsTab("appearance")}
                        >
                            <i className="fa-solid fa-palette"></i>
                            <span>Appearance</span>
                        </button>
                        <button
                            type="button"
                            className={`settingsNavItem ${settingsTab === "account" ? "active" : ""}`}
                            onClick={() => setSettingsTab("account")}
                        >
                            <i className="fa-regular fa-user"></i>
                            <span>Account</span>
                        </button>
                    </nav>

                    {/* Main Content Area */}
                    <main className="settingsContent">
                        {settingsTab === "appearance" && (
                            <section className="appearanceSection">
                                <h3 className="sectionHeading">Appearance</h3>
                                <p className="sectionSubheading">
                                    Customize how SigmaGPT looks on your device.
                                </p>

                                <div className="themeOptionsGrid">
                                    {/* System theme */}
                                    <div
                                        className={`themeOptionCard ${theme === "system" ? "selected" : ""}`}
                                        onClick={() => changeTheme("system")}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && changeTheme("system")}
                                    >
                                        <div className="themeIconBox">
                                            <i className="fa-solid fa-desktop"></i>
                                        </div>
                                        <div className="themeInfo">
                                            <span className="themeTitle">System</span>
                                            <span className="themeDesc">Follow your device theme</span>
                                        </div>
                                        {theme === "system" && (
                                            <i className="fa-solid fa-check themeCheckIcon"></i>
                                        )}
                                    </div>

                                    {/* Dark theme */}
                                    <div
                                        className={`themeOptionCard ${theme === "dark" ? "selected" : ""}`}
                                        onClick={() => changeTheme("dark")}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && changeTheme("dark")}
                                    >
                                        <div className="themeIconBox">
                                            <i className="fa-solid fa-moon"></i>
                                        </div>
                                        <div className="themeInfo">
                                            <span className="themeTitle">Dark</span>
                                            <span className="themeDesc">Always use dark theme</span>
                                        </div>
                                        {theme === "dark" && (
                                            <i className="fa-solid fa-check themeCheckIcon"></i>
                                        )}
                                    </div>

                                    {/* Light theme */}
                                    <div
                                        className={`themeOptionCard ${theme === "light" ? "selected" : ""}`}
                                        onClick={() => changeTheme("light")}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === "Enter" && changeTheme("light")}
                                    >
                                        <div className="themeIconBox">
                                            <i className="fa-solid fa-sun"></i>
                                        </div>
                                        <div className="themeInfo">
                                            <span className="themeTitle">Light</span>
                                            <span className="themeDesc">Always use light theme</span>
                                        </div>
                                        {theme === "light" && (
                                            <i className="fa-solid fa-check themeCheckIcon"></i>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {settingsTab === "account" && (
                            <section className="accountSection">
                                <h3 className="sectionHeading">Account</h3>

                                {user ? (
                                    <div className="accountList">
                                        {/* Name Row */}
                                        <div className="accountRow">
                                            <span className="accountRowLabel">Name</span>
                                            <span className="accountRowValue">{user.name}</span>
                                        </div>

                                        <div className="accountDivider" />

                                        {/* Username Row */}
                                        <div
                                            className="accountRow clickable"
                                            onClick={() => {
                                                closeSettingsModal();
                                                openProfileModal();
                                            }}
                                            title="Click to edit profile"
                                        >
                                            <span className="accountRowLabel">Username</span>
                                            <div className="accountRowActionValue">
                                                <span className="accountRowValue">{displayUsername}</span>
                                                <i className="fa-solid fa-chevron-right chevronIcon"></i>
                                            </div>
                                        </div>

                                        <div className="accountDivider" />

                                        {/* Email Row */}
                                        <div className="accountRow">
                                            <span className="accountRowLabel">Email</span>
                                            <div className="accountRowActionValue">
                                                <span className="accountRowValue">{user.email}</span>
                                                <i className="fa-solid fa-chevron-right chevronIcon"></i>
                                            </div>
                                        </div>

                                        <div className="accountDivider" />

                                        {/* Delete Account Row matching Image 3 */}
                                        <div className="accountRow deleteRow">
                                            <span className="accountRowLabel deleteLabel">Delete account</span>
                                            <button
                                                type="button"
                                                className="accountDeleteBtn"
                                                onClick={() => setShowDeleteConfirm(true)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="guestAccountNotice">
                                        <p>You are currently browsing in guest mode.</p>
                                        <p className="guestAccountSubtext">
                                            Sign in or create an account to manage your profile and settings.
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}
                    </main>
                </div>

                {/* Delete Account Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div
                        className="deleteConfirmOverlay"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <div
                            className="deleteConfirmBox"
                            onClick={(e) => e.stopPropagation()}
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="delete-account-title"
                        >
                            <div className="deleteConfirmIcon">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                            <h4 id="delete-account-title" className="deleteConfirmTitle">
                                Delete your account?
                            </h4>
                            <p className="deleteConfirmMessage">
                                This will permanently delete your account, saved chats, and all profile data.
                                <strong> This action cannot be undone.</strong>
                            </p>

                            {deleteError && (
                                <div className="deleteConfirmError">{deleteError}</div>
                            )}

                            <div className="deleteConfirmActions">
                                <button
                                    type="button"
                                    className="deleteConfirmCancelBtn"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="deleteConfirmDangerBtn"
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SettingsModal;
