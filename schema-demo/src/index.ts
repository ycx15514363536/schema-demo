import app from './app';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 获取端口（默认 8080）
const PORT = Number(process.env.PORT) || 8080;

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 服务器启动成功！访问地址：http://localhost:${PORT}`);
});