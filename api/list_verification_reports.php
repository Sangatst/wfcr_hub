<?php
header('Content-Type: application/json');
$dir = __DIR__ . '/../data/verification-reports/';
$result = [];
if (is_dir($dir)) {
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        $path = $dir . $file;
        if (is_file($path)) {
            $result[] = [
                'filename' => $file,
                'size' => filesize($path),
                'modified' => date('Y-m-d H:i:s', filemtime($path))
            ];
        }
    }
}
echo json_encode(['success' => true, 'reports' => $result]); 