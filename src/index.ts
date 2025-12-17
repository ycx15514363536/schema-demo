import app from './app'
import dotenv from 'dotenv'

dotenv.config()

const PORT = Number(process.env.PORT) || 8080

app.listen(PORT, () => {
  console.log(`服务器启动成功,访问地址：http://localhost:${PORT}`)
})