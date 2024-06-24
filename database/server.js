const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

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
    SELECT m.title as titleKorean, m.eng_title as titleEnglish, m.year as productionYear,
           m.country as productionCountry, m.m_type as type, g.genre as genre, 
           m.status as productionStatus, d.name as director, m.company as productionCompany, 
           m.update_date as updateDate, m.release_date as releaseDate
    FROM movie m
    LEFT JOIN genre g ON m.id = g.movie_id
    LEFT JOIN movie_director md ON m.id = md.movie_id
    LEFT JOIN director d ON md.director_id = d.id
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
