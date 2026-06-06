import { useState } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import './App.css'

function App() {
  const [ticker, setTicker] = useState('AAPL')
  const [startDate, setStartDate] = useState('2020-01-01')
  const [endDate, setEndDate] = useState('2024-01-01')
  const [shortWindow, setShortWindow] = useState(50)
  const [longWindow, setLongWindow] = useState(200)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runBacktest = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
 const res = await axios.post('https://stock-backtester-api-txtx.onrender.com/backtest', {        ticker,
        start_date: startDate,
        end_date: endDate,
        short_window: parseInt(shortWindow),
        long_window: parseInt(longWindow),
      })
      if (res.data.error) {
        setError(res.data.error)
      } else {
        setResult(res.data)
      }
    } catch (e) {
      setError('Failed to connect to backend.')
    }
    setLoading(false)
  }

  const sample = result?.chart_data?.filter((_, i) => i % 5 === 0) || []

  return (
    <div className="app">
      <div className="header">
        <h1>📈 Stock Strategy Backtester</h1>
        <p>Test a Moving Average Crossover strategy on any stock</p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Ticker Symbol</label>
          <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="e.g. AAPL" />
        </div>
        <div className="control-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="control-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="control-group">
          <label>Short MA ({shortWindow} days)</label>
          <input type="range" min="5" max="100" value={shortWindow} onChange={e => setShortWindow(e.target.value)} />
        </div>
        <div className="control-group">
          <label>Long MA ({longWindow} days)</label>
          <input type="range" min="50" max="300" value={longWindow} onChange={e => setLongWindow(e.target.value)} />
        </div>
        <button onClick={runBacktest} disabled={loading}>
          {loading ? 'Running...' : '▶ Run Backtest'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results">
          <div className="stats">
            <div className="stat-card">
              <div className="stat-label">Initial Investment</div>
              <div className="stat-value">${result.initial_value.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Final Value</div>
              <div className="stat-value">${result.final_value.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Return</div>
              <div className={`stat-value ${result.total_return >= 0 ? 'positive' : 'negative'}`}>
                {result.total_return >= 0 ? '+' : ''}{result.total_return}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Number of Trades</div>
              <div className="stat-value">{result.num_trades}</div>
            </div>
          </div>

          <div className="chart-container">
            <h2>Portfolio Value Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sample}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} interval={30} />
                <YAxis tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #444' }} />
                <Legend />
                <Line type="monotone" dataKey="portfolio" stroke="#4caf50" dot={false} name="Portfolio ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h2>Price & Moving Averages</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sample}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} interval={30} />
                <YAxis tick={{ fontSize: 11, fill: '#aaa' }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #444' }} />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#2196f3" dot={false} name="Price ($)" />
                <Line type="monotone" dataKey="short_ma" stroke="#ff9800" dot={false} name={`Short MA (${shortWindow})`} />
                <Line type="monotone" dataKey="long_ma" stroke="#e91e63" dot={false} name={`Long MA (${longWindow})`} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default App