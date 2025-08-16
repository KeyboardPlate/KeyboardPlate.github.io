# GitHub Pages 部署脚本
Write-Host "开始构建和部署到 GitHub Pages..." -ForegroundColor Green

# 构建项目
Write-Host "正在构建项目..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "构建成功！" -ForegroundColor Green
    
    # 部署到 GitHub Pages
    Write-Host "正在部署到 GitHub Pages..." -ForegroundColor Yellow
    npm run deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "部署成功！你的网站将在几分钟内在 GitHub Pages 上可用。" -ForegroundColor Green
    } else {
        Write-Host "部署失败！请检查错误信息。" -ForegroundColor Red
    }
} else {
    Write-Host "构建失败！请检查错误信息。" -ForegroundColor Red
}