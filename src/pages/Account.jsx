import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Account.css";

function Account() {

    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // =========================
    // LẤY USER
    // =========================

    useEffect(() => {

        const savedUser = localStorage.getItem("user");

        if (!savedUser) {
            window.location.href = "/";
            return;
        }

        const currentUser = JSON.parse(savedUser);

        setUser(currentUser);

        fetchMyPosts(currentUser.id);

    }, []);


    // =========================
    // LẤY BÀI VIẾT CỦA USER
    // =========================

    const fetchMyPosts = async (userId) => {

        try {

            const response = await fetch(
                `http://localhost/it-connect-php/posts/posts.php?user_id=${userId}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.log(data.message);
                return;
            }

            // Chỉ lấy bài của mình
            const posts = data.filter(
                (post) =>
                    Number(post.user_id) === Number(userId)
            );

            setMyPosts(posts);

        } catch (error) {

            console.log(
                "Lỗi lấy bài viết:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    // =========================
    // ĐĂNG XUẤT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem("user");

        window.location.href = "/";

    };


    // =========================
    // CHƯA CÓ USER
    // =========================

    if (!user) {
        return null;
    }


    return (

        <div className="account-page">

            {/* =========================
                HEADER
            ========================= */}

            <header className="account-header">

                <Link
                    to="/"
                    className="account-logo"
                >
                    🎓 IT CONNECT
                </Link>

                <Link
                    to="/"
                    className="back-home"
                >
                    ← Trang chủ
                </Link>

            </header>


            {/* =========================
                CONTENT
            ========================= */}

            <main className="account-container">


                {/* =========================
                    PROFILE
                ========================= */}

                <section className="profile-card">

                    <div className="profile-cover"></div>

                    <div className="profile-content">

                        <div className="profile-avatar">

                            {user.name
                                ? user.name
                                    .charAt(0)
                                    .toUpperCase()
                                : "?"
                            }

                        </div>


                        <h1>
                            {user.name}
                        </h1>


                        <p className="profile-role">
                            🎓 Sinh viên Khoa Công nghệ thông tin
                        </p>


                        <div className="profile-info">


                            <div className="info-item">

                                <span className="info-icon">
                                    📧
                                </span>

                                <div>

                                    <small>
                                        Email
                                    </small>

                                    <strong>
                                        {user.email}
                                    </strong>

                                </div>

                            </div>


                            <div className="info-item">

                                <span className="info-icon">
                                    🎓
                                </span>

                                <div>

                                    <small>
                                        Mã sinh viên
                                    </small>

                                    <strong>
                                        {user.student_code}
                                    </strong>

                                </div>

                            </div>


                            <div className="info-item">

                                <span className="info-icon">
                                    🏫
                                </span>

                                <div>

                                    <small>
                                        Lớp
                                    </small>

                                    <strong>
                                        {user.class}
                                    </strong>

                                </div>

                            </div>


                        </div>


                        <div className="profile-actions">

                            <button>
                                ✏️ Chỉnh sửa thông tin
                            </button>

                            <button
                                className="logout-btn"
                                onClick={handleLogout}
                            >
                                🚪 Đăng xuất
                            </button>

                        </div>

                    </div>

                </section>


                {/* =========================
                    MY POSTS
                ========================= */}

                <section className="my-posts">

                    <div className="section-title">

                        <div>

                            <h2>
                                📝 Bài viết của tôi
                            </h2>

                            <p>
                                Những bài viết bạn đã chia sẻ
                            </p>

                        </div>

                        <span className="post-count">
                            {myPosts.length} bài viết
                        </span>

                    </div>


                    {loading ? (

                        <div className="empty-post">
                            Đang tải bài viết...
                        </div>

                    ) : myPosts.length === 0 ? (

                        <div className="empty-post">

                            <div className="empty-icon">
                                📝
                            </div>

                            <h3>
                                Bạn chưa có bài viết
                            </h3>

                            <p>
                                Hãy chia sẻ điều gì đó với cộng đồng IT CONNECT.
                            </p>

                            <Link to="/">
                                Đăng bài ngay
                            </Link>

                        </div>

                    ) : (

                        <div className="account-post-list">

                            {myPosts.map((post) => (

                                <article
                                    className="account-post"
                                    key={post.id}
                                >

                                    <div className="account-post-header">

                                        <div className="mini-avatar">

                                            {user.name
                                                ? user.name
                                                    .charAt(0)
                                                    .toUpperCase()
                                                : "?"
                                            }

                                        </div>


                                        <div>

                                            <strong>
                                                {user.name}
                                            </strong>

                                            <span>

                                                {post.created_at
                                                    ? new Date(
                                                        post.created_at
                                                    ).toLocaleString(
                                                        "vi-VN"
                                                    )
                                                    : "Vừa đăng"
                                                }

                                            </span>

                                        </div>

                                    </div>


                                    <div className="account-post-content">

                                        {post.content}

                                    </div>


                                    <div className="account-post-stats">

                                        <span>
                                            ❤️{" "}
                                            {Number(
                                                post.like_count
                                            ) || 0}
                                            {" lượt thích"}
                                        </span>

                                        <span>
                                            💬{" "}
                                            {Number(
                                                post.comment_count
                                            ) || 0}
                                            {" bình luận"}
                                        </span>

                                    </div>

                                </article>

                            ))}

                        </div>

                    )}

                </section>

            </main>

        </div>

    );

}

export default Account;