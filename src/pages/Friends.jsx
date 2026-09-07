import { useEffect, useRef, useState } from "react";
import {
    Link,
    useSearchParams
} from "react-router-dom";
import "./Friends.css";

function Friends() {

    // =========================
    // USER
    // =========================

    const user = JSON.parse(
        localStorage.getItem("user")
    );


    // =========================
    // URL PARAMS
    // =========================

    const [searchParams] = useSearchParams();

    const tab =
        searchParams.get("tab");


    // =========================
    // REF LỜI MỜI
    // =========================

    const requestsSectionRef =
        useRef(null);


    // =========================
    // STATE
    // =========================

    const [users, setUsers] = useState([]);

    const [requests, setRequests] = useState([]);

    const [friends, setFriends] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [highlightRequests, setHighlightRequests] =
        useState(false);


    // =========================
    // LẤY DANH SÁCH NGƯỜI DÙNG
    // =========================

    const fetchUsers = async () => {

        if (!user?.id) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/friends/users?user_id=${user.id}`
            );

            const data = await response.json();

            if (response.ok) {

                setUsers(data);

            } else {

                setUsers([]);

            }

        } catch (error) {

            console.log(
                "Lỗi lấy danh sách người dùng:",
                error
            );

        }

    };


    // =========================
    // LẤY LỜI MỜI
    // =========================

    const fetchRequests = async () => {

        if (!user?.id) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/friends/requests/${user.id}`
            );

            const data = await response.json();

            if (response.ok) {

                setRequests(data);

            } else {

                setRequests([]);

            }

        } catch (error) {

            console.log(
                "Lỗi lấy lời mời:",
                error
            );

            setRequests([]);

        }

    };


    // =========================
    // LẤY BẠN BÈ
    // =========================

    const fetchFriends = async () => {

        if (!user?.id) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/friends/${user.id}`
            );

            const data = await response.json();

            if (response.ok) {

                setFriends(data);

            } else {

                setFriends([]);

            }

        } catch (error) {

            console.log(
                "Lỗi lấy bạn bè:",
                error
            );

            setFriends([]);

        } finally {

            setLoading(false);

        }

    };


    // =========================
    // LOAD DATA
    // =========================

    useEffect(() => {

        if (!user) {
            return;
        }

        fetchUsers();

        fetchRequests();

        fetchFriends();

    }, []);


    // =========================
    // TỰ ĐỘNG ĐẾN LỜI MỜI
    // KHI URL CÓ ?tab=requests
    // =========================

    useEffect(() => {

        if (
            tab !== "requests" ||
            loading
        ) {
            return;
        }


        // Nếu chưa có lời mời
        if (
            requests.length === 0
        ) {
            return;
        }


        setHighlightRequests(true);


        // Đợi DOM render xong
        setTimeout(() => {

            if (
                requestsSectionRef.current
            ) {

                requestsSectionRef.current.scrollIntoView({

                    behavior: "smooth",

                    block: "start"

                });

            }

        }, 200);


        // Bỏ highlight sau vài giây
        const timer = setTimeout(() => {

            setHighlightRequests(false);

        }, 3000);


        return () => {

            clearTimeout(timer);

        };

    }, [
        tab,
        loading,
        requests
    ]);


    // =========================
    // GỬI LỜI MỜI
    // =========================

    const handleAddFriend = async (
        receiverId
    ) => {

        try {

            const response = await fetch(
                "http://localhost:5000/api/friends/request",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        sender_id: user.id,

                        receiver_id: receiverId

                    })

                }
            );


            const data = await response.json();


            if (!response.ok) {

                alert(
                    data.message
                );

                return;

            }


            alert(
                "Đã gửi lời mời kết bạn!"
            );


            fetchUsers();

        } catch (error) {

            console.log(error);

        }

    };


    // =========================
    // CHẤP NHẬN
    // =========================

    const handleAccept = async (
        friendshipId
    ) => {

        try {

            const response = await fetch(
                `http://localhost:5000/api/friends/accept/${friendshipId}`,
                {
                    method: "PUT"
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message
                );

                return;

            }


            await fetchRequests();

            await fetchFriends();

            await fetchUsers();


        } catch (error) {

            console.log(error);

        }

    };


    // =========================
    // TỪ CHỐI
    // =========================

    const handleReject = async (
        friendshipId
    ) => {

        try {

            const response = await fetch(
                `http://localhost:5000/api/friends/reject/${friendshipId}`,
                {
                    method: "PUT"
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message
                );

                return;

            }


            await fetchRequests();

            await fetchUsers();


        } catch (error) {

            console.log(error);

        }

    };


    // =========================
    // TÌM KIẾM
    // =========================

    const filteredUsers =
        users.filter((item) => {

            const keyword =
                search.toLowerCase();


            return (

                item.name
                    ?.toLowerCase()
                    .includes(keyword)

                ||

                item.email
                    ?.toLowerCase()
                    .includes(keyword)

                ||

                item.student_code
                    ?.toLowerCase()
                    .includes(keyword)

                ||

                item.class
                    ?.toLowerCase()
                    .includes(keyword)

            );

        });


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

        <div className="friends-page">


            {/* =========================
                HEADER
            ========================= */}

            <header className="friends-header">

                <Link
                    to="/home"
                    className="friends-logo"
                >

                    🎓 IT CONNECT

                </Link>


                <Link
                    to="/home"
                    className="back-home"
                >

                    ← Trang chủ

                </Link>

            </header>



            {/* =========================
                CONTENT
            ========================= */}

            <main className="friends-container">


                {/* =========================
                    TITLE
                ========================= */}

                <div className="friends-title">

                    <div>

                        <h1>
                            👥 Bạn bè
                        </h1>

                        <p>
                            Kết nối với sinh viên Khoa Công nghệ thông tin
                        </p>

                    </div>

                </div>



                {/* =========================
                    LỜI MỜI
                ========================= */}

                {requests.length > 0 && (

                    <section
                        ref={
                            requestsSectionRef
                        }
                        className={
                            highlightRequests
                                ? "friends-box notification-highlight"
                                : "friends-box"
                        }
                    >

                        <div className="box-title">

                            <h2>
                                🔔 Lời mời kết bạn
                            </h2>

                            <span>
                                {requests.length}
                            </span>

                        </div>


                        <div className="request-list">

                            {requests.map(
                                (request) => (

                                    <div
                                        className="request-item"
                                        key={
                                            request.id
                                        }
                                    >


                                        {/* AVATAR */}

                                        <div className="friend-avatar">

                                            {
                                                request.name
                                                    ?.charAt(0)
                                                    .toUpperCase()
                                            }

                                        </div>



                                        {/* THÔNG TIN */}

                                        <div className="friend-info">

                                            <strong>
                                                {
                                                    request.name
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    request.class
                                                }
                                            </span>

                                            <small>
                                                MSSV: {
                                                    request.student_code
                                                }
                                            </small>

                                        </div>



                                        {/* ACTION */}

                                        <div className="request-actions">

                                            <button
                                                className="accept-btn"
                                                onClick={() =>
                                                    handleAccept(
                                                        request.id
                                                    )
                                                }
                                            >

                                                Chấp nhận

                                            </button>


                                            <button
                                                className="reject-btn"
                                                onClick={() =>
                                                    handleReject(
                                                        request.id
                                                    )
                                                }
                                            >

                                                Từ chối

                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    </section>

                )}



                {/* =========================
                    NẾU ĐI TỪ THÔNG BÁO
                    NHƯNG KHÔNG CÓ LỜI MỜI
                ========================= */}

                {
                    tab === "requests" &&
                    !loading &&
                    requests.length === 0 && (

                        <section className="friends-box">

                            <div className="empty-friends">

                                <div>
                                    🔔
                                </div>

                                <p>
                                    Hiện tại không có lời mời kết bạn.
                                </p>

                                <span>
                                    Có thể lời mời đã được xử lý trước đó.
                                </span>

                            </div>

                        </section>

                    )
                }



                {/* =========================
                    BẠN BÈ
                ========================= */}

                <section className="friends-box">

                    <div className="box-title">

                        <h2>
                            👥 Bạn bè của tôi
                        </h2>

                        <span>
                            {friends.length}
                        </span>

                    </div>


                    {friends.length === 0 ? (

                        <div className="empty-friends">

                            <div>
                                👥
                            </div>

                            <p>
                                Bạn chưa có bạn bè nào.
                            </p>

                            <span>
                                Hãy tìm kiếm sinh viên bên dưới để kết nối.
                            </span>

                        </div>

                    ) : (

                        <div className="friends-grid">

                            {friends.map(
                                (friend) => (

                                    <div
                                        className="friend-card"
                                        key={
                                            friend.id
                                        }
                                    >

                                        <div className="friend-avatar large">

                                            {
                                                friend.name
                                                    ?.charAt(0)
                                                    .toUpperCase()
                                            }

                                        </div>


                                        <strong>
                                            {
                                                friend.name
                                            }
                                        </strong>


                                        <span>
                                            {
                                                friend.class
                                            }
                                        </span>


                                        <small>
                                            MSSV: {
                                                friend.student_code
                                            }
                                        </small>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>



                {/* =========================
                    TÌM BẠN
                ========================= */}

                <section className="friends-box">

                    <div className="box-title">

                        <div>

                            <h2>
                                🔍 Tìm sinh viên
                            </h2>

                            <p>
                                Tìm theo tên, email, mã sinh viên hoặc lớp
                            </p>

                        </div>

                    </div>



                    {/* SEARCH */}

                    <div className="search-friend">

                        <span>
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Tìm kiếm sinh viên..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>



                    {/* USERS */}

                    <div className="users-list">

                        {loading ? (

                            <p className="loading">
                                Đang tải...
                            </p>

                        ) : filteredUsers.length === 0 ? (

                            <p className="no-result">
                                Không tìm thấy sinh viên.
                            </p>

                        ) : (

                            filteredUsers.map(
                                (item) => (

                                    <div
                                        className="user-card"
                                        key={
                                            item.id
                                        }
                                    >


                                        {/* AVATAR */}

                                        <div className="friend-avatar">

                                            {
                                                item.name
                                                    ?.charAt(0)
                                                    .toUpperCase()
                                            }

                                        </div>



                                        {/* INFO */}

                                        <div className="friend-info">

                                            <strong>
                                                {
                                                    item.name
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    item.class
                                                }
                                            </span>

                                            <small>
                                                MSSV: {
                                                    item.student_code
                                                }
                                            </small>

                                        </div>



                                        {/* ACTION */}

                                        <div className="user-action">

                                            {
                                                item.friend_status ===
                                                "accepted" ? (

                                                    <button
                                                        className="friend-status"
                                                    >

                                                        ✓ Bạn bè

                                                    </button>

                                                ) : item.friend_status ===
                                                "pending_sent" ? (

                                                    <button
                                                        className="friend-status pending"
                                                    >

                                                        ⏳ Đã gửi

                                                    </button>

                                                ) : item.friend_status ===
                                                "pending_received" ? (

                                                    <button
                                                        className="friend-status pending"
                                                    >

                                                        🔔 Đang chờ bạn

                                                    </button>

                                                ) : (

                                                    <button
                                                        className="add-friend"
                                                        onClick={() =>
                                                            handleAddFriend(
                                                                item.id
                                                            )
                                                        }
                                                    >

                                                        ➕ Kết bạn

                                                    </button>

                                                )}

                                        </div>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </section>

            </main>

        </div>

    );

}


export default Friends;