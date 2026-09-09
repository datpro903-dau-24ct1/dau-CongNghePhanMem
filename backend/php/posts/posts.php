<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";


// ======================================================
// GET - LẤY DANH SÁCH BÀI VIẾT
// ======================================================

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $userId = isset($_GET["user_id"])
        ? intval($_GET["user_id"])
        : 0;

    $sql = "
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
                WHERE pl2.post_id = p.id
                AND pl2.user_id = ?
            ) AS liked

        FROM posts p

        JOIN users u
            ON p.user_id = u.id

        ORDER BY p.created_at DESC
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        http_response_code(500);

        echo json_encode([
            "message" => "Không thể lấy bài viết!"
        ]);

        exit;
    }

    $stmt->bind_param("i", $userId);

    $stmt->execute();

    $result = $stmt->get_result();

    $posts = [];

    while ($row = $result->fetch_assoc()) {

        $row["like_count"] = intval($row["like_count"]);
        $row["comment_count"] = intval($row["comment_count"]);
        $row["liked"] = intval($row["liked"]);

        $posts[] = $row;
    }

    echo json_encode($posts);

    $stmt->close();
    $conn->close();

    exit;
}


// ======================================================
// POST - ĐĂNG BÀI
// ======================================================

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $data = json_decode(
        file_get_contents("php://input"),
        true
    );

    $userId = intval($data["user_id"] ?? 0);
    $content = trim($data["content"] ?? "");
    $image = $data["image"] ?? null;

    if (!$userId || $content === "") {

        http_response_code(400);

        echo json_encode([
            "message" => "Nội dung bài viết không được để trống!"
        ]);

        exit;
    }

    $sql = "
        INSERT INTO posts
        (
            user_id,
            content,
            image
        )
        VALUES (?, ?, ?)
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {

        http_response_code(500);

        echo json_encode([
            "message" => "Không thể đăng bài!"
        ]);

        exit;
    }

    $stmt->bind_param(
        "iss",
        $userId,
        $content,
        $image
    );

    if ($stmt->execute()) {

        http_response_code(201);

        echo json_encode([
            "message" => "Đăng bài thành công!",
            "postId" => $stmt->insert_id
        ]);

    } else {

        http_response_code(500);

        echo json_encode([
            "message" => "Không thể đăng bài!"
        ]);
    }

    $stmt->close();
    $conn->close();

    exit;
}
// ======================================================
// DELETE - XÓA BÀI VIẾT
// CHỈ NGƯỜI ĐĂNG BÀI MỚI ĐƯỢC XÓA
// ======================================================
if ($_SERVER["REQUEST_METHOD"] === "DELETE") {

    $postId = isset($_GET["post_id"])
        ? intval($_GET["post_id"])
        : 0;

    $userId = isset($_GET["user_id"])
        ? intval($_GET["user_id"])
        : 0;

    if (!$postId || !$userId) {
        http_response_code(400);

        echo json_encode([
            "message" => "Thiếu post_id hoặc user_id!"
        ]);

        exit;
    }

    // Kiểm tra bài viết có tồn tại và đúng người đăng không
    $checkSql = "
        SELECT id
        FROM posts
        WHERE id = ?
        AND user_id = ?
        LIMIT 1
    ";

    $checkStmt = $conn->prepare($checkSql);

    if (!$checkStmt) {
        http_response_code(500);

        echo json_encode([
            "message" => "Lỗi kiểm tra bài viết!"
        ]);

        exit;
    }

    $checkStmt->bind_param(
        "ii",
        $postId,
        $userId
    );

    $checkStmt->execute();

    $result = $checkStmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(403);

        echo json_encode([
            "message" => "Bạn không có quyền xóa bài viết này!"
        ]);

        $checkStmt->close();
        exit;
    }

    $checkStmt->close();

    // Xóa like trước
    $deleteLikes = $conn->prepare(
        "DELETE FROM post_likes WHERE post_id = ?"
    );

    $deleteLikes->bind_param("i", $postId);
    $deleteLikes->execute();
    $deleteLikes->close();

    // Xóa comment trước
    $deleteComments = $conn->prepare(
        "DELETE FROM comments WHERE post_id = ?"
    );

    $deleteComments->bind_param("i", $postId);
    $deleteComments->execute();
    $deleteComments->close();

    // Xóa bài viết
    $deletePost = $conn->prepare(
        "DELETE FROM posts
         WHERE id = ?
         AND user_id = ?"
    );

    $deletePost->bind_param(
        "ii",
        $postId,
        $userId
    );

    if ($deletePost->execute()) {

        echo json_encode([
            "message" => "Xóa bài viết thành công!"
        ]);

    } else {

        http_response_code(500);

        echo json_encode([
            "message" => "Không thể xóa bài viết!"
        ]);
    }

    $deletePost->close();
    $conn->close();

    exit;
}

// ======================================================
// METHOD KHÔNG HỖ TRỢ
// ======================================================

http_response_code(405);

echo json_encode([
    "message" => "Method không được hỗ trợ!"
]);

$conn->close();
?>