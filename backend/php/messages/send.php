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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "message" => "Method không được hỗ trợ!"
    ]);

    exit;
}

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$senderId = intval(
    $data["sender_id"] ?? 0
);

$receiverId = intval(
    $data["receiver_id"] ?? 0
);

$content = trim(
    $data["content"] ?? ""
);

if (
    !$senderId ||
    !$receiverId ||
    $content === ""
) {
    http_response_code(400);

    echo json_encode([
        "message" => "Thông tin tin nhắn không hợp lệ!"
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| KIỂM TRA 2 NGƯỜI CÓ PHẢI BẠN BÈ KHÔNG
|--------------------------------------------------------------------------
*/

$sql = "
    SELECT id
    FROM friendships

    WHERE
        (
            user_id = ?
            AND friend_id = ?
        )

        OR

        (
            user_id = ?
            AND friend_id = ?
        )

        AND status = 'accepted'

    LIMIT 1
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "iiii",
    $senderId,
    $receiverId,
    $receiverId,
    $senderId
);

$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {

    $stmt->close();

    http_response_code(403);

    echo json_encode([
        "message" => "Hai người chưa là bạn bè!"
    ]);

    exit;
}

$stmt->close();


/*
|--------------------------------------------------------------------------
| THÊM TIN NHẮN
|--------------------------------------------------------------------------
*/

$sql = "
    INSERT INTO messages
    (
        sender_id,
        receiver_id,
        content
    )

    VALUES (?, ?, ?)
";

$stmt = $conn->prepare($sql);

if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể gửi tin nhắn!"
    ]);

    exit;
}

$stmt->bind_param(
    "iis",
    $senderId,
    $receiverId,
    $content
);

if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể gửi tin nhắn!"
    ]);

    exit;
}

$messageId = $stmt->insert_id;

$stmt->close();


/*
|--------------------------------------------------------------------------
| LẤY TÊN NGƯỜI GỬI
|--------------------------------------------------------------------------
*/

$sql = "
    SELECT name
    FROM users
    WHERE id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $senderId
);

$stmt->execute();

$result = $stmt->get_result();

$user = $result->fetch_assoc();

$senderName = $user["name"] ?? "Bạn";

$stmt->close();


/*
|--------------------------------------------------------------------------
| TẠO THÔNG BÁO
|--------------------------------------------------------------------------
*/

$notificationContent =
    $senderName . " đã gửi cho bạn một tin nhắn.";

$sql = "
    INSERT INTO notifications
    (
        user_id,
        type,
        from_user_id,
        content,
        related_id
    )

    VALUES (?, 'message', ?, ?, ?)
";

$stmt = $conn->prepare($sql);

if ($stmt) {

    $stmt->bind_param(
        "iisi",
        $receiverId,
        $senderId,
        $notificationContent,
        $messageId
    );

    $stmt->execute();

    $stmt->close();
}


/*
|--------------------------------------------------------------------------
| TRẢ KẾT QUẢ
|--------------------------------------------------------------------------
*/

http_response_code(201);

echo json_encode([
    "message" => "Gửi tin nhắn thành công!",
    "messageId" => $messageId
]);

$conn->close();

?>