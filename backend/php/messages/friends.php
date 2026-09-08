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

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "message" => "Method không được hỗ trợ!"
    ]);

    exit;
}

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
        u.id,
        u.name,
        u.email,
        u.student_code,
        u.class,
        u.avatar

    FROM friendships f

    JOIN users u
        ON (
            CASE
                WHEN f.user_id = ? THEN f.friend_id
                ELSE f.user_id
            END
        ) = u.id

    WHERE
        (
            f.user_id = ?
            OR f.friend_id = ?
        )
        AND f.status = 'accepted'

    ORDER BY u.name ASC
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "message" => "Không thể lấy danh sách bạn bè!"
    ]);

    exit;
}

$stmt->bind_param(
    "iii",
    $userId,
    $userId,
    $userId
);

$stmt->execute();

$result = $stmt->get_result();

$friends = [];

while ($row = $result->fetch_assoc()) {
    $friends[] = $row;
}

echo json_encode($friends);

$stmt->close();
$conn->close();

?>