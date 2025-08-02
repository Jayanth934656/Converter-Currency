class CurrencyConverter {
    constructor() {
        this.apiKey = null; // Using free tier without API key
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/';
        this.currencies = {};
        this.exchangeRates = {};
        
        this.initializeElements();
        this.bindEvents();
        this.loadCurrencies();
    }
    
    initializeElements() {
        this.form = document.getElementById('converterForm');
        this.sourceCurrency = document.getElementById('sourceCurrency');
        this.targetCurrency = document.getElementById('targetCurrency');
        this.amountInput = document.getElementById('amount');
        this.convertBtn = document.getElementById('convertBtn');
        this.swapBtn = document.getElementById('swapBtn');
        this.convertedAmount = document.getElementById('convertedAmount');
        this.exchangeRate = document.getElementById('exchangeRate');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.loadingSpinner = this.convertBtn.querySelector('.loading-spinner');
        this.btnText = this.convertBtn.querySelector('.btn-text');
    }
    
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
        
        // Real-time conversion on input change (optional enhancement)
        this.amountInput.addEventListener('input', () => {
            if (this.amountInput.value && this.sourceCurrency.value && this.targetCurrency.value) {
                this.debounce(() => this.convertCurrency(), 500);
            }
        });
    }
    
    async loadCurrencies() {
        try {
            // Common currencies with their full names
            this.currencies = {
                'USD': 'US Dollar',
                'EUR': 'Euro',
                'GBP': 'British Pound',
                'JPY': 'Japanese Yen',
                'AUD': 'Australian Dollar',
                'CAD': 'Canadian Dollar',
                'CHF': 'Swiss Franc',
                'CNY': 'Chinese Yuan',
                'INR': 'Indian Rupee',
                'KRW': 'South Korean Won',
                'BRL': 'Brazilian Real',
                'RUB': 'Russian Ruble',
                'MXN': 'Mexican Peso',
                'SGD': 'Singapore Dollar',
                'NZD': 'New Zealand Dollar',
                'ZAR': 'South African Rand',
                'HKD': 'Hong Kong Dollar',
                'SEK': 'Swedish Krona',
                'NOK': 'Norwegian Krone',
                'TRY': 'Turkish Lira'
            };
            
            this.populateCurrencyDropdowns();
            
            // Set default currencies
            this.sourceCurrency.value = 'USD';
            this.targetCurrency.value = 'EUR';
            
        } catch (error) {
            this.showError('Failed to load currencies. Please refresh the page.');
        }
    }
    
    populateCurrencyDropdowns() {
        const currencyOptions = Object.entries(this.currencies)
            .map(([code, name]) => `<option value="${code}">${code} - ${name}</option>`)
            .join('');
        
        this.sourceCurrency.innerHTML = '<option value="">Select source currency</option>' + currencyOptions;
        this.targetCurrency.innerHTML = '<option value="">Select target currency</option>' + currencyOptions;
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        await this.convertCurrency();
    }
    
    async convertCurrency() {
        const amount = parseFloat(this.amountInput.value);
        const from = this.sourceCurrency.value;
        const to = this.targetCurrency.value;
        
        if (!amount || !from || !to) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (amount <= 0) {
            this.showError('Amount must be greater than 0');
            return;
        }
        
        this.setLoadingState(true);
        this.hideMessages();
        
        try {
            const rate = await this.getExchangeRate(from, to);
            const convertedValue = amount * rate;
            
            this.displayResult(convertedValue, from, to, rate);
            this.showSuccess('Conversion completed successfully!');
            
        } catch (error) {
            this.showError(error.message || 'Failed to convert currency. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    async getExchangeRate(from, to) {
        try {
            // Check if we have cached rates for this base currency
            if (!this.exchangeRates[from] || this.isRateExpired(from)) {
                const response = await fetch(`${this.baseUrl}${from}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.rates) {
                    throw new Error('Invalid response format');
                }
                
                this.exchangeRates[from] = {
                    rates: data.rates,
                    timestamp: Date.now()
                };
            }
            
            const rate = this.exchangeRates[from].rates[to];
            
            if (!rate) {
                throw new Error(`Exchange rate not available for ${to}`);
            }
            
            return rate;
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            throw error;
        }
    }
    
    isRateExpired(currency) {
        const cacheTime = 10 * 60 * 1000; // 10 minutes
        return Date.now() - this.exchangeRates[currency].timestamp > cacheTime;
    }
    
    displayResult(convertedValue, from, to, rate) {
        const formattedAmount = this.formatCurrency(convertedValue, to);
        this.convertedAmount.textContent = formattedAmount;
        
        const rateText = `1 ${from} = ${rate.toFixed(4)} ${to}`;
        this.exchangeRate.textContent = rateText;
    }
    
    formatCurrency(amount, currency) {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 4
            }).format(amount);
        } catch (error) {
            // Fallback formatting if currency is not supported
            return `${currency} ${amount.toFixed(2)}`;
        }
    }
    
    swapCurrencies() {
        const sourceValue = this.sourceCurrency.value;
        const targetValue = this.targetCurrency.value;
        
        if (sourceValue && targetValue) {
            this.sourceCurrency.value = targetValue;
            this.targetCurrency.value = sourceValue;
            
            // Auto-convert if amount is entered
            if (this.amountInput.value) {
                this.convertCurrency();
            }
        }
    }
    
    setLoadingState(loading) {
        this.convertBtn.disabled = loading;
        
        if (loading) {
            this.loadingSpinner.classList.add('show');
            this.btnText.textContent = 'Converting...';
        } else {
            this.loadingSpinner.classList.remove('show');
            this.btnText.textContent = 'Convert';
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }
    
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 3000);
    }
    
    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }
    
    // Utility function for debouncing
    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }
}

// Initialize the currency converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});