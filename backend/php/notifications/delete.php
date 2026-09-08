<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once "../config/database.php";

$notification_id = isset($_GET["id"])
    ? intval($_GET["id"])
    : 0;

$user_id = isset($_GET["user_id"])
    ? intval($_GET["user_id"])
    : 0;

if ($notification_id <= 0 || $user_id <= 0) {

    http_response_code(400);

    echo json_encode([
        "message" => "Thông tin không hợp lệ!"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// Chỉ cho phép người nhận thông báo
// được xóa thông báo của chính mình
$sql = "
    DELETE FROM notifications
    WHERE id = ?
    AND user_id = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $notification_id,
    $user_id
);

if ($stmt->execute()) {

    if ($stmt->affected_rows > 0) {

        echo json_encode([
            "message" => "Xóa thông báo thành công!"
        ], JSON_UNESCAPED_UNICODE);

    } else {

        http_response_code(404);

        echo json_encode([
            "message" => "Không tìm thấy thông báo!"
        ], JSON_UNESCAPED_UNICODE);

    }

} else {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể xóa thông báo!"
    ], JSON_UNESCAPED_UNICODE);

}

$stmt->close();
$conn->close();