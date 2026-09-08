<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

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
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE user_id = ?
    AND is_read = 0
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $user_id
);

$stmt->execute();

$result = $stmt->get_result();

$row = $result->fetch_assoc();

echo json_encode([
    "unread_count" => intval(
        $row["unread_count"]
    )
], JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();