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

$friendId = isset($_GET["friend_id"])
    ? intval($_GET["friend_id"])
    : 0;

if (!$userId || !$friendId) {
    http_response_code(400);

    echo json_encode([
        "message" => "Thiếu user_id hoặc friend_id!"
    ]);

    exit;
}

$sql = "
    SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.created_at,

        sender.name AS sender_name,
        sender.avatar AS sender_avatar,

        receiver.name AS receiver_name,
        receiver.avatar AS receiver_avatar

    FROM messages m

    JOIN users sender
        ON m.sender_id = sender.id

    JOIN users receiver
        ON m.receiver_id = receiver.id

    WHERE
        (
            m.sender_id = ?
            AND m.receiver_id = ?
        )

        OR

        (
            m.sender_id = ?
            AND m.receiver_id = ?
        )

    ORDER BY m.created_at ASC
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "message" => "Không thể lấy tin nhắn!"
    ]);

    exit;
}

$stmt->bind_param(
    "iiii",
    $userId,
    $friendId,
    $friendId,
    $userId
);

$stmt->execute();

$result = $stmt->get_result();

$messages = [];

while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
}

echo json_encode($messages);

$stmt->close();
$conn->close();

?>