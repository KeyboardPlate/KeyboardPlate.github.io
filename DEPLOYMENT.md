# GitHub Pages 部署指南

## 配置步骤

### 1. 项目配置
项目已经配置完成，`homepage` 设置为：
```json
"homepage": "https://KeyboardPlate.github.io"
```

### 2. 部署方式

#### 手动部署（推荐）
运行以下命令进行部署：
```bash
npm run deploy
```

或者使用 PowerShell 脚本：
```powershell
.\deploy.ps1
```

这会自动构建项目并部署到 `gh-pages` 分支。

### 3. GitHub Pages 设置
1. 访问仓库：https://github.com/KeyboardPlate/KeyboardPlate.github.io
2. 进入 Settings > Pages
3. 在 Source 部分选择 "Deploy from a branch"
4. 选择 `gh-pages` 分支和 `/ (root)` 文件夹
5. 点击 Save

## 部署状态

✅ **已成功部署**：网站已经部署并可以访问
✅ **访问地址**：https://KeyboardPlate.github.io

## 更新网站

当你修改代码后，只需要运行：
```bash
npm run deploy
```

这会自动重新构建并更新网站。

## 注意事项

1. 由于这是 `username.github.io` 仓库，网站直接部署在根域名
2. 部署后可能需要几分钟才能看到更新
3. 确保所有静态资源使用相对路径
4. 手动部署比 GitHub Actions 更可靠，推荐使用