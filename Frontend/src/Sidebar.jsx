import "./Sidebar.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import { ALLOWED_CATEGORIES as categories } from "../../Backend/constants/categories.js";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats,
        user,
        token,
        openAuthModal,
        logout,
        isSidebarOpen,
        toggleSidebar
    } = useContext(MyContext);

    const [threadToDelete, setThreadToDelete] = useState(null);
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [openThreadMenu, setOpenThreadMenu] = useState(null);
    const [threadToCategorize, setThreadToCategorize] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [customCategories, setCustomCategories] = useState([]);
    const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const categoryOptions = [
        ...categories.map((name) => ({ name, id: null })),
        ...customCategories.map((category) => ({ name: category.name, id: category._id }))
    ];

    const availableCategories = categoryOptions.map(({ name }) => name).filter((category) =>
        allThreads.some((thread) => (thread.primaryCategory || "General") === category)
    );

    const groupedThreads = allThreads.reduce((groups, thread) => {
        const category = thread.primaryCategory || "General";

        if (!groups[category]) {
            groups[category] = [];
        }

        groups[category].push(thread);
        return groups;
    }, {});

    const toggleCategory = (category) => {
        setCollapsedCategories((current) => ({
            ...current,
            [category]: !current[category]
        }));
    };

    // Close delete confirmation on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (threadToDelete) setThreadToDelete(null);
                if (openThreadMenu) setOpenThreadMenu(null);
                if (threadToCategorize) setThreadToCategorize(null);
                if (categoryToDelete) setCategoryToDelete(null);
                if (isCreateCategoryOpen) setIsCreateCategoryOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [threadToDelete, openThreadMenu, threadToCategorize, categoryToDelete, isCreateCategoryOpen]);

    useEffect(() => {
        const handleDocumentClick = () => {
            setOpenThreadMenu(null);
        };
        document.addEventListener("click", handleDocumentClick);
        return () => document.removeEventListener("click", handleDocumentClick);
    }, []);

    const getAllThreads = async (query = searchQuery, category = categoryFilter) => {
        if (!token) {
            setAllThreads([]);
            return;
        }

        try {
            const params = new URLSearchParams();
            if (query.trim()) params.set("q", query.trim());
            if (category !== "All") params.set("category", category);

            const endpoint = params.toString()
                ? `http://localhost:8080/api/thread/search?${params}`
                : "http://localhost:8080/api/thread";
            const response = await fetch(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                logout();
                return;
            }

            const res = await response.json();
            if (Array.isArray(res)) {
                const filteredData = res.map(thread => ({
                    threadId: thread.threadId,
                    title: thread.title,
                    primaryCategory: thread.categoryId?.name || thread.primaryCategory || "General",
                    categoryId: thread.categoryId?._id || null
                }));
                setAllThreads(filteredData);
            }
        } catch (error) {
            console.error("Error fetching threads:", error);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => getAllThreads(), 250);
        return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currThreadId, token, searchQuery, categoryFilter]);

    useEffect(() => {
        if (!token) {
            return;
        }

        const getCategories = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/category", {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include"
                });

                if (response.status === 401) {
                    logout();
                    return;
                }

                if (!response.ok) throw new Error("Failed to fetch categories");
                setCustomCategories(await response.json());
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        getCategories();
    }, [token, logout]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        if (!token) {
            setPrevChats([]);
            setNewChat(false);
            setReply(null);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/thread/${newThreadId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                logout();
                return;
            }

            const res = await response.json();
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (error) {
            console.error("Error fetching thread history:", error);
        }
    };

    const deleteThread = async (threadId) => {
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8080/api/thread/${threadId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                logout();
                return;
            }

            // updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (error) {
            console.error("Error deleting thread:", error);
        }
    };

    const updateCategory = async (threadId, categoryOption) => {
        if (!token) return;

        try {
            const isCustomCategory = Boolean(categoryOption.id);
            const response = await fetch(
                isCustomCategory
                    ? `http://localhost:8080/api/category/${threadId}`
                    : `http://localhost:8080/api/thread/${threadId}/category`,
                {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(isCustomCategory
                    ? { categoryId: categoryOption.id }
                    : { category: categoryOption.name })
                }
            );

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to update category");
            }

            setAllThreads((threads) => threads.map((thread) => (
                thread.threadId === threadId
                    ? {
                        ...thread,
                        primaryCategory: categoryOption.name,
                        categoryId: categoryOption.id
                    }
                    : thread
            )));
            setThreadToCategorize(null);
        } catch (error) {
            console.error("Error updating thread category:", error);
        }
    };

    const createCategory = async (event) => {
        event.preventDefault();
        const name = newCategoryName.trim();
        if (!name || !token) return;

        try {
            const response = await fetch("http://localhost:8080/api/category", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                credentials: "include",
                body: JSON.stringify({ name })
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create category");
            }

            const category = await response.json();
            setCustomCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)));
            setNewCategoryName("");
            setIsCreateCategoryOpen(false);
        } catch (error) {
            console.error("Error creating category:", error);
        }
    };

    const deleteCategory = async (categoryId) => {
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:8080/api/category/${categoryId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to delete category");
            }

            setCustomCategories((current) => current.filter((category) => category._id !== categoryId));
            setCategoryToDelete(null);
            // Re-fetch threads so each thread's primaryCategory is restored from the DB
            await getAllThreads();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    return (
        <>
            <section className={`sidebar ${user && !isSidebarOpen ? "collapsed" : ""}`}>
                <div className="sidebarTopBar">
                    <button className="newChatBtn" onClick={createNewChat}>
                        <div className="newChatLeft">
                            <img src="src/assets/blacklogo.png" alt="GPT Logo" className="logo" />
                            <span>New Chat</span>
                        </div>
                        <span>
                            <i className="fa-solid fa-pen-to-square"></i>
                        </span>
                    </button>
                    {user && (
                        <button
                            type="button"
                            className="sidebarCloseBtn"
                            onClick={toggleSidebar}
                            title="Close sidebar"
                            aria-label="Close sidebar"
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                    )}
                </div>

                <div className="historyContainer">
                    {user ? (
                        <div className="history">
                            <div className="sidebarSearch">
                                <div className="searchInputWrap">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search chats"
                                        aria-label="Search chats"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="searchClearBtn"
                                            onClick={() => setSearchQuery("")}
                                            aria-label="Clear chat search"
                                        >
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    )}
                                </div>
                                <div className="categorySelectWrap">
                                    <select
                                        value={categoryFilter}
                                        onChange={(event) => setCategoryFilter(event.target.value)}
                                        aria-label="Filter chats by category"
                                    >
                                        <option value="All">All categories</option>
                                        {availableCategories.map((category) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                    <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
                                </div>
                            </div>
                            {allThreads.length === 0 ? (
                                <p className="noThreadsNote">No previous chats yet</p>
                            ) : (
                                Object.entries(groupedThreads).map(([category, categoryThreads]) => (
                                    <section className="threadCategory" key={category}>
                                        <button
                                            type="button"
                                            className="categoryHeading"
                                            onClick={() => toggleCategory(category)}
                                            aria-expanded={!collapsedCategories[category]}
                                        >
                                            <span>{category}</span>
                                            <i className={`fa-solid ${collapsedCategories[category] ? "fa-chevron-right" : "fa-chevron-down"}`}></i>
                                        </button>

                                        {!collapsedCategories[category] && (
                                            <ul className="categoryThreads">
                                                {categoryThreads.map((thread) => (
                                                    <li
                                                        key={thread.threadId}
                                                        onClick={() => changeThread(thread.threadId)}
                                                        className={thread.threadId === currThreadId ? "highlighted" : ""}
                                                    >
                                                        <span className="threadTitle">{thread.title}</span>
                                                        <div className="threadActions" onClick={(event) => event.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                className="threadMenuBtn"
                                                                title="Chat options"
                                                                aria-label={`Options for ${thread.title}`}
                                                                aria-expanded={openThreadMenu === thread.threadId}
                                                                onClick={() => setOpenThreadMenu((current) => (
                                                                    current === thread.threadId ? null : thread.threadId
                                                                ))}
                                                            >
                                                                <i className="fa-solid fa-ellipsis"></i>
                                                            </button>
                                                            {openThreadMenu === thread.threadId && (
                                                                <div className="threadMenu" role="menu">
                                                                    <button
                                                                        type="button"
                                                                        role="menuitem"
                                                                        onClick={() => {
                                                                            setOpenThreadMenu(null);
                                                                            setThreadToDelete(thread);
                                                                        }}
                                                                    >
                                                                        <i className="fa-solid fa-trash"></i>
                                                                        Delete
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        role="menuitem"
                                                                        onClick={() => {
                                                                            setOpenThreadMenu(null);
                                                                            setThreadToCategorize(thread);
                                                                        }}
                                                                    >
                                                                        <i className="fa-solid fa-folder"></i>
                                                                        Change category
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="guestHistoryPrompt">
                            <div className="guestPromptIcon">
                                <i className="fa-solid fa-clock-rotate-left"></i>
                            </div>
                            <h3 style={{color: "#808080" }}>Save your chats</h3>
                            <p>Sign in to save your conversation history and access it anytime.</p>
                            <button
                                type="button"
                                className="guestAuthBtn"
                                onClick={() => openAuthModal("login")}
                            >
                                Sign In / Register
                            </button>
                        </div>
                    )}
                </div>

                <div className="sign">
                    <p>By Piyush Negi &hearts;</p>
                </div>
            </section>

            {threadToDelete && (
                <div
                    className="deleteModalOverlay"
                    onClick={() => setThreadToDelete(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-dialog-title"
                >
                    <div className="deleteModalBox" onClick={(e) => e.stopPropagation()}>
                        <div className="deleteModalHeader">
                            <div className="deleteModalIcon">
                                <i className="fa-solid fa-trash-can"></i>
                            </div>
                            <h3 id="delete-dialog-title" className="deleteModalTitle">Delete chat?</h3>
                        </div>
                        <p className="deleteModalMessage">
                            Are you sure you want to delete this chat?
                        </p>
                        {threadToDelete.title && (
                            <div className="deleteModalThreadPreview">
                                <i className="fa-regular fa-message"></i>
                                <span>{threadToDelete.title}</span>
                            </div>
                        )}
                        <div className="deleteModalActions">
                            <button
                                type="button"
                                className="deleteModalCancelBtn"
                                onClick={() => setThreadToDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="deleteModalConfirmBtn"
                                onClick={() => {
                                    const targetId = threadToDelete.threadId;
                                    setThreadToDelete(null);
                                    deleteThread(targetId);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {threadToCategorize && (
                <div
                    className="categoryModalOverlay"
                    onClick={() => setThreadToCategorize(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="category-dialog-title"
                >
                    <div className="categoryModalBox" onClick={(event) => event.stopPropagation()}>
                        <div className="categoryModalHeader">
                            <div>
                                <h3 id="category-dialog-title" className="categoryModalTitle">Change category</h3>
                                <p className="categoryModalDescription">Choose a category for this chat.</p>
                            </div>
                            <button
                                type="button"
                                className="categoryModalCloseBtn"
                                onClick={() => setThreadToCategorize(null)}
                                aria-label="Close category selection"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="categoryOptions">
                            {categoryOptions.map((categoryOption) => {
                                const isCurrentCategory = categoryOption.name === (threadToCategorize.primaryCategory || "General");
                                const categoryButton = (
                                    <button
                                        type="button"
                                        className="categoryOptionSelect"
                                        onClick={() => updateCategory(threadToCategorize.threadId, categoryOption)}
                                        disabled={isCurrentCategory}
                                    >
                                        <span>{categoryOption.name}</span>
                                        {isCurrentCategory && <i className="fa-solid fa-check" aria-label="Current category"></i>}
                                    </button>
                                );

                                if (!categoryOption.id) {
                                    return <div className={`categoryOption ${isCurrentCategory ? "selected" : ""}`} key={categoryOption.name}>{categoryButton}</div>;
                                }

                                return (
                                    <div className={`categoryOption customCategoryOption ${isCurrentCategory ? "selected" : ""}`} key={categoryOption.id}>
                                        {categoryButton}
                                        <button
                                            type="button"
                                            className="deleteCategoryBtn"
                                            title={`Delete ${categoryOption.name}`}
                                            aria-label={`Delete ${categoryOption.name}`}
                                            onClick={() => setCategoryToDelete(categoryOption)}
                                        >
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                );
                            })}
                            <button
                                type="button"
                                className="categoryOption createCategoryOption"
                                onClick={() => setIsCreateCategoryOpen(true)}
                            >
                                <span><i className="fa-solid fa-plus"></i> Create category</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateCategoryOpen && (
                <div
                    className="categoryModalOverlay"
                    onClick={() => setIsCreateCategoryOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-category-title"
                >
                    <form className="categoryModalBox" onClick={(event) => event.stopPropagation()} onSubmit={createCategory}>
                        <div className="categoryModalHeader">
                            <div>
                                <h3 id="create-category-title" className="categoryModalTitle">Create category</h3>
                                <p className="categoryModalDescription">Name a category for organizing your chats.</p>
                            </div>
                            <button
                                type="button"
                                className="categoryModalCloseBtn"
                                onClick={() => setIsCreateCategoryOpen(false)}
                                aria-label="Close create category dialog"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <input
                            className="categoryNameInput"
                            value={newCategoryName}
                            onChange={(event) => setNewCategoryName(event.target.value)}
                            placeholder="Category name"
                            maxLength={50}
                            autoFocus
                        />
                        <button type="submit" className="createCategorySubmitBtn" disabled={!newCategoryName.trim()}>
                            Create
                        </button>
                    </form>
                </div>
            )}

            {categoryToDelete && (
                <div
                    className="deleteModalOverlay"
                    onClick={() => setCategoryToDelete(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-category-dialog-title"
                >
                    <div className="deleteModalBox" onClick={(event) => event.stopPropagation()}>
                        <div className="deleteModalHeader">
                            <div className="deleteModalIcon">
                                <i className="fa-solid fa-trash-can"></i>
                            </div>
                            <h3 id="delete-category-dialog-title" className="deleteModalTitle">Delete category?</h3>
                        </div>
                        <p className="deleteModalMessage">Are you sure you want to delete this category?</p>
                        <div className="deleteModalThreadPreview">
                            <i className="fa-solid fa-folder"></i>
                            <span>{categoryToDelete.name}</span>
                        </div>
                        <div className="deleteModalActions">
                            <button type="button" className="deleteModalCancelBtn" onClick={() => setCategoryToDelete(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="deleteModalConfirmBtn"
                                onClick={() => deleteCategory(categoryToDelete.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;