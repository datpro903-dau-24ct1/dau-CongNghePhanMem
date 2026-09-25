import {
    useEffect,
    useRef,
    useState
} from "react";

import { Link } from "react-router-dom";

import "./Account.css";


const API = "http://localhost/it-connect-php";


function Account() {

    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [loading, setLoading] = useState(true);


    // =========================
    // AVATAR
    // =========================

    const avatarInputRef = useRef(null);

    const [uploadingAvatar, setUploadingAvatar] =
        useState(false);

    const [avatarMessage, setAvatarMessage] =
        useState("");


    // =========================
    // EDIT
    // =========================

    const [showEdit, setShowEdit] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");


    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        student_code: "",
        class: "",
        date_of_birth: ""
    });


    // =========================
    // LẤY USER
    // =========================

    useEffect(() => {

        const savedUser =
            localStorage.getItem("user");


        if (!savedUser) {

            window.location.href = "/";

            return;
        }


        try {

            const currentUser =
                JSON.parse(savedUser);


            setUser(currentUser);


            fetchMyPosts(
                currentUser.id
            );


        } catch (error) {

            console.log(
                "Lỗi đọc user:",
                error
            );


            localStorage.removeItem("user");


            window.location.href = "/";

        }

    }, []);


    // =========================
    // LẤY BÀI VIẾT CỦA USER
    // =========================

    const fetchMyPosts = async (userId) => {

        try {

            const response = await fetch(
                `${API}/posts/posts.php?user_id=${userId}`
            );


            const data =
                await response.json();


            if (!response.ok) {

                console.log(
                    data.message
                );

                return;
            }


            const posts =
                Array.isArray(data)
                    ? data.filter(
                        (post) =>
                            Number(
                                post.user_id
                            ) === Number(userId)
                    )
                    : [];


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


    // =================================================
    // AVATAR
    // =================================================

    const handleAvatarClick = () => {

        if (uploadingAvatar) {
            return;
        }


        avatarInputRef.current?.click();

    };


    // =================================================
    // UPLOAD AVATAR
    // =================================================

    const handleAvatarChange = async (e) => {

        const file =
            e.target.files?.[0];


        if (!file) {
            return;
        }


        // =========================
        // KIỂM TRA LOẠI FILE
        // =========================

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            setAvatarMessage(
                "Chỉ chấp nhận JPG, PNG, GIF hoặc WEBP!"
            );


            e.target.value = "";


            return;
        }


        // =========================
        // KIỂM TRA DUNG LƯỢNG
        // =========================

        const maxSize =
            5 * 1024 * 1024;


        if (file.size > maxSize) {

            setAvatarMessage(
                "Ảnh không được vượt quá 5MB!"
            );


            e.target.value = "";


            return;
        }


        try {

            setUploadingAvatar(true);

            setAvatarMessage(
                "Đang tải ảnh lên..."
            );


            // =========================
            // FORM DATA
            // =========================

            const formData =
                new FormData();


            formData.append(
                "user_id",
                user.id
            );


            formData.append(
                "avatar",
                file
            );


            // =========================
            // GỌI PHP
            // =========================

            const response =
                await fetch(
                    `${API}/account/avatar.php`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            // =========================
            // LỖI
            // =========================

            if (!response.ok) {

                setAvatarMessage(
                    data.message ||
                    "Tải avatar thất bại!"
                );


                return;
            }


            // =========================
            // USER MỚI
            // =========================

            const updatedUser = {
                ...user,
                avatar: data.avatar
            };


            // =========================
            // CẬP NHẬT REACT
            // =========================

            setUser(
                updatedUser
            );


            // =========================
            // CẬP NHẬT LOCAL STORAGE
            // =========================

            localStorage.setItem(
                "user",
                JSON.stringify(
                    updatedUser
                )
            );


            // =========================
            // THÔNG BÁO
            // =========================

            setAvatarMessage(
                "Cập nhật avatar thành công!"
            );


            setTimeout(() => {

                setAvatarMessage("");

            }, 2000);


        } catch (error) {

            console.log(
                "Lỗi upload avatar:",
                error
            );


            setAvatarMessage(
                "Không thể kết nối đến máy chủ!"
            );


        } finally {

            setUploadingAvatar(false);


            // Cho phép chọn lại
            // cùng một file

            e.target.value = "";

        }

    };


    // =========================
    // MỞ FORM CHỈNH SỬA
    // =========================

    const handleOpenEdit = () => {

        setEditForm({

            name:
                user.name || "",

            email:
                user.email || "",

            student_code:
                user.student_code || "",

            class:
                user.class || "",

            date_of_birth:
                user.date_of_birth || ""

        });


        setMessage("");

        setShowEdit(true);

    };


    // =========================
    // ĐÓNG FORM
    // =========================

    const handleCloseEdit = () => {

        if (saving) {
            return;
        }


        setShowEdit(false);

        setMessage("");

    };


    // =========================
    // THAY ĐỔI INPUT
    // =========================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setEditForm(
            (prev) => ({
                ...prev,
                [name]: value
            })
        );

    };


    // =========================
    // LƯU THÔNG TIN
    // =========================

    const handleSave = async (e) => {

        e.preventDefault();


        if (saving) {
            return;
        }


        setMessage("");


        // =========================
        // KIỂM TRA DỮ LIỆU
        // =========================

        if (
            !editForm.name.trim() ||
            !editForm.email.trim() ||
            !editForm.student_code.trim() ||
            !editForm.class.trim() ||
            !editForm.date_of_birth
        ) {

            setMessage(
                "Vui lòng nhập đầy đủ thông tin!"
            );


            return;
        }


        // =========================
        // KIỂM TRA EMAIL
        // =========================

        const emailRegex =
            /^[^\s@]+@(gmail\.com|[a-zA-Z0-9-]+\.edu\.vn)$/i;


        if (
            !emailRegex.test(
                editForm.email.trim()
            )
        ) {

            setMessage(
                "Email phải có đuôi @gmail.com hoặc tên miền .edu.vn!"
            );


            return;
        }


        try {

            setSaving(true);


            const response =
                await fetch(
                    `${API}/account/update.php`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                id: user.id,

                                name:
                                    editForm.name.trim(),

                                email:
                                    editForm.email.trim(),

                                student_code:
                                    editForm.student_code.trim(),

                                class:
                                    editForm.class.trim(),

                                date_of_birth:
                                    editForm.date_of_birth
                            })
                    }
                );


            const data =
                await response.json();


            // =========================
            // LỖI
            // =========================

            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Cập nhật thông tin thất bại!"
                );


                return;
            }


            // =========================
            // USER MỚI
            // =========================

            const updatedUser = {

                ...user,

                name:
                    editForm.name.trim(),

                email:
                    editForm.email.trim(),

                student_code:
                    editForm.student_code.trim(),

                class:
                    editForm.class.trim(),

                date_of_birth:
                    editForm.date_of_birth

            };


            // =========================
            // CẬP NHẬT REACT
            // =========================

            setUser(
                updatedUser
            );


            // =========================
            // CẬP NHẬT LOCAL STORAGE
            // =========================

            localStorage.setItem(
                "user",
                JSON.stringify(
                    updatedUser
                )
            );


            setMessage(
                "Cập nhật thông tin thành công!"
            );


            setTimeout(() => {

                setShowEdit(false);

                setMessage("");

            }, 1000);


        } catch (error) {

            console.log(
                "Lỗi cập nhật thông tin:",
                error
            );


            setMessage(
                "Không thể kết nối đến máy chủ!"
            );


        } finally {

            setSaving(false);

        }

    };


    // =========================
    // ĐĂNG XUẤT
    // =========================

    const handleLogout = () => {

        localStorage.removeItem(
            "user"
        );


        window.location.href = "/";

    };


    // =========================
    // CHƯA CÓ USER
    // =========================

    if (!user) {
        return null;
    }


    // =================================================
    // AVATAR URL
    // =================================================

    const avatarUrl =
        user.avatar
            ? `${API}/${user.avatar}`
            : null;


    // =================================================
    // RENDER
    // =================================================

    return (

        <div className="account-page">


            {/* =================================================
                HEADER
            ================================================= */}

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


            {/* =================================================
                CONTENT
            ================================================= */}

            <main className="account-container">


                {/* =================================================
                    PROFILE
                ================================================= */}

                <section className="profile-card">


                    <div className="profile-cover"></div>


                    <div className="profile-content">


                        {/* =================================================
                            AVATAR
                        ================================================= */}

                        <div
                            className="profile-avatar-upload"
                            onClick={
                                handleAvatarClick
                            }
                            title="Đổi ảnh đại diện"
                        >


                            {avatarUrl ? (

                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="profile-avatar-image"
                                />

                            ) : (

                                <div className="profile-avatar">

                                    {user.name
                                        ? user.name
                                            .charAt(0)
                                            .toUpperCase()
                                        : "?"
                                    }

                                </div>

                            )}


                            {/* CAMERA */}

                            <div className="avatar-camera">

                                {uploadingAvatar
                                    ? "..."
                                    : "📷"
                                }

                            </div>


                            {/* FILE INPUT */}

                            <input
                                ref={
                                    avatarInputRef
                                }
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={
                                    handleAvatarChange
                                }
                                style={{
                                    display:
                                        "none"
                                }}
                            />

                        </div>


                        {/* =================================================
                            THÔNG BÁO AVATAR
                        ================================================= */}

                        {avatarMessage && (

                            <div
                                className="avatar-message"
                            >
                                {avatarMessage}
                            </div>

                        )}


                        {/* =================================================
                            NAME
                        ================================================= */}

                        <h1>
                            {user.name}
                        </h1>


                        <p className="profile-role">
                            🎓 Sinh viên Khoa Công nghệ thông tin
                        </p>


                        {/* =================================================
                            THÔNG TIN
                        ================================================= */}

                        <div className="profile-info">


                            {/* EMAIL */}

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


                            {/* MÃ SINH VIÊN */}

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


                            {/* LỚP */}

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


                            {/* NGÀY SINH */}

                            <div className="info-item">

                                <span className="info-icon">
                                    🎂
                                </span>

                                <div>

                                    <small>
                                        Ngày sinh
                                    </small>

                                    <strong>

                                        {user.date_of_birth
                                            ? new Date(
                                                user.date_of_birth
                                            ).toLocaleDateString(
                                                "vi-VN"
                                            )
                                            : "Chưa cập nhật"
                                        }

                                    </strong>

                                </div>

                            </div>


                        </div>


                        {/* =================================================
                            ACTION
                        ================================================= */}

                        <div className="profile-actions">


                            <button
                                type="button"
                                onClick={
                                    handleOpenEdit
                                }
                            >
                                ✏️ Chỉnh sửa thông tin
                            </button>


                            <button
                                type="button"
                                className="logout-btn"
                                onClick={
                                    handleLogout
                                }
                            >
                                🚪 Đăng xuất
                            </button>


                        </div>


                    </div>

                </section>


                {/* =================================================
                    MY POSTS
                ================================================= */}

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

                            {myPosts.length}
                            {" "}
                            bài viết

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


                            {myPosts.map(
                                (post) => (

                                    <article
                                        className="account-post"
                                        key={post.id}
                                    >


                                        {/* POST HEADER */}

                                        <div className="account-post-header">


                                            {/* MINI AVATAR */}

                                            <div className="mini-avatar">


                                                {avatarUrl ? (

                                                    <img
                                                        src={
                                                            avatarUrl
                                                        }
                                                        alt="Avatar"
                                                        className="mini-avatar-image"
                                                    />

                                                ) : (

                                                    user.name
                                                        ? user.name
                                                            .charAt(0)
                                                            .toUpperCase()
                                                        : "?"

                                                )}

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


                                        {/* POST CONTENT */}

                                        <div className="account-post-content">

                                            {post.content}

                                        </div>


                                        {/* POST STATS */}

                                        <div className="account-post-stats">


                                            <span>

                                                ❤️{" "}
                                                {
                                                    Number(
                                                        post.like_count
                                                    ) || 0
                                                }{" "}
                                                lượt thích

                                            </span>


                                            <span>

                                                💬{" "}
                                                {
                                                    Number(
                                                        post.comment_count
                                                    ) || 0
                                                }{" "}
                                                bình luận

                                            </span>


                                        </div>


                                    </article>

                                )
                            )}


                        </div>

                    )}


                </section>


            </main>


            {/* =================================================
                MODAL CHỈNH SỬA THÔNG TIN
            ================================================= */}

            {showEdit && (

                <div
                    className="edit-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                                e.currentTarget &&
                            !saving
                        ) {

                            handleCloseEdit();

                        }

                    }}
                >


                    <div
                        className="edit-modal"
                        onMouseDown={(e) => {

                            e.stopPropagation();

                        }}
                    >


                        {/* =================================================
                            HEADER
                        ================================================= */}

                        <div className="edit-modal-header">


                            <div>

                                <h2>
                                    ✏️ Chỉnh sửa thông tin
                                </h2>


                                <p>
                                    Cập nhật thông tin cá nhân của bạn
                                </p>

                            </div>


                            <button
                                type="button"
                                className="edit-close"
                                onClick={
                                    handleCloseEdit
                                }
                                disabled={
                                    saving
                                }
                            >
                                ✕
                            </button>


                        </div>


                        {/* =================================================
                            FORM
                        ================================================= */}

                        <form
                            className="edit-form"
                            onSubmit={
                                handleSave
                            }
                        >


                            {/* HỌ TÊN */}

                            <div className="edit-form-group">

                                <label>
                                    Họ và tên
                                </label>


                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        editForm.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Nhập họ và tên"
                                    disabled={
                                        saving
                                    }
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="edit-form-group">

                                <label>
                                    Email
                                </label>


                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        editForm.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Nhập email"
                                    disabled={
                                        saving
                                    }
                                    required
                                />

                            </div>


                            {/* MÃ SINH VIÊN */}

                            <div className="edit-form-group">

                                <label>
                                    Mã sinh viên
                                </label>


                                <input
                                    type="text"
                                    name="student_code"
                                    value={
                                        editForm.student_code
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Nhập mã sinh viên"
                                    disabled={
                                        saving
                                    }
                                    required
                                />

                            </div>


                            {/* LỚP */}

                            <div className="edit-form-group">

                                <label>
                                    Lớp
                                </label>


                                <input
                                    type="text"
                                    name="class"
                                    value={
                                        editForm.class
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Nhập lớp"
                                    disabled={
                                        saving
                                    }
                                    required
                                />

                            </div>


                            {/* NGÀY SINH */}

                            <div className="edit-form-group">

                                <label>
                                    Ngày tháng năm sinh
                                </label>


                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={
                                        editForm.date_of_birth
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        saving
                                    }
                                    required
                                />

                            </div>


                            {/* MESSAGE */}

                            {message && (

                                <div
                                    className={
                                        message.includes(
                                            "thành công"
                                        )
                                            ? "edit-message success"
                                            : "edit-message error"
                                    }
                                >

                                    {message}

                                </div>

                            )}


                            {/* BUTTON */}

                            <div className="edit-form-actions">


                                <button
                                    type="button"
                                    className="edit-cancel"
                                    onClick={
                                        handleCloseEdit
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Hủy
                                </button>


                                <button
                                    type="submit"
                                    className="edit-save"
                                    disabled={
                                        saving
                                    }
                                >

                                    {saving
                                        ? "Đang lưu..."
                                        : "💾 Lưu thay đổi"
                                    }

                                </button>


                            </div>


                        </form>


                    </div>

                </div>

            )}


        </div>

    );

}


export default Account;