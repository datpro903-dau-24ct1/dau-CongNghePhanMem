import { useEffect, useState, useRef } from "react";
import "./Home.css";
import { Link, useNavigate } from "react-router-dom";

function Home() {

    const navigate = useNavigate();

    // =========================
    // USER ĐANG ĐĂNG NHẬP
    // =========================

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    // =========================
    // STATE
    // =========================

    const [content, setContent] = useState("");
    const [message, setMessage] = useState("");

    const [posts, setPosts] = useState([]);

    const [loadingPosts, setLoadingPosts] = useState(true);

    // =========================
    // THÔNG BÁO
    // =========================

    const [unreadCount, setUnreadCount] = useState(0);

    const [notifications, setNotifications] = useState([]);

    const [showNotifications, setShowNotifications] =
        useState(false);

    const notificationRef = useRef(null);

    // =========================
    // COMMENT
    // =========================

    const [comments, setComments] = useState({});

    const [commentInputs, setCommentInputs] = useState({});

    const [openComments, setOpenComments] = useState({});

    const [loadingComments, setLoadingComments] = useState({});


    // =========================
    // LẤY BÀI VIẾT
    // =========================

    const fetchPosts = async () => {

        try {

            const url = user?.id
                ? `http://localhost:5000/api/posts?user_id=${user.id}`
                : "http://localhost:5000/api/posts";

            const response = await fetch(url);

            const data = await response.json();

            if (!response.ok) {

                console.log(data.message);

                return;
            }

            setPosts(data);

        } catch (error) {

            console.log(
                "Lỗi lấy bài viết:",
                error
            );

        } finally {

            setLoadingPosts(false);

        }

    };


    // =========================
    // LẤY SỐ THÔNG BÁO CHƯA ĐỌC
    // =========================

    const fetchUnreadNotifications = async () => {

        if (!user?.id) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/notifications/${user.id}/unread-count`
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(data.message);

                return;
            }

            setUnreadCount(
                Number(data.count) || 0
            );

        } catch (error) {

            console.log(
                "Lỗi lấy số thông báo:",
                error
            );

        }

    };


    // =========================
    // LẤY DANH SÁCH THÔNG BÁO
    // =========================

    const fetchNotifications = async () => {

        if (!user?.id) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/notifications/${user.id}`
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(data.message);

                return;
            }

            setNotifications(data);

        } catch (error) {

            console.log(
                "Lỗi lấy thông báo:",
                error
            );

        }

    };


    // =========================
    // MỞ / ĐÓNG THÔNG BÁO
    // =========================

    const handleNotificationClick = async () => {

        const newState = !showNotifications;

        setShowNotifications(newState);

        if (newState) {

            await fetchNotifications();

        }

    };


    // =========================
    // CLICK RA NGOÀI
    // ĐÓNG THÔNG BÁO
    // =========================

    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
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


    // =========================
    // ĐÁNH DẤU 1 THÔNG BÁO ĐÃ ĐỌC
    // =========================

    const markNotificationAsRead = async (
        notification
    ) => {

        if (!notification) {
            return;
        }

        // Nếu chưa đọc thì đánh dấu đã đọc
        // Không chặn việc chuyển trang nếu API bị lỗi
        if (Number(notification.is_read) === 0) {

            try {

                const response = await fetch(
                    `http://localhost:5000/api/notifications/${notification.id}/read`,
                    {
                        method: "PUT"
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {

                    console.log(
                        "Lỗi đánh dấu thông báo:",
                        data.message || response.status
                    );

                    return;
                }

                // Cập nhật giao diện
                setNotifications((current) =>
                    current.map((item) =>
                        item.id === notification.id
                            ? {
                                ...item,
                                is_read: 1
                            }
                            : item
                    )
                );

                // Giảm badge
                setUnreadCount((current) =>
                    Math.max(0, current - 1)
                );

            } catch (error) {

                console.log(
                    "Lỗi đánh dấu thông báo:",
                    error
                );

            }

        }

    };



    // =========================
    // CLICK VÀO 1 THÔNG BÁO
    // CHUYỂN ĐẾN ĐÚNG CHỨC NĂNG
    // =========================

    const handleNotificationItemClick = (
        notification
    ) => {

        if (!notification) {
            return;
        }

        // Đóng popup trước khi chuyển trang
        setShowNotifications(false);

        // Đánh dấu đã đọc ở background,
        // không await để không làm chậm navigate
        markNotificationAsRead(notification);

        // Lời mời kết bạn
        if (notification.type === "friend_request") {

            navigate("/friends?tab=requests");

            return;
        }

        // Có người chấp nhận lời mời kết bạn
        if (notification.type === "friend_accept") {

            navigate("/friends");

            return;
        }

        // Có tin nhắn mới
        if (notification.type === "message") {

            if (notification.from_user_id) {

                navigate(
                    `/messages?user=${notification.from_user_id}`
                );

            } else {

                navigate("/messages");

            }

            return;
        }

        // Các loại thông báo khác
        navigate("/notifications");

    };


    // =========================
    // ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
    // =========================

    const markAllNotificationsAsRead = async () => {

        if (!user?.id || unreadCount === 0) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/notifications/${user.id}/read-all`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(data.message);

                return;
            }

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    is_read: 1
                }))
            );

            setUnreadCount(0);

        } catch (error) {

            console.log(
                "Lỗi đánh dấu tất cả:",
                error
            );

        }

    };


    // =========================
    // ICON THÔNG BÁO
    // =========================

    const getNotificationIcon = (type) => {

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


    // =========================
    // THỜI GIAN THÔNG BÁO
    // =========================

    const formatNotificationTime = (
        createdAt
    ) => {

        if (!createdAt) {
            return "";
        }

        const date = new Date(createdAt);

        const now = new Date();

        const diff =
            Math.floor(
                (now - date) / 1000
            );

        if (diff < 60) {
            return "Vừa xong";
        }

        if (diff < 3600) {

            return (
                Math.floor(diff / 60) +
                " phút trước"
            );

        }

        if (diff < 86400) {

            return (
                Math.floor(diff / 3600) +
                " giờ trước"
            );

        }

        if (diff < 604800) {

            return (
                Math.floor(diff / 86400) +
                " ngày trước"
            );

        }

        return date.toLocaleDateString(
            "vi-VN"
        );

    };


    // =========================
    // TỰ ĐỘNG LẤY DỮ LIỆU
    // =========================

    useEffect(() => {

        fetchPosts();

        fetchUnreadNotifications();

        const notificationInterval =
            setInterval(() => {

                fetchUnreadNotifications();

            }, 10000);

        return () => {

            clearInterval(
                notificationInterval
            );

        };

    }, []);


    // =========================
    // ĐĂNG BÀI
    // =========================

    const handlePost = async () => {

        if (!content.trim()) {

            setMessage(
                "Vui lòng nhập nội dung bài viết!"
            );

            return;
        }

        if (!user) {

            setMessage(
                "Bạn chưa đăng nhập!"
            );

            return;
        }

        try {

            const response = await fetch(
                "http://localhost:5000/api/posts",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        user_id: user.id,
                        content: content
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message
                );

                return;
            }

            setMessage(
                "Đăng bài thành công!"
            );

            setContent("");

            fetchPosts();

        } catch (error) {

            console.log(error);

            setMessage(
                "Không thể kết nối đến server!"
            );

        }

    };


    // =========================
    // LIKE / BỎ LIKE
    // =========================

    const handleLike = async (postId) => {

        if (!user) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/posts/${postId}/like`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        user_id: user.id
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(data.message);

                return;
            }

            setPosts((currentPosts) =>

                currentPosts.map((post) => {

                    if (post.id !== postId) {
                        return post;
                    }

                    const currentLikeCount =
                        Number(post.like_count) || 0;

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

                })

            );

        } catch (error) {

            console.log(
                "Lỗi Like:",
                error
            );

        }

    };


    // =========================
    // LẤY BÌNH LUẬN
    // =========================

    const fetchComments = async (postId) => {

        setLoadingComments((current) => ({
            ...current,
            [postId]: true
        }));

        try {

            const response = await fetch(
                `http://localhost:5000/api/posts/${postId}/comments`
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(data.message);

                return;
            }

            setComments((current) => ({
                ...current,
                [postId]: data
            }));

        } catch (error) {

            console.log(
                "Lỗi lấy bình luận:",
                error
            );

        } finally {

            setLoadingComments((current) => ({
                ...current,
                [postId]: false
            }));

        }

    };


    // =========================
    // MỞ / ĐÓNG COMMENT
    // =========================

    const handleToggleComments = (postId) => {

        const isOpen =
            openComments[postId];

        setOpenComments((current) => ({
            ...current,
            [postId]: !isOpen
        }));

        if (!isOpen) {

            fetchComments(postId);

        }

    };


    // =========================
    // NHẬP COMMENT
    // =========================

    const handleCommentChange = (
        postId,
        value
    ) => {

        setCommentInputs((current) => ({
            ...current,
            [postId]: value
        }));

    };


    // =========================
    // GỬI COMMENT
    // =========================

    const handleComment = async (postId) => {

        if (!user) {
            return;
        }

        const commentContent =
            commentInputs[postId] || "";

        if (!commentContent.trim()) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/posts/${postId}/comments`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        user_id: user.id,
                        content: commentContent
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(data.message);

                return;
            }

            setCommentInputs((current) => ({
                ...current,
                [postId]: ""
            }));

            setComments((current) => ({

                ...current,

                [postId]: [

                    ...(current[postId] || []),

                    {
                        ...data.comment,

                        name: user.name,

                        avatar: user.avatar,

                        class: user.class,

                        created_at: new Date()
                    }

                ]

            }));

            setPosts((currentPosts) =>

                currentPosts.map((post) => {

                    if (post.id !== postId) {
                        return post;
                    }

                    return {
                        ...post,

                        comment_count:
                            (Number(
                                post.comment_count
                            ) || 0) + 1
                    };

                })

            );

        } catch (error) {

            console.log(
                "Lỗi gửi bình luận:",
                error
            );

        }

    };


    // =========================
    // RENDER
    // =========================

    return (

        <div className="app">


            {/* =========================
                HEADER
            ========================= */}

            <header className="header">


                {/* LOGO */}

                <Link
                    to="/home"
                    className="logo"
                >
                    🎓 IT CONNECT
                </Link>


                {/* SEARCH */}

                <div className="search">

                    🔍

                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                    />

                </div>


                {/* HEADER RIGHT */}

                <div className="header-right">


                    {/* =========================
                        THÔNG BÁO
                    ========================= */}

                    <div
                        className="notification-container"
                        ref={notificationRef}
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
                                unreadCount > 0 && (

                                    <span className="notification-badge">

                                        {
                                            unreadCount > 9
                                                ? "9+"
                                                : unreadCount
                                        }

                                    </span>

                                )
                            }

                        </button>


                        {/* =========================
                            NOTIFICATION DROPDOWN
                        ========================= */}

                        {
                            showNotifications && (

                                <div className="notification-dropdown">


                                    {/* HEADER */}

                                    <div className="notification-header">

                                        <h3>
                                            Thông báo
                                        </h3>


                                        {
                                            unreadCount > 0 && (

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


                                    {/* LIST */}

                                    <div className="notification-list">


                                        {
                                            notifications.length === 0 ? (

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
                                                    (notification) => (

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


                                                            {/* ICON */}

                                                            <div className="notification-item-icon">

                                                                {
                                                                    getNotificationIcon(
                                                                        notification.type
                                                                    )
                                                                }

                                                            </div>


                                                            {/* CONTENT */}

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


                                                            {/* CHẤM CHƯA ĐỌC */}

                                                            {
                                                                Number(
                                                                    notification.is_read
                                                                ) === 0 && (

                                                                    <span className="notification-unread-dot">
                                                                    </span>

                                                                )
                                                            }

                                                        </div>

                                                    )

                                                )

                                            )

                                        }

                                    </div>


                                    {/* FOOTER */}

                                    {
                                        notifications.length > 0 && (

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
                            navigate("/account")
                        }
                    >

                        <div className="avatar">

                            {
                                user?.name
                                    ? user.name
                                        .charAt(0)
                                        .toUpperCase()
                                    : "Đ"
                            }

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


                {/* =========================
                    SIDEBAR
                ========================= */}

                <aside className="sidebar">

                    <nav>


                        <Link
                            to="/home"
                            className="menu active"
                        >
                            <span>🏠</span>
                            Trang chủ
                        </Link>


                        <a className="menu">

                            <span>📝</span>

                            Bài viết

                        </a>


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


                        <a className="menu">

                            <span>⚙️</span>

                            Cài đặt

                        </a>


                        <button
                            className="menu logout"
                            onClick={() => {

                                localStorage.removeItem(
                                    "user"
                                );

                                window.location.href = "/";

                            }}
                        >

                            <span>🚪</span>

                            Đăng xuất

                        </button>


                    </div>

                </aside>



                {/* =========================
                    CONTENT
                ========================= */}

                <main className="content">


                    {/* =========================
                        CREATE POST
                    ========================= */}

                    <section className="create-post">


                        <div className="post-user">


                            <div className="avatar big">

                                {
                                    user?.name
                                        ? user.name
                                            .charAt(0)
                                            .toUpperCase()
                                        : "Đ"
                                }

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


                        <div className="post-actions">


                            <button>
                                📷 Hình ảnh
                            </button>


                            <button>
                                📎 Tệp
                            </button>


                            <button
                                className="post-btn"
                                onClick={handlePost}
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
                        DANH SÁCH BÀI VIẾT
                    ========================= */}

                    {
                        loadingPosts ? (

                            <p>
                                Đang tải bài viết...
                            </p>

                        ) : posts.length === 0 ? (

                            <p>
                                Chưa có bài viết nào.
                            </p>

                        ) : (

                            posts.map((post) => (

                                <section
                                    className="post"
                                    key={post.id}
                                >


                                    {/* POST HEADER */}

                                    <div className="post-header">


                                        <div className="avatar">

                                            {
                                                post.name
                                                    ? post.name
                                                        .charAt(0)
                                                        .toUpperCase()
                                                    : "?"
                                            }

                                        </div>


                                        <div>

                                            <h3>
                                                {post.name}
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



                                    {/* POST CONTENT */}

                                    <div className="post-content">

                                        <p>
                                            {post.content}
                                        </p>

                                    </div>



                                    {/* POST STATS */}

                                    <div className="post-stats">


                                        <span>

                                            ❤️{" "}

                                            {
                                                Number(
                                                    post.like_count
                                                ) || 0
                                            }

                                            {" lượt thích"}

                                        </span>


                                        <span>

                                            💬{" "}

                                            {
                                                Number(
                                                    post.comment_count
                                                ) || 0
                                            }

                                            {" bình luận"}

                                        </span>


                                    </div>



                                    {/* POST FOOTER */}

                                    <div className="post-footer">


                                        <button
                                            className={
                                                Number(
                                                    post.liked
                                                ) === 1
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
                                                ) === 1
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



                                    {/* COMMENTS */}

                                    {
                                        openComments[
                                            post.id
                                        ] && (

                                            <div className="comments-section">


                                                {/* INPUT */}

                                                <div className="comment-input">


                                                    <div className="avatar small">

                                                        {
                                                            user?.name
                                                                ? user.name
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()
                                                                : "?"
                                                        }

                                                    </div>


                                                    <input
                                                        type="text"
                                                        placeholder="Viết bình luận..."
                                                        value={
                                                            commentInputs[
                                                                post.id
                                                            ] || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleCommentChange(
                                                                post.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        onKeyDown={(e) => {

                                                            if (
                                                                e.key === "Enter"
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



                                                {/* COMMENT LIST */}

                                                {
                                                    loadingComments[
                                                        post.id
                                                    ]
                                                        ? (

                                                            <p className="comment-loading">
                                                                Đang tải bình luận...
                                                            </p>

                                                        )
                                                        : (

                                                            <div className="comments-list">


                                                                {
                                                                    comments[
                                                                        post.id
                                                                    ]?.length > 0
                                                                        ? (

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
                                                                                                comment.name
                                                                                                    ? comment.name
                                                                                                        .charAt(
                                                                                                            0
                                                                                                        )
                                                                                                        .toUpperCase()
                                                                                                    : "?"
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

                                                                        )
                                                                        : (

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

                            ))

                        )
                    }


                </main>



                {/* =========================
                    RIGHT SIDEBAR
                ========================= */}

                <aside className="right-sidebar">


                    {/* FRIENDS */}

                    <div className="right-box">

                        <h3>
                            👥 Bạn bè online
                        </h3>


                        <div className="friend">

                            <div className="avatar small">
                                N
                            </div>

                            <div>

                                <strong>
                                    Nguyễn Văn An
                                </strong>

                                <span className="online">
                                    ● Online
                                </span>

                            </div>

                        </div>


                        <div className="friend">

                            <div className="avatar small avatar-blue">
                                T
                            </div>

                            <div>

                                <strong>
                                    Trần Minh Tú
                                </strong>

                                <span className="online">
                                    ● Online
                                </span>

                            </div>

                        </div>


                        <div className="friend">

                            <div className="avatar small avatar-purple">
                                L
                            </div>

                            <div>

                                <strong>
                                    Lê Văn Cường
                                </strong>

                                <span className="online">
                                    ● Online
                                </span>

                            </div>

                        </div>


                        <button className="view-all">
                            Xem tất cả
                        </button>


                    </div>



                    {/* NOTIFICATION */}

                    <div className="right-box">

                        <h3>
                            📌 Thông báo
                        </h3>


                        <div className="notification">

                            <span>
                                📚
                            </span>

                            <p>
                                Ngày mai có kiểm tra Cơ sở dữ liệu.
                            </p>

                        </div>


                        <div className="notification">

                            <span>
                                🎓
                            </span>

                            <p>
                                Có thông báo mới từ Khoa CNTT.
                            </p>

                        </div>


                    </div>


                </aside>


            </div>


        </div>

    );

}

export default Home;