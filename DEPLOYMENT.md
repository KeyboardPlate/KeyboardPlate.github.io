# GitHub Pages 部署指南

## 配置步骤

### 1. 更新 package.json 中的 homepage
请将 `package.json` 中的 `homepage` 字段更新为你的实际 GitHub 信息：
```json
"homepage": "https://你的用户名.github.io/仓库名"
```

### 2. 在 GitHub 上设置仓库
1. 将代码推送到 GitHub 仓库
2. 进入仓库的 Settings > Pages
3. 在 Source 部分选择 "GitHub Actions"

### 3. 部署方式

#### 方式一：手动部署
运行以下命令：
```bash
npm run deploy
```

或者使用 PowerShell 脚本：
```powershell
.\deploy.ps1
```

#### 方式二：自动部署（推荐）
项目已配置 GitHub Actions，当你推送代码到 main 或 master 分支时会自动部署。

## 注意事项

1. 确保你的 GitHub 仓库是公开的，或者你有 GitHub Pro 账户
2. 首次部署可能需要几分钟才能在网站上看到效果
3. 如果遇到路径问题，检查 `homepage` 配置是否正确
4. 确保所有静态资源使用相对路径

## 访问网站
部署成功后，你可以通过以下地址访问网站：
`https://你的用户名.github.io/仓库名`