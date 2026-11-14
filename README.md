# 这是前端预览项目，后端和数据库不上传到github公开（谁会把自己的云服务器ip和db密码搞上来呢）
## 本项目已经经过云服务器上线测试，确认可上线，功能正常
## 自己也想体验的话可以叫ai给你mock一个后端，或者自己搓后端/db

# AbyssSystem 前端

前端使用 Vue 3、TypeScript、Vue Router、Pinia、Tailwind CSS 4、AntV G2 和 Vite 构建。


## 快速启动

```powershell
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

如果端口被占用，Vite 会自动使用其他可用端口。

## 生产构建

```powershell
npm run build
```

构建命令会先执行 TypeScript/Vue 类型检查，再执行 Vite 生产构建。

## API 地址

默认后端地址为：

```text
http://localhost:8080/api（自机后端默认端口）
```

如需修改，在当前目录创建 `.env.local`：

```env
VITE_API_BASE=http://localhost:8080/api
```
