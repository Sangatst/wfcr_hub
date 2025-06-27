<?php
header('Content-Type: application/json');

// API key for security
$api_key = 'your_secure_api_key';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Only POST requests are allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Check if API key is provided and valid
if (!isset($data['api_key']) || $data['api_key'] !== $api_key) {
    echo json_encode(['error' => 'Invalid API key']);
    exit;
}

// Check required fields
if (!isset($data['file']) || !isset($data['content'])) {
    echo json_encode(['error' => 'File and content are required']);
    exit;
}

$file = '../data/' . basename($data['file']);
$content = $data['content'];

// Validate file path (security check)
if (!preg_match('/^\.\.\/data\/[a-zA-Z0-9_-]+\.json$/', $file)) {
    echo json_encode(['error' => 'Invalid file path']);
    exit;
}

try {
    // Create data directory if it doesn't exist
    if (!file_exists('../data')) {
        mkdir('../data', 0755, true);
    }
    
    // Write content to file
    $result = file_put_contents($file, json_encode($content, JSON_PRETTY_PRINT));
    
    if ($result === false) {
        echo json_encode(['error' => 'Failed to write to file']);
        exit;
    }
    
    echo json_encode(['success' => true, 'message' => 'Content updated successfully']);
} catch (Exception $e) {
    echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
}
?>
