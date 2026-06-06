from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class BacktestRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    short_window: int = 50
    long_window: int = 200

@app.post("/backtest")
def backtest(req: BacktestRequest):
    df = yf.download(req.ticker, start=req.start_date, end=req.end_date, auto_adjust=True, progress=False)
    
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)

    if df.empty:
        return {"error": "No data found for this ticker"}

    df["short_ma"] = df["Close"].rolling(req.short_window).mean()
    df["long_ma"] = df["Close"].rolling(req.long_window).mean()

    df["signal"] = 0
    df.loc[df["short_ma"] > df["long_ma"], "signal"] = 1
    df["position"] = df["signal"].diff()

    cash = 10000
    shares = 0
    portfolio = []

    for i, row in df.iterrows():
        price = float(row["Close"])
        if row["position"] == 1 and cash > 0:
            shares = cash / price
            cash = 0
        elif row["position"] == -1 and shares > 0:
            cash = shares * price
            shares = 0
        total = cash + shares * price
        portfolio.append(total)

    df["portfolio"] = portfolio
    total_return = ((portfolio[-1] - 10000) / 10000) * 100
    trades = df[df["position"] != 0].copy()

    chart_data = []
    for i, row in df.iterrows():
        price = float(row["Close"])
        chart_data.append({
            "date": str(i.date()),
            "price": round(price, 2),
            "portfolio": round(row["portfolio"], 2),
            "short_ma": round(row["short_ma"], 2) if not pd.isna(row["short_ma"]) else None,
            "long_ma": round(row["long_ma"], 2) if not pd.isna(row["long_ma"]) else None,
        })

    return {
        "total_return": round(total_return, 2),
        "final_value": round(portfolio[-1], 2),
        "initial_value": 10000,
        "num_trades": len(trades),
        "chart_data": chart_data,
    }

@app.get("/")
def root():
    return {"message": "Stock Backtester API running"}