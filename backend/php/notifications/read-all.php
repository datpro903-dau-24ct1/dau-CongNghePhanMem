<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once "../config/database.php";

$user_id = isset($_GET["user_id"])
    ? intval($_GET["user_id"])
    : 0;

if ($user_id <= 0) {

    http_response_code(400);

    echo json_encode([
        "message" => "user_id không hợp lệ!"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$sql = "
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
    AND is_read = 0
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $user_id
);

if ($stmt->execute()) {

    echo json_encode([
        "message" => "Đã đánh dấu tất cả thông báo đã đọc!"
    ], JSON_UNESCAPED_UNICODE);

} else {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể đánh dấu thông báo!"
    ], JSON_UNESCAPED_UNICODE);

}

$stmt->close();
$conn->close();