import { useState, useEffect, useCallback, useContext } from "react";
import "./AuthModal.css";
import { MyContext } from "./MyContext";

function AuthModal() {
    const { isAuthModalOpen, closeAuthModal, authMode, setAuthMode, login } = useContext(MyContext);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isLogin = authMode === "login";

    const switchMode = (newMode) => {
        setError("");
        setName("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setAuthMode(newMode);
    };

    const handleClose = useCallback(() => {
        setError("");
        setName("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        closeAuthModal();
    }, [closeAuthModal]);

    // Handle Escape key to close modal (accessible dismiss)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isAuthModalOpen) {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAuthModalOpen, handleClose]);

    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const endpoint = isLogin
            ? "http://localhost:8080/api/auth/login"
            : "http://localhost:8080/api/auth/register";

        const payload = isLogin
            ? { email, password }
            : { name, email, password };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Authentication failed. Please check your credentials.");
                setLoading(false);
                return;
            }

            // Success: log user in
            login(data.token, data.user);
        } catch (err) {
            console.error("Auth request error:", err);
            setError("Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="authModalBackdrop" onClick={handleClose}>
            <div
                className="authModalCard"
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
                onClick={(e) => e.stopPropagation()} // Prevent clicking modal from closing it
            >
                <button
                    className="authCloseBtn"
                    onClick={handleClose}
                    aria-label="Close dialog"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>

                <div className="authHeader">
                    <img src="src/assets/blacklogo.png" alt="SigmaGPT" className="authLogo" />
                    <h2 id="auth-modal-title">{isLogin ? "Welcome Back" : "Create Your Account"}</h2>
                    <p>
                        {isLogin
                            ? "Sign in to access your saved threads and sync chats"
                            : "Register to save your conversations across devices"}
                    </p>
                </div>

                <div className="authTabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={isLogin}
                        className={`authTab ${isLogin ? "active" : ""}`}
                        onClick={() => switchMode("login")}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!isLogin}
                        className={`authTab ${!isLogin ? "active" : ""}`}
                        onClick={() => switchMode("register")}
                    >
                        Register
                    </button>
                </div>

                {error && (
                    <div className="authErrorBanner" role="alert">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form className="authForm" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="formGroup">
                            <label htmlFor="auth-name">Full Name</label>
                            <div className="authInputWrapper">
                                <input
                                    id="auth-name"
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="formGroup">
                        <label htmlFor="auth-email">Email Address</label>
                        <div className="authInputWrapper">
                            <input
                                id="auth-email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>
                    </div>

                    <div className="formGroup">
                        <label htmlFor="auth-password">Password</label>
                        <div className="authInputWrapper">
                            <input
                                id="auth-password"
                                type={showPassword ? "text" : "password"}
                                placeholder={isLogin ? "Enter your password" : "At least 6 characters"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                minLength={isLogin ? undefined : 6}
                                required
                            />
                            <button
                                type="button"
                                className="passwordToggleBtn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="authSubmitBtn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                            </>
                        ) : (
                            <span>{isLogin ? "Sign In" : "Create Account"}</span>
                        )}
                    </button>
                </form>

                <div className="authFooterSwitch">
                    {isLogin ? (
                        <p>
                            Don't have an account?{" "}
                            <button type="button" onClick={() => switchMode("register")}>
                                Sign up
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{" "}
                            <button type="button" onClick={() => switchMode("login")}>
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthModal;
