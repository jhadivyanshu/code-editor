const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
})

const rooms = {}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-room', (roomId) => {
    socket.join(roomId)
    if (rooms[roomId]) {
      socket.emit('load-code', rooms[roomId])
    }
    console.log(`User ${socket.id} joined room ${roomId}`)
  })

  socket.on('code-change', ({ roomId, code }) => {
    rooms[roomId] = code
    socket.to(roomId).emit('code-update', code)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001')
})