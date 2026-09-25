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
            p.file,
            p.media_type,
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
// Hỗ trợ:
// - Văn bản
// - Hình ảnh
// - Video
// - Tệp
// ======================================================

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $userId = intval($_POST["user_id"] ?? 0);
    $content = trim($_POST["content"] ?? "");

    if (!$userId) {

        http_response_code(400);

        echo json_encode([
            "message" => "Không xác định được người dùng!"
        ]);

        exit;
    }


    // ==================================================
    // KIỂM TRA FILE
    // ==================================================

    $hasFile = isset($_FILES["media"])
        && $_FILES["media"]["error"] !== UPLOAD_ERR_NO_FILE;


    // Không có nội dung và cũng không có file
    if ($content === "" && !$hasFile) {

        http_response_code(400);

        echo json_encode([
            "message" => "Hãy nhập nội dung hoặc chọn hình ảnh, video, tệp!"
        ]);

        exit;
    }


    $image = null;
    $file = null;
    $mediaType = null;


    // ==================================================
    // UPLOAD FILE
    // ==================================================

    if ($hasFile) {

        if ($_FILES["media"]["error"] !== UPLOAD_ERR_OK) {

            http_response_code(400);

            echo json_encode([
                "message" => "File tải lên bị lỗi!"
            ]);

            exit;
        }


        $originalName =
            $_FILES["media"]["name"];

        $tmpName =
            $_FILES["media"]["tmp_name"];

        $fileSize =
            $_FILES["media"]["size"];


        // ==============================================
        // GIỚI HẠN 100MB
        // ==============================================

        $maxSize = 100 * 1024 * 1024;

        if ($fileSize > $maxSize) {

            http_response_code(400);

            echo json_encode([
                "message" => "File không được lớn hơn 100MB!"
            ]);

            exit;
        }


        // ==============================================
        // LẤY PHẦN MỞ RỘNG
        // ==============================================

        $extension =
            strtolower(
                pathinfo(
                    $originalName,
                    PATHINFO_EXTENSION
                )
            );


        // ==============================================
        // KIỂM TRA MIME
        // ==============================================

        $mimeType =
            mime_content_type($tmpName);


        // ==============================================
        // HÌNH ẢNH
        // ==============================================

        $imageExtensions = [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp"
        ];


        // ==============================================
        // VIDEO
        // ==============================================

        $videoExtensions = [
            "mp4",
            "webm",
            "mov",
            "avi",
            "mkv"
        ];


        // ==============================================
        // TỆP
        // ==============================================

        $fileExtensions = [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "txt",
            "zip",
            "rar",
            "7z"
        ];


        // ==============================================
        // XÁC ĐỊNH LOẠI
        // ==============================================

        if (
            in_array(
                $extension,
                $imageExtensions
            )
        ) {

            $mediaType = "image";

        } elseif (
            in_array(
                $extension,
                $videoExtensions
            )
        ) {

            $mediaType = "video";

        } elseif (
            in_array(
                $extension,
                $fileExtensions
            )
        ) {

            $mediaType = "file";

        } else {

            http_response_code(400);

            echo json_encode([
                "message" =>
                    "Loại file này chưa được hỗ trợ!"
            ]);

            exit;
        }


        // ==============================================
        // THƯ MỤC UPLOAD
        // ==============================================

        $uploadDir =
            __DIR__ .
            "/../uploads/posts/";


        if (!is_dir($uploadDir)) {

            mkdir(
                $uploadDir,
                0777,
                true
            );
        }


        // ==============================================
        // TẠO TÊN FILE MỚI
        // ==============================================

        $newFileName =
            uniqid(
                "post_",
                true
            )
            . "_"
            . time()
            . "."
            . $extension;


        $destination =
            $uploadDir .
            $newFileName;


        // ==============================================
        // DI CHUYỂN FILE
        // ==============================================

        if (
            !move_uploaded_file(
                $tmpName,
                $destination
            )
        ) {

            http_response_code(500);

            echo json_encode([
                "message" =>
                    "Không thể lưu file lên server!"
            ]);

            exit;
        }


        // ==============================================
        // ĐƯỜNG DẪN LƯU DATABASE
        // ==============================================

        $relativePath =
            "uploads/posts/" .
            $newFileName;


        if ($mediaType === "image") {

            $image = $relativePath;

        } else {

            $file = $relativePath;
        }
    }


    // ==================================================
    // INSERT DATABASE
    // ==================================================

    $sql = "
        INSERT INTO posts
        (
            user_id,
            content,
            image,
            file,
            media_type
        )
        VALUES (?, ?, ?, ?, ?)
    ";


    $stmt =
        $conn->prepare($sql);


    if (!$stmt) {

        http_response_code(500);

        echo json_encode([
            "message" =>
                "Không thể tạo bài viết!"
        ]);

        exit;
    }


    $stmt->bind_param(
        "issss",
        $userId,
        $content,
        $image,
        $file,
        $mediaType
    );


    if ($stmt->execute()) {

        http_response_code(201);

        echo json_encode([
            "message" =>
                "Đăng bài thành công!",

            "postId" =>
                $stmt->insert_id,

            "media_type" =>
                $mediaType,

            "file" =>
                $file,

            "image" =>
                $image
        ]);

    } else {

        http_response_code(500);

        echo json_encode([
            "message" =>
                "Không thể đăng bài!"
        ]);
    }


    $stmt->close();
    $conn->close();

    exit;
}


// ======================================================
// METHOD KHÔNG HỖ TRỢ
// ======================================================

http_response_code(405);

echo json_encode([
    "message" =>
        "Method không được hỗ trợ!"
]);

$conn->close();

?>