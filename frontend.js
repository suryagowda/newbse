// Function to fetch top 10 stocks
async function getTopStocks() {
    const response = await fetch('https://nonstop-pond-sprint.glitch.me/top10stocks');
    const data = await response.json();
    const topStocksBody = document.getElementById('topStocksBody');

    // Clear previous table rows
    topStocksBody.innerHTML = '';

    // Display data for debugging
    console.log('Data:', data);

    // Display each stock name and code in the table
    data.forEach(stock => {
        console.log('Stock:', stock); // Log each stock for further inspection
        const row = topStocksBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);

        // Create a span for the stock name
        const stockNameSpan = document.createElement('span');
        stockNameSpan.textContent = stock.name;

        // Create a copy icon for the stock name
        const copyNameIcon = createCopyIcon(stock.name);

        // Append the stock name and copy icon to the cell
        cell1.appendChild(stockNameSpan);
        cell1.appendChild(copyNameIcon);

        // Create a span for the stock code
        const stockCodeSpan = document.createElement('span');
        stockCodeSpan.textContent = ` (${stock.code})`;

        // Create a copy icon for the stock code
        const copyCodeIcon = createCopyIcon(stock.code);

        // Append the stock code and copy icon to the cell
        cell2.appendChild(stockCodeSpan);
        cell2.appendChild(copyCodeIcon);
    });
}

// Function to create a copy icon for a given text
/// Function to create a copy icon for a given text
function createCopyIcon(text) {
    const copyIcon = document.createElement('span');
    copyIcon.className = 'copy-icon';
    copyIcon.textContent = '📋'; // Unicode for clipboard icon

    // Add a click event listener to handle the copy action
    copyIcon.addEventListener('click', function () {
        copyTextToClipboardFallback(text);
    });

    // Ensure the cursor is set to pointer
    copyIcon.style.cursor = 'pointer';

    // Add a title attribute for accessibility
    copyIcon.title = 'Copy to Clipboard';

    return copyIcon;
}

// Function to copy text to clipboard using document.execCommand (fallback)
function copyTextToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        showAlert('Copied to clipboard!', 'alert-success');
    } catch (err) {
        console.error('Unable to copy to clipboard', err);
        showAlert('Failed to copy to clipboard', 'alert-danger');
    } finally {
        document.body.removeChild(textarea);
    }
}






async function processEquityBhavcopyForDate() {
    const rawDateInput = document.getElementById('equityBhavcopyDateInput').value;

    // Validate the date format (yyyy-mm-dd)
    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormat.test(rawDateInput)) {
        showAlert('Please enter a valid date in the format yyyy-mm-dd.', 'alert-danger');
        return;
    }

    // Convert the raw date input to "ddmmyy" format
    const dateObject = new Date(rawDateInput);
    const day = String(dateObject.getDate()).padStart(2, '0');
    const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Note: Month is zero-based
    const year = String(dateObject.getFullYear()).slice(-2);
    const formattedDateInput = day + month + year;

    console.log(formattedDateInput);

    try {
        const response = await fetch('https://nonstop-pond-sprint.glitch.me/processEquityBhavcopy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: formattedDateInput }),
        });
    
        if (!response.ok) {
            if (response.status === 404) {
                showAlert('Invalid date. Please enter a valid date.', 'alert-danger');
                return;
            } else {
                throw new Error(`Failed to download CSV for the provided date. Status: ${response.status}.`);
            }
        }
    
        const result = await response.json();
        showAlert(result.message, 'alert-success');
    
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        showAlert(`Error: ${error.message}`, 'alert-danger');
        console.error('Error processing Equity Bhavcopy:', error);
    }
    
}




// Rest of your code...


function showAlert(message, alertType) {
    // Implement your alert logic here, e.g., display an alert message on the UI
    console.log(message);

    // Example: Displaying an alert using Bootstrap alert classes
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertType}`;
    alertDiv.textContent = message;

    document.body.insertBefore(alertDiv, document.body.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 10000);
}





// Function to search stocks by name
async function searchStocks() {
    const stockName = document.getElementById('stockNameInput').value;
    const response = await fetch(`https://nonstop-pond-sprint.glitch.me/stocks/${stockName}`);
    const data = await response.json();
    const searchResultsBody = document.getElementById('searchResultsBody');

    searchResultsBody.innerHTML = ''; // Clear previous results

    data.forEach(stock => {
        const row = searchResultsBody.insertRow();
        const cell1 = row.insertCell(0);

        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);
        const cell5 = row.insertCell(4);
        const cell6 = row.insertCell(4);

        cell1.textContent = stock.name;
        cell2.textContent = stock.code;
        cell3.textContent = stock.open;
        cell4.textContent = stock.close;
        cell5.textContent = stock.high;
        cell6.textContent = stock.low;
        
    });
}


// Function to add a stock to favorites
async function addToFavorites() {
    const nameInput = document.getElementById('favoriteNameInput').value;
    const codeInput = document.getElementById('favoriteCodeInput').value;

    if (!nameInput || !codeInput) {
        showAlert('Both name and code are required.', 'alert-danger');
        return;
    }

    const response = await fetch('https://nonstop-pond-sprint.glitch.me/addtofavorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: nameInput, code: codeInput }),
    });

    const result = await response.json();
    showAlert(result.message, 'alert-success');

    // Fetch and display favorite stocks after adding
    getFavoriteStocks();
}

// Function to fetch and display favorite stocks
async function getFavoriteStocks() {
    const response = await fetch('https://nonstop-pond-sprint.glitch.me/favoritestocks');
    const data = await response.json();
    const favoriteStocksBody = document.getElementById('favoriteStocksBody');

    // Clear previous table rows
    favoriteStocksBody.innerHTML = '';

    data.forEach(stock => {
        const row = favoriteStocksBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2); // New cell for remove button

        cell1.textContent = stock.name;
        cell2.textContent = stock.code;

        // Create a remove button with a red background
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove-button'; // Add a class for styling
        removeButton.onclick = function() {
            removeFromFavorites(stock.code);
        };

        cell3.appendChild(removeButton);
    });
}



// Function to remove stock from favorites
async function removeFromFavorites(code) {
    const response = await fetch(`https://nonstop-pond-sprint.glitch.me/removefromfavorites/${code}`, {
        method: 'DELETE',
    });

    const result = await response.json();
    showAlert(result.message, 'alert-success');

    // Fetch and display updated favorite stocks after removal
    getFavoriteStocks();
}


async function fetchAndStoreStockDataa() {
    const stockNameForDataInput = document.getElementById('stockInput').value;

    if (!stockNameForDataInput) {
        showAlert('Please enter a stock name.', 'alert-danger');
        return; // Add this line to exit the function
    }

    const stockName = stockNameForDataInput.trim();

    try {
        const response = await fetch(`https://nonstop-pond-sprint.glitch.me/fetchAndStoreStockData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ stockName }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch and store data for ${stockName}.`);
        }

        const result = await response.json();
        showAlert(result.message, 'alert-success');

        // Wait for 4-5 seconds (4000-5000 milliseconds)
        setTimeout(() => {
            // Reload the page
            location.reload();
        }, Math.floor(Math.random() * 1000) + 3000); // Add a random delay between 4 and 5 seconds
    } catch (error) {
        showAlert(`Error: ${error.message}`, 'alert-danger');
        console.error(`Error fetching and storing data for ${stockName}:`, error);
    }
    
}




// Add any additional functions related to the stock graph here




// Fetch top stocks and favorite stocks on page load
getTopStocks();
getFavoriteStocks();



