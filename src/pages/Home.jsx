import { useEffect, useState, useRef } from "react";
import "./Home.css";
import { Link, useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    // =========================
    // USER ĐANG ĐĂNG NHẬP
    // =========================

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    // =========================
    // AVATAR
    // =========================

    const getAvatarUrl = (avatar) => {
        if (!avatar) {
            return null;
        }

        if (
            avatar.startsWith("http://") ||
            avatar.startsWith("https://")
        ) {
            return avatar;
        }

        return `http://localhost/it-connect-php/${avatar}`;
    };

    // =========================
    // MEDIA URL
    // =========================

    const getMediaUrl = (path) => {
        if (!path) {
            return null;
        }

        if (
            path.startsWith("http://") ||
            path.startsWith("https://")
        ) {
            return path;
        }

        return `http://localhost/it-connect-php/${path}`;
    };

    // =========================
    // STATE BÀI VIẾT
    // =========================

    const [content, setContent] = useState("");
    const [message, setMessage] = useState("");

    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // =========================
    // FILE ĐĂNG BÀI
    // =========================

    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [fileType, setFileType] = useState("");

    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const fileInputRef = useRef(null);

    // =========================
    // STATE BẠN BÈ
    // =========================

    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(true);

    // =========================
    // STATE THÔNG BÁO
    // =========================

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] =
        useState(false);

    const [hideNotificationBadge, setHideNotificationBadge] =
        useState(false);

    const [deletingNotificationId, setDeletingNotificationId] =
        useState(null);

    const notificationRef = useRef(null);

    // =========================
    // STATE BÌNH LUẬN
    // =========================

    const [comments, setComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [openComments, setOpenComments] = useState({});
    const [loadingComments, setLoadingComments] = useState({});

    // =====================================================
    // LẤY BÀI VIẾT
    // =====================================================

    const fetchPosts = async () => {
        try {
            const url = user?.id
                ? `http://localhost/it-connect-php/posts/posts.php?user_id=${user.id}`
                : "http://localhost/it-connect-php/posts/posts.php";

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                console.log(data.message);
                return;
            }

            setPosts(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {
            console.log(
                "Lỗi lấy bài viết:",
                error
            );
        } finally {
            setLoadingPosts(false);
        }
    };

    // =====================================================
    // LẤY DANH SÁCH BẠN BÈ
    // =====================================================

    const fetchFriends = async () => {
        if (!user?.id) {
            setLoadingFriends(false);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost/it-connect-php/friends/list.php?user_id=${user.id}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.log(
                    "Lỗi lấy danh sách bạn bè:",
                    data.message
                );

                setFriends([]);
                return;
            }

            setFriends(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {
            console.log(
                "Lỗi lấy danh sách bạn bè:",
                error
            );

            setFriends([]);

        } finally {
            setLoadingFriends(false);
        }
    };

    // =====================================================
    // LẤY THÔNG BÁO
    // =====================================================

    const fetchNotifications = async () => {
        if (!user?.id) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost/it-connect-php/notifications/notifications.php?user_id=${user.id}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.log(
                    "Lỗi lấy thông báo:",
                    data.message
                );
                return;
            }

            if (!Array.isArray(data)) {
                return;
            }

            setNotifications(data);

            const count = data.filter(
                (notification) =>
                    Number(notification.is_read) === 0
            ).length;

            if (
                !showNotifications &&
                !hideNotificationBadge
            ) {
                setUnreadCount(count);
            }

        } catch (error) {
            console.log(
                "Lỗi lấy thông báo:",
                error
            );
        }
    };

    // =====================================================
    // CHỌN FILE
    // =====================================================

    const handleFileSelect = (
        event,
        type
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setMessage("");

        setSelectedFile(file);
        setFileType(type);

        // =========================
        // TẠO PREVIEW
        // =========================

        if (
            type === "image" ||
            type === "video"
        ) {
            const previewUrl =
                URL.createObjectURL(file);

            setFilePreview(previewUrl);

        } else {

            setFilePreview(null);
        }
    };

    // =====================================================
    // XÓA FILE ĐÃ CHỌN
    // =====================================================

    const handleRemoveFile = () => {

        if (filePreview) {
            URL.revokeObjectURL(
                filePreview
            );
        }

        setSelectedFile(null);
        setFilePreview(null);
        setFileType("");

        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }

        if (videoInputRef.current) {
            videoInputRef.current.value = "";
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // =====================================================
    // BẤM ICON CHUÔNG
    // =====================================================

    const handleNotificationClick = async () => {
        const newState =
            !showNotifications;

        setShowNotifications(
            newState
        );

        if (newState) {
            await fetchNotifications();

            setUnreadCount(0);
            setHideNotificationBadge(true);
        }
    };

    // =====================================================
    // CLICK RA NGOÀI DROPDOWN
    // =====================================================

    useEffect(() => {

        const handleClickOutside =
            (event) => {

                if (
                    notificationRef.current &&
                    !notificationRef.current.contains(
                        event.target
                    )
                ) {
                    setShowNotifications(false);
                }
            };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);

    // =====================================================
    // XÓA THÔNG BÁO
    // =====================================================

    const handleDeleteNotification =
        async (
            notificationId
        ) => {

            if (
                !user?.id ||
                !notificationId
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    "Bạn có muốn xóa thông báo này không?"
                );

            if (!confirmed) {
                return;
            }

            setDeletingNotificationId(
                notificationId
            );

            try {

                const response =
                    await fetch(
                        `http://localhost/it-connect-php/notifications/delete.php?id=${notificationId}&user_id=${user.id}`,
                        {
                            method: "DELETE"
                        }
                    );

                const data =
                    await response.json()
                        .catch(
                            () => ({})
                        );

                if (!response.ok) {
                    console.log(
                        data.message ||
                        response.status
                    );

                    return;
                }

                setNotifications(
                    (current) =>
                        current.filter(
                            (notification) =>
                                String(
                                    notification.id
                                ) !==
                                String(
                                    notificationId
                                )
                        )
                );

            } catch (error) {

                console.log(
                    "Lỗi xóa thông báo:",
                    error
                );

            } finally {

                setDeletingNotificationId(
                    null
                );
            }
        };

    // =====================================================
    // ĐÁNH DẤU THÔNG BÁO
    // =====================================================

    const markNotificationAsRead =
        async (
            notification
        ) => {

            if (!notification) {
                return;
            }

            if (
                Number(
                    notification.is_read
                ) === 0
            ) {

                setNotifications(
                    (current) =>
                        current.map(
                            (item) =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    notification.id
                                )
                                    ? {
                                        ...item,
                                        is_read: 1
                                    }
                                    : item
                        )
                );

                setUnreadCount(
                    (current) =>
                        Math.max(
                            0,
                            current - 1
                        )
                );

                try {

                    const response =
                        await fetch(
                            `http://localhost/it-connect-php/notifications/read.php?id=${notification.id}`,
                            {
                                method: "PUT"
                            }
                        );

                    const data =
                        await response.json()
                            .catch(
                                () => ({})
                            );

                    if (!response.ok) {
                        console.log(
                            data.message ||
                            response.status
                        );
                    }

                } catch (error) {

                    console.log(
                        "Lỗi đánh dấu thông báo:",
                        error
                    );
                }
            }
        };

    // =====================================================
    // CLICK THÔNG BÁO
    // =====================================================

    const handleNotificationItemClick =
        (
            notification
        ) => {

            if (!notification) {
                return;
            }

            setShowNotifications(
                false
            );

            markNotificationAsRead(
                notification
            );

            if (
                notification.type ===
                "friend_request"
            ) {

                navigate(
                    "/friends?tab=requests"
                );

                return;
            }

            if (
                notification.type ===
                "friend_accept"
            ) {

                navigate(
                    "/friends"
                );

                return;
            }

            if (
                notification.type ===
                "message"
            ) {

                if (
                    notification.from_user_id
                ) {

                    navigate(
                        `/messages?user=${notification.from_user_id}`
                    );

                } else {

                    navigate(
                        "/messages"
                    );
                }

                return;
            }

            navigate(
                "/notifications"
            );
        };

    // =====================================================
    // ĐÁNH DẤU TẤT CẢ
    // =====================================================

    const markAllNotificationsAsRead =
        async () => {

            if (
                !user?.id ||
                unreadCount === 0
            ) {
                return;
            }

            setNotifications(
                (current) =>
                    current.map(
                        (notification) => ({
                            ...notification,
                            is_read: 1
                        })
                    )
            );

            setUnreadCount(0);
            setHideNotificationBadge(
                true
            );

            try {

                const response =
                    await fetch(
                        `http://localhost/it-connect-php/notifications/read-all.php?user_id=${user.id}`,
                        {
                            method: "PUT"
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    console.log(
                        data.message
                    );
                }

            } catch (error) {

                console.log(
                    "Lỗi đánh dấu tất cả:",
                    error
                );
            }
        };

    // =====================================================
    // ICON THÔNG BÁO
    // =====================================================

    const getNotificationIcon =
        (type) => {

            switch (type) {

                case "friend_request":
                    return "👥";

                case "friend_accept":
                    return "🤝";

                case "message":
                    return "💬";

                default:
                    return "🔔";
            }
        };

    // =====================================================
    // THỜI GIAN
    // =====================================================

    const formatNotificationTime =
        (createdAt) => {

            if (!createdAt) {
                return "";
            }

            const date =
                new Date(createdAt);

            const now =
                new Date();

            const diff =
                Math.floor(
                    (now - date) / 1000
                );

            if (diff < 60) {
                return "Vừa xong";
            }

            if (diff < 3600) {
                return (
                    Math.floor(
                        diff / 60
                    ) +
                    " phút trước"
                );
            }

            if (diff < 86400) {
                return (
                    Math.floor(
                        diff / 3600
                    ) +
                    " giờ trước"
                );
            }

            if (diff < 604800) {
                return (
                    Math.floor(
                        diff / 86400
                    ) +
                    " ngày trước"
                );
            }

            return date.toLocaleDateString(
                "vi-VN"
            );
        };

    // =====================================================
    // TỰ ĐỘNG LẤY DỮ LIỆU
    // =====================================================

    useEffect(() => {

        fetchPosts();
        fetchFriends();
        fetchNotifications();

        const notificationInterval =
            setInterval(
                () => {
                    fetchNotifications();
                },
                2000
            );

        return () => {
            clearInterval(
                notificationInterval
            );
        };

    }, []);

    // =====================================================
    // ĐĂNG BÀI
    // =====================================================

    const handlePost = async () => {

        if (!user) {

            setMessage(
                "Bạn chưa đăng nhập!"
            );

            return;
        }

        if (
            !content.trim() &&
            !selectedFile
        ) {

            setMessage(
                "Hãy nhập nội dung hoặc chọn hình ảnh, video, tệp!"
            );

            return;
        }

        try {

            setMessage(
                "Đang đăng bài..."
            );


            // ============================================
            // FORMDATA
            // ============================================

            const formData =
                new FormData();

            formData.append(
                "user_id",
                user.id
            );

            formData.append(
                "content",
                content
            );

            if (selectedFile) {

                formData.append(
                    "media",
                    selectedFile
                );
            }


            const response =
                await fetch(
                    "http://localhost/it-connect-php/posts/posts.php",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Không thể đăng bài!"
                );

                return;
            }


            setMessage(
                "Đăng bài thành công!"
            );


            // ============================================
            // RESET
            // ============================================

            setContent("");

            handleRemoveFile();

            fetchPosts();

        } catch (error) {

            console.log(
                "Lỗi đăng bài:",
                error
            );

            setMessage(
                "Không thể kết nối đến server!"
            );
        }
    };

    // =====================================================
    // LIKE
    // =====================================================

    const handleLike = async (
        postId
    ) => {

        if (!user) {
            return;
        }

        try {

            const response =
                await fetch(
                    `http://localhost/it-connect-php/posts/likes.php?post_id=${postId}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            user_id:
                                user.id
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                console.log(
                    data.message
                );

                return;
            }

            setPosts(
                (currentPosts) =>
                    currentPosts.map(
                        (post) => {

                            if (
                                post.id !==
                                postId
                            ) {
                                return post;
                            }

                            const currentLikeCount =
                                Number(
                                    post.like_count
                                ) || 0;

                            return {
                                ...post,

                                liked:
                                    data.liked
                                        ? 1
                                        : 0,

                                like_count:
                                    data.liked
                                        ? currentLikeCount + 1
                                        : Math.max(
                                            0,
                                            currentLikeCount - 1
                                        )
                            };
                        }
                    )
            );

        } catch (error) {

            console.log(
                "Lỗi Like:",
                error
            );
        }
    };

    // =====================================================
    // LẤY COMMENT
    // =====================================================

    const fetchComments =
        async (
            postId
        ) => {

            setLoadingComments(
                (current) => ({
                    ...current,
                    [postId]: true
                })
            );

            try {

                const response =
                    await fetch(
                        `http://localhost/it-connect-php/posts/comments.php?post_id=${postId}`
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    console.log(
                        data.message
                    );

                    return;
                }

                setComments(
                    (current) => ({
                        ...current,
                        [postId]:
                            data
                    })
                );

            } catch (error) {

                console.log(
                    "Lỗi lấy bình luận:",
                    error
                );

            } finally {

                setLoadingComments(
                    (current) => ({
                        ...current,
                        [postId]: false
                    })
                );
            }
        };

    // =====================================================
    // MỞ COMMENT
    // =====================================================

    const handleToggleComments =
        (
            postId
        ) => {

            const isOpen =
                openComments[
                    postId
                ];

            setOpenComments(
                (current) => ({
                    ...current,
                    [postId]:
                        !isOpen
                })
            );

            if (!isOpen) {
                fetchComments(
                    postId
                );
            }
        };

    // =====================================================
    // NHẬP COMMENT
    // =====================================================

    const handleCommentChange =
        (
            postId,
            value
        ) => {

            setCommentInputs(
                (current) => ({
                    ...current,
                    [postId]:
                        value
                })
            );
        };

    // =====================================================
    // GỬI COMMENT
    // =====================================================

    const handleComment =
        async (
            postId
        ) => {

            if (!user) {
                return;
            }

            const commentContent =
                commentInputs[
                    postId
                ] || "";

            if (
                !commentContent.trim()
            ) {
                return;
            }

            try {

                const response =
                    await fetch(
                        `http://localhost/it-connect-php/posts/comments.php?post_id=${postId}`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    user_id:
                                        user.id,

                                    content:
                                        commentContent
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    console.log(
                        data.message
                    );

                    return;
                }

                setCommentInputs(
                    (current) => ({
                        ...current,
                        [postId]:
                            ""
                    })
                );

                setComments(
                    (current) => ({
                        ...current,

                        [postId]: [
                            ...(current[
                                postId
                            ] || []),

                            {
                                ...data.comment,
                                name:
                                    user.name,
                                avatar:
                                    user.avatar,
                                class:
                                    user.class,
                                created_at:
                                    new Date()
                            }
                        ]
                    })
                );

                setPosts(
                    (currentPosts) =>
                        currentPosts.map(
                            (post) => {

                                if (
                                    post.id !==
                                    postId
                                ) {
                                    return post;
                                }

                                return {
                                    ...post,

                                    comment_count:
                                        (
                                            Number(
                                                post.comment_count
                                            ) || 0
                                        ) + 1
                                };
                            }
                        )
                );

            } catch (error) {

                console.log(
                    "Lỗi gửi bình luận:",
                    error
                );
            }
        };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="app">

            {/* =========================
                HEADER
            ========================= */}

            <header className="header">

                <Link
                    to="/home"
                    className="logo"
                >
                    🎓 IT CONNECT
                </Link>

                <div className="search">
                    🔍

                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                    />
                </div>

                <div className="header-right">

                    {/* THÔNG BÁO */}

                    <div
                        className="notification-container"
                        ref={
                            notificationRef
                        }
                    >

                        <button
                            className={
                                "notification-wrapper " +
                                (
                                    showNotifications
                                        ? "notification-active"
                                        : ""
                                )
                            }
                            onClick={
                                handleNotificationClick
                            }
                            title="Thông báo"
                        >

                            <span className="notification-icon">
                                🔔
                            </span>

                            {
                                unreadCount >
                                0 &&
                                !hideNotificationBadge && (
                                    <span className="notification-badge">
                                        {
                                            unreadCount >
                                            9
                                                ? "9+"
                                                : unreadCount
                                        }
                                    </span>
                                )
                            }

                        </button>

                        {
                            showNotifications && (

                                <div className="notification-dropdown">

                                    <div className="notification-header">

                                        <h3>
                                            Thông báo
                                        </h3>

                                        {
                                            notifications.some(
                                                (
                                                    notification
                                                ) =>
                                                    Number(
                                                        notification.is_read
                                                    ) === 0
                                            ) && (

                                                <button
                                                    onClick={
                                                        markAllNotificationsAsRead
                                                    }
                                                >
                                                    Đánh dấu tất cả đã đọc
                                                </button>
                                            )
                                        }

                                    </div>

                                    <div className="notification-list">

                                        {
                                            notifications.length ===
                                            0 ? (

                                                <div className="notification-empty">

                                                    <div className="notification-empty-icon">
                                                        🔔
                                                    </div>

                                                    <strong>
                                                        Không có thông báo
                                                    </strong>

                                                    <p>
                                                        Khi có hoạt động mới, bạn sẽ thấy thông báo ở đây.
                                                    </p>

                                                </div>

                                            ) : (

                                                notifications.map(
                                                    (
                                                        notification
                                                    ) => (

                                                        <div
                                                            key={
                                                                notification.id
                                                            }

                                                            className={
                                                                "notification-item " +
                                                                (
                                                                    Number(
                                                                        notification.is_read
                                                                    ) === 0
                                                                        ? "unread"
                                                                        : ""
                                                                )
                                                            }

                                                            onClick={() =>
                                                                handleNotificationItemClick(
                                                                    notification
                                                                )
                                                            }
                                                        >

                                                            <div className="notification-item-icon">
                                                                {
                                                                    getNotificationIcon(
                                                                        notification.type
                                                                    )
                                                                }
                                                            </div>

                                                            <div className="notification-item-content">

                                                                <p>

                                                                    {
                                                                        notification.name && (
                                                                            <strong>
                                                                                {
                                                                                    notification.name
                                                                                }
                                                                            </strong>
                                                                        )
                                                                    }

                                                                    {" "}

                                                                    {
                                                                        notification.content
                                                                    }

                                                                </p>

                                                                <span>
                                                                    {
                                                                        formatNotificationTime(
                                                                            notification.created_at
                                                                        )
                                                                    }
                                                                </span>

                                                            </div>

                                                            {
                                                                Number(
                                                                    notification.is_read
                                                                ) ===
                                                                0 && (
                                                                    <span className="notification-unread-dot"></span>
                                                                )
                                                            }

                                                        </div>
                                                    )
                                                )
                                            )
                                        }

                                    </div>

                                    {
                                        notifications.length >
                                        0 && (

                                            <div className="notification-footer">

                                                <button
                                                    onClick={() => {

                                                        setShowNotifications(
                                                            false
                                                        );

                                                        navigate(
                                                            "/notifications"
                                                        );

                                                    }}
                                                >
                                                    Xem tất cả thông báo
                                                </button>

                                            </div>
                                        )
                                    }

                                </div>
                            )
                        }

                    </div>

                    {/* USER */}

                    <div
                        className="user"
                        onClick={() =>
                            navigate(
                                "/account"
                            )
                        }
                    >

                        <div className="avatar">

                            {user?.avatar ? (

                                <img
                                    src={
                                        getAvatarUrl(
                                            user.avatar
                                        )
                                    }
                                    alt="Avatar"
                                    className="avatar-image"
                                />

                            ) : (

                                user?.name
                                    ? user.name
                                        .charAt(
                                            0
                                        )
                                        .toUpperCase()
                                    : "Đ"
                            )}

                        </div>

                        <span>
                            {
                                user?.name ||
                                "Đạt"
                            }
                        </span>

                    </div>

                </div>

            </header>


            {/* =========================
                MAIN
            ========================= */}

            <div className="main-layout">

                {/* SIDEBAR */}

                <aside className="sidebar">

                    <nav>

                        <Link
                            to="/home"
                            className="menu active"
                        >
                            <span>🏠</span>
                            Trang chủ
                        </Link>

                        <Link
                            to="/friends"
                            className="menu"
                        >
                            <span>👥</span>
                            Bạn bè
                        </Link>

                        <Link
                            to="/messages"
                            className="menu"
                        >
                            <span>💬</span>
                            Tin nhắn
                        </Link>

                        <Link
                            to="/account"
                            className="menu"
                        >
                            <span>👤</span>
                            Tài khoản
                        </Link>

                    </nav>

                    <div className="sidebar-bottom">

                        <button
                            className="menu logout"
                            onClick={() => {

                                localStorage.removeItem(
                                    "user"
                                );

                                window.location.href =
                                    "/";

                            }}
                        >
                            <span>🚪</span>
                            Đăng xuất
                        </button>

                    </div>

                </aside>


                {/* =========================
                    NỘI DUNG
                ========================= */}

                <main className="content">

                    {/* =========================
                        TẠO BÀI
                    ========================= */}

                    <section className="create-post">

                        <div className="post-user">

                            <div className="avatar big">

                                {user?.avatar ? (

                                    <img
                                        src={
                                            getAvatarUrl(
                                                user.avatar
                                            )
                                        }
                                        alt="Avatar"
                                        className="avatar-image"
                                    />

                                ) : (

                                    user?.name
                                        ? user.name
                                            .charAt(
                                                0
                                            )
                                            .toUpperCase()
                                        : "Đ"
                                )}

                            </div>

                            <input
                                type="text"
                                placeholder="Bạn đang nghĩ gì?"
                                value={content}
                                onChange={(e) => {

                                    setContent(
                                        e.target.value
                                    );

                                    setMessage("");

                                }}
                            />

                        </div>


                        {/* =========================
                            PREVIEW FILE
                        ========================= */}

                        {selectedFile && (

                            <div className="selected-media">

                                <button
                                    className="remove-media"
                                    onClick={
                                        handleRemoveFile
                                    }
                                    type="button"
                                >
                                    ✕
                                </button>

                                {
                                    fileType ===
                                    "image" &&
                                    filePreview && (

                                        <img
                                            src={
                                                filePreview
                                            }
                                            alt="Preview"
                                            className="media-preview-image"
                                        />

                                    )
                                }

                                {
                                    fileType ===
                                    "video" &&
                                    filePreview && (

                                        <video
                                            src={
                                                filePreview
                                            }
                                            controls
                                            className="media-preview-video"
                                        />

                                    )
                                }

                                {
                                    fileType ===
                                    "file" && (

                                        <div className="file-preview">

                                            <span className="file-preview-icon">
                                                📎
                                            </span>

                                            <div>
                                                <strong>
                                                    {
                                                        selectedFile.name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        (
                                                            selectedFile.size /
                                                            1024 /
                                                            1024
                                                        ).toFixed(
                                                            2
                                                        )
                                                    }
                                                    {" MB"}
                                                </small>
                                            </div>

                                        </div>
                                    )
                                }

                            </div>
                        )}


                        {/* =========================
                            INPUT ẨN
                        ========================= */}

                        <input
                            ref={
                                imageInputRef
                            }
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) =>
                                handleFileSelect(
                                    e,
                                    "image"
                                )
                            }
                        />

                        <input
                            ref={
                                videoInputRef
                            }
                            type="file"
                            accept="video/*"
                            hidden
                            onChange={(e) =>
                                handleFileSelect(
                                    e,
                                    "video"
                                )
                            }
                        />

                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                            hidden
                            onChange={(e) =>
                                handleFileSelect(
                                    e,
                                    "file"
                                )
                            }
                        />


                        {/* =========================
                            ACTIONS
                        ========================= */}

                        <div className="post-actions">

                            <button
                                type="button"
                                onClick={() =>
                                    imageInputRef.current?.click()
                                }
                            >
                                🖼️ Hình ảnh
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    videoInputRef.current?.click()
                                }
                            >
                                🎥 Video
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                            >
                                📎 Tệp
                            </button>

                            <button
                                className="post-btn"
                                onClick={
                                    handlePost
                                }
                                type="button"
                            >
                                Đăng bài
                            </button>

                        </div>


                        {
                            message && (

                                <p className="post-message">
                                    {message}
                                </p>

                            )
                        }

                    </section>


                    {/* =========================
                        DANH SÁCH BÀI
                    ========================= */}

                    {
                        loadingPosts ? (

                            <p className="loading-text">
                                Đang tải bài viết...
                            </p>

                        ) : posts.length === 0 ? (

                            <p className="loading-text">
                                Chưa có bài viết nào.
                            </p>

                        ) : (

                            posts.map(
                                (post) => (

                                    <section
                                        className="post"
                                        key={
                                            post.id
                                        }
                                    >

                                        {/* HEADER */}

                                        <div className="post-header">

                                            <div className="avatar">

                                                {post.avatar ? (

                                                    <img
                                                        src={
                                                            getAvatarUrl(
                                                                post.avatar
                                                            )
                                                        }
                                                        alt="Avatar"
                                                        className="avatar-image"
                                                    />

                                                ) : (

                                                    post.name
                                                        ? post.name
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                        : "?"
                                                )}

                                            </div>

                                            <div>

                                                <h3>
                                                    {
                                                        post.name
                                                    }
                                                </h3>

                                                <span>

                                                    {
                                                        post.created_at
                                                            ? new Date(
                                                                post.created_at
                                                            ).toLocaleString(
                                                                "vi-VN"
                                                            )
                                                            : "Vừa đăng"
                                                    }

                                                    {" · Khoa CNTT"}

                                                </span>

                                            </div>

                                        </div>


                                        {/* NỘI DUNG */}

                                        {
                                            post.content && (

                                                <div className="post-content">

                                                    <p>
                                                        {
                                                            post.content
                                                        }
                                                    </p>

                                                </div>

                                            )
                                        }


                                        {/* =========================
                                            MEDIA BÀI VIẾT
                                        ========================= */}

                                        {
                                            post.media_type ===
                                            "image" &&
                                            post.image && (

                                                <div className="post-media">

                                                    <img
                                                        src={
                                                            getMediaUrl(
                                                                post.image
                                                            )
                                                        }
                                                        alt="Ảnh bài viết"
                                                        className="post-image"
                                                    />

                                                </div>

                                            )
                                        }


                                        {
                                            post.media_type ===
                                            "video" &&
                                            post.file && (

                                                <div className="post-media">

                                                    <video
                                                        src={
                                                            getMediaUrl(
                                                                post.file
                                                            )
                                                        }
                                                        controls
                                                        className="post-video"
                                                    />

                                                </div>

                                            )
                                        }


                                        {
                                            post.media_type ===
                                            "file" &&
                                            post.file && (

                                                <div className="post-file">

                                                    <div className="post-file-icon">
                                                        📎
                                                    </div>

                                                    <div className="post-file-info">

                                                        <strong>
                                                            {
                                                                post.file
                                                                    .split(
                                                                        "/"
                                                                    )
                                                                    .pop()
                                                            }
                                                        </strong>

                                                        <span>
                                                            Tệp đính kèm
                                                        </span>

                                                    </div>

                                                    <a
                                                        href={
                                                            getMediaUrl(
                                                                post.file
                                                            )
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="post-file-button"
                                                    >
                                                        Mở tệp
                                                    </a>

                                                </div>

                                            )
                                        }


                                        {/* THỐNG KÊ */}

                                        <div className="post-stats">

                                            <span>
                                                ❤️{" "}
                                                {
                                                    Number(
                                                        post.like_count
                                                    ) ||
                                                    0
                                                }
                                                {" lượt thích"}
                                            </span>

                                            <span>
                                                💬{" "}
                                                {
                                                    Number(
                                                        post.comment_count
                                                    ) ||
                                                    0
                                                }
                                                {" bình luận"}
                                            </span>

                                        </div>


                                        {/* NÚT */}

                                        <div className="post-footer">

                                            <button
                                                className={
                                                    Number(
                                                        post.liked
                                                    ) ===
                                                    1
                                                        ? "liked"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    handleLike(
                                                        post.id
                                                    )
                                                }
                                            >
                                                {
                                                    Number(
                                                        post.liked
                                                    ) ===
                                                    1
                                                        ? "❤️ Đã thích"
                                                        : "♡ Thích"
                                                }
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleToggleComments(
                                                        post.id
                                                    )
                                                }
                                            >
                                                💬 Bình luận
                                            </button>

                                            <button>
                                                ↗ Chia sẻ
                                            </button>

                                        </div>


                                        {/* COMMENT */}

                                        {
                                            openComments[
                                                post.id
                                            ] && (

                                                <div className="comments-section">

                                                    <div className="comment-input">

                                                        <div className="avatar small">

                                                            {user?.avatar ? (

                                                                <img
                                                                    src={
                                                                        getAvatarUrl(
                                                                            user.avatar
                                                                        )
                                                                    }
                                                                    alt="Avatar"
                                                                    className="avatar-image"
                                                                />

                                                            ) : (

                                                                user?.name
                                                                    ? user.name
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()
                                                                    : "?"
                                                            )}

                                                        </div>

                                                        <input
                                                            type="text"
                                                            placeholder="Viết bình luận..."
                                                            value={
                                                                commentInputs[
                                                                    post.id
                                                                ] ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleCommentChange(
                                                                    post.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            onKeyDown={(e) => {

                                                                if (
                                                                    e.key ===
                                                                    "Enter"
                                                                ) {

                                                                    handleComment(
                                                                        post.id
                                                                    );
                                                                }
                                                            }}
                                                        />

                                                        <button
                                                            onClick={() =>
                                                                handleComment(
                                                                    post.id
                                                                )
                                                            }
                                                        >
                                                            Gửi
                                                        </button>

                                                    </div>


                                                    {
                                                        loadingComments[
                                                            post.id
                                                        ] ? (

                                                            <p className="comment-loading">
                                                                Đang tải bình luận...
                                                            </p>

                                                        ) : (

                                                            <div className="comments-list">

                                                                {
                                                                    comments[
                                                                        post.id
                                                                    ]?.length >
                                                                    0 ? (

                                                                        comments[
                                                                            post.id
                                                                        ].map(
                                                                            (
                                                                                comment
                                                                            ) => (

                                                                                <div
                                                                                    className="comment"
                                                                                    key={
                                                                                        comment.id
                                                                                    }
                                                                                >

                                                                                    <div className="avatar small">

                                                                                        {
                                                                                            comment.avatar ? (

                                                                                                <img
                                                                                                    src={
                                                                                                        getAvatarUrl(
                                                                                                            comment.avatar
                                                                                                        )
                                                                                                    }
                                                                                                    alt="Avatar"
                                                                                                    className="avatar-image"
                                                                                                />

                                                                                            ) : (

                                                                                                comment.name
                                                                                                    ? comment.name
                                                                                                        .charAt(
                                                                                                            0
                                                                                                        )
                                                                                                        .toUpperCase()
                                                                                                    : "?"
                                                                                            )
                                                                                        }

                                                                                    </div>

                                                                                    <div className="comment-body">

                                                                                        <div className="comment-user">

                                                                                            <strong>
                                                                                                {
                                                                                                    comment.name
                                                                                                }
                                                                                            </strong>

                                                                                            <span>
                                                                                                {
                                                                                                    comment.created_at
                                                                                                        ? new Date(
                                                                                                            comment.created_at
                                                                                                        ).toLocaleString(
                                                                                                            "vi-VN"
                                                                                                        )
                                                                                                        : ""
                                                                                                }
                                                                                            </span>

                                                                                        </div>

                                                                                        <p>
                                                                                            {
                                                                                                comment.content
                                                                                            }
                                                                                        </p>

                                                                                    </div>

                                                                                </div>

                                                                            )
                                                                        )

                                                                    ) : (

                                                                        <p className="no-comments">
                                                                            Chưa có bình luận nào.
                                                                        </p>

                                                                    )
                                                                }

                                                            </div>
                                                        )
                                                    }

                                                </div>
                                            )
                                        }

                                    </section>
                                )
                            )
                        )
                    }

                </main>


                {/* =========================
                    SIDEBAR PHẢI
                ========================= */}

                <aside className="right-sidebar">

                    <div className="right-box">

                        <h3>
                            👥 Bạn bè online
                        </h3>

                        {
                            loadingFriends ? (

                                <p className="friend-loading">
                                    Đang tải bạn bè...
                                </p>

                            ) : friends.length ===
                            0 ? (

                                <div className="notification-empty">

                                    <div className="notification-empty-icon">
                                        👥
                                    </div>

                                    <strong>
                                        Chưa có bạn bè
                                    </strong>

                                    <p>
                                        Hãy kết bạn với sinh viên khác để kết nối.
                                    </p>

                                </div>

                            ) : (

                                friends.map(
                                    (friend) => (

                                        <div
                                            className="friend"
                                            key={
                                                friend.id
                                            }
                                        >

                                            <div className="avatar small">

                                                {friend.avatar ? (

                                                    <img
                                                        src={
                                                            getAvatarUrl(
                                                                friend.avatar
                                                            )
                                                        }
                                                        alt={
                                                            friend.name
                                                        }
                                                        className="avatar-image"
                                                    />

                                                ) : (

                                                    friend.name
                                                        ? friend.name
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                        : "?"
                                                )}

                                            </div>

                                            <div className="friend-info">

                                                <strong>
                                                    {
                                                        friend.name
                                                    }
                                                </strong>

                                                <span className="online">
                                                    ● Online
                                                </span>

                                            </div>

                                        </div>
                                    )
                                )
                            )
                        }

                        <button
                            className="view-all"
                            onClick={() =>
                                navigate(
                                    "/friends"
                                )
                            }
                        >
                            Xem tất cả
                        </button>

                    </div>

                </aside>

            </div>

        </div>
    );
}

export default Home;