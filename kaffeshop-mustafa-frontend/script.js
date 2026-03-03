// Bas-URL till backend-servern (alla fetch-anrop utgår härifrån)
const API = "http://localhost:3000";

// Hämtar HTML-element från sidan som vi behöver referera till
const productsEl = document.getElementById("products");       // Div där produktkorten visas
const btnLoad = document.getElementById("btnLoad");           // "Ladda produkter"-knappen

const orderIdEl = document.getElementById("orderId");         // Input-fältet för order-ID
const btnOrder = document.getElementById("btnOrder");         // "Hämta order"-knappen
const orderResultEl = document.getElementById("orderResult"); // Div där orderresultatet visas

// ===============================
// EVENT LISTENERS
// ===============================

// Kopplar knappar till funktioner — när man klickar körs funktionen
btnLoad.addEventListener("click", loadProducts);
btnOrder.addEventListener("click", loadOrderJoin);

// ===============================
// SKAPA PRODUKT (POST) — 
// ===============================

// Lyssnar på klick på "Lägg till"-knappen
// async behövs för att vi använder await inuti
document.getElementById("btnAdd").addEventListener("click", async () => {

  // Hämtar värdena från formulärets input-fält och bygger ett objekt
  // Number() konverterar strängar till siffror (inputfält ger alltid strängar)
  const product = {
    name: document.getElementById("newName").value,
    description: document.getElementById("newDesc").value,
    price: Number(document.getElementById("newPrice").value),
    stock: Number(document.getElementById("newStock").value),
    category_id: Number(document.getElementById("newCat").value),
  };

  try {
    // Skickar POST-request till /products
    // headers talar om att bodyn är JSON
    // JSON.stringify konverterar objektet till en JSON-sträng
    const res = await fetch(`${API}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    // Om svaret inte är ok (t.ex. 500), kasta ett fel
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Visa bekräftelse och ladda om produktlistan
    alert("Produkt skapad!");
    loadProducts();
  } catch (err) {
    // Fångar nätverksfel eller HTTP-fel
    alert("Fel: " + err.message);
  }
});

// ===============================
// HÄMTA ALLA PRODUKTER (GET)
// ===============================

async function loadProducts() {
  // Visa laddningstext medan vi väntar på svar
  productsEl.innerHTML = `<div class="muted">Laddar...</div>`;

  try {
    // GET-request till /products — hämtar alla produkter från databasen
    const res = await fetch(`${API}/products`);

    // Om servern svarar med fel, kasta error
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Parsar JSON-svaret till en JavaScript-array med produktobjekt
    const products = await res.json();

    // Om arrayen är tom — visa meddelande och avbryt
    if (!products.length) {
      productsEl.innerHTML = `<div class="muted">Inga produkter hittades.</div>`;
      return;
    }

    // Kör renderProductCard på varje produkt → array med HTML-strängar
    // join("") slår ihop till en enda sträng som sätts som innerHTML
    productsEl.innerHTML = products.map(renderProductCard).join("");

    // Koppla click-listeners till alla "Ta bort"-knappar
    wireDeleteButtons();
  } catch (err) {
    // Vid fel — visa felmeddelandet i produktdiven
    productsEl.innerHTML = `<div class="error">Fel vid hämtning: ${err.message}</div>`;
  }
}

// ===============================
// RENDERA ETT PRODUKTKORT (HTML)
// ===============================

// Tar emot ett produktobjekt och returnerar en HTML-sträng
function renderProductCard(p) {
  return `
    <article class="product">
      <div class="product-head">
        <!-- escapeHtml() skyddar mot XSS — farliga tecken görs ofarliga -->
        <h3>${escapeHtml(p.name)}</h3>
        <span class="pill">ID: ${p.id}</span>
      </div>

      <div class="product-meta">
        <!-- Number() + toFixed(2) ger priset med två decimaler -->
        <div><span class="label">Pris:</span> ${Number(p.price).toFixed(2)} kr</div>
        <div><span class="label">Lager:</span> ${p.stock}</div>
      </div>

      <!-- data-delete-id sparar produkt-ID:t som attribut, används av wireDeleteButtons -->
      <button class="btn btn-danger" data-delete-id="${p.id}">Ta bort</button>
    </article>
  `;
}

// ===============================
// KOPPLA "TA BORT"-KNAPPAR (DELETE)
// ===============================

function wireDeleteButtons() {
  // Hittar alla element med attributet data-delete-id (alla "Ta bort"-knappar)
  document.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      // Hämtar produkt-ID från knappens data-attribut
      const id = btn.getAttribute("data-delete-id");

      // Visa bekräftelsedialog — om användaren klickar "Avbryt" avbryts funktionen
      if (!confirm(`Ta bort produkt ${id}?`)) return;

      try {
        // Skickar DELETE-request till /products/:id
        const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });

        // Om svaret inte är ok, läs felmeddelandet och kasta det
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }

        // Ladda om produktlistan så den borttagna produkten försvinner
        await loadProducts();
      } catch (err) {
        alert("Delete fail: " + err.message);
      }
    });
  });
}

// ===============================
// HÄMTA ORDER MED JOIN (GET)
// ===============================

async function loadOrderJoin() {
  // Hämtar order-ID från input-fältet, trim() tar bort mellanslag
  const orderId = String(orderIdEl.value || "").trim();

  // Rensa tidigare resultat
  orderResultEl.innerHTML = "";

  // Om fältet är tomt — visa felmeddelande och avbryt
  if (!orderId) {
    orderResultEl.innerHTML = `<div class="error">Skriv ett Order-ID.</div>`;
    return;
  }

  try {
    // GET-request till /orders/:id/join — backend kör JOIN-query mot tre tabeller
    const res = await fetch(`${API}/orders/${orderId}/join`);

    // Om svaret inte är ok (t.ex. 404), visa felmeddelandet
    if (!res.ok) {
      let msg = `Status: ${res.status}`;
      try {
        // Försök läsa svaret som JSON
        const j = await res.json();
        msg += `<br>${escapeHtml(JSON.stringify(j))}`;
      } catch {
        // Om det inte är JSON, läs som text istället
        const t = await res.text();
        msg += `<br>${escapeHtml(t)}`;
      }
      orderResultEl.innerHTML = `<div class="error">Fel!<br>${msg}</div>`;
      return;
    }

    // Parsar svaret — ett orderobjekt med items-array från JOIN-queryn
    const order = await res.json();

    // Loopar igenom varje item och bygger en <li> per vara
    const lines = order.items.map((it) => {
      // Om priset är null (produkt borttagen) visa "?", annars priset med 2 decimaler
      const priceText =
        it.product_price == null ? "?" : Number(it.product_price).toFixed(2);

      // Visa radtotal om den finns
      const lineTotalText =
        it.line_total == null ? "" : ` (rad: ${Number(it.line_total).toFixed(2)} kr)`;

      return `
        <li>
          <b>${escapeHtml(it.product_name)}</b>
          (ID ${it.product_id}) x${it.quantity}
          | ${priceText} kr${lineTotalText}
        </li>
      `;
    }).join(""); // join("") slår ihop alla <li> till en sträng

    // Beräknar totalsumman med reduce — adderar varje line_total
    // Startvärde 0, hoppar över items utan line_total
    const total = order.items.reduce((sum, it) => {
      if (it.line_total == null) return sum;
      return sum + Number(it.line_total);
    }, 0);

    // Bygger hela order-boxen med ordernummer, user, items och total
    orderResultEl.innerHTML = `
      <div class="orderBox">
        <div class="orderTitle">Order #${order.order_id}</div>
        <div class="muted">User: ${order.user_id}</div>

        <div class="spacer"></div>

        <div><b>Items:</b></div>
        <ul class="orderList">${lines}</ul>

        <div class="totalRow">
          <span>Total:</span>
          <span>${Number(total).toFixed(2)} kr</span>
        </div>
      </div>
    `;
  } catch (err) {
    // Nätverksfel eller annat oväntat fel
    orderResultEl.innerHTML = `<div class="error">Fel: ${escapeHtml(err.message)}</div>`;
  }
}

// ===============================
// XSS-SKYDD
// ===============================

// Ersätter farliga HTML-tecken med ofarliga versioner (HTML entities)
// T.ex. < blir &lt; — webbläsaren visar tecknet men tolkar det inte som HTML
// Detta förhindrar att skadlig kod (t.ex. <script>-taggar) körs i webbläsaren
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}