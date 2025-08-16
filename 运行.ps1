# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "正在启动定位板生成工具..." -ForegroundColor Green
Write-Host ""
Write-Host "请确保已安装 Node.js，如果没有安装请访问：https://nodejs.org/" -ForegroundColor Yellow
Write-Host ""

# 检查是否安装了 Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "检测到 Node.js 版本：$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误：未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Write-Host "下载地址：https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

# 检查是否安装了依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "首次运行，正在安装依赖包..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "依赖安装失败，请检查网络连接" -ForegroundColor Red
        Read-Host "按回车键退出"
        exit 1
    }
    Write-Host "依赖安装完成！" -ForegroundColor Green
}

Write-Host "启动开发服务器..." -ForegroundColor Green
Write-Host "浏览器将自动打开 http://localhost:3000" -ForegroundColor Cyan
Write-Host "如果没有自动打开，请手动访问该地址" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 可以停止服务器" -ForegroundColor Yellow
Write-Host ""

# 启动开发服务器
npm start

Write-Host ""
Write-Host "服务器已停止" -ForegroundColor Yellow
Read-Host "按回车键退出"