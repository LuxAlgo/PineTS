var institBiasIndicator = (context) => {
    const ema9 = ta.ema(close, 9);
    const ema18 = ta.ema(close, 18);

    const bull_bias = ema9 > ema18;
    const bear_bias = ema9 < ema18;

    plot(ema9, 'EMA 9', { title: 'EMA 9', color: '#2962FF', style: 'line' });
    plot(ema18, 'EMA 18', { title: 'EMA 18', color: '#FF6D00', style: 'line' });
    plot(bull_bias, 'Bull Bias', {
        title: 'Bull Bias',
        color: '#2962FF',
        style: 'background',
    });

    plot(bear_bias, 'Bear Bias', {
        title: 'Bear Bias',
        color: '#FF6D00',
        style: 'background',
    });

    //plot(val, 'Momentum', { color: bcolor, style: 'histogram', linewidth: 4 });
    //plot(0, 'Cross', { color: scolor, style: 'cross', linewidth: 2 });
};
