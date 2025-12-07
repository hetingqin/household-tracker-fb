# GitHub 上传指南

您的项目已经初始化了本地 Git 仓库，但由于未配置用户信息，提交尚未完成。请按照以下步骤操作：

## 1. 配置 Git 用户信息 (如果尚未配置)
在终端中运行以下命令（替换为您自己的信息）：
```bash
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

## 2. 提交代码
配置完成后，运行以下命令提交代码：
```bash
git commit -m "Initial commit: Household Tracker App with Firebase"
```

## 3. 在 GitHub 上创建仓库
1. 登录 [GitHub](https://github.com)。
2. 点击右上角的 `+` 号，选择 **New repository**。
3. Repository name 输入 `household-tracker` (或您喜欢的名字)。
4. 保持 Public 或 Private 均可。
5. **不要** 勾选 "Initialize this repository with a README" (因为我们本地已经有文件了)。
6. 点击 **Create repository**。

## 4. 推送代码
在 GitHub 仓库创建成功后的页面上，找到 "...or push an existing repository from the command line" 这一栏，复制其中的命令并在您的终端运行。通常如下所示：

```bash
git remote add origin https://github.com/YOUR_USERNAME/household-tracker.git
git branch -M main
git push -u origin main
```

## 5. 完成
刷新 GitHub 页面，您应该能看到所有代码已上传。
