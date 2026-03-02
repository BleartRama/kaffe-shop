// Kaffeshop Backend

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

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

// PRODUKTER

// Hämta alla produkter

app.get("/products", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id ASC", (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av produkter");
    res.json(result);
  });
});

// Hämta en produkt via ID

app.get("/products/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av produkt");
    if (result.length === 0) return res.status(404).send("Produkten finns inte");
    res.json(result[0]);
  });
});

// Skapa ny produkt

app.post("/products", (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  db.query(
    "INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)",
    [name, description, price, stock, category_id],
    (err) => {
      if (err) return res.status(500).send("Fel vid skapande av produkt");
      res.send("Produkt skapad!");
    }
  );
});

// Uppdatera produkt

app.put("/products/:id", (req, res) => {
  const id = req.params.id;
  const { name, description, price, stock } = req.body;
  db.query(
    "UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?",
    [name, description, price, stock, id],
    (err) => {
      if (err) return res.status(500).send("Fel vid uppdatering");
      res.send("Produkt uppdaterad!");
    }
  );
});

// Ta bort produkt
app.delete("/products/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send("Fel vid borttagning");
    res.send("Produkt borttagen!");
  });
});


// Här har vi USERS

app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av users");
    res.json(result);
  });
});


// Här har vi ORDERS

app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders", (err, result) => {
    if (err) return res.status(500).send("Fel vid hämtning av orders");
    res.json(result);
  });
});

/**
 * JOIN: Hämta en order med items + produktinfo
 */
app.get("/orders/:id/join", (req, res) => {
  const orderId = req.params.id;

  // VIKTIGT: Vi hämtar oi.price_at_purchase istället för p.price.
  // Detta gör att rätt pris visas även om produkten har raderats från katalogen.
  const sql = `
    SELECT
      o.id          AS order_id,
      o.user_id     AS user_id,
      oi.id         AS order_item_id,
      oi.product_id AS product_id,
      oi.quantity   AS quantity,
      oi.price_at_purchase AS product_price,
      p.name        AS product_name
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE o.id = ?
    ORDER BY oi.id ASC
  `;

  db.query(sql, [orderId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: "Fel vid JOIN-hämtning",
        details: err.message,
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Order finns inte" });
    }

    const order = {
      order_id: rows[0].order_id,
      user_id: rows[0].user_id,
      items: rows.map((r) => {
        // Om produkten raderats är r.product_price null i p-tabellen, 
        // men vi använder r.product_price från order_items istället.
        const price = r.product_price == null ? null : Number(r.product_price);
        const qty = Number(r.quantity);

        return {
          order_item_id: r.order_item_id,
          product_id: Number(r.product_id),
          product_name: r.product_name ?? "Okänd produkt (borttagen)",
          product_price: price,
          quantity: qty,
          line_total: price == null ? null : price * qty,
        };
      }),
    };

    res.json(order);
  });
});


// STARTA SERVER

app.listen(3000, () => {
  console.log("Servern kör på http://localhost:3000");
});