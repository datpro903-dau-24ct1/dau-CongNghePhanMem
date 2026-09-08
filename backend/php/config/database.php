<?php

$host = "localhost";
$user = "root";
$password = "";
$database = "it_connect";

$conn = new mysqli(
    $host,
    $user,
    $password,
    $database
);

if ($conn->connect_error) {
    http_response_code(500);

    echo json_encode([
        "message" => "Không thể kết nối database!",
        "error" => $conn->connect_error
    ]);

    exit;
}

$conn->set_charset("utf8mb4");