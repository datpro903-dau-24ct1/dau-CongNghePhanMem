<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../config/database.php";

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";
$student_code = trim($data["student_code"] ?? "");
$class = trim($data["class"] ?? "");
$date_of_birth = trim($data["date_of_birth"] ?? "");

if (
    empty($name) ||
    empty($email) ||
    empty($password) ||
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

// Kiểm tra email
if (
    !preg_match(
        '/^[^\s@]+@(gmail\.com|[a-zA-Z0-9-]+\.edu\.vn)$/i',
        $email
    )
) {
    http_response_code(400);

    echo json_encode([
        "message" => "Email phải có đuôi @gmail.com hoặc tên miền .edu.vn!"
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Kiểm tra email hoặc mã sinh viên đã tồn tại
|--------------------------------------------------------------------------
*/

$checkSql = "
    SELECT id
    FROM users
    WHERE email = ? OR student_code = ?
    LIMIT 1
";

$checkStmt = $conn->prepare($checkSql);

$checkStmt->bind_param(
    "ss",
    $email,
    $student_code
);

$checkStmt->execute();

$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {

    http_response_code(400);

    echo json_encode([
        "message" => "Email hoặc mã sinh viên đã tồn tại!"
    ]);

    $checkStmt->close();
    $conn->close();

    exit;
}

$checkStmt->close();

/*
|--------------------------------------------------------------------------
| Mã hóa mật khẩu
|--------------------------------------------------------------------------
*/

$hashedPassword = password_hash(
    $password,
    PASSWORD_DEFAULT
);

/*
|--------------------------------------------------------------------------
| Thêm user
|--------------------------------------------------------------------------
*/

$sql = "
    INSERT INTO users
    (
        name,
        email,
        password,
        student_code,
        class,
        date_of_birth
    )
    VALUES (?, ?, ?, ?, ?, ?)
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ssssss",
    $name,
    $email,
    $hashedPassword,
    $student_code,
    $class,
    $date_of_birth
);

if ($stmt->execute()) {

    http_response_code(201);

    echo json_encode([
        "message" => "Đăng ký thành công!",
        "userId" => $stmt->insert_id
    ]);

} else {

    http_response_code(500);

    echo json_encode([
        "message" => "Đăng ký thất bại!"
    ]);
}

$stmt->close();
$conn->close();