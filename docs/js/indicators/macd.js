var macdIndicator = (context) => {
    let fast_length = input.int({ title: 'Fast Length', defval: 12 });

    let slow_length = input.int({ title: 'Slow Length', defval: 26 });

    let src = input({ title: 'Source', defval: close });

    let signal_length = input.int({ title: 'Signal Smoothing', defval: 9 });

    let sma_source = input.string({
        title: 'Oscillator MA Type',
        defval: 'EMA',
    });

    let sma_signal = input.string({
        title: 'Signal Line MA Type',
        defval: 'EMA',
    });

    let fast_ma = sma_source == 'SMA' ? ta.sma(src, fast_length) : ta.ema(src, fast_length);

    let slow_ma = sma_source == 'SMA' ? ta.sma(src, slow_length) : ta.ema(src, slow_length);

    let macd = fast_ma - slow_ma;

    let signal = sma_signal == 'SMA' ? ta.sma(macd, signal_length) : ta.ema(macd, signal_length);

    let hist = macd - signal;

    const histColor = hist >= 0 ? (hist[1] < hist ? '#26A69A' : '#B2DFDB') : hist[1] < hist ? '#FFCDD2' : '#FF5252';
    plot(hist, 'Histogram', {
        title: 'Histogram',
        style: 'histogram',
        color: histColor,
    });

    plot(macd, 'MACD', { title: 'MACD', color: '#2962FF' });

    plot(signal, 'Signal', { title: 'Signal', color: '#FF6D00' });
};
