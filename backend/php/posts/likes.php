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


// ======================================================
// CHỈ CHO PHÉP POST
// ======================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "message" => "Method không được hỗ trợ!"
    ]);

    exit;
}


// ======================================================
// LẤY POST ID
// ======================================================

$postId = isset($_GET["post_id"])
    ? intval($_GET["post_id"])
    : 0;


// ======================================================
// LẤY USER ID
// ======================================================

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$userId = intval($data["user_id"] ?? 0);


if (!$postId || !$userId) {

    http_response_code(400);

    echo json_encode([
        "message" => "Thiếu postId hoặc userId!"
    ]);

    exit;
}


// ======================================================
// KIỂM TRA LIKE ĐÃ TỒN TẠI CHƯA
// ======================================================

$sql = "
    SELECT id
    FROM post_likes
    WHERE post_id = ?
    AND user_id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $postId,
    $userId
);

$stmt->execute();

$result = $stmt->get_result();


// ======================================================
// NẾU ĐÃ LIKE → BỎ LIKE
// ======================================================

if ($result->num_rows > 0) {

    $stmt->close();

    $sql = "
        DELETE FROM post_likes
        WHERE post_id = ?
        AND user_id = ?
    ";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param(
        "ii",
        $postId,
        $userId
    );

    if (!$stmt->execute()) {

        http_response_code(500);

        echo json_encode([
            "message" => "Không thể bỏ like!"
        ]);

        exit;
    }

    echo json_encode([
        "liked" => false
    ]);

    $stmt->close();
    $conn->close();

    exit;
}


// ======================================================
// CHƯA LIKE → THÊM LIKE
// ======================================================

$stmt->close();

$sql = "
    INSERT INTO post_likes
    (
        post_id,
        user_id
    )
    VALUES (?, ?)
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $postId,
    $userId
);

if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể like!"
    ]);

    exit;
}

echo json_encode([
    "liked" => true
]);

$stmt->close();
$conn->close();

?>