const fs = require('fs')
const Koa = require('koa')
const cors = require('koa2-cors')
const helmet = require('koa-helmet')
const bodyParser = require('koa-bodyparser')
const morgan = require('koa-morgan')

const logger = require('koa-logger')
const Router = require('koa-router')
const path = require('path')
const router = new Router()
const app = new Koa()

app.use(logger())

const accessLogStream = fs.createWriteStream(__dirname + '/access.log')
app.use(morgan('short', { stream: accessLogStream }))

// 防止html注入攻击
app.use(helmet())
app.use(bodyParser())
// 跨域
app.use(
  cors({
    origin: '*',
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 86400,
    credentials: true, // 允许携带头部验证信息
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Token', 'X-Device-Id', 'X-Uid']
  })
)

function defineRouter(routesPath) {
  routesPath = routesPath || path.join(path.resolve(__dirname), 'routes')
  // 加载所有路由文件
  let routesFile = fs.readdirSync(routesPath)
  routesFile.map(element => {
    // const elementPath = routesPath + '/' + element
    const elementPath = path.join(routesPath, '/', element)
    const stat = fs.lstatSync(elementPath)
    const isDir = stat.isDirectory()
    if (isDir) {
      // 递归注册路由
      defineRouter(elementPath)
    } else {
      // 加载路由模块
      let route = require(elementPath)

      const prefixArr = routesPath.split('\\')
      let routePrefix = `/${prefixArr[prefixArr.length - 1]}` || '/v1'

      //api路径: 127.0.0.1:3000/v2/users
      router.use(routePrefix + '/' + element.replace('.js', ''), route.routes())
    }
  })
}

defineRouter()

// 测试
router.get('', ctx => {
  ctx.body = 'juein-api-server is working...'
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3000, _ => console.log('server in http://127.0.0.1:3000'))
