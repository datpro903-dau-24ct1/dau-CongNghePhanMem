import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Notifications.css";

function Notifications() {

    const navigate = useNavigate();

    // =========================
    // USER
    // =========================

    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    // =========================
    // STATE
    // =========================

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const [deletingNotificationId, setDeletingNotificationId] =
        useState(null);

    // Thông báo đang được chọn để xóa
    const [notificationToDelete, setNotificationToDelete] =
        useState(null);

    // =========================
    // LẤY THÔNG BÁO
    // PHP
    // =========================

    const fetchNotifications = async (showLoading = true) => {

        if (!user?.id) {

            console.log("❌ Không tìm thấy user.id:", user);

            setLoading(false);

            return;
        }

        try {

            if (showLoading) {
                setLoading(true);
            }

            const url =
                `http://localhost/it-connect-php/notifications/notifications.php?user_id=${user.id}`;

            console.log("🔔 Gọi API thông báo:", url);

            const response = await fetch(url);

            console.log(
                "🔔 HTTP status:",
                response.status
            );

            const data = await response.json();

            console.log(
                "🔔 Dữ liệu API trả về:",
                data
            );

            console.log(
                "🔔 Có phải Array:",
                Array.isArray(data)
            );

            if (!response.ok) {

                console.log(
                    "❌ API lỗi:",
                    data.message || "Không thể lấy thông báo"
                );

                setNotifications([]);

                return;
            }

            if (Array.isArray(data)) {

                console.log(
                    `✅ Đã nhận ${data.length} thông báo`
                );

                setNotifications(data);

            } else {

                console.log(
                    "❌ API không trả về mảng:",
                    data
                );

                setNotifications([]);

            }

        } catch (error) {

            console.log(
                "❌ Lỗi lấy thông báo:",
                error
            );

            setNotifications([]);

        } finally {

            if (showLoading) {
                setLoading(false);
            }

        }

    };

    // =========================
    // LOAD LẦN ĐẦU
    // =========================

    useEffect(() => {

        fetchNotifications();

    }, []);

    // =========================
    // TỰ ĐỘNG KIỂM TRA
    // =========================

    useEffect(() => {

        if (!user?.id) {
            return;
        }

        const interval = setInterval(() => {

            fetchNotifications(false);

        }, 2000);

        return () => {

            clearInterval(interval);

        };

    }, []);

    // =========================
    // FORMAT THỜI GIAN
    // =========================

    const formatTime = (dateString) => {

        if (!dateString) {
            return "";
        }

        const date = new Date(dateString);
        const now = new Date();

        const diff = Math.floor(
            (now - date) / 1000
        );

        if (diff < 60) {
            return "Vừa xong";
        }

        if (diff < 3600) {
            return `${Math.floor(diff / 60)} phút trước`;
        }

        if (diff < 86400) {
            return `${Math.floor(diff / 3600)} giờ trước`;
        }

        if (diff < 172800) {
            return "Hôm qua";
        }

        if (diff < 604800) {
            return `${Math.floor(diff / 86400)} ngày trước`;
        }

        return date.toLocaleDateString("vi-VN");
    };

    // =========================
    // ICON
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
    // CLICK THÔNG BÁO
    // =========================

    const handleNotificationClick = (notification) => {

        if (!notification) {
            return;
        }

        // =========================
        // ĐÁNH DẤU ĐÃ ĐỌC
        // =========================

        if (Number(notification.is_read) === 0) {

            setNotifications((current) =>
                current.map((item) =>
                    String(item.id) === String(notification.id)
                        ? {
                            ...item,
                            is_read: 1
                        }
                        : item
                )
            );

            fetch(
                `http://localhost/it-connect-php/notifications/read.php?id=${notification.id}`,
                {
                    method: "PUT"
                }
            ).catch((error) => {

                console.log(
                    "Lỗi đánh dấu thông báo:",
                    error
                );

            });

        }

        // =========================
        // LỜI MỜI KẾT BẠN
        // =========================

        if (notification.type === "friend_request") {

            navigate("/friends?tab=requests");

            return;
        }

        // =========================
        // CHẤP NHẬN KẾT BẠN
        // =========================

        if (notification.type === "friend_accept") {

            navigate("/friends");

            return;
        }

        // =========================
        // TIN NHẮN
        // =========================

        if (notification.type === "message") {

            const senderId =
                notification.from_user_id;

            if (senderId) {

                navigate(
                    `/messages?user=${senderId}`
                );

            } else {

                navigate("/messages");

            }

            return;
        }

        navigate("/home");
    };

    // =========================
    // MỞ MODAL XÓA
    // =========================

    const openDeleteModal = (
        event,
        notification
    ) => {

        event.stopPropagation();

        setNotificationToDelete(notification);

    };

    // =========================
    // ĐÓNG MODAL
    // =========================

    const closeDeleteModal = () => {

        if (deletingNotificationId) {
            return;
        }

        setNotificationToDelete(null);

    };

    // =========================
    // XÓA THÔNG BÁO
    // =========================

    const handleDeleteNotification = async () => {

        if (
            !user?.id ||
            !notificationToDelete?.id
        ) {
            return;
        }

        const notificationId =
            notificationToDelete.id;

        setDeletingNotificationId(
            notificationId
        );

        try {

            const response = await fetch(
                `http://localhost/it-connect-php/notifications/delete.php?id=${notificationId}&user_id=${user.id}`,
                {
                    method: "DELETE"
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {

                console.log(
                    "❌ Lỗi xóa thông báo:",
                    data.message ||
                    response.status
                );

                return;
            }

            // =========================
            // XÓA KHỎI GIAO DIỆN
            // =========================

            setNotifications((current) =>
                current.filter(
                    (notification) =>
                        String(notification.id) !==
                        String(notificationId)
                )
            );

            console.log(
                "✅ Xóa thông báo thành công"
            );

            // Đóng modal
            setNotificationToDelete(null);

        } catch (error) {

            console.log(
                "❌ Lỗi xóa thông báo:",
                error
            );

        } finally {

            setDeletingNotificationId(null);

        }

    };

    // =========================
    // ĐÁNH DẤU TẤT CẢ
    // =========================

    const markAllAsRead = async () => {

        if (!user?.id) {
            return;
        }

        setNotifications((current) =>
            current.map((notification) => ({
                ...notification,
                is_read: 1
            }))
        );

        try {

            const response = await fetch(
                `http://localhost/it-connect-php/notifications/read-all.php?user_id=${user.id}`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.log(
                    data.message ||
                    "Không thể đánh dấu tất cả"
                );

            }

        } catch (error) {

            console.log(
                "Lỗi đánh dấu tất cả:",
                error
            );

        }

    };

    // =========================
    // ĐẾM CHƯA ĐỌC
    // =========================

    const unreadCount =
        notifications.filter(
            (notification) =>
                Number(notification.is_read) === 0
        ).length;

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem("user");

        window.location.href = "/";

    };

    // =========================
    // CHƯA ĐĂNG NHẬP
    // =========================

    if (!user) {
        return null;
    }

    // =========================
    // RENDER
    // =========================

    return (

        <div className="notifications-app">

            {/* =========================
                HEADER
            ========================= */}

            <header className="notifications-header">

                <Link
                    to="/home"
                    className="notifications-logo"
                >
                    🎓 IT CONNECT
                </Link>

                <div className="notifications-search">

                    🔍

                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                    />

                </div>

                <div className="notifications-header-right">

                    <Link
                        to="/notifications"
                        className="notifications-bell"
                    >

                        🔔

                        {unreadCount > 0 && (

                            <span className="notifications-badge">
                                {unreadCount > 9
                                    ? "9+"
                                    : unreadCount}
                            </span>

                        )}

                    </Link>

                    <div
                        className="notifications-user"
                        onClick={() =>
                            navigate("/account")
                        }
                    >

                        <div className="notifications-avatar">

                            {user?.name
                                ? user.name
                                    .charAt(0)
                                    .toUpperCase()
                                : "Đ"}

                        </div>

                        <span>
                            {user?.name || "Đạt"}
                        </span>

                    </div>

                </div>

            </header>

            {/* =========================
                MAIN
            ========================= */}

            <div className="notifications-layout">

                {/* =========================
                    SIDEBAR
                ========================= */}

                <aside className="notifications-sidebar">

                    <nav>

                        <Link
                            to="/home"
                            className="notification-menu"
                        >
                            <span>🏠</span>
                            Trang chủ
                        </Link>

                        <Link
                            to="/home"
                            className="notification-menu"
                        >
                            <span>📝</span>
                            Bài viết
                        </Link>

                        <Link
                            to="/friends"
                            className="notification-menu"
                        >
                            <span>👥</span>
                            Bạn bè
                        </Link>

                        <Link
                            to="/messages"
                            className="notification-menu"
                        >
                            <span>💬</span>
                            Tin nhắn
                        </Link>

                        <Link
                            to="/account"
                            className="notification-menu"
                        >
                            <span>👤</span>
                            Tài khoản
                        </Link>

                    </nav>

                    <div className="notifications-sidebar-bottom">

                        <button
                            className="notification-menu logout"
                            onClick={handleLogout}
                        >
                            <span>🚪</span>
                            Đăng xuất
                        </button>

                    </div>

                </aside>

                {/* =========================
                    CONTENT
                ========================= */}

                <main className="notifications-content">

                    <div className="notifications-title-row">

                        <div>

                            <h1>
                                Thông báo
                            </h1>

                            <p>

                                {unreadCount > 0
                                    ? `${unreadCount} thông báo chưa đọc`
                                    : "Bạn đã xem tất cả thông báo"}

                            </p>

                        </div>

                        {unreadCount > 0 && (

                            <button
                                className="mark-all-btn"
                                onClick={markAllAsRead}
                            >
                                ✓ Đánh dấu tất cả đã đọc
                            </button>

                        )}

                    </div>

                    {/* =========================
                        CARD
                    ========================= */}

                    <div className="notifications-card">

                        {loading ? (

                            <div className="notifications-loading">
                                Đang tải thông báo...
                            </div>

                        ) : notifications.length === 0 ? (

                            <div className="notifications-empty">

                                <div className="empty-icon">
                                    🔔
                                </div>

                                <h3>
                                    Chưa có thông báo
                                </h3>

                                <p>
                                    Khi có hoạt động mới,
                                    thông báo sẽ xuất hiện ở đây.
                                </p>

                            </div>

                        ) : (

                            <>

                                {unreadCount > 0 && (

                                    <div className="notification-section-title">
                                        Mới
                                    </div>

                                )}

                                {notifications.map(
                                    (notification) => {

                                        const unread =
                                            Number(
                                                notification.is_read
                                            ) === 0;

                                        return (

                                            <div
                                                key={
                                                    notification.id
                                                }
                                                className={
                                                    unread
                                                        ? "notification-item unread"
                                                        : "notification-item"
                                                }
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                            >

                                                {/* =========================
                                                    AVATAR
                                                ========================= */}

                                                <div className="notification-avatar-wrapper">

                                                    <div className="notification-avatar-large">

                                                        {notification.name
                                                            ? notification.name
                                                                .charAt(0)
                                                                .toUpperCase()
                                                            : "?"}

                                                    </div>

                                                    <span className="notification-type-icon">

                                                        {getNotificationIcon(
                                                            notification.type
                                                        )}

                                                    </span>

                                                </div>

                                                {/* =========================
                                                    CONTENT
                                                ========================= */}

                                                <div className="notification-item-content">

                                                    <p>

                                                        <strong>
                                                            {
                                                                notification.name ||
                                                                "Người dùng"
                                                            }
                                                        </strong>

                                                        {" "}

                                                        {
                                                            notification.content
                                                        }

                                                    </p>

                                                    <span className="notification-time">

                                                        {formatTime(
                                                            notification.created_at
                                                        )}

                                                    </span>

                                                </div>

                                                {/* =========================
                                                    NÚT XÓA
                                                ========================= */}

                                                <button
                                                    type="button"
                                                    className="notification-delete"
                                                    onClick={(event) =>
                                                        openDeleteModal(
                                                            event,
                                                            notification
                                                        )
                                                    }
                                                    disabled={
                                                        deletingNotificationId ===
                                                        notification.id
                                                    }
                                                    title="Xóa thông báo"
                                                >
                                                    ✕
                                                </button>

                                                {/* =========================
                                                    DẤU CHẤM CHƯA ĐỌC
                                                ========================= */}

                                                {unread && (

                                                    <span className="unread-dot"></span>

                                                )}

                                            </div>

                                        );

                                    }
                                )}

                            </>

                        )}

                    </div>

                </main>

            </div>

            {/* =========================
                MODAL XÁC NHẬN XÓA
            ========================= */}

            {notificationToDelete && (

                <div
                    className="delete-modal-overlay"
                    onClick={closeDeleteModal}
                >

                    <div
                        className="delete-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* ICON */}

                        <div className="delete-modal-icon">
                            🗑️
                        </div>

                        {/* TITLE */}

                        <h2>
                            Xóa thông báo?
                        </h2>

                        {/* MESSAGE */}

                        <p>
                            Bạn có chắc muốn xóa thông báo này không?
                        </p>

                        {/* BUTTONS */}

                        <div className="delete-modal-buttons">

                            <button
                                type="button"
                                className="delete-cancel-btn"
                                onClick={closeDeleteModal}
                                disabled={
                                    !!deletingNotificationId
                                }
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                className="delete-confirm-btn"
                                onClick={
                                    handleDeleteNotification
                                }
                                disabled={
                                    !!deletingNotificationId
                                }
                            >

                                {deletingNotificationId
                                    ? "Đang xóa..."
                                    : "Xóa"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );
}

export default Notifications;