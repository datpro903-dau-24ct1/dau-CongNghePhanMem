<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once "../config/database.php";

$notification_id = isset($_GET["id"])
    ? intval($_GET["id"])
    : 0;

if ($notification_id <= 0) {

    http_response_code(400);

    echo json_encode([
        "message" => "ID thông báo không hợp lệ!"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$sql = "
    UPDATE notifications
    SET is_read = 1
    WHERE id = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $notification_id
);

if ($stmt->execute()) {

    echo json_encode([
        "message" => "Đã đánh dấu thông báo đã đọc!"
    ], JSON_UNESCAPED_UNICODE);

} else {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể đánh dấu thông báo!"
    ], JSON_UNESCAPED_UNICODE);

}

$stmt->close();
$conn->close();