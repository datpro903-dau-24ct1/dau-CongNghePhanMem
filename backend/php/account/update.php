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


/* =========================
   NHẬN DỮ LIỆU
========================= */

$data = json_decode(
    file_get_contents("php://input"),
    true
);


$id = intval(
    $data["id"] ?? 0
);

$name = trim(
    $data["name"] ?? ""
);

$email = trim(
    $data["email"] ?? ""
);

$student_code = trim(
    $data["student_code"] ?? ""
);

$class = trim(
    $data["class"] ?? ""
);

$date_of_birth = trim(
    $data["date_of_birth"] ?? ""
);


/* =========================
   KIỂM TRA
========================= */

if (
    !$id ||
    empty($name) ||
    empty($email) ||
    empty($student_code) ||
    empty($class) ||
    empty($date_of_birth)
) {

    http_response_code(400);

    echo json_encode([
        "message" => "Vui lòng nhập đầy đủ thông tin!"
    ]);

    exit;
}


/* =========================
   KIỂM TRA EMAIL
========================= */

if (
    !preg_match(
        '/^[^\s@]+@(gmail\.com|[a-zA-Z0-9-]+\.edu\.vn)$/i',
        $email
    )
) {

    http_response_code(400);

    echo json_encode([
        "message" =>
            "Email phải có đuôi @gmail.com hoặc tên miền .edu.vn!"
    ]);

    exit;
}


/* =========================
   KIỂM TRA USER
========================= */

$checkUserSql = "
    SELECT id
    FROM users
    WHERE id = ?
    LIMIT 1
";

$checkUserStmt = $conn->prepare(
    $checkUserSql
);

if (!$checkUserStmt) {

    http_response_code(500);

    echo json_encode([
        "message" => "Lỗi chuẩn bị truy vấn!"
    ]);

    exit;
}

$checkUserStmt->bind_param(
    "i",
    $id
);

$checkUserStmt->execute();

$checkUserResult =
    $checkUserStmt->get_result();

if (
    $checkUserResult->num_rows === 0
) {

    http_response_code(404);

    echo json_encode([
        "message" => "Không tìm thấy người dùng!"
    ]);

    $checkUserStmt->close();
    $conn->close();

    exit;
}

$checkUserStmt->close();


/* =========================
   KIỂM TRA EMAIL TRÙNG
========================= */

$checkEmailSql = "
    SELECT id
    FROM users
    WHERE email = ?
    AND id != ?
    LIMIT 1
";

$checkEmailStmt = $conn->prepare(
    $checkEmailSql
);

$checkEmailStmt->bind_param(
    "si",
    $email,
    $id
);

$checkEmailStmt->execute();

$checkEmailResult =
    $checkEmailStmt->get_result();

if (
    $checkEmailResult->num_rows > 0
) {

    http_response_code(400);

    echo json_encode([
        "message" => "Email đã được sử dụng!"
    ]);

    $checkEmailStmt->close();
    $conn->close();

    exit;
}

$checkEmailStmt->close();


/* =========================
   KIỂM TRA MÃ SINH VIÊN TRÙNG
========================= */

$checkStudentSql = "
    SELECT id
    FROM users
    WHERE student_code = ?
    AND id != ?
    LIMIT 1
";

$checkStudentStmt = $conn->prepare(
    $checkStudentSql
);

$checkStudentStmt->bind_param(
    "si",
    $student_code,
    $id
);

$checkStudentStmt->execute();

$checkStudentResult =
    $checkStudentStmt->get_result();

if (
    $checkStudentResult->num_rows > 0
) {

    http_response_code(400);

    echo json_encode([
        "message" =>
            "Mã sinh viên đã được sử dụng!"
    ]);

    $checkStudentStmt->close();
    $conn->close();

    exit;
}

$checkStudentStmt->close();


/* =========================
   CẬP NHẬT
========================= */

$sql = "
    UPDATE users
    SET
        name = ?,
        email = ?,
        student_code = ?,
        class = ?,
        date_of_birth = ?
    WHERE id = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "message" =>
            "Không thể cập nhật thông tin!"
    ]);

    $conn->close();

    exit;
}


$stmt->bind_param(
    "sssssi",
    $name,
    $email,
    $student_code,
    $class,
    $date_of_birth,
    $id
);


/* =========================
   THỰC HIỆN
========================= */

if ($stmt->execute()) {

    http_response_code(200);

    echo json_encode([
        "message" =>
            "Cập nhật thông tin thành công!"
    ]);

} else {

    http_response_code(500);

    echo json_encode([
        "message" =>
            "Cập nhật thông tin thất bại!"
    ]);

}


$stmt->close();
$conn->close();

?>