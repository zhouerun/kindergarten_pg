# 安全的API修复脚本
Write-Host "开始安全修复API导入..." -ForegroundColor Green

# 需要修复的文件列表
$files = @(
    "src\views\teacher\PhotoUpload.vue",
    "src\views\teacher\PhotoManagement.vue", 
    "src\views\teacher\Dashboard.vue",
    "src\views\teacher\ClassManagement.vue",
    "src\views\Register.vue",
    "src\views\Profile.vue"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "修复文件: $file" -ForegroundColor Yellow
        
        try {
            # 读取文件内容
            $content = Get-Content $file -Raw -Encoding UTF8
            
            # 替换import语句
            $content = $content -replace "import axios from 'axios';", "import api from '@/utils/axios';"
            
            # 替换axios调用
            $content = $content -replace 'axios\.', 'api.'
            
            # 写回文件
            Set-Content $file $content -Encoding UTF8 -NoNewline
            
            Write-Host "✓ 完成: $file" -ForegroundColor Green
        } catch {
            Write-Host "✗ 错误: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ 文件不存在: $file" -ForegroundColor Red
    }
}

Write-Host "所有文件修复完成！" -ForegroundColor Green 