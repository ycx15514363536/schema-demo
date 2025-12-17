import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
})

const initDB = async (): Promise<void> => {
  try {
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionLimit: 1,
    })

    const [dbExist] = await tempPool.query(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`)
    if ((dbExist as any[]).length === 0) {
      await tempPool.query(`CREATE DATABASE ${process.env.DB_NAME}`)
      console.log(`数据库 ${process.env.DB_NAME} 创建成功`)
    } else {
      console.log(`数据库 ${process.env.DB_NAME} 已存在`)
    }

    await tempPool.end()
    await pool.query(`USE ${process.env.DB_NAME}`)

    const [tableExist] = await pool.query(`SHOW TABLES LIKE 'schema_table'`)
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      console.log('表 schema_table 创建成功')
    } else {
      console.log('表 schema_table 已存在')
    }
  } catch (err) {
    console.error('❌ 数据库初始化失败：', (err as Error).message)
    process.exit(1)
  }
}

initDB()

export default pool