/**
 * Card Generator Utility
 * Generates valid test credit card numbers using Luhn algorithm
 */

class CardGenerator {
    /**
     * Generate cards based on BIN (Bank Identification Number)
     * @param {string} bin - First 6 digits of card (or more)
     * @param {number} quantity - Number of cards to generate
     * @param {string} format - Output format (standard, json, csv)
     * @returns {Array} Array of card objects
     */
    static generateCards(bin, quantity = 10, format = 'standard') {
        if (!bin || bin.length < 6) {
            throw new Error('BIN must be at least 6 digits');
        }

        // Clean BIN - keep only digits
        const cleanBIN = bin.replace(/\D/g, '');
        
        if (cleanBIN.length < 6) {
            throw new Error('BIN must contain at least 6 digits');
        }

        const cards = [];
        
        for (let i = 0; i < quantity; i++) {
            const card = this.generateSingleCard(cleanBIN);
            cards.push(card);
        }

        return cards;
    }

    /**
     * Generate a single card from BIN
     */
    static generateSingleCard(bin) {
        const cardLength = this.getCardLength(bin);
        const prefix = bin.slice(0, 6);
        
        // Generate random middle digits
        const remainingLength = cardLength - prefix.length - 1; // -1 for check digit
        let cardNumber = prefix;
        
        for (let i = 0; i < remainingLength; i++) {
            cardNumber += Math.floor(Math.random() * 10);
        }
        
        // Calculate and append Luhn check digit
        const checkDigit = this.calculateLuhnCheckDigit(cardNumber);
        cardNumber += checkDigit;

        // Generate expiry date (1-3 years from now)
        const expiry = this.generateExpiryDate();
        
        // Generate CVV based on card type
        const cvc = this.generateCVC(bin);

        return {
            number: cardNumber,
            expiry: expiry,
            cvc: cvc,
            brand: this.getCardBrand(bin),
            valid: this.validateLuhn(cardNumber)
        };
    }

    /**
     * Calculate Luhn check digit
     */
    static calculateLuhnCheckDigit(partialNumber) {
        let sum = 0;
        let isEven = false;
        
        for (let i = partialNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(partialNumber.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return (10 - (sum % 10)) % 10;
    }

    /**
     * Validate card number using Luhn algorithm
     */
    static validateLuhn(cardNumber) {
        let sum = 0;
        let isEven = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    /**
     * Validate BIN format
     */
    static validateBIN(bin) {
        if (!bin) return false;
        const cleanBIN = bin.replace(/\D/g, '');
        return cleanBIN.length >= 6;
    }

    /**
     * Get expected card length based on BIN
     */
    static getCardLength(bin) {
        const firstDigit = bin.charAt(0);
        const firstTwo = bin.slice(0, 2);
        
        // Amex
        if (firstTwo === '34' || firstTwo === '37') return 15;
        
        // Visa
        if (firstDigit === '4') return 16;
        
        // Mastercard
        if (firstTwo >= '51' && firstTwo <= '55') return 16;
        if (parseInt(firstTwo) >= 22 && parseInt(firstTwo) <= 27) return 16;
        
        // Discover
        if (bin.slice(0, 4) === '6011' || firstTwo === '65') return 16;
        
        // JCB
        if (firstTwo === '35') return 16;
        
        // Diners Club
        if (firstTwo === '36' || firstTwo === '38') return 14;
        
        // Default
        return 16;
    }

    /**
     * Get card brand based on BIN
     */
    static getCardBrand(bin) {
        const firstDigit = bin.charAt(0);
        const firstTwo = bin.slice(0, 2);
        const firstFour = bin.slice(0, 4);
        
        if (firstTwo === '34' || firstTwo === '37') return 'amex';
        if (firstDigit === '4') return 'visa';
        if ((firstTwo >= '51' && firstTwo <= '55') || (parseInt(firstTwo) >= 22 && parseInt(firstTwo) <= 27)) return 'mastercard';
        if (firstFour === '6011' || firstTwo === '65') return 'discover';
        if (firstTwo === '35') return 'jcb';
        if (firstTwo === '36' || firstTwo === '38') return 'diners';
        
        return 'unknown';
    }

    /**
     * Generate expiry date (MMYY format)
     */
    static generateExpiryDate() {
        const now = new Date();
        const month = Math.floor(Math.random() * 12) + 1;
        const year = now.getFullYear() + Math.floor(Math.random() * 3) + 1;
        
        const monthStr = month.toString().padStart(2, '0');
        const yearStr = year.toString().slice(-2);
        
        return monthStr + yearStr;
    }

    /**
     * Generate CVV based on card type
     */
    static generateCVC(bin) {
        const brand = this.getCardBrand(bin);
        const length = brand === 'amex' ? 4 : 3;
        
        let cvc = '';
        for (let i = 0; i < length; i++) {
            cvc += Math.floor(Math.random() * 10);
        }
        
        return cvc;
    }

    /**
     * Format card number with spaces
     */
    static formatCardNumber(number) {
        const brand = this.getCardBrand(number);
        
        if (brand === 'amex') {
            return number.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
        }
        
        return number.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    /**
     * Export cards to different formats
     */
    static exportCards(cards, format = 'json') {
        switch (format.toLowerCase()) {
            case 'csv':
                return this.toCSV(cards);
            case 'txt':
                return this.toTXT(cards);
            case 'json':
            default:
                return JSON.stringify(cards, null, 2);
        }
    }

    static toCSV(cards) {
        const headers = 'Number,Expiry,CVC,Brand\n';
        const rows = cards.map(c => `${c.number},${c.expiry},${c.cvc},${c.brand}`).join('\n');
        return headers + rows;
    }

    static toTXT(cards) {
        return cards.map(c => `${c.number}|${c.expiry}|${c.cvc}`).join('\n');
    }

    /**
     * Get test cards for specific scenarios
     */
    static getStripeTestCards() {
        return {
            success: [
                { number: '4242424242424242', brand: 'Visa', description: 'Visa success' },
                { number: '4000056655665556', brand: 'Visa (debit)', description: 'Visa debit success' },
                { number: '5555555555554444', brand: 'Mastercard', description: 'Mastercard success' },
                { number: '378282246310005', brand: 'Amex', description: 'Amex success' }
            ],
            decline: [
                { number: '4000000000000002', brand: 'Visa', description: 'Card declined' },
                { number: '4000000000009995', brand: 'Visa', description: 'Insufficient funds' },
                { number: '4000000000009987', brand: 'Visa', description: 'Lost card' },
                { number: '4000000000009979', brand: 'Visa', description: 'Stolen card' }
            ],
            require3DS: [
                { number: '4000002500003155', brand: 'Visa', description: '3D Secure required' },
                { number: '4000002760003184', brand: 'Visa', description: '3D Secure 2' }
            ]
        };
    }
}

module.exports = CardGenerator;
