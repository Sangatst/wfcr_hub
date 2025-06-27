<?php
header('Content-Type: application/json');
$dir = __DIR__ . '/../data/verification-reports/';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}
$filename = isset($_POST['filename']) ? $_POST['filename'] : '';
if (!$filename || strpos($filename, '..') !== false || strpos($filename, '/') !== false) {
    echo json_encode(['success' => false, 'message' => 'Invalid filename.']);
    exit;
}
$path = $dir . $filename;
if (!is_file($path)) {
    echo json_encode(['success' => false, 'message' => 'File not found.']);
    exit;
}
if (unlink($path)) {
    echo json_encode(['success' => true, 'message' => 'File deleted.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete file.']);
} 