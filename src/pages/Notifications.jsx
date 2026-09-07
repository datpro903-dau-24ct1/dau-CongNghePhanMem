import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Notifications.css";

function Notifications() {

    const navigate = useNavigate();


    // =========================
    // USER
    // =========================

    const user = JSON.parse(
        localStorage.getItem("user")
    );


    // =========================
    // STATE
    // =========================

    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);


    // =========================
    // LẤY THÔNG BÁO
    // =========================

    const fetchNotifications = async () => {

        if (!user?.id) {

            setLoading(false);

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

        } finally {

            setLoading(false);

        }

    };


    // =========================
    // LOAD
    // =========================

    useEffect(() => {

        fetchNotifications();

    }, []);


    // =========================
    // FORMAT THỜI GIAN
    // =========================

    const formatTime = (dateString) => {

        if (!dateString) {

            return "";

        }


        const date =
            new Date(dateString);

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


        return date.toLocaleDateString(
            "vi-VN"
        );

    };


    // =========================
    // ICON
    // =========================

    const getNotificationIcon = (
        type
    ) => {

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

    const handleNotificationClick = (
        notification
    ) => {

        if (!notification) {

            return;

        }


        // =================================
        // ĐÁNH DẤU ĐÃ ĐỌC
        // KHÔNG CHỜ API
        // =================================

        if (
            Number(notification.is_read) === 0
        ) {

            // Cập nhật giao diện ngay

            setNotifications(
                (current) =>
                    current.map(
                        (item) =>
                            item.id ===
                            notification.id
                                ? {
                                    ...item,
                                    is_read: 1
                                }
                                : item
                    )
            );


            // Gọi API chạy nền
            // Không await

            fetch(
                `http://localhost:5000/api/notifications/${notification.id}/read`,
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


        // =================================
        // LỜI MỜI KẾT BẠN
        // =================================

        if (
            notification.type ===
            "friend_request"
        ) {

            navigate(
                "/friends?tab=requests"
            );

            return;

        }


        // =================================
        // CHẤP NHẬN KẾT BẠN
        // =================================

        if (
            notification.type ===
            "friend_accept"
        ) {

            navigate(
                "/friends"
            );

            return;

        }


        // =================================
        // TIN NHẮN
        // =================================

        if (
            notification.type ===
            "message"
        ) {

            const senderId =
                notification.from_user_id;


            console.log(
                "Notification message:",
                notification
            );


            if (senderId) {

                navigate(
                    `/messages?user=${senderId}`
                );

            } else {

                navigate(
                    "/messages"
                );

            }


            return;

        }


        // =================================
        // MẶC ĐỊNH
        // =================================

        navigate(
            "/home"
        );

    };


    // =========================
    // ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
    // =========================

    const markAllAsRead = async () => {

        if (!user?.id) {

            return;

        }


        // Cập nhật giao diện trước

        setNotifications(
            (current) =>
                current.map(
                    (notification) => ({
                        ...notification,
                        is_read: 1
                    })
                )
        );


        try {

            const response = await fetch(
                `http://localhost:5000/api/notifications/${user.id}/read-all`,
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

                return;

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
                Number(
                    notification.is_read
                ) === 0
        ).length;


    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem(
            "user"
        );

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


            {/* HEADER */}

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

                                {
                                    unreadCount > 9
                                        ? "9+"
                                        : unreadCount
                                }

                            </span>

                        )}

                    </Link>


                    <div
                        className="notifications-user"
                        onClick={() =>
                            navigate(
                                "/account"
                            )
                        }
                    >

                        <div className="notifications-avatar">

                            {
                                user?.name
                                    ? user.name
                                        .charAt(0)
                                        .toUpperCase()
                                    : "Đ"
                            }

                        </div>


                        <span>
                            {user?.name || "Đạt"}
                        </span>

                    </div>

                </div>

            </header>



            {/* MAIN */}

            <div className="notifications-layout">


                {/* SIDEBAR */}

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

                        <div className="notification-menu">

                            <span>⚙️</span>

                            Cài đặt

                        </div>


                        <button
                            className="notification-menu logout"
                            onClick={
                                handleLogout
                            }
                        >

                            <span>🚪</span>

                            Đăng xuất

                        </button>

                    </div>

                </aside>



                {/* CONTENT */}

                <main className="notifications-content">


                    <div className="notifications-title-row">

                        <div>

                            <h1>
                                Thông báo
                            </h1>

                            <p>

                                {
                                    unreadCount > 0
                                        ? `${unreadCount} thông báo chưa đọc`
                                        : "Bạn đã xem tất cả thông báo"
                                }

                            </p>

                        </div>


                        {unreadCount > 0 && (

                            <button
                                className="mark-all-btn"
                                onClick={
                                    markAllAsRead
                                }
                            >

                                ✓ Đánh dấu tất cả đã đọc

                            </button>

                        )}

                    </div>



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


                                                {/* AVATAR */}

                                                <div className="notification-avatar-wrapper">

                                                    <div className="notification-avatar-large">

                                                        {
                                                            notification.name
                                                                ? notification.name
                                                                    .charAt(0)
                                                                    .toUpperCase()
                                                                : "?"
                                                        }

                                                    </div>


                                                    <span className="notification-type-icon">

                                                        {
                                                            getNotificationIcon(
                                                                notification.type
                                                            )
                                                        }

                                                    </span>

                                                </div>



                                                {/* CONTENT */}

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

                                                        {
                                                            formatTime(
                                                                notification.created_at
                                                            )
                                                        }

                                                    </span>

                                                </div>



                                                {/* UNREAD */}

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

        </div>

    );

}


export default Notifications;