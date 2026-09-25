import { useState, useEffect, useRef, useContext } from "react";
import "./ProfileModal.css";
import { MyContext } from "./MyContext.jsx";

function ProfileModal() {
    const {
        isProfileModalOpen,
        closeProfileModal,
        user,
        setUser,
        token
    } = useContext(MyContext);

    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    // Sync state when modal opens or user changes
    useEffect(() => {
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayName(user.name || "");
            setUsername(user.username || (user.email ? user.email.split("@")[0] : ""));
            setAvatar(user.avatar || "");
            setError("");
        }
    }, [user, isProfileModalOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isProfileModalOpen) {
                closeProfileModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isProfileModalOpen, closeProfileModal]);

    if (!isProfileModalOpen || !user) return null;

    // Get 2-letter initials (e.g. "PI" for Piyush, as shown in reference)
    const getInitials = () => {
        const source = displayName.trim() || user.name || "User";
        const parts = source.split(" ").filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return source.slice(0, 2).toUpperCase();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError("Image size should be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setAvatar(reader.result);
            setError("");
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) {
            setError("Display name is required");
            return;
        }
        if (!username.trim()) {
            setError("Username is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:8080/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: displayName.trim(),
                    username: username.trim().replace(/^@/, ""),
                    avatar
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to update profile");
                setLoading(false);
                return;
            }

            // Update user in state
            setUser(data.user);
            closeProfileModal();
        } catch (err) {
            console.error("Profile save error:", err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profileModalOverlay" onClick={closeProfileModal}>
            <div
                className="profileModalCard"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="profileModalHeader">
                    <h2 id="profile-modal-title" className="profileModalTitle">Edit profile</h2>
                    <button
                        type="button"
                        className="profileModalCloseBtn"
                        onClick={closeProfileModal}
                        aria-label="Close"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {error && <div className="profileModalError">{error}</div>}

                <form onSubmit={handleSave} className="profileModalForm">
                    {/* Centered Avatar with Camera Badge */}
                    <div className="profileAvatarSection">
                        <div
                            className="profileAvatarCircle"
                            onClick={() => fileInputRef.current?.click()}
                            title="Click to change profile picture"
                        >
                            {avatar ? (
                                <img src={avatar} alt="Profile" className="profileAvatarImg" />
                            ) : (
                                <span className="profileAvatarInitials">{getInitials()}</span>
                            )}

                            <button
                                type="button"
                                className="profileCameraBadge"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                aria-label="Upload picture"
                                title="Upload picture"
                            >
                                <i className="fa-solid fa-camera"></i>
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                    </div>

                    {/* Display name field */}
                    <div className="profileFieldBox">
                        <label htmlFor="profile-display-name" className="profileFieldLabel">
                            Display name
                        </label>
                        <input
                            id="profile-display-name"
                            type="text"
                            className="profileFieldInput"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter display name"
                            required
                        />
                    </div>

                    {/* Username field */}
                    <div className="profileFieldBox">
                        <label htmlFor="profile-username" className="profileFieldLabel">
                            Username
                        </label>
                        <input
                            id="profile-username"
                            type="text"
                            className="profileFieldInput"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            autoComplete="username"
                            required
                        />
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="profileModalActions">
                        <button
                            type="button"
                            className="profileCancelBtn"
                            onClick={closeProfileModal}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="profileSaveBtn"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfileModal;
