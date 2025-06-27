<?php
// Database configuration
$host = 'localhost';
$dbname = 'nchm_content';
$username = 'content_user';
$password = 'your_secure_password';

// API settings
$api_key = 'your_secure_api_key';

// Connect to database
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Verify API key
function verifyApiKey($provided_key) {
    global $api_key;
    return $provided_key === $api_key;
}
?>
