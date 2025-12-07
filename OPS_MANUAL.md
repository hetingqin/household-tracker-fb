# 项目运维手册 (Operations Manual)

本文档旨在指导开发人员和运维人员如何部署、启动和维护 **家庭日用品追踪 (Household Tracker)** 项目。

## 1. 环境准备 (Prerequisites)

在开始之前，请确保您的环境已安装以下工具：

*   **Node.js**: (建议 v16 或更高版本) [下载地址](https://nodejs.org/)
*   **Firebase CLI**: 用于与 Firebase 服务交互。
    ```bash
    npm install -g firebase-tools
    ```
*   **Git**: 版本控制工具。

## 2. 项目初始化 (Installation)

首次获取项目代码后，需要进行初始化：

1.  **克隆代码**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/household-tracker.git
    cd household-tracker
    ```

2.  **登录 Firebase**:
    ```bash
    firebase login
    ```

3.  **关联项目**:
    如果您是首次在本地运行，可能需要关联到现有的 Firebase 项目：
    ```bash
    firebase use --add household-tracker-e3c57
    ```

## 3. 本地开发 (Local Development)

### 启动项目 (Start)
启动本地开发服务器，用于开发和调试。该服务支持热重载。

```bash
firebase serve
```
*   **访问地址**: 默认通常为 `http://localhost:5000` (终端会显示具体端口)。

### 停止项目 (Stop)
在运行终端中，按下组合键停止服务：
*   **Windows/Linux/Mac**: `Ctrl + C`

## 4. 部署上线 (Deployment)

将本地代码发布到生产环境 (Firebase Hosting)。

### 部署命令
```bash
firebase deploy
```

### 验证部署
部署完成后，终端会输出 Hosting URL。
*   **线上地址**: [https://household-tracker-e3c57.web.app](https://household-tracker-e3c57.web.app)

## 5. 常见问题 (FAQ)

*   **Q: 部署时提示权限不足 (Permission denied)?**
    *   A: 请检查是否已登录正确的账号 (`firebase login`)，且该账号拥有项目的编辑权限。

*   **Q: 本地运行正常，线上数据不显示?**
    *   A: 请检查 Firebase Console 中的 Firestore 数据库权限规则 (`firestore.rules`) 是否允许读写。

*   **Q: 如何查看线上日志?**
    *   A: 访问 [Firebase Console](https://console.firebase.google.com/) -> Functions (如果使用了云函数) 或 Hosting 页面查看概览。
