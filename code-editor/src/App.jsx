import Editor from '@monaco-editor/react'
import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('https://code-editor-api-1z2v.onrender.com')
function App() {
  const [language, setLanguage] = useState('javascript')
  const [roomId, setRoomId] = useState('')
  const [joined, setJoined] = useState(false)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
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
    if (joined) socket.emit('code-change', { roomId, code: value })
  }

  const runCode = async () => {
      const code = editorRef.current?.getValue()
  if (!code) return
  setRunning(true)
  setOutput('Running...')
  try {
    const res = await fetch('http://localhost:3001/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code }),
    })
    const data = await res.json()
    setOutput(data.output)
  } catch (e) {
    setOutput('Error: ' + e.message)
  }
  setRunning(false)
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
          <button className="run-btn" onClick={runCode} disabled={running}>
            {running ? 'Running...' : '▶ Run'}
          </button>
        </div>
      </div>
      <div className="main">
        <Editor
          height="100%"
          language={language}
          defaultValue="// Start coding here..."
          theme="vs-dark"
          options={{ fontSize: 16, minimap: { enabled: false }, wordWrap: 'on' }}
          onMount={editor => { editorRef.current = editor }}
          onChange={handleEditorChange}
        />
        <div className="output-panel">
          <div className="output-header">Output</div>
          <pre className="output-content">{output || 'Click ▶ Run to see output'}</pre>
        </div>
      </div>
    </div>
  )
}

export default App