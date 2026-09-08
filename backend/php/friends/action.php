<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

$method = $_SERVER["REQUEST_METHOD"];

$data = json_decode(
    file_get_contents("php://input"),
    true
);


/*
|--------------------------------------------------------------------------
| GỬI LỜI MỜI
|--------------------------------------------------------------------------
*/

if (
    $method === "POST"
    && isset($_GET["action"])
    && $_GET["action"] === "request"
) {

    $senderId = intval(
        $data["sender_id"] ?? 0
    );

    $receiverId = intval(
        $data["receiver_id"] ?? 0
    );

    if (!$senderId || !$receiverId) {
        http_response_code(400);

        echo json_encode([
            "message" => "Thiếu thông tin người dùng!"
        ]);

        exit;
    }

    if ($senderId === $receiverId) {
        http_response_code(400);

        echo json_encode([
            "message" => "Không thể kết bạn với chính mình!"
        ]);

        exit;
    }


    /*
    | Kiểm tra quan hệ hiện tại
    */

    $sql = "
        SELECT
            id,
            status,
            user_id,
            friend_id

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

    if ($result->num_rows > 0) {

        $friendship = $result->fetch_assoc();

        $stmt->close();

        if ($friendship["status"] === "accepted") {

            http_response_code(400);

            echo json_encode([
                "message" => "Hai người đã là bạn bè!"
            ]);

            exit;
        }

        if ($friendship["status"] === "pending") {

            http_response_code(400);

            echo json_encode([
                "message" => "Lời mời kết bạn đã tồn tại!"
            ]);

            exit;
        }

        /*
        | Nếu trước đó bị rejected
        | cho phép gửi lại
        */

        $sql = "
            UPDATE friendships

            SET
                user_id = ?,
                friend_id = ?,
                status = 'pending',
                created_at = CURRENT_TIMESTAMP

            WHERE id = ?
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "iii",
            $senderId,
            $receiverId,
            $friendship["id"]
        );

    } else {

        $stmt->close();

        $sql = "
            INSERT INTO friendships
            (
                user_id,
                friend_id,
                status
            )
            VALUES (?, ?, 'pending')
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "ii",
            $senderId,
            $receiverId
        );
    }


    if (!$stmt->execute()) {

        http_response_code(500);

        echo json_encode([
            "message" => "Không thể gửi lời mời kết bạn!"
        ]);

        exit;
    }


    echo json_encode([
        "message" => "Đã gửi lời mời kết bạn!"
    ]);

    $stmt->close();
    $conn->close();

    exit;
}


/*
|--------------------------------------------------------------------------
| CHẤP NHẬN / TỪ CHỐI
|--------------------------------------------------------------------------
*/

if ($method === "PUT") {

    $friendshipId = isset($_GET["id"])
        ? intval($_GET["id"])
        : 0;

    $action = $_GET["action"] ?? "";

    if (!$friendshipId) {

        http_response_code(400);

        echo json_encode([
            "message" => "Thiếu friendship_id!"
        ]);

        exit;
    }


    /*
    | CHẤP NHẬN
    */

    if ($action === "accept") {

        $sql = "
            UPDATE friendships

            SET status = 'accepted'

            WHERE
                id = ?
                AND status = 'pending'
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "i",
            $friendshipId
        );

        if (!$stmt->execute()) {

            http_response_code(500);

            echo json_encode([
                "message" => "Không thể chấp nhận lời mời!"
            ]);

            exit;
        }

        if ($stmt->affected_rows === 0) {

            http_response_code(400);

            echo json_encode([
                "message" => "Lời mời không tồn tại hoặc đã được xử lý!"
            ]);

            exit;
        }

        echo json_encode([
            "message" => "Đã chấp nhận lời mời!"
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }


    /*
    | TỪ CHỐI
    */

    if ($action === "reject") {

        $sql = "
            UPDATE friendships

            SET status = 'rejected'

            WHERE
                id = ?
                AND status = 'pending'
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "i",
            $friendshipId
        );

        if (!$stmt->execute()) {

            http_response_code(500);

            echo json_encode([
                "message" => "Không thể từ chối lời mời!"
            ]);

            exit;
        }

        if ($stmt->affected_rows === 0) {

            http_response_code(400);

            echo json_encode([
                "message" => "Lời mời không tồn tại hoặc đã được xử lý!"
            ]);

            exit;
        }

        echo json_encode([
            "message" => "Đã từ chối lời mời!"
        ]);

        $stmt->close();
        $conn->close();

        exit;
    }
}


http_response_code(405);

echo json_encode([
    "message" => "Method không được hỗ trợ!"
]);

$conn->close();

?>