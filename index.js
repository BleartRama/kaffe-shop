// Kaffeshop Backend
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
// ■ Koppla till MySQL
const db = mysql.createConnection({
 host: "localhost",
 user: "root",
 password: "19271995", // ditt lösenord
 database: "kaffeshop"
});
db.connect((err) => {
 if (err) {
 console.log("Fel vid anslutning till databasen");
 } else {
 console.log("Ansluten till MySQL!");
 }
});
// ===============================
// PRODUKTER
// ===============================
// ■ Hämta alla produkter
app.get("/products", (req, res) => {
 db.query("SELECT * FROM products", (err, result) => {
 if (err) {
 res.send("Fel vid hämtning av produkter");
 } else {
 res.json(result);
 }
 });
});
// ■ Hämta en produkt
app.get("/products/:id", (req, res) => {
 const id = req.params.id;
 db.query("SELECT * FROM products WHERE id = ?", [id], (err, result) => {
 if (err) {
 res.send("Fel vid hämtning av produkt");
 } else {
 if (result.length === 0) {
 res.send("Produkten finns inte");
 } else {
 res.json(result[0]);
 }
 }
 });
});
// ■ Skapa ny produkt
app.post("/products", (req, res) => {
 const { name, description, price, stock, category_id } = req.body;
 db.query(
 "INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)",
 [name, description, price, stock, category_id],
 (err, result) => {
 if (err) {
 res.send("Fel vid skapande av produkt");
 } else {
 res.send("Produkt skapad!");
 }
 }
 );
});
// ■ Uppdatera produkt
app.put("/products/:id", (req, res) => {
 const id = req.params.id;
 const { name, description, price, stock } = req.body;
 db.query(
 "UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?",
 [name, description, price, stock, id],
 (err, result) => {
 if (err) {
 res.send("Fel vid uppdatering");
 } else {
 res.send("Produkt uppdaterad!");
 }
 }
 );
});
// ■ Ta bort produkt
app.delete("/products/:id", (req, res) => {
 const id = req.params.id;
 db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
 if (err) {
 res.send("Fel vid borttagning");
 } else {
 res.send("Produkt borttagen!");
 }
 });
});
// ===============================
// USERS
// ===============================
app.get("/users", (req, res) => {
 db.query("SELECT * FROM users", (err, result) => {
 if (err) {
 res.send("Fel vid hämtning av users");
 } else {
 res.json(result);
 }
 });
});
// ===============================
// ORDERS
// ===============================
app.get("/orders", (req, res) => {
 db.query("SELECT * FROM orders", (err, result) => {
 if (err) {
 res.send("Fel vid hämtning av orders");
 } else {
 res.json(result);
 }
 });
});
// ===============================
// STARTA SERVER
// ===============================
app.listen(3000, () => {
 console.log("Servern kör på http://localhost:3000");
});