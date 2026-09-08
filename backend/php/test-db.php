<?php

header("Content-Type: text/plain; charset=UTF-8");

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
    die("❌ Kết nối thất bại: " . $conn->connect_error);
}

echo "✅ PHP kết nối MySQL thành công!\n";
echo "Database: " . $database . "\n";
echo "Host: " . $host;

$conn->close();