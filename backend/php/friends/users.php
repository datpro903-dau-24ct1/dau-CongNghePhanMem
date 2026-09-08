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


/*
|--------------------------------------------------------------------------
| LẤY DANH SÁCH NGƯỜI DÙNG
|--------------------------------------------------------------------------
*/

$sql = "
    SELECT
        u.id,
        u.name,
        u.email,
        u.student_code,
        u.class,
        u.avatar,

        CASE

            /*
            |--------------------------------------------------------------------------
            | 1. ĐANG CHỜ - MÌNH ĐÃ GỬI
            |--------------------------------------------------------------------------
            */

            WHEN EXISTS (
                SELECT 1
                FROM friendships f
                WHERE
                    f.user_id = ?
                    AND f.friend_id = u.id
                    AND f.status = 'pending'
            )
            THEN 'pending_sent'


            /*
            |--------------------------------------------------------------------------
            | 2. ĐANG CHỜ - NGƯỜI KIA GỬI CHO MÌNH
            |--------------------------------------------------------------------------
            */

            WHEN EXISTS (
                SELECT 1
                FROM friendships f
                WHERE
                    f.user_id = u.id
                    AND f.friend_id = ?
                    AND f.status = 'pending'
            )
            THEN 'pending_received'


            /*
            |--------------------------------------------------------------------------
            | 3. ĐÃ LÀ BẠN BÈ
            |--------------------------------------------------------------------------
            */

            WHEN EXISTS (
                SELECT 1
                FROM friendships f
                WHERE
                    (
                        f.user_id = ?
                        AND f.friend_id = u.id
                    )
                    OR
                    (
                        f.user_id = u.id
                        AND f.friend_id = ?
                    )
                    AND f.status = 'accepted'
            )
            THEN 'accepted'


            /*
            |--------------------------------------------------------------------------
            | 4. CHƯA CÓ QUAN HỆ
            |--------------------------------------------------------------------------
            */

            ELSE 'none'

        END AS friend_status

    FROM users u

    WHERE u.id != ?

    ORDER BY u.name ASC
";


$stmt = $conn->prepare($sql);

if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể lấy danh sách người dùng!",
        "error" => $conn->error
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| BIND PARAM
|--------------------------------------------------------------------------
*/

$stmt->bind_param(
    "iiiii",
    $userId,
    $userId,
    $userId,
    $userId,
    $userId
);


/*
|--------------------------------------------------------------------------
| EXECUTE
|--------------------------------------------------------------------------
*/

if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "message" => "Không thể lấy danh sách người dùng!",
        "error" => $stmt->error
    ]);

    exit;
}


$result = $stmt->get_result();

$users = [];


while ($row = $result->fetch_assoc()) {

    $users[] = $row;

}


echo json_encode(
    $users,
    JSON_UNESCAPED_UNICODE
);


$stmt->close();

$conn->close();

?>