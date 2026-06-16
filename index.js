import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
app.use(cors()); // Pozwala na łączenie się z frontendem
app.use(express.json());

// Konfiguracja połączenia pobierana automatycznie z Railway
const dbConfig = {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: parseInt(process.env.MYSQLPORT || '3306'),
};

// Inicjalizacja bazy danych (Tworzenie tabeli)
async function initDB() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Połączono z MySQL. Tabela 'messages' jest gotowa.");
        await connection.end();
    } catch (error) {
        console.error("Błąd inicjalizacji bazy danych:", error);
    }
}
await initDB();

// Endpoint 1: Pobieranie wiadomości (GET /messages)
app.get('/messages', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SELECT * FROM messages ORDER BY created_at DESC");
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint 2: Wysyłanie wiadomości (POST /messages)
app.post('/messages', async (req, res) => {
    const { user, text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Wiadomość nie może być pusta" });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.query("INSERT INTO messages (user, text) VALUES (?, ?)", [user || 'Anonim', text]);
        await connection.end();
        res.status(201).json({ status: "Wysłano" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serwer Node.js działa na porcie ${PORT}`);
});
