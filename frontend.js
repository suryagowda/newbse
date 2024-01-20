// Function to fetch top 10 stocks
async function getTopStocks() {
    const response = await fetch('https://nonstop-pond-sprint.glitch.me/top10stocks');
    const data = await response.json();
    const topStocksList = document.getElementById('topStocksList');

    // Clear previous list items
    topStocksList.innerHTML = '';

    // Display data for debugging
    console.log('Data:', data);

    // Display each stock name in the list
    data.forEach(stock => {
        console.log('Stock:', stock); // Log each stock for further inspection
        const listItem = document.createElement('li');
        listItem.textContent = stock.name;
        topStocksList.appendChild(listItem);
    });
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

const response = await fetch('https://nonstop-pond-sprint.glitch.me/processEquityBhavcopy', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ date: formattedDateInput }),
});

const result = await response.json();
showAlert(result.message, 'alert-success');

setTimeout(() => {
    location.reload();
}, 1000);

    
}

function showAlert(message, alertType) {
    // Implement your alert logic here, e.g., display an alert message on the UI
    console.log(message);
}




// Function to search stocks by name
async function searchStocks() {
    const stockName = document.getElementById('stockNameInput').value;
    const response = await fetch(`https://nonstop-pond-sprint.glitch.me/stocks/${stockName}`);
    const data = await response.json();
    const searchResults = document.getElementById('searchResults');

    searchResults.innerHTML = ''; // Clear previous results

    data.forEach(stock => {
        const listItem = document.createElement('li');
        listItem.textContent = `${stock.name} - ${stock.close}`;
        searchResults.appendChild(listItem);
    });
}

// Function to add a stock to favorites
async function addToFavorites() {
    const codeInput = document.getElementById('favoriteCodeInput').value;
    const nameInput = document.getElementById('favoriteNameInput').value;

    if (!codeInput || !nameInput) {
        showAlert('Both code and name are required.', 'alert-danger');
        return;
    }

    const response = await fetch('https://nonstop-pond-sprint.glitch.me/addtofavorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeInput, name: nameInput }),
    });

    const result = await response.json();
    showAlert(result.message, 'alert-success');

    setTimeout(() => {
        location.reload();
    }, 1000);
}



// Function to fetch and display favorite stocks
async function getFavoriteStocks() {
    const response = await fetch('https://nonstop-pond-sprint.glitch.me/favoritestocks');
    const data = await response.json();
    const favoriteStocksList = document.getElementById('favoriteStocksList');

    data.forEach(stock => {
        const listItem = document.createElement('li');
        listItem.textContent = `${stock.name} - ${stock.code}`;
        favoriteStocksList.appendChild(listItem);
    });
}

// Function to remove stock from favorites
async function removeFromFavorites() {
    const codeInput = document.getElementById('removeFavoriteCodeInput').value;

    if (!codeInput) {
        showAlert('Stock code is required for removal.', 'alert-danger');
        return;
    }

    const response = await fetch(`https://nonstop-pond-sprint.glitch.me/removefromfavorites/${codeInput}`, {
        method: 'DELETE',
    });

    const result = await response.json();
    showAlert(result.message, 'alert-success');

    setTimeout(() => {
        location.reload();
    }, 1000);
}


// Display alert message
function showAlert(message, className) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${className}`;
    alertDiv.textContent = message;

    document.body.insertBefore(alertDiv, document.body.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}



// Fetch top stocks and favorite stocks on page load
getTopStocks();
getFavoriteStocks();
