const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { VM } = require('vm2')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

const rooms = {}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  socket.on('join-room', (roomId) => {
    socket.join(roomId)
    if (rooms[roomId]) socket.emit('load-code', rooms[roomId])
  })
  socket.on('code-change', ({ roomId, code }) => {
    rooms[roomId] = code
    socket.to(roomId).emit('code-update', code)
  })
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

app.post('/run', (req, res) => {
  const { language, code } = req.body

  if (language !== 'javascript') {
    return res.json({ output: 'Only JavaScript execution is supported in this demo. Python and C++ coming soon!' })
  }

  const logs = []
  const vm = new VM({
    timeout: 5000,
    sandbox: {
      console: {
        log: (...args) => logs.push(args.map(String).join(' ')),
        error: (...args) => logs.push(args.map(String).join(' ')),
      }
    }
  })

  try {
    vm.run(code)
    res.json({ output: logs.join('\n') || 'Code ran successfully (no output)' })
  } catch (e) {
    res.json({ output: 'Error: ' + e.message })
  }
})

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001')
})