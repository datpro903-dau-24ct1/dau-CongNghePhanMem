import { useEffect, useState } from "react";
import {
    Link,
    useSearchParams
} from "react-router-dom";
import "./Messages.css";

function Messages() {

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

    const userFromNotification =
        searchParams.get("user");


    // =========================
    // STATE
    // =========================

    const [conversations, setConversations] = useState([]);

    const [selectedUser, setSelectedUser] = useState(null);

    const [messages, setMessages] = useState([]);

    const [content, setContent] = useState("");

    const [loading, setLoading] = useState(true);

    const [loadingMessages, setLoadingMessages] = useState(false);


    // =========================
    // LẤY DANH SÁCH BẠN BÈ
    // =========================

    const fetchConversations = async () => {

        if (!user?.id) {
            return;
        }

        try {

            setLoading(true);

            const response = await fetch(
                `http://localhost:5000/api/friends/${user.id}`
            );

            const data = await response.json();

            if (response.ok) {

                setConversations(data);

            } else {

                setConversations([]);

                console.log(
                    "Không lấy được danh sách bạn bè:",
                    data
                );

            }

        } catch (error) {

            console.log(
                "Lỗi lấy danh sách bạn bè:",
                error
            );

            setConversations([]);

        } finally {

            setLoading(false);

        }

    };


    // =========================
    // LẤY TIN NHẮN
    // =========================

    const fetchMessages = async (friendId) => {

        if (!user?.id || !friendId) {
            return;
        }

        setLoadingMessages(true);

        try {

            const response = await fetch(
                `http://localhost:5000/api/messages/${user.id}/${friendId}`
            );

            const data = await response.json();

            if (response.ok) {

                setMessages(data);

            } else {

                setMessages([]);

                console.log(
                    "Không lấy được tin nhắn:",
                    data
                );

            }

        } catch (error) {

            console.log(
                "Lỗi lấy tin nhắn:",
                error
            );

            setMessages([]);

        } finally {

            setLoadingMessages(false);

        }

    };


    // =========================
    // CHỌN NGƯỜI NHẮN
    // =========================

    const handleSelectUser = (friend) => {

        setSelectedUser(friend);

        fetchMessages(friend.id);

    };


    // =========================
    // TỰ ĐỘNG MỞ CHAT
    // KHI ĐI TỪ THÔNG BÁO
    // =========================

    useEffect(() => {

        if (
            !userFromNotification ||
            conversations.length === 0
        ) {
            return;
        }


        const friend = conversations.find(
            (conversation) =>
                String(conversation.id) ===
                String(userFromNotification)
        );


        if (friend) {

            setSelectedUser(friend);

            fetchMessages(friend.id);

        }

    }, [
        userFromNotification,
        conversations
    ]);


    // =========================
    // GỬI TIN NHẮN
    // =========================

    const handleSendMessage = async () => {

        if (!content.trim()) {
            return;
        }

        if (!selectedUser) {
            return;
        }

        try {

            const response = await fetch(
                "http://localhost:5000/api/messages",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        sender_id: user.id,

                        receiver_id: selectedUser.id,

                        content: content.trim()

                    })

                }
            );


            const data = await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Không thể gửi tin nhắn"
                );

                return;

            }


            // =========================
            // XÓA Ô NHẬP
            // =========================

            setContent("");


            // =========================
            // LOAD LẠI TIN NHẮN
            // =========================

            await fetchMessages(
                selectedUser.id
            );


            // =========================
            // LOAD LẠI DANH SÁCH BẠN
            // =========================

            await fetchConversations();

        } catch (error) {

            console.log(
                "Lỗi gửi tin nhắn:",
                error
            );

            alert(
                "Không thể kết nối tới server"
            );

        }

    };


    // =========================
    // ENTER ĐỂ GỬI
    // SHIFT + ENTER = XUỐNG DÒNG
    // =========================

    const handleKeyDown = (e) => {

        if (
            e.key === "Enter" &&
            !e.shiftKey
        ) {

            e.preventDefault();

            handleSendMessage();

        }

    };


    // =========================
    // LOAD DANH SÁCH BẠN
    // =========================

    useEffect(() => {

        if (user) {

            fetchConversations();

        }

    }, []);


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

        <div className="messages-page">


            {/* =========================
                HEADER
            ========================= */}

            <header className="messages-header">

                <Link
                    to="/home"
                    className="messages-logo"
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

            <main className="messages-container">


                {/* =========================
                    TITLE
                ========================= */}

                <div className="messages-title">

                    <h1>
                        💬 Tin nhắn
                    </h1>

                    <p>
                        Trò chuyện với bạn bè trong IT CONNECT
                    </p>

                </div>



                {/* =========================
                    MESSAGE BOX
                ========================= */}

                <div className="messages-box">


                    {/* =========================
                        DANH SÁCH BẠN BÈ
                    ========================= */}

                    <aside className="conversation-sidebar">


                        <div className="conversation-header">

                            <h2>
                                Tin nhắn
                            </h2>

                            <span>
                                {conversations.length}
                            </span>

                        </div>



                        {/* =========================
                            LOADING
                        ========================= */}

                        {loading ? (

                            <div className="message-loading">

                                Đang tải...

                            </div>

                        ) : conversations.length === 0 ? (

                            <div className="empty-conversations">

                                <div className="empty-icon">
                                    💬
                                </div>

                                <strong>
                                    Chưa có bạn bè
                                </strong>

                                <p>
                                    Hãy kết bạn để bắt đầu trò chuyện.
                                </p>

                                <Link to="/friends">
                                    Tìm bạn bè
                                </Link>

                            </div>

                        ) : (

                            <div className="conversation-list">

                                {conversations.map(
                                    (conversation) => (

                                        <div
                                            key={
                                                conversation.id
                                            }

                                            className={
                                                `conversation-item ${
                                                    selectedUser?.id ===
                                                    conversation.id
                                                        ? "active"
                                                        : ""
                                                }`
                                            }

                                            onClick={() =>
                                                handleSelectUser(
                                                    conversation
                                                )
                                            }
                                        >


                                            {/* =========================
                                                AVATAR
                                            ========================= */}

                                            <div className="message-avatar">

                                                {conversation.avatar ? (

                                                    <img
                                                        src={
                                                            conversation.avatar
                                                        }
                                                        alt={
                                                            conversation.name
                                                        }
                                                    />

                                                ) : (

                                                    conversation.name
                                                        ?.charAt(0)
                                                        .toUpperCase()

                                                )}

                                            </div>



                                            {/* =========================
                                                THÔNG TIN
                                            ========================= */}

                                            <div className="conversation-info">

                                                <strong>
                                                    {
                                                        conversation.name
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        conversation.class ||
                                                        "Sinh viên Khoa CNTT"
                                                    }
                                                </span>

                                            </div>


                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </aside>



                    {/* =========================
                        KHUNG CHAT
                    ========================= */}

                    <section className="chat-area">


                        {!selectedUser ? (

                            <div className="empty-chat">

                                <div className="empty-chat-icon">
                                    💬
                                </div>

                                <h2>
                                    Tin nhắn của bạn
                                </h2>

                                <p>
                                    Chọn một người bạn để bắt đầu trò chuyện.
                                </p>

                            </div>

                        ) : (

                            <>


                                {/* =========================
                                    CHAT HEADER
                                ========================= */}

                                <div className="chat-header">


                                    <div className="message-avatar">

                                        {selectedUser.avatar ? (

                                            <img
                                                src={
                                                    selectedUser.avatar
                                                }
                                                alt={
                                                    selectedUser.name
                                                }
                                            />

                                        ) : (

                                            selectedUser.name
                                                ?.charAt(0)
                                                .toUpperCase()

                                        )}

                                    </div>



                                    <div className="chat-user-info">

                                        <strong>
                                            {selectedUser.name}
                                        </strong>

                                        <span>
                                            {
                                                selectedUser.class ||
                                                "Sinh viên Khoa CNTT"
                                            }
                                        </span>

                                    </div>


                                </div>



                                {/* =========================
                                    DANH SÁCH TIN NHẮN
                                ========================= */}

                                <div className="chat-messages">


                                    {loadingMessages ? (

                                        <div className="message-loading">

                                            Đang tải tin nhắn...

                                        </div>

                                    ) : messages.length === 0 ? (

                                        <div className="no-messages">

                                            <div>
                                                👋
                                            </div>

                                            <strong>
                                                Chưa có tin nhắn
                                            </strong>

                                            <span>
                                                Hãy gửi lời chào đầu tiên!
                                            </span>

                                        </div>

                                    ) : (

                                        messages.map(
                                            (message) => {

                                                const isMine =
                                                    Number(
                                                        message.sender_id
                                                    ) ===
                                                    Number(
                                                        user.id
                                                    );


                                                return (

                                                    <div
                                                        key={
                                                            message.id
                                                        }

                                                        className={
                                                            `message-row ${
                                                                isMine
                                                                    ? "mine"
                                                                    : "other"
                                                            }`
                                                        }
                                                    >


                                                        {/* =========================
                                                            AVATAR NGƯỜI NHẬN
                                                        ========================= */}

                                                        {!isMine && (

                                                            <div className="message-avatar mini">

                                                                {
                                                                    message.sender_name
                                                                        ?.charAt(0)
                                                                        .toUpperCase()
                                                                }

                                                            </div>

                                                        )}



                                                        <div className="message-content">


                                                            <div className="message-bubble">

                                                                {
                                                                    message.content
                                                                }

                                                            </div>


                                                            <small>

                                                                {
                                                                    new Date(
                                                                        message.created_at
                                                                    ).toLocaleTimeString(
                                                                        "vi-VN",
                                                                        {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit"
                                                                        }
                                                                    )
                                                                }

                                                            </small>


                                                        </div>


                                                    </div>

                                                );

                                            }
                                        )

                                    )}

                                </div>



                                {/* =========================
                                    INPUT
                                ========================= */}

                                <div className="chat-input-area">


                                    <textarea

                                        value={
                                            content
                                        }

                                        onChange={(e) =>
                                            setContent(
                                                e.target.value
                                            )
                                        }

                                        onKeyDown={
                                            handleKeyDown
                                        }

                                        placeholder="Nhập tin nhắn..."

                                        rows="1"

                                    />


                                    <button

                                        className="send-message-btn"

                                        onClick={
                                            handleSendMessage
                                        }

                                        disabled={
                                            !content.trim()
                                        }

                                    >

                                        ➤

                                    </button>


                                </div>


                            </>

                        )}

                    </section>


                </div>

            </main>

        </div>

    );

}


export default Messages;