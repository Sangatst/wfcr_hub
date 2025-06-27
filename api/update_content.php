<?php
header('Content-Type: application/json');
require_once 'config.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Only POST requests are allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Check if API key is provided and valid
if (!isset($data['api_key']) || !verifyApiKey($data['api_key'])) {
    echo json_encode(['error' => 'Invalid API key']);
    exit;
}

// Check required fields
if (!isset($data['section']) || !isset($data['content'])) {
    echo json_encode(['error' => 'Section and content are required']);
    exit;
}

$section = $data['section'];
$content = $data['content'];

try {
    // Begin transaction
    $pdo->beginTransaction();
    
    // Delete existing content for this section
    $stmt = $pdo->prepare("DELETE FROM content WHERE section = ?");
    $stmt->execute([$section]);
    
    // Insert new content
    $stmt = $pdo->prepare("INSERT INTO content (section, title, description, content, updated_at, updated_by) VALUES (?, ?, ?, ?, NOW(), ?)");
    
    foreach ($content as $item) {
        $stmt->execute([
            $section,
            $item['title'],
            $item['description'],
            $item['content'],
            $data['user_id']
        ]);
    }
    
    // Commit transaction
    $pdo->commit();
    
    echo json_encode(['success' => true, 'message' => 'Content updated successfully']);
} catch (PDOException $e) {
    // Rollback transaction on error
    $pdo->rollBack();
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
