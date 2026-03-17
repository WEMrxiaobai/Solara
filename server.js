// 添加全局错误捕获
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 健康检查端点
app.get('/api/health', (req, res) => {
  const protocol = req.get('X-Forwarded-Proto') || req.protocol;
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    protocol: protocol
  });
});

// 调试端点：显示当前请求的详细信息
app.get('/api/debug', (req, res) => {
  const debugInfo = {
    headers: {
      'x-forwarded-proto': req.get('X-Forwarded-Proto'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'host': req.get('Host'),
      'user-agent': req.get('User-Agent')
    },
    connection: {
      protocol: req.protocol,
      secure: req.secure,
      ip: req.ip,
      ips: req.ips
    },
    config: {
      NODE_ENV: process.env.NODE_ENV
    }
  };
  res.json(debugInfo);
});

// 导入路由
const paletteRouter = require('./src/palette');
const proxyRouter = require('./src/proxy');

// 路由配置（不需要认证）
app.use('/palette', paletteRouter);
app.use('/proxy', proxyRouter);

// 主页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 首页路由别名
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404 处理 - 修复：使用 HTML 响应而不是不存在的文件
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API端点不存在' });
  } else {
    // 返回简单的 HTML 404 页面，而不是尝试读取不存在的文件
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>页面未找到 - Solara Music</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
              }
              .container {
                  background: rgba(255,255,255,0.1);
                  padding: 40px;
                  border-radius: 10px;
                  backdrop-filter: blur(10px);
              }
              h1 { font-size: 48px; margin-bottom: 20px; }
              p { font-size: 18px; margin-bottom: 30px; }
              a { 
                  color: white; 
                  text-decoration: none;
                  border: 1px solid white;
                  padding: 10px 20px;
                  border-radius: 5px;
                  transition: all 0.3s;
              }
              a:hover {
                  background: white;
                  color: #667eea;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>404</h1>
              <p>抱歉，您访问的页面不存在。</p>
              <a href="/">返回首页</a>
          </div>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`Solara Music Server 启动成功`);
  console.log(`=================================================`);
  console.log(`服务端口: ${PORT}`);
  console.log(`环境变量配置:`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
  console.log(`=================================================`);
  console.log(`访问地址:`);
  console.log(`  - 直接访问: http://localhost:${PORT}`);
  console.log(`  - 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  - 调试信息: http://localhost:${PORT}/api/debug`);
  console.log(`=================================================`);
});
