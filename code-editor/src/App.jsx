import Editor from '@monaco-editor/react'
import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:3001')

function App() {
  const [language, setLanguage] = useState('javascript')
  const [roomId, setRoomId] = useState('')
  const [joined, setJoined] = useState(false)
  const editorRef = useRef(null)
  const isRemoteUpdate = useRef(false)

  useEffect(() => {
    socket.on('load-code', (code) => {
      if (editorRef.current) {
        isRemoteUpdate.current = true
        editorRef.current.setValue(code)
      }
    })

    socket.on('code-update', (code) => {
      if (editorRef.current) {
        isRemoteUpdate.current = true
        editorRef.current.setValue(code)
      }
    })

    return () => {
      socket.off('load-code')
      socket.off('code-update')
    }
  }, [])

  const joinRoom = () => {
    if (roomId.trim()) {
      socket.emit('join-room', roomId)
      setJoined(true)
    }
  }

  const handleEditorChange = (value) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false
      return
    }
    if (joined) {
      socket.emit('code-change', { roomId, code: value })
    }
  }

  return (
    <div className="app">
      <div className="toolbar">
        <h1>Collaborative Code Editor</h1>
        <div className="controls">
          {!joined ? (
            <>
              <input
                placeholder="Enter room ID (e.g. room1)"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
              />
              <button onClick={joinRoom}>Join Room</button>
            </>
          ) : (
            <span className="room-badge">Room: {roomId}</span>
          )}
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </div>
      <Editor
        height="90vh"
        language={language}
        defaultValue="// Start coding here..."
        theme="vs-dark"
        options={{ fontSize: 16, minimap: { enabled: false }, wordWrap: 'on' }}
        onMount={editor => { editorRef.current = editor }}
        onChange={handleEditorChange}
      />
    </div>
  )
}

export default App