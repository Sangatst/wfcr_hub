<?php
header('Content-Type: application/json');
require_once 'config.php';

// Check if API key is provided and valid
if (!isset($_GET['api_key']) || !verifyApiKey($_GET['api_key'])) {
    echo json_encode(['error' => 'Invalid API key']);
    exit;
}

// Get section parameter
$section = isset($_GET['section']) ? $_GET['section'] : null;

if (!$section) {
    echo json_encode(['error' => 'Section parameter is required']);
    exit;
}

try {
    // Query to get content for the specified section
    $stmt = $pdo->prepare("SELECT * FROM content WHERE section = ?");
    $stmt->execute([$section]);
    $content = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $content]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
