import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 1. 创建数据库连接池（性能优于单连接）
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT), // 转换为数字（env 中是字符串）
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10, // 最大连接数
  waitForConnections: true,
  queueLimit: 0,
});

// 2. 初始化数据库（首次运行创建库和表）
const initDB = async (): Promise<void> => {
  try {
    // 直接切换到已创建的数据库（不再检查/创建数据库）
    await pool.query(`USE ${process.env.DB_NAME}`);

    // 检查 schema_table 表是否存在，不存在则创建
    const [tableExist] = await pool.query(`SHOW TABLES LIKE 'schema_table'`);
    if ((tableExist as any[]).length === 0) {
      await pool.query(`
        CREATE TABLE schema_table (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(20) NOT NULL UNIQUE,
          context TEXT NOT NULL,
          type ENUM('Page', 'Flow') NOT NULL,
          create_user VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_delete INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('✅ 表 schema_table 创建成功');
    } else {
      console.log('✅ 表 schema_table 已存在，无需创建');
    }
  } catch (err) {
    console.error('❌ 数据库初始化失败：', (err as Error).message);
    process.exit(1);
  }
};
// 执行数据库初始化
initDB();

// 导出连接池，供控制器使用
export default pool;