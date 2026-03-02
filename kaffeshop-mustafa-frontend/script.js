const API = "http://localhost:3000";

const productsEl = document.getElementById("products");
const btnLoad = document.getElementById("btnLoad");

const orderIdEl = document.getElementById("orderId");
const btnOrder = document.getElementById("btnOrder");
const orderResultEl = document.getElementById("orderResult");

btnLoad.addEventListener("click", loadProducts);
btnOrder.addEventListener("click", loadOrderJoin);

document.getElementById("btnAdd").addEventListener("click", async () => {
  const product = {
    name: document.getElementById("newName").value,
    description: document.getElementById("newDesc").value,
    price: Number(document.getElementById("newPrice").value),
    stock: Number(document.getElementById("newStock").value),
    category_id: Number(document.getElementById("newCat").value),
  };

  try {
    const res = await fetch(`${API}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    alert("Produkt skapad!");
    loadProducts();
  } catch (err) {
    alert("Fel: " + err.message);
  }
});

async function loadProducts() {
  productsEl.innerHTML = `<div class="muted">Laddar...</div>`;

  try {
    const res = await fetch(`${API}/products`);
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

async function loadOrderJoin() {
  const orderId = String(orderIdEl.value || "").trim();

  orderResultEl.innerHTML = "";

  if (!orderId) {
    orderResultEl.innerHTML = `<div class="error">Skriv ett Order-ID.</div>`;
    return;
  }

  try {
    const res = await fetch(`${API}/orders/${orderId}/join`);

    // Om backend skickar JSON-fel (404)
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

    // Viktigt: vi använder JOIN-datan direkt (product_name/product_price)
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

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}