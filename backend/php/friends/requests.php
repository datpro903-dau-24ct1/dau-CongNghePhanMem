<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

$userId = isset($_GET["user_id"])
    ? intval($_GET["user_id"])
    : 0;

if (!$userId) {
    http_response_code(400);
    echo json_encode([
        "message" => "Thiếu user_id!"
    ]);
    exit;
}

$sql = "
    SELECT
        f.id,
        u.id AS user_id,
        u.name,
        u.email,
        u.student_code,
        u.class,
        u.avatar,
        f.created_at

    FROM friendships f

    JOIN users u
        ON f.user_id = u.id

    WHERE
        f.friend_id = ?
        AND f.status = 'pending'

    ORDER BY f.created_at DESC
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "message" => "Không thể lấy lời mời kết bạn!"
    ]);
    exit;
}

$stmt->bind_param("i", $userId);

$stmt->execute();

$result = $stmt->get_result();

$requests = [];

while ($row = $result->fetch_assoc()) {
    $requests[] = $row;
}

echo json_encode($requests);

$stmt->close();
$conn->close();

?>