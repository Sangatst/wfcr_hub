<?php
header('Content-Type: application/json');

// Allowed file types
$allowed_types = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'text/x-csv',
    'application/vnd.ms-excel',
    'application/octet-stream' // Some browsers use this for csv/xls
];

// Allowed extensions for extra check
$allowed_exts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'];

$max_size = 10 * 1024 * 1024; // 10MB
$upload_dir = __DIR__ . '/../data/verification-reports/';

if (!isset($_FILES['report-upload'])) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded.']);
    exit;
}

$file = $_FILES['report-upload'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'File upload error.']);
    exit;
}

if ($file['size'] > $max_size) {
    echo json_encode(['success' => false, 'message' => 'File is too large (max 10MB).']);
    exit;
}

// Check MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

// Check extension
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($mime, $allowed_types) && !in_array($ext, $allowed_exts)) {
    echo json_encode(['success' => false, 'message' => 'Invalid file type.']);
    exit;
}

// Ensure upload directory exists
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0775, true)) {
        echo json_encode(['success' => false, 'message' => 'Failed to create upload directory.']);
        exit;
    }
}

// Generate unique filename
$base = pathinfo($file['name'], PATHINFO_FILENAME);
$base = preg_replace('/[^a-zA-Z0-9_-]/', '_', $base);
$filename = $base . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
$target = $upload_dir . $filename;

if (move_uploaded_file($file['tmp_name'], $target)) {
    echo json_encode(['success' => true, 'message' => 'File uploaded successfully.', 'filename' => $filename]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save file.']);
} 