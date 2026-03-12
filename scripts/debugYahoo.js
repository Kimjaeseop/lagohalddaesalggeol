import yahooFinance from 'yahoo-finance2';
import * as yahooFinanceModule from 'yahoo-finance2';

console.log('Default Export type:', typeof yahooFinance);
console.log('Default Export keys:', Object.keys(yahooFinance));
console.log('Module Exports keys:', Object.keys(yahooFinanceModule));

try {
    const quote = await yahooFinance.quote('AAPL');
    console.log('Quote success:', quote);
} catch (e) {
    console.log('Quote failed:', e.message);
}
