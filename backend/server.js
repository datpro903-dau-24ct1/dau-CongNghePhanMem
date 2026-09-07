import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bcrypt from "bcryptjs";

const app = express();

app.use(cors());
app.use(express.json());


// ======================================================
// KẾT NỐI DATABASE
// ======================================================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "it_connect"
});


// ======================================================
// 🔔 TỰ ĐỘNG GIỮ TỐI ĐA 10 THÔNG BÁO / USER
// ======================================================
// Khi user có hơn 10 thông báo,
// hệ thống sẽ giữ lại 10 thông báo mới nhất
// và xóa các thông báo cũ hơn.
// ======================================================

const cleanupOldNotifications = (userId) => {

    userId = Number(userId);

    if (!userId) {
        return;
    }

    const selectSql = `
        SELECT id
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
    `;

    db.query(
        selectSql,
        [userId],
        (err, rows) => {

            if (err) {

                console.log(
                    "❌ Lỗi kiểm tra số lượng thông báo:",
                    err
                );

                return;
            }

            console.log(
                `🔔 User ${userId} hiện có ${rows.length} thông báo`
            );

            // Có tối đa 10 thì không cần xóa
            if (rows.length <= 10) {
                return;
            }

            // Lấy các thông báo cũ hơn
            const deleteIds = rows
                .slice(10)
                .map(row => row.id);

            if (deleteIds.length === 0) {
                return;
            }

            const placeholders = deleteIds
                .map(() => "?")
                .join(",");

            const deleteSql = `
                DELETE FROM notifications
                WHERE user_id = ?
                AND id IN (${placeholders})
            `;

            db.query(
                deleteSql,
                [
                    userId,
                    ...deleteIds
                ],
                (deleteErr, result) => {

                    if (deleteErr) {

                        console.log(
                            "❌ Lỗi xóa thông báo cũ:",
                            deleteErr
                        );

                        return;
                    }

                    console.log(
                        `🗑️ Đã xóa ${result.affectedRows} thông báo cũ của user ${userId}`
                    );

                }
            );

        }
    );

};


// ======================================================
// KẾT NỐI MYSQL
// ======================================================

db.connect((err) => {

    if (err) {

        console.log(
            "❌ Lỗi kết nối MySQL:",
            err
        );

        return;
    }

    console.log(
        "✅ Đã kết nối MySQL!"
    );


    // ==================================================
    // 🔔 DỌN THÔNG BÁO CŨ KHI SERVER KHỞI ĐỘNG
    // ==================================================

    db.query(
        `
        SELECT DISTINCT user_id
        FROM notifications
        `,
        (err, users) => {

            if (err) {

                console.log(
                    "❌ Không thể kiểm tra thông báo cũ:",
                    err
                );

                return;
            }

            users.forEach(user => {

                cleanupOldNotifications(
                    user.user_id
                );

            });

            console.log(
                `🔔 Đã kiểm tra ${users.length} user có thông báo.`
            );

        }
    );

});


// ======================================================
// TEST SERVER
// ======================================================

app.get("/", (req, res) => {

    res.json({
        message: "IT Community API đang hoạt động!"
    });

});


// ======================================================
// ĐĂNG KÝ
// ======================================================

app.post("/api/register", async (req, res) => {

    const {
        name,
        email,
        password,
        student_code,
        class: className
    } = req.body;

    if (
        !name ||
        !email ||
        !password ||
        !student_code ||
        !className
    ) {

        return res.status(400).json({
            message: "Vui lòng nhập đầy đủ thông tin!"
        });

    }

    try {

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (
                name,
                email,
                password,
                student_code,
                class
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                name,
                email,
                hashedPassword,
                student_code,
                className
            ],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi đăng ký:",
                        err
                    );

                    if (err.code === "ER_DUP_ENTRY") {

                        return res.status(400).json({
                            message:
                                "Email hoặc mã sinh viên đã tồn tại!"
                        });

                    }

                    return res.status(500).json({
                        message: "Đăng ký thất bại!"
                    });

                }

                res.status(201).json({

                    message:
                        "Đăng ký thành công!",

                    userId:
                        result.insertId

                });

            }
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Lỗi server!"
        });

    }

});


// ======================================================
// ĐĂNG NHẬP
// ======================================================

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            message:
                "Vui lòng nhập email và mật khẩu!"
        });

    }

    const sql = `
        SELECT *
        FROM users
        WHERE email = ?
        LIMIT 1
    `;

    db.query(
        sql,
        [email],
        async (err, result) => {

            if (err) {

                console.log(
                    "Lỗi đăng nhập:",
                    err
                );

                return res.status(500).json({
                    message: "Lỗi server!"
                });

            }

            if (result.length === 0) {

                return res.status(401).json({
                    message:
                        "Email hoặc mật khẩu không đúng!"
                });

            }

            const user = result[0];

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatch) {

                return res.status(401).json({
                    message:
                        "Email hoặc mật khẩu không đúng!"
                });

            }

            delete user.password;

            res.json({

                message:
                    "Đăng nhập thành công!",

                user

            });

        }
    );

});


// ======================================================
// LẤY BÀI VIẾT
// ======================================================

app.get("/api/posts", (req, res) => {

    const userId =
        Number(req.query.user_id) || 0;

    const sql = `
        SELECT
            p.id,
            p.user_id,
            p.content,
            p.image,
            p.created_at,

            u.name,
            u.avatar,

            (
                SELECT COUNT(*)
                FROM post_likes pl
                WHERE pl.post_id = p.id
            ) AS like_count,

            (
                SELECT COUNT(*)
                FROM comments c
                WHERE c.post_id = p.id
            ) AS comment_count,

            (
                SELECT COUNT(*)
                FROM post_likes pl2
                WHERE
                    pl2.post_id = p.id
                    AND pl2.user_id = ?
            ) AS user_liked

        FROM posts p

        JOIN users u
            ON p.user_id = u.id

        ORDER BY
            p.created_at DESC
    `;

    db.query(
        sql,
        [userId],
        (err, result) => {

            if (err) {

                console.log(
                    "Lỗi lấy bài viết:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Không thể lấy bài viết!"
                });

            }

            res.json(result);

        }
    );

});


// ======================================================
// ĐĂNG BÀI
// ======================================================

app.post("/api/posts", (req, res) => {

    const {
        user_id,
        content,
        image
    } = req.body;

    if (!user_id || !content?.trim()) {

        return res.status(400).json({
            message:
                "Nội dung bài viết không được để trống!"
        });

    }

    const sql = `
        INSERT INTO posts
        (
            user_id,
            content,
            image
        )
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [
            user_id,
            content.trim(),
            image || null
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "Lỗi đăng bài:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Không thể đăng bài!"
                });

            }

            res.status(201).json({

                message:
                    "Đăng bài thành công!",

                postId:
                    result.insertId

            });

        }
    );

});


// ======================================================
// LIKE / UNLIKE BÀI VIẾT
// ======================================================

app.post(
    "/api/posts/:postId/like",
    (req, res) => {

        const postId =
            Number(req.params.postId);

        const userId =
            Number(req.body.user_id);

        if (!postId || !userId) {

            return res.status(400).json({
                message:
                    "Thiếu postId hoặc userId!"
            });

        }

        const checkSql = `
            SELECT id
            FROM post_likes
            WHERE
                post_id = ?
                AND user_id = ?
            LIMIT 1
        `;

        db.query(
            checkSql,
            [postId, userId],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        message:
                            "Lỗi kiểm tra like!"
                    });

                }

                // =========================
                // UNLIKE
                // =========================

                if (result.length > 0) {

                    const deleteSql = `
                        DELETE FROM post_likes
                        WHERE
                            post_id = ?
                            AND user_id = ?
                    `;

                    db.query(
                        deleteSql,
                        [postId, userId],
                        (err) => {

                            if (err) {

                                return res.status(500).json({
                                    message:
                                        "Không thể bỏ like!"
                                });

                            }

                            res.json({
                                liked: false
                            });

                        }
                    );

                    return;
                }


                // =========================
                // LIKE
                // =========================

                const insertSql = `
                    INSERT INTO post_likes
                    (
                        post_id,
                        user_id
                    )
                    VALUES (?, ?)
                `;

                db.query(
                    insertSql,
                    [postId, userId],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                message:
                                    "Không thể like!"
                            });

                        }

                        res.json({
                            liked: true
                        });

                    }
                );

            }
        );

    }
);


// ======================================================
// LẤY COMMENT
// ======================================================

app.get(
    "/api/posts/:postId/comments",
    (req, res) => {

        const postId =
            Number(req.params.postId);

        const sql = `
            SELECT
                c.id,
                c.post_id,
                c.user_id,
                c.content,
                c.created_at,

                u.name,
                u.avatar

            FROM comments c

            JOIN users u
                ON c.user_id = u.id

            WHERE c.post_id = ?

            ORDER BY
                c.created_at ASC
        `;

        db.query(
            sql,
            [postId],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi lấy comment:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể lấy bình luận!"
                    });

                }

                res.json(result);

            }
        );

    }
);


// ======================================================
// THÊM COMMENT
// ======================================================

app.post(
    "/api/posts/:postId/comments",
    (req, res) => {

        const postId =
            Number(req.params.postId);

        const {
            user_id,
            content
        } = req.body;

        if (
            !postId ||
            !user_id ||
            !content?.trim()
        ) {

            return res.status(400).json({
                message:
                    "Nội dung bình luận không hợp lệ!"
            });

        }

        const sql = `
            INSERT INTO comments
            (
                post_id,
                user_id,
                content
            )
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                postId,
                user_id,
                content.trim()
            ],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi thêm comment:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể bình luận!"
                    });

                }

                res.status(201).json({

                    message:
                        "Bình luận thành công!",

                    commentId:
                        result.insertId

                });

            }
        );

    }
);


// ======================================================
// LẤY DANH SÁCH USER ĐỂ KẾT BẠN
// ======================================================

app.get(
    "/api/friends/users",
    (req, res) => {

        const userId =
            Number(req.query.user_id);

        const sql = `
            SELECT
                id,
                name,
                email,
                student_code,
                class,
                avatar

            FROM users

            WHERE id != ?

            ORDER BY name ASC
        `;

        db.query(
            sql,
            [userId],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi lấy danh sách users:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể lấy danh sách người dùng!"
                    });

                }

                res.json(result);

            }
        );

    }
);


// ======================================================
// GỬI LỜI MỜI KẾT BẠN
// ======================================================

app.post(
    "/api/friends/request",
    (req, res) => {

        // Hỗ trợ cả 2 kiểu frontend:
        // user_id / friend_id
        // sender_id / receiver_id

        const user_id =
            Number(
                req.body.user_id ||
                req.body.sender_id
            );

        const friend_id =
            Number(
                req.body.friend_id ||
                req.body.receiver_id
            );


        // =========================
        // KIỂM TRA
        // =========================

        if (!user_id || !friend_id) {

            return res.status(400).json({
                message:
                    "Thiếu user_id hoặc friend_id!"
            });

        }


        if (user_id === friend_id) {

            return res.status(400).json({
                message:
                    "Không thể kết bạn với chính mình!"
            });

        }


        // =========================
        // KIỂM TRA QUAN HỆ
        // =========================

        const checkSql = `
            SELECT *
            FROM friendships

            WHERE
                (
                    user_id = ?
                    AND friend_id = ?
                )

                OR

                (
                    user_id = ?
                    AND friend_id = ?
                )

            LIMIT 1
        `;

        db.query(
            checkSql,
            [
                user_id,
                friend_id,
                friend_id,
                user_id
            ],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi kiểm tra bạn bè:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Lỗi database!"
                    });

                }


                if (result.length > 0) {

                    return res.status(400).json({
                        message:
                            "Đã gửi lời mời hoặc hai người đã là bạn!"
                    });

                }


                // =========================
                // TẠO FRIENDSHIP
                // =========================

                const insertFriendSql = `
                    INSERT INTO friendships
                    (
                        user_id,
                        friend_id,
                        status
                    )
                    VALUES (?, ?, 'pending')
                `;

                db.query(
                    insertFriendSql,
                    [
                        user_id,
                        friend_id
                    ],
                    (err, result) => {

                        if (err) {

                            console.log(
                                "Lỗi tạo lời mời:",
                                err
                            );

                            return res.status(500).json({
                                message:
                                    "Không thể gửi lời mời!"
                            });

                        }


                        // =========================
                        // TẠO THÔNG BÁO
                        // =========================

                        const notificationSql = `
                            INSERT INTO notifications
                            (
                                user_id,
                                type,
                                from_user_id,
                                content,
                                related_id
                            )
                            VALUES
                            (
                                ?,
                                'friend_request',
                                ?,
                                ?,
                                ?
                            )
                        `;

                        const notificationContent =
                            "đã gửi cho bạn một lời mời kết bạn.";


                        db.query(
                            notificationSql,
                            [
                                friend_id,
                                user_id,
                                notificationContent,
                                result.insertId
                            ],
                            (err) => {

                                if (err) {

                                    console.log(
                                        "❌ Lỗi tạo notification:",
                                        err
                                    );

                                    return res.status(201).json({
                                        message:
                                            "Đã gửi lời mời nhưng tạo thông báo thất bại!"
                                    });

                                }


                                console.log(
                                    "🔔 Đã tạo thông báo lời mời kết bạn!"
                                );


                                // ==================================================
                                // 🔔 GIỮ TỐI ĐA 10 THÔNG BÁO CHO NGƯỜI NHẬN
                                // ==================================================

                                cleanupOldNotifications(
                                    friend_id
                                );


                                res.status(201).json({

                                    message:
                                        "Đã gửi lời mời kết bạn!",

                                    friendshipId:
                                        result.insertId

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// ======================================================
// LẤY LỜI MỜI KẾT BẠN
// ======================================================

app.get(
    "/api/friends/requests/:userId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        const sql = `
            SELECT

                f.id,

                f.user_id,
                f.friend_id,

                f.status,
                f.created_at,

                u.id AS sender_id,
                u.name,
                u.email,
                u.student_code,
                u.class,
                u.avatar

            FROM friendships f

            JOIN users u
                ON u.id = f.user_id

            WHERE
                f.friend_id = ?
                AND f.status = 'pending'

            ORDER BY
                f.created_at DESC
        `;

        db.query(
            sql,
            [userId],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi lấy lời mời:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể lấy lời mời!"
                    });

                }

                res.json(result);

            }
        );

    }
);


// ======================================================
// CHẤP NHẬN LỜI MỜI
// ======================================================

app.put(
    "/api/friends/accept/:id",
    (req, res) => {

        const friendshipId =
            Number(req.params.id);

        // Lấy friendship trước
        const getSql = `
            SELECT *
            FROM friendships
            WHERE id = ?
            LIMIT 1
        `;

        db.query(
            getSql,
            [friendshipId],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        message:
                            "Lỗi database!"
                    });

                }

                if (result.length === 0) {

                    return res.status(404).json({
                        message:
                            "Không tìm thấy lời mời!"
                    });

                }

                const friendship =
                    result[0];


                // =========================
                // ACCEPT
                // =========================

                const updateSql = `
                    UPDATE friendships

                    SET status = 'accepted'

                    WHERE id = ?
                `;

                db.query(
                    updateSql,
                    [friendshipId],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                message:
                                    "Không thể chấp nhận!"
                            });

                        }


                        // =========================
                        // THÔNG BÁO CHO NGƯỜI GỬI
                        // =========================

                        const notificationSql = `
                            INSERT INTO notifications
                            (
                                user_id,
                                type,
                                from_user_id,
                                content,
                                related_id
                            )
                            VALUES
                            (
                                ?,
                                'friend_accept',
                                ?,
                                ?,
                                ?
                            )
                        `;

                        db.query(
                            notificationSql,
                            [
                                friendship.user_id,
                                friendship.friend_id,
                                "đã chấp nhận lời mời kết bạn của bạn.",
                                friendshipId
                            ],
                            (err) => {

                                if (err) {

                                    console.log(
                                        "Lỗi notification accept:",
                                        err
                                    );

                                }

                                // ==================================================
                                // 🔔 GIỮ TỐI ĐA 10 THÔNG BÁO CHO NGƯỜI NHẬN
                                // ==================================================

                                cleanupOldNotifications(
                                    friendship.user_id
                                );


                                res.json({

                                    message:
                                        "Đã chấp nhận lời mời!"

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// ======================================================
// TỪ CHỐI LỜI MỜI
// ======================================================

app.put(
    "/api/friends/reject/:id",
    (req, res) => {

        const friendshipId =
            Number(req.params.id);

        const sql = `
            UPDATE friendships

            SET status = 'rejected'

            WHERE id = ?
        `;

        db.query(
            sql,
            [friendshipId],
            (err) => {

                if (err) {

                    console.log(
                        "Lỗi từ chối lời mời:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể từ chối!"
                    });

                }

                res.json({

                    message:
                        "Đã từ chối lời mời!"

                });

            }
        );

    }
);


// ======================================================
// LẤY DANH SÁCH BẠN BÈ
// ======================================================

app.get(
    "/api/friends/:userId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        const sql = `
            SELECT

                u.id,
                u.name,
                u.email,
                u.student_code,
                u.class,
                u.avatar

            FROM friendships f

            JOIN users u

                ON u.id =
                    CASE

                        WHEN f.user_id = ?
                        THEN f.friend_id

                        ELSE f.user_id

                    END

            WHERE

                (
                    f.user_id = ?
                    OR f.friend_id = ?
                )

                AND f.status = 'accepted'

            ORDER BY u.name ASC
        `;

        db.query(
            sql,
            [
                userId,
                userId,
                userId
            ],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi lấy bạn bè:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể lấy danh sách bạn bè!"
                    });

                }

                res.json(result);

            }
        );

    }
);


// ======================================================
// LẤY DANH SÁCH BẠN CÓ THỂ CHAT
// ======================================================

app.get(
    "/api/messages/friends/:userId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        const sql = `
            SELECT

                u.id,
                u.name,
                u.avatar

            FROM friendships f

            JOIN users u

                ON u.id =
                    CASE

                        WHEN f.user_id = ?
                        THEN f.friend_id

                        ELSE f.user_id

                    END

            WHERE

                (
                    f.user_id = ?
                    OR f.friend_id = ?
                )

                AND f.status = 'accepted'

            ORDER BY u.name ASC
        `;

        db.query(
            sql,
            [
                userId,
                userId,
                userId
            ],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi lấy bạn chat:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể lấy danh sách bạn!"
                    });

                }

                res.json(result);

            }
        );

    }
);


// ======================================================
// LẤY TIN NHẮN
// ======================================================

app.get(
    "/api/messages/:userId/:friendId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        const friendId =
            Number(req.params.friendId);

        const sql = `
            SELECT

                m.id,
                m.sender_id,
                m.receiver_id,
                m.content,
                m.created_at

            FROM messages m

            WHERE

                (
                    m.sender_id = ?
                    AND m.receiver_id = ?
                )

                OR

                (
                    m.sender_id = ?
                    AND m.receiver_id = ?
                )

            ORDER BY
                m.created_at ASC
        `;

        db.query(
            sql,
            [
                userId,
                friendId,
                friendId,
                userId
            ],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi lấy tin nhắn:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể lấy tin nhắn!"
                    });

                }

                res.json(result);

            }
        );

    }
);


// ======================================================
// GỬI TIN NHẮN
// ======================================================

app.post(
    "/api/messages",
    (req, res) => {

        const {
            sender_id,
            receiver_id,
            content
        } = req.body;

        if (
            !sender_id ||
            !receiver_id ||
            !content?.trim()
        ) {

            return res.status(400).json({
                message:
                    "Tin nhắn không hợp lệ!"
            });

        }

        const sql = `
            INSERT INTO messages
            (
                sender_id,
                receiver_id,
                content
            )
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [
                sender_id,
                receiver_id,
                content.trim()
            ],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi gửi tin nhắn:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể gửi tin nhắn!"
                    });

                }


                // =========================
                // TẠO THÔNG BÁO TIN NHẮN
                // =========================

                const notificationSql = `
                    INSERT INTO notifications
                    (
                        user_id,
                        type,
                        from_user_id,
                        content,
                        related_id
                    )
                    VALUES
                    (
                        ?,
                        'message',
                        ?,
                        ?,
                        ?
                    )
                `;

                db.query(
                    notificationSql,
                    [
                        receiver_id,
                        sender_id,
                        "đã gửi cho bạn một tin nhắn.",
                        result.insertId
                    ],
                    (notificationErr) => {

                        if (notificationErr) {

                            console.log(
                                "Lỗi tạo notification tin nhắn:",
                                notificationErr
                            );

                        }


                        // ==================================================
                        // 🔔 GIỮ TỐI ĐA 10 THÔNG BÁO CHO NGƯỜI NHẬN
                        // ==================================================

                        cleanupOldNotifications(
                            receiver_id
                        );


                        res.status(201).json({

                            message:
                                "Gửi tin nhắn thành công!",

                            messageId:
                                result.insertId

                        });

                    }
                );

            }
        );

    }
);


// ======================================================
// 🔔 LẤY SỐ THÔNG BÁO CHƯA ĐỌC
// ======================================================
// QUAN TRỌNG:
// Route này phải đặt trước /api/notifications/:userId
// ======================================================

app.get(
    "/api/notifications/:userId/unread-count",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        if (!userId) {

            return res.status(400).json({
                message:
                    "userId không hợp lệ!"
            });

        }

        const sql = `
            SELECT
                COUNT(*) AS count

            FROM notifications

            WHERE
                user_id = ?
                AND is_read = 0
        `;

        db.query(
            sql,
            [userId],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi đếm thông báo:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể đếm thông báo!"
                    });

                }

                res.json({

                    count:
                        Number(result[0].count) || 0

                });

            }
        );

    }
);


// ======================================================
// 🔔 LẤY THÔNG BÁO
// ======================================================

app.get(
    "/api/notifications/:userId",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        if (!userId) {

            return res.status(400).json({
                message:
                    "userId không hợp lệ!"
            });

        }

        const sql = `
            SELECT

                n.id,
                n.user_id,
                n.type,
                n.from_user_id,
                n.content,
                n.related_id,
                n.is_read,
                n.created_at,

                u.name,
                u.avatar

            FROM notifications n

            LEFT JOIN users u
                ON n.from_user_id = u.id

            WHERE
                n.user_id = ?

            ORDER BY

                n.is_read ASC,
                n.created_at DESC
        `;

        db.query(
            sql,
            [userId],
            (err, result) => {

                if (err) {

                    console.log(
                        "Lỗi lấy thông báo:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể lấy thông báo!"
                    });

                }

                res.json(result);

            }
        );

    }
);


// ======================================================
// 🔔 ĐÁNH DẤU 1 THÔNG BÁO ĐÃ ĐỌC
// ======================================================

app.put(
    "/api/notifications/:id/read",
    (req, res) => {

        const notificationId =
            Number(req.params.id);

        if (!notificationId) {

            return res.status(400).json({
                message:
                    "notificationId không hợp lệ!"
            });

        }

        const sql = `
            UPDATE notifications

            SET is_read = 1

            WHERE id = ?
        `;

        db.query(
            sql,
            [notificationId],
            (err) => {

                if (err) {

                    console.log(
                        "Lỗi đánh dấu đã đọc:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể cập nhật thông báo!"
                    });

                }

                res.json({

                    message:
                        "Đã đọc thông báo!"

                });

            }
        );

    }
);


// ======================================================
// 🔔 ĐÁNH DẤU TẤT CẢ THÔNG BÁO ĐÃ ĐỌC
// ======================================================

app.put(
    "/api/notifications/:userId/read-all",
    (req, res) => {

        const userId =
            Number(req.params.userId);

        if (!userId) {

            return res.status(400).json({
                message:
                    "userId không hợp lệ!"
            });

        }

        const sql = `
            UPDATE notifications

            SET is_read = 1

            WHERE user_id = ?
        `;

        db.query(
            sql,
            [userId],
            (err) => {

                if (err) {

                    console.log(
                        "Lỗi đọc tất cả:",
                        err
                    );

                    return res.status(500).json({
                        message:
                            "Không thể cập nhật thông báo!"
                    });

                }

                res.json({

                    message:
                        "Đã đọc tất cả thông báo!"

                });

            }
        );

    }
);


// ======================================================
// CHẠY SERVER
// ======================================================

const PORT = 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `🚀 Server chạy tại http://localhost:${PORT}`
        );

    }
);