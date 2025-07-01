# 良策AI - 智能分析平台

良策AI智能分析平台是一个基于Vue3和DeepSeek AI的智能分析工具，提供个人征信、企业征信、房产建议、融资建议等多种智能分析服务。

## 功能特点

- 个人征信分析：上传个人征信报告，获取专业分析和改进建议
- 企业征信分析：上传企业征信报告，获取专业分析和风险评估
- 房产建议：根据用户需求提供专业的房产投资建议
- 融资建议：根据企业或个人情况提供专业的融资方案建议

## 技术栈

- 前端框架：Vue 3
- 构建工具：Webpack 5
- UI组件库：Element Plus
- 包管理工具：NPM
- Node.js版本：v16

## 项目结构

```
liangceai/
├── public/               # 静态资源
├── src/
│   ├── api/              # API请求
│   ├── assets/           # 静态资源
│   ├── components/       # 组件
│   ├── config/           # 配置文件
│   ├── pages/            # 页面
│   ├── utils/            # 工具函数
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── .gitignore            # Git忽略文件
├── package.json          # 项目依赖
├── webpack.config.js     # Webpack配置
└── README.md             # 项目说明
```

## 开发指南

### 环境要求

- Node.js v16
- NPM

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## API密钥配置

使用平台前，需要配置DeepSeek API密钥：

1. 获取DeepSeek API密钥
2. 在应用中设置API密钥

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

ISC # 测试SSH连接
