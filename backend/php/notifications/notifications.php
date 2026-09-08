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
        ON u.id = n.from_user_id

    WHERE n.user_id = ?

    ORDER BY n.created_at DESC
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $user_id
);

$stmt->execute();

$result = $stmt->get_result();

$notifications = [];

while ($row = $result->fetch_assoc()) {

    $notifications[] = $row;

}

echo json_encode(
    $notifications,
    JSON_UNESCAPED_UNICODE
);

$stmt->close();
$conn->close();