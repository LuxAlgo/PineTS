// Data Loading Helper (Simulating what was in chart.js)
var DATA_LENGTH = 500;
async function getIndicatorData(inficatorCode, tickerId, timeframe = '1w', periods = 500, stime, etime) {
    const pineTS = new PineTS(PineTS.Provider.Binance, tickerId, timeframe, periods, stime, etime);
    const { result, plots, marketData } = await pineTS.run(inficatorCode);
    return { result, plots, marketData };
}
console.log('Getting indicator data...');

(async () => {
    const { marketData, plots: macdPlots } = await getIndicatorData(macdIndicator, 'BTCUSDT', 'W', DATA_LENGTH);

    // Map Market Data to QFChart OHLCV format
    // marketData is array of objects: { openTime, open, high, low, close, volume }
    const ohlcvData = marketData.map((k) => ({
        time: k.openTime,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volume,
    }));

    // Initialize Chart
    const chartContainer = document.getElementById('main-chart');
    window.chart = new QFChart.QFChart(chartContainer, {
        title: 'BTC/USDT', // Custom title
        height: '600px',
        padding: 0.1,
        databox: {
            position: 'floating',
        },
        dataZoom: {
            visible: true,
            position: 'inside',
            height: 6,
            start: 70,
            end: 100,
        },
        layout: {
            mainPaneHeight: '60%',
            gap: 5,
        },
    });

    // Set Market Data
    chart.setMarketData(ohlcvData);

    // Set Indicators
    // Group plots into one indicator
    chart.addIndicator('MACD', macdPlots, {
        isOverlay: false,
        height: 16,
        titleColor: '#ff9900',
        controls: { collapse: true, maximize: true },
    });

    //add plugins
    // Register Measure Tool Plugin
    const measureTool = new QFChart.MeasureTool();
    chart.registerPlugin(measureTool);

    // Register Line Tool Plugin
    const lineTool = new QFChart.LineTool();
    chart.registerPlugin(lineTool);

    // Register Fibonacci Tool Plugin
    const fibTool = new QFChart.FibonacciTool();
    chart.registerPlugin(fibTool);
})();
