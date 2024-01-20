const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const unzipper = require('unzipper');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const db = new sqlite3.Database('stocks.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS stocks (
      code TEXT,
      name TEXT,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      date DATE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT
    )
  `);
});

async function processCSVFile(csvFilePath) {

    // Clear existing data in the stocks table
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM stocks', (err) => {
        if (err) {
          console.error('Error clearing stocks table:', err);
          reject(err);
        } else {
          console.log('Stocks table cleared.');
          resolve();
        }
      });
    });

    
  const stmt = db.prepare(`
    INSERT INTO stocks (code, name, open, high, low, close) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          if (row && row.SC_CODE && row.SC_NAME && row.OPEN && row.HIGH && row.LOW && row.CLOSE) {
            stmt.run(
              row.SC_CODE.trim(),
              row.SC_NAME.trim(),
              parseFloat(row.OPEN),
              parseFloat(row.HIGH),
              parseFloat(row.LOW),
              parseFloat(row.CLOSE),
            );
          } else {
            console.error('Skipping row:', row);
          }
        } catch (error) {
          console.error('Error processing row:', error);
        }
      })
      .on('end', () => {
        stmt.finalize();
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}



async function processEquityBhavcopy(date) {
  const url = `https://www.bseindia.com/download/BhavCopy/Equity/EQ${date}_CSV.ZIP`;
  const zipFileName = 'equity_bhavcopy.zip';
  const extractionPath = 'extracted_data';

  try {
    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(fs.createWriteStream(zipFileName));

    await new Promise((resolve) => {
      response.data.on('end', resolve);
    });

    await fs.createReadStream(zipFileName)
      .pipe(unzipper.Extract({ path: extractionPath }))
      .promise();

    await processCSVFile(`${extractionPath}/EQ${date}.CSV`);

    console.log(`Data processing completed for ${date}.`);
  } catch (error) {
    //console.error('Error processing Equity Bhavcopy:', error);
  } finally {
    fs.unlinkSync(zipFileName);
  }
}

// Middleware to parse JSON requests
app.use(bodyParser.json());


app.post('/processEquityBhavcopy', async (req, res) => {
  const userInputDate = req.body.date;
  console.log(userInputDate);

  try {
    if (!userInputDate) {
      throw new Error('Please provide a date in the format ddmmyy.');
    }

    await processEquityBhavcopy(userInputDate);
    res.json({ message: `Data processing completed for ${userInputDate}.` });
  } catch (error) {
    //console.error('Error processing Equity Bhavcopy:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET route for the top 10 stocks
app.get('/top10stocks', (req, res) => {
  db.all('SELECT a.*,round((close-open)/(open)*100,2) b FROM stocks a order by b desc limit 10 ', (err, rows) => {
    if (err) {
      console.error('Error retrieving top 10 stocks:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

// GET route to find stocks by name
app.get('/stocks/:name', (req, res) => {
  const stockName = req.params.name;
  const query = `SELECT * FROM stocks WHERE name LIKE '%${stockName}%'`;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error retrieving stocks by name:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

// GET route to get stock price history list for UI graph
app.get('/stockpricehistory/:code', (req, res) => {
  const stockCode = req.params.code;
  const query = `SELECT * FROM stocks WHERE code = '${stockCode}' ORDER BY date ASC`;

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error retrieving stock price history:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

// POST route to add a stock to favorites
app.post('/addtofavorites', (req, res) => {
  const { code, name } = req.body;

  if (!code || !name) {
    res.status(400).json({ error: 'Bad Request. Missing code or name in the request body.' });
    return;
  }

  // Check if the stock exists in the stocks table
  const checkStockQuery = 'SELECT * FROM stocks WHERE code = ? AND name = ?';
  db.get(checkStockQuery, [code, name], (checkStockErr, stockRow) => {
    if (checkStockErr) {
      console.error('Error checking if stock exists in stocks table:', checkStockErr);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (!stockRow) {
      res.status(400).json({ error: 'Stock does not exist in the stocks table.' });
    } else {
      // Check if the stock is already in favorites
      const checkFavoriteQuery = 'SELECT * FROM favorites WHERE code = ?';
      db.get(checkFavoriteQuery, [code], (checkFavoriteErr, favoriteRow) => {
        if (checkFavoriteErr) {
          console.error('Error checking if stock is in favorites:', checkFavoriteErr);
          res.status(500).json({ error: 'Internal Server Error' });
        } else if (favoriteRow) {
          res.status(400).json({ error: 'Stock is already in favorites.' });
        } else {
          // Add the stock to favorites
          const insertQuery = 'INSERT INTO favorites (code, name) VALUES (?, ?)';
          db.run(insertQuery, [code, name], (insertErr) => {
            if (insertErr) {
              console.error('Error adding stock to favorites:', insertErr);
              res.status(500).json({ error: 'Internal Server Error' });
            } else {
              res.json({ message: 'Stock added to favorites successfully.' });
            }
          });
        }
      });
    }
  });
});


// GET route to see favorite stocks
app.get('/favoritestocks', (req, res) => {
  // Retrieve and return the list of favorite stocks
  const query = 'SELECT * FROM favorites';

  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error retrieving favorite stocks:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(rows);
    }
  });
});

// DELETE route to remove a stock from favorites
app.delete('/removefromfavorites/:code', (req, res) => {
  const stockCode = req.params.code;

  if (!stockCode) {
    res.status(400).json({ error: 'Bad Request. Missing stock code in the request parameters.' });
  } else {
    // Remove the stock from favorites
    const deleteQuery = 'DELETE FROM favorites WHERE code = ?';
    db.run(deleteQuery, [stockCode], (deleteErr) => {
      if (deleteErr) {
        console.error('Error removing stock from favorites:', deleteErr);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ message: 'Stock removed from favorites successfully.' });
      }
    });
  }
});





// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
