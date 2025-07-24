# 批量修复API导入脚本
Write-Host "开始修复API导入..." -ForegroundColor Green

# 需要修复的文件列表
$files = @(
    "src\views\teacher\UserManagement.vue",
    "src\views\teacher\Dashboard.vue", 
    "src\views\teacher\ClassManagement.vue",
    "src\views\Register.vue",
    "src\views\Profile.vue"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "修复文件: $file" -ForegroundColor Yellow
        
        # 替换import语句
        $content = Get-Content $file -Raw
        $content = $content -replace "import axios from 'axios';", "import api from '@/utils/axios';"
        $content = $content -replace 'axios\.', 'api.'
        Set-Content $file $content -NoNewline
        
        Write-Host "✓ 完成: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ 文件不存在: $file" -ForegroundColor Red
    }
}

Write-Host "所有文件修复完成！" -ForegroundColor Green 