// Kaffeshop Backend

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Logga alla requests (bra för debug)
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

// 🔹 Koppla till MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "19271995",
  database: "kaffeshop",
});

db.connect((err) => {
  if (err) {
    console.log("Fel vid anslutning till databasen:", err.message);
  } else {
    console.log("Ansluten till MySQL!");
  }
});

// ===============================
// PRODUKTER
// ===============================

app.get("/products", (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  db.query("SELECT * FROM products", (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av produkter");
    res.json(result);
  });
});

app.get("/products/:id", (req, res) => {
  const id = req.params.id;

  db.query("SELECT * FROM products WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av produkt");

    if (result.length === 0) {
      return res.status(404).send("Produkten finns inte");
    }

    res.json(result[0]);
  });
});

app.post("/products", (req, res) => {
  const { name, description, price, stock, category_id } = req.body;

  db.query(
    "INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)",
    [name, description, price, stock, category_id],
    (err, result) => {
      if (err) return res.status(500).send("Fel vid skapande av produkt");
      res.status(201).send("Produkt skapad!");
    }
  );
});

app.put("/products/:id", (req, res) => {
  const id = req.params.id;
  const { name, description, price, stock } = req.body;

  db.query(
    "UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?",
    [name, description, price, stock, id],
    (err, result) => {
      if (err) return res.status(500).send("Fel vid uppdatering");

      if (result.affectedRows === 0) {
        return res.status(404).send("Produkten finns inte");
      }

      res.send("Produkt uppdaterad!");
    }
  );
});

// 🔹 Ta bort produkt 
app.delete("/products/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM order_items WHERE product_id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({
        error: "Fel vid borttagning i order_items",
        details: err.message,
      });
    }

    db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Fel vid borttagning av produkt",
          details: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Produkten finns inte" });
      }

      res.json({ message: "Produkt borttagen!" });
    });
  });
});

// ===============================
// USERS
// ===============================

app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av users");
    res.json(result);
  });
});

// ===============================
// ORDERS
// ===============================

app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders", (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av orders");
    res.json(result);
  });
});

// ✅ JOIN: Hämta order + order_items + produktinfo
app.get("/orders/:id", (req, res) => {
  const orderId = req.params.id;

  const sql = `
    SELECT 
      o.id AS order_id,
      o.user_id,
      o.created_at,
      oi.product_id,
      oi.quantity,
      p.name AS product_name,
      p.price AS product_price
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.id = ?
  `;

  db.query(sql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Fel vid JOIN", details: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Order finns inte" });

    // Packa lite snyggare
    const order = {
      id: rows[0].order_id,
      user_id: rows[0].user_id,
      created_at: rows[0].created_at,
      items: rows.map(r => ({
        product_id: r.product_id,
        name: r.product_name,
        price: r.product_price,
        quantity: r.quantity
      }))
    };

    res.json(order);
  });
});

// ===============================
// STARTA SERVER
// ===============================

app.listen(3000, () => {
  console.log("Servern kör på http://localhost:3000");
});