<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";


/* =========================
   KIỂM TRA USER
========================= */

$userId = isset($_POST["user_id"])
    ? intval($_POST["user_id"])
    : 0;

if (!$userId) {

    http_response_code(400);

    echo json_encode([
        "message" => "Thiếu user_id!"
    ]);

    exit;
}


/* =========================
   KIỂM TRA FILE
========================= */

if (!isset($_FILES["avatar"])) {

    http_response_code(400);

    echo json_encode([
        "message" => "Vui lòng chọn ảnh!"
    ]);

    exit;
}

$file = $_FILES["avatar"];


if ($file["error"] !== UPLOAD_ERR_OK) {

    http_response_code(400);

    echo json_encode([
        "message" => "Tải ảnh lên thất bại!"
    ]);

    exit;
}


/* =========================
   GIỚI HẠN DUNG LƯỢNG
   5MB
========================= */

$maxSize = 5 * 1024 * 1024;

if ($file["size"] > $maxSize) {

    http_response_code(400);

    echo json_encode([
        "message" => "Ảnh không được vượt quá 5MB!"
    ]);

    exit;
}


/* =========================
   KIỂM TRA MIME
========================= */

$finfo = new finfo(FILEINFO_MIME_TYPE);

$mimeType = $finfo->file(
    $file["tmp_name"]
);


$allowedTypes = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/gif" => "gif",
    "image/webp" => "webp"
];


if (!isset($allowedTypes[$mimeType])) {

    http_response_code(400);

    echo json_encode([
        "message" =>
            "Chỉ chấp nhận JPG, PNG, GIF hoặc WEBP!"
    ]);

    exit;
}


/* =========================
   KIỂM TRA USER
========================= */

$sql = "
    SELECT avatar
    FROM users
    WHERE id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $userId
);

$stmt->execute();

$result = $stmt->get_result();


if ($result->num_rows === 0) {

    http_response_code(404);

    echo json_encode([
        "message" => "Không tìm thấy người dùng!"
    ]);

    $stmt->close();
    $conn->close();

    exit;
}


$user = $result->fetch_assoc();

$oldAvatar = $user["avatar"];

$stmt->close();


/* =========================
   TẠO THƯ MỤC
========================= */

$uploadDir = __DIR__ . "/../uploads/avatars/";

if (!is_dir($uploadDir)) {

    if (!mkdir(
        $uploadDir,
        0777,
        true
    )) {

        http_response_code(500);

        echo json_encode([
            "message" =>
                "Không thể tạo thư mục lưu ảnh!"
        ]);

        $conn->close();

        exit;
    }
}


/* =========================
   TẠO TÊN FILE
========================= */

$extension =
    $allowedTypes[$mimeType];

$fileName =
    "avatar_" .
    $userId .
    "_" .
    time() .
    "_" .
    bin2hex(random_bytes(4)) .
    "." .
    $extension;


$filePath =
    $uploadDir .
    $fileName;


/* =========================
   UPLOAD
========================= */

if (!move_uploaded_file(
    $file["tmp_name"],
    $filePath
)) {

    http_response_code(500);

    echo json_encode([
        "message" =>
            "Không thể lưu ảnh!"
    ]);

    $conn->close();

    exit;
}


/* =========================
   ĐƯỜNG DẪN LƯU DATABASE
========================= */

$avatarPath =
    "uploads/avatars/" .
    $fileName;


/* =========================
   UPDATE DATABASE
========================= */

$updateSql = "
    UPDATE users
    SET avatar = ?
    WHERE id = ?
";

$updateStmt =
    $conn->prepare($updateSql);

$updateStmt->bind_param(
    "si",
    $avatarPath,
    $userId
);


if (!$updateStmt->execute()) {

    // Xóa file vừa upload nếu DB lỗi
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    http_response_code(500);

    echo json_encode([
        "message" =>
            "Không thể cập nhật avatar!"
    ]);

    $updateStmt->close();
    $conn->close();

    exit;
}


/* =========================
   XÓA AVATAR CŨ
========================= */

if (
    !empty($oldAvatar) &&
    strpos($oldAvatar, "uploads/avatars/") === 0
) {

    $oldFile =
        __DIR__ .
        "/../" .
        $oldAvatar;

    if (
        file_exists($oldFile) &&
        $oldFile !== $filePath
    ) {
        unlink($oldFile);
    }
}


$updateStmt->close();
$conn->close();


/* =========================
   TRẢ KẾT QUẢ
========================= */

http_response_code(200);

echo json_encode([
    "message" =>
        "Cập nhật avatar thành công!",

    "avatar" =>
        $avatarPath
]);

?>