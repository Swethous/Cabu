// app/javascript/controllers/stock_chart_controller.js
import { Controller } from "@hotwired/stimulus"
import { createChart } from "lightweight-charts"

export default class extends Controller {
  static targets = ["chart", "priceInfo"]
  static values = {
    symbol: String,
    refreshInterval: { type: Number, default: 5000 },
  }

  connect() {
    this.setupChart()
    this.fetchAndRender()

    this.refreshTimer = setInterval(
      () => this.fetchAndRender(),
      this.refreshIntervalValue
    )

    this.handleResize = () => {
      if (!this.chart) return
      this.chart.applyOptions({ width: this.chartTarget.clientWidth })
    }
    window.addEventListener("resize", this.handleResize)
  }

  disconnect() {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
    if (this.handleResize) window.removeEventListener("resize", this.handleResize)
    if (this.chart) this.chart.remove()
  }

  setupChart() {
    const el = this.chartTarget

    this.chart = createChart(el, {
      width: el.clientWidth,
      height: 450,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333333",
      },
      grid: {
        vertLines: { color: "#eeeeee" },
        horzLines: { color: "#eeeeee" },
      },
      timeScale: {
        borderColor: "#cccccc",
      },
    })

    // 🔥 캔들 차트 시리즈 생성
    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    })

    // 🔥 거래량 시리즈
    this.volumeSeries = this.chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#26a69a",
    })

    this.chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })
  }


  async fetchAndRender() {
    const symbol = this.symbolValue || "7203.T"

    try {
      const res = await fetch(`/stock/chart_data.json?symbol=${encodeURIComponent(symbol)}`)
      if (!res.ok) return

      const data = await res.json()

      // 가격 정보 UI 업데이트
      this.updatePriceInfo(data)

      // 🔥 캔들 차트 데이터 반영
      this.candleSeries.setData(data.candles)

      // 🔥 거래량 반영
      this.volumeSeries.setData(data.volume_series)

    } catch (e) {
      console.error("fetchAndRender error:", e)
    }
  }

  updatePriceInfo(data) {
    if (!this.hasPriceInfoTarget) {
    console.log("⚠️ priceInfoTarget 없음")
    return
    }
    if (!data.price) {
      this.priceInfoTarget.textContent = "가격 정보를 불러올 수 없습니다."
      return
    }

    const color = data.change >= 0 ? "red" : "blue"
    const sign  = data.change >= 0 ? "+" : ""

    this.priceInfoTarget.innerHTML = `
      <div style="font-size: 22px; font-weight: bold;">
        $${data.price.toFixed(2)}
        <span style="color: ${color}; font-size: 18px;">
          (${sign}${data.change.toFixed(2)},
          ${sign}${data.change_percent.toFixed(2)}%)
        </span>
      </div>

      <div style="font-size: 14px; color:#666;">
        High: $${data.high?.toFixed ? data.high.toFixed(2) : data.high} /
        Low: $${data.low?.toFixed ? data.low.toFixed(2) : data.low} /
        Vol: ${data.volume?.toLocaleString?.() || data.volume}
      </div>
    `
  }
}