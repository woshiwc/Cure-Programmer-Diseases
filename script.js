// This script handles the dynamic functionality of the transfer page.
// It includes populating form fields, formatting user input,
// calculating fees, and managing form submission.

document.addEventListener('DOMContentLoaded', function() {
    // Ensures the script runs after the entire HTML document is loaded and parsed.

    // Section 1: Payer Account Population
    // Populates the 'Payer Account' dropdown with predefined account options.
    const payerAccountSelect = document.getElementById('payerAccount');
    if (payerAccountSelect) {
        const payerAccounts = [
            { text: "Savings Account (********1234)", value: "acc1" },
            { text: "Checking Account (********5678)", value: "acc2" },
            { text: "Business Account (********9012)", value: "acc3" }
        ];
        payerAccounts.forEach(account => {
            const option = document.createElement('option');
            option.textContent = account.text;
            option.value = account.value;
            payerAccountSelect.appendChild(option);
        });
    }

    // Section 2: Payment Amount Input Handling
    // Handles real-time formatting of the payment amount, converts it to Chinese capital letters,
    // and calculates the transaction fee.
    const paymentAmountInput = document.getElementById('paymentAmount');
    const capitalizedAmountDisplay = document.getElementById('capitalizedAmountDisplay');
    const transactionFeeDisplay = document.getElementById('transactionFeeDisplay');

    /**
     * Converts a numerical amount to its Chinese capitalized representation.
     * This is often required for financial documents in Chinese-speaking regions.
     * For example, 123.45 becomes "壹佰贰拾叁元肆角伍分".
     * @param {number|string} amount - The numerical amount to convert.
     * @returns {string} The Chinese capitalized string.
     */
    function amountToChinese(amount) {
        // digits: Chinese characters for 0-9
        // units: Basic units (Yuan for integer, Jiao for 1st decimal, Fen for 2nd decimal)
        // bigUnits: Larger units for integer part (Shi, Bai, Qian, Wan, Yi)
        const digits = '零壹贰叁肆伍陆柒捌玖';
        const units = '元角分';
        const bigUnits = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
        let [integerPart, decimalPart] = String(amount).split('.');
        integerPart = integerPart.replace(/^0+/, ''); // Remove leading zeros from integer part

        // Handle the case of 0 or 0.00, returning "零元"
        if (integerPart === '' && (!decimalPart || parseFloat(decimalPart) === 0)) return digits[0] + units[0];

        let integerStr = ''; // Will store the Chinese string for the integer part
        if (integerPart.length > 0) {
            for (let i = 0; i < integerPart.length; i++) {
                const digit = integerPart[i];
                const unit = bigUnits[integerPart.length - 1 - i]; // Determine the correct big unit based on position
                if (digit === '0') {
                    // Logic to handle zeros:
                    // - Avoids consecutive "零" (e.g., "壹仟零零伍元" should be "壹仟零伍元").
                    // - Avoids "零" before units like "万", "亿", "元" if it's redundant or at the end of a segment.
                    if (integerStr.slice(-1) !== digits[0] && unit !== '万' && unit !== '亿' && unit !== '元' && integerPart.substring(i + 1).replace(/0/g, '').length > 0) {
                         if ( (integerPart.length -1 -i) % 4 !== 0 || integerStr.slice(-1) === units[0] ) {
                            integerStr += digits[0]; // Add '零' if it's meaningful
                         }
                    }
                } else {
                    integerStr += digits[digit] + unit; // Add Chinese digit and its corresponding unit
                }
            }
            }
            // Cleanup for the integer string:
            // - Replace multiple consecutive "零"s with a single "零".
            integerStr = integerStr.replace(/零+/g, digits[0]);
            // - Remove "零" if it's followed by a major unit (万, 亿, 元) but not part of a "零元" for zero.
            integerStr = integerStr.replace(new RegExp(digits[0] + '([' + bigUnits.join('') + '])', 'g'), '$1');
            // - Remove trailing "零" if not "零元".
            integerStr = integerStr.replace(new RegExp(digits[0] + '$'), '');
            // - Ensure '元' is added if it's missing (e.g. for amounts like "10000" -> "壹万元").
            if (!integerStr.includes(units[0])) {
                 integerStr += units[0];
            }
            // Correct cases like "零元" to "元" if preceded by other digits.
             integerStr = integerStr.replace(new RegExp(digits[0] + units[0] + '$'), units[0]);
        }


        let decimalStr = ''; // Will store the Chinese string for the decimal part
        if (decimalPart && parseFloat(decimalPart) > 0) { // Process only if decimal part exists and is greater than 0
            if (integerPart.length === 0 && integerStr === '') {
                // If integer part is zero (e.g. 0.50), it would have returned "零元" already if decimal was 0.
                // For .50, integerStr would be "" here.
            }
            if (decimalPart[0]) { // Process Jiao (first decimal place)
                decimalStr += digits[decimalPart[0]] + units[1]; // Add Chinese digit for Jiao and "角" unit
            }
            if (decimalPart[1]) { // Process Fen (second decimal place)
                if (decimalPart[0] === '0' && decimalPart[1] !== '0' && integerPart.length > 0) {
                    // Handle cases like "1.05" -> "壹元零伍分"
                    decimalStr = digits[0] + digits[decimalPart[1]] + units[2];
                } else if (decimalPart[0] !== '0' && decimalPart[1] !== '0') {
                     decimalStr += digits[decimalPart[1]] + units[2]; // Add Chinese digit for Fen and "分" unit
                } else if (decimalPart[0] !== '0' && decimalPart[1] === '0') {
                    // Handle cases like "1.50" -> "壹元伍角" (no "零分" is typically used)
                }
            }
        } else if (integerStr !== '') { // If no decimal part, but there is an integer part
            decimalStr = '整'; // Append '整' (meaning "whole" or "exact")
        }

        let result = integerStr + decimalStr;
        // Final cleanup rules for common edge cases and to ensure proper formatting.
        result = result.replace(new RegExp(digits[0] + units[0] + digits[0] + units[1]), digits[0] + units[0]); // e.g. "零元零角" -> "零元"
        result = result.replace(new RegExp(units[0] + digits[0] + units[1]), units[0] + digits[0]); // e.g. "元零角" -> "元零" (will be cleaned further)
        result = result.replace(new RegExp(digits[0] + units[1]), digits[0]); // e.g. "零角" -> "零" (will be cleaned further)
        if (result.startsWith(units[0])) result = digits[0] + result; // Handles cases like ".5" -> "零元伍角"
        if (result === '整' && integerStr === '') return digits[0] + units[0] + '整'; // "0.00" should be "零元整"
        if (result.endsWith(digits[0]) && result !== digits[0]+units[0] && !result.endsWith(units[0]+digits[0]) && result.includes(units[1])) {
            // Remove trailing "零" if it's not "零元" and "角" is present. e.g. "壹元伍角零" -> "壹元伍角"
            result = result.slice(0, -1);
        }
        if (result === digits[0]+units[0]+units[0]) result = digits[0]+units[0]; // Safety net for "零元元" -> "零元"
        return result;
    }

    if (paymentAmountInput) {
        // Event listener for the payment amount input field to handle real-time updates.
        paymentAmountInput.addEventListener('input', function(e) {
            // Get the raw input value, removing any existing commas for parsing.
            let value = e.target.value.replace(/,/g, '');

            // Preserve cursor position during formatting to ensure smooth user experience.
            // Store current cursor position and original length of input.
            let cursorPosition = e.target.selectionStart;
            let originalLength = e.target.value.length;

            // Basic input validation:
            // - If the value is not a number (and not empty or just a decimal point),
            //   remove the last character entered by the user.
            // - This prevents most non-numeric inputs.
            if (isNaN(parseFloat(value)) && value !== '' && value !== '.') {
                e.target.value = value.slice(0, -1); // Remove last character
                // Adjust cursor position accordingly
                if (cursorPosition > 0) {
                    e.target.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
                }
                return; // Stop further processing for this input event
            }
            // Prevent multiple decimal points
            if (value.indexOf('.') !== value.lastIndexOf('.')) {
                 e.target.value = value.slice(0, -1);
                if (cursorPosition > 0) {
                    e.target.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
                }
                return;
            }


            let numericValue = parseFloat(value);
            if (isNaN(numericValue)) {
                numericValue = 0; // Default to 0 if parsing results in NaN (e.g. if input is just ".")
            }

            // Comma Formatting:
            // Adds thousand separators to the integer part of the number.
            let parts = value.split('.'); // Split integer and decimal parts
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas to integer part
            const formattedValue = parts.join('.');
            e.target.value = formattedValue; // Update the input field with the formatted value

            // Adjust cursor position after formatting:
            // Calculate how many characters were added or removed by formatting (commas).
            let newLength = e.target.value.length;
            cursorPosition += (newLength - originalLength);
            if (cursorPosition < 0) cursorPosition = 0; // Ensure cursor position is not negative

            try {
                // Set the new cursor position.
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            } catch (ex) {
                // Catch potential errors if input type is 'number' (though current is 'text', this is a safeguard).
            }


            // Chinese Capitalization Display:
            // Updates the dedicated display area with the amount in Chinese characters.
            if (capitalizedAmountDisplay) {
                // Convert the numeric value (ensuring it has two decimal places for consistency)
                capitalizedAmountDisplay.textContent = amountToChinese(numericValue.toFixed(2));
            }

            // Transaction Fee Calculation:
            // Calculates a fee of 0.5% of the payment amount and displays it.
            if (transactionFeeDisplay) {
                const fee = numericValue * 0.005; // 0.5% fee calculation
                transactionFeeDisplay.textContent = `Fee: ¥${fee.toFixed(2)}`; // Display fee, formatted to 2 decimal places
            }
        });
    }

    // Section 3: Payee Information Simulation
    // Simulates selecting a payee from a list by populating payee name and account details
    // when the 'Select from Payee List' button is clicked.
    const selectPayeeButton = document.getElementById('selectPayeeButton');
    const payeeNameInput = document.getElementById('payeeName');
    const payeeAccountInput = document.getElementById('payeeAccount');

    if (selectPayeeButton && payeeNameInput && payeeAccountInput) {
        selectPayeeButton.addEventListener('click', function() {
            // Populate with sample payee data. In a real app, this might open a modal or fetch data.
            payeeNameInput.value = "John Doe"; // Sample payee name
            payeeAccountInput.value = "6220**********7890"; // Sample payee account
        });
    }

    // Section 4: Payment Purpose Suggestions
    // Populates the datalist for 'Payment Purpose' input with predefined common purposes,
    // offering users quick suggestions.
    const paymentPurposeDatalist = document.getElementById('recentPurposes');
    if (paymentPurposeDatalist) {
        const purposes = ["Rent", "Utilities", "Loan Repayment", "Groceries", "Salary"];
        purposes.forEach(purpose => {
            const option = document.createElement('option');
            option.value = purpose; // The value of the option is what gets suggested and submitted
            paymentPurposeDatalist.appendChild(option);
        });
    }

    // Section 5: Form Submission Handling
    // Manages the form submission process. It prevents the default GET/POST request
    // and instead collects the form data and logs it to the console.
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the browser's default form submission behavior.

            // Collect data from all relevant form fields.
            const formData = {
                payerAccount: payerAccountSelect ? payerAccountSelect.value : '',
                paymentAmount: paymentAmountInput ? paymentAmountInput.value.replace(/,/g, '') : '', // Store unformatted numeric amount
                payeeName: payeeNameInput ? payeeNameInput.value : '',
                payeeAccount: payeeAccountInput ? payeeAccountInput.value : '',
                paymentPurpose: document.getElementById('paymentPurpose') ? document.getElementById('paymentPurpose').value : ''
            };
            console.log("Form Data:", formData); // Log the collected data to the browser console.

            // In a real application, this data would typically be sent to a server
            // using an AJAX request (e.g., using the fetch API or XMLHttpRequest).
            // Example: fetch('/api/transfer', { method: 'POST', body: JSON.stringify(formData) });
            alert("Transfer Submitted (check console for data). Amount: " + formData.paymentAmount);
        });
    }
});
// End of DOMContentLoaded listener
