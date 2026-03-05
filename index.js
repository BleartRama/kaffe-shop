// Kaffeshop Backend

// ■ Importer och inställningar 
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// ■ Anslutningskonfiguration till MySQL
const db = mysql.createConnection({
 host: process.env.DB_HOST,
 user: process.env.DB_USER,
 password: process.env.DB_PASSWORD, // ditt lösenord
 database: process.env.DB_NAME
});

//Försöker koppla upp sig till databasen 
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
  const { category_id } = req.query;

  let query = "SELECT * FROM products";
  let params = [];

  if (category_id) {
    query += " WHERE category_id = ?";
    params.push(category_id);
  }

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).send("Databasfel");
    res.json(rows);
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

// Hämtar alla kategorier
app.get("/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, rows) => {
    if (err) return res.status(500).send("Databasfel");
    res.json(rows);
  });
});

// ■ Skapa ny produkt
app.post("/products", (req, res) => {
  const { name, description, price, stock, category_id } = req.body;

  if (!name || !description || !price || !stock || !category_id) {
    return res.status(400).send("Alla fält krävs");
  }

  db.query(
    "SELECT id FROM categories WHERE id = ?",
    [category_id],
    (err, rows) => {
      if (err) return res.status(500).send("Databasfel");
      if (rows.length === 0) {
        return res.status(400).send("Kategorin finns inte");
      }

      db.query(
        "INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)",
        [name, description, price, stock, category_id],
        (err, result) => {
          if (err) {
            res.status(500).send("Fel vid skapande av produkt");
          } else {
            res.status(201).send("Produkt skapad!");
          }
        }
      );
    }
  );
});
// ■ Uppdatera produkt
app.put("/products/:id", (req, res) => {
 const id = req.params.id;
 const { name, description, price, stock, category_id } = req.body;
 db.query(
 "UPDATE products SET name=?, description=?, price=?, stock=?, category_id=? WHERE id=?",
 [name, description, price, stock, category_id, id],
 (err, result) => {
  if (err) {
    return res.status(500).json({ error: "Fel vid uppdatering" });
  }
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Produkten finns inte" });
  }
  res.json({ message: "Produkt uppdaterad!" });
}
 );
});
// ■ Ta bort produkt
app.delete("/products/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM order_items WHERE product_id = ?", [id], (err) => {
    if (err) {
      return res.status(500).json({ error: "Fel vid borttagning av order_items" });
    }
    db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Fel vid borttagning" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Produkten finns inte" });
      }
      res.status(204).send();
    });
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

/**
 * JOIN: Hämta en order med items + produktinfo Mustafa
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
      return res.status(404).json({ error: "Order finns inte!" });
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

// ===============================
// STARTA SERVER
// ===============================
app.listen(3000, () => {
 console.log("Servern kör på http://localhost:3000");
});