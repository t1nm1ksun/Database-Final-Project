const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1111',
    database: 'database_final_project',
    port: 3307
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

app.get('/movies', (req, res) => {
    const query = `
    SELECT 
    m.title AS titleKorean, 
    m.eng_title AS titleEnglish, 
    m.year AS productionYear,
    m.country AS productionCountry, 
    m.m_type AS type, 
    g.genre AS genre, 
    m.status AS productionStatus, 
    GROUP_CONCAT(d.name SEPARATOR ', ') AS directors,  -- Concatenate director names
    m.company AS productionCompany
FROM 
    movie m
LEFT JOIN 
    genre g ON m.id = g.movie_id
LEFT JOIN 
    movie_director md ON m.id = md.movie_id
LEFT JOIN 
    director d ON md.director_id = d.id
GROUP BY 
    m.id, m.title, m.eng_title, m.year, m.country, m.m_type, g.genre, m.status, m.company;
  `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching movies:', err);
            res.status(500).send('Error fetching movies');
            return;
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
