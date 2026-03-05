const API = "http://localhost:3000";

const productsEl = document.getElementById("products");
const btnLoad = document.getElementById("btnLoad");
const orderIdEl = document.getElementById("orderId");
const btnOrder = document.getElementById("btnOrder");
const orderResultEl = document.getElementById("orderResult");

// ===============================
// EVENT LISTENERS
// ===============================

btnLoad.addEventListener("click", loadProducts);
btnOrder.addEventListener("click", loadOrderJoin);
document.getElementById("filterCat").addEventListener("change", loadProducts);

// ===============================
// SKAPA PRODUKT (POST)
// ===============================

document.getElementById("btnAdd").addEventListener("click", async () => {
  const name = document.getElementById("newName").value.trim();
  const description = document.getElementById("newDesc").value.trim();
  const price = Number(document.getElementById("newPrice").value);
  const stock = Number(document.getElementById("newStock").value);
  const category_id = Number(document.getElementById("newCat").value);

  if (!name || !description || !price || !stock || !category_id) {
    alert("Alla fält måste fyllas i!");
    return;
  }
  if (price <= 0 || stock < 0) {
    alert("Pris måste vara större än 0 och lager kan inte vara negativt.");
    return;
  }

  const product = { name, description, price, stock, category_id };

  try {
    const res = await fetch(`${API}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    alert("Produkt skapad!");
    loadProducts();
  } catch (err) {
    alert("Fel: " + err.message);
  }
});

// ===============================
// LADDA KATEGORIER
// ===============================

async function loadCategories() {
  const res = await fetch(`${API}/categories`);
  const categories = await res.json();

  const filterSelect = document.getElementById("filterCat");
  const newCatSelect = document.getElementById("newCat");

  filterSelect.innerHTML = `<option value="">Alla kategorier</option>`;
  newCatSelect.innerHTML = `<option value="">Välj kategori</option>`;

  categories.forEach(cat => {
    filterSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    newCatSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

// ===============================
// HÄMTA PRODUKTER (GET)
// ===============================

async function loadProducts() {
  productsEl.innerHTML = `<div class="muted">Laddar...</div>`;

  // Hämtar valt kategori-ID från filter-dropdown
  const category_id = document.getElementById("filterCat").value;
  const url = category_id ? `${API}/products?category_id=${category_id}` : `${API}/products`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const products = await res.json();

    if (!products.length) {
      productsEl.innerHTML = `<div class="muted">Inga produkter hittades.</div>`;
      return;
    }

    productsEl.innerHTML = products.map(renderProductCard).join("");
    wireDeleteButtons();
  } catch (err) {
    productsEl.innerHTML = `<div class="error">Fel vid hämtning: ${err.message}</div>`;
  }
}

// ===============================
// RENDERA ETT PRODUKTKORT (HTML)
// ===============================

function renderProductCard(p) {
  return `
    <article class="product">
      <div class="product-head">
        <h3>${escapeHtml(p.name)}</h3>
        <span class="pill">ID: ${p.id}</span>
      </div>

      <div class="product-meta">
        <div><span class="label">Pris:</span> ${Number(p.price).toFixed(2)} kr</div>
        <div><span class="label">Lager:</span> ${p.stock}</div>
      </div>

      <button class="btn btn-danger" data-delete-id="${p.id}">Ta bort</button>
    </article>
  `;
}

// ===============================
// KOPPLA "TA BORT"-KNAPPAR (DELETE)
// ===============================

function wireDeleteButtons() {
  document.querySelectorAll("[data-delete-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete-id");

      if (!confirm(`Ta bort produkt ${id}?`)) return;

      try {
        const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }

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
  const orderId = String(orderIdEl.value || "").trim();

  orderResultEl.innerHTML = "";

  if (!orderId) {
    orderResultEl.innerHTML = `<div class="error">Skriv ett Order-ID.</div>`;
    return;
  }

  try {
    const res = await fetch(`${API}/orders/${orderId}/join`);

    if (!res.ok) {
      let msg = `Status: ${res.status}`;
      try {
        const j = await res.json();
        msg += `<br>${escapeHtml(JSON.stringify(j))}`;
      } catch {
        const t = await res.text();
        msg += `<br>${escapeHtml(t)}`;
      }
      orderResultEl.innerHTML = `<div class="error">Fel!<br>${msg}</div>`;
      return;
    }

    const order = await res.json();

    const lines = order.items.map((it) => {
      const priceText =
        it.product_price == null ? "?" : Number(it.product_price).toFixed(2);

      const lineTotalText =
        it.line_total == null ? "" : ` (rad: ${Number(it.line_total).toFixed(2)} kr)`;

      return `
        <li>
          <b>${escapeHtml(it.product_name)}</b>
          (ID ${it.product_id}) x${it.quantity}
          | ${priceText} kr${lineTotalText}
        </li>
      `;
    }).join("");

    const total = order.items.reduce((sum, it) => {
      if (it.line_total == null) return sum;
      return sum + Number(it.line_total);
    }, 0);

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
    orderResultEl.innerHTML = `<div class="error">Fel: ${escapeHtml(err.message)}</div>`;
  }
}

// ===============================
// XSS-SKYDD
// ===============================

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadCategories();