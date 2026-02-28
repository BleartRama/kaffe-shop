const API_PRODUCTS = "http://localhost:3000/products";
const API_ORDERS = "http://localhost:3000/orders";

function loadProducts() {
  fetch(API_PRODUCTS, { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      const productsDiv = document.getElementById("products");
      productsDiv.innerHTML = "";

      data.forEach(product => {
        productsDiv.innerHTML += `
          <div class="product">
            <h3>${product.name}</h3>
            <p><b>ID:</b> ${product.id}</p>
            <p>Pris: ${Number(product.price).toFixed(2)} kr</p>
            <p>Lager: ${product.stock}</p>
            <button onclick="deleteProduct(${product.id})">Ta bort</button>
          </div>
        `;
      });
    })
    .catch(err => alert("GET fel: " + err.message));
}

function deleteProduct(id) {
  fetch(`http://localhost:3000/products/${id}`, { method: "DELETE" })
    .then(res => res.text().then(text => ({ ok: res.ok, status: res.status, text })))
    .then(result => {
      if (!result.ok) {
        alert("DELETE fail\nStatus: " + result.status + "\n" + result.text);
        return;
      }
      alert("Produkt borttagen: ID " + id);
      loadProducts();
    })
    .catch(err => alert("DELETE fel: " + err.message));
}

// ✅ JOIN: Hämta order med items + produktnamn
function loadOrder() {
  const id = document.getElementById("orderId").value;
  const out = document.getElementById("orderResult");

  if (!id) {
    out.textContent = "Skriv ett order-id först.";
    return;
  }

  out.textContent = "Laddar...";

  fetch(`${API_ORDERS}/${id}`, { cache: "no-store" })
    .then(res => res.text().then(text => ({ ok: res.ok, status: res.status, text })))
    .then(result => {
      if (!result.ok) {
        out.textContent = "Fel!\nStatus: " + result.status + "\n" + result.text;
        return;
      }

      const data = JSON.parse(result.text);

      // Skriv ut enkelt och läsbart
      let text = `Order #${data.id}\nUser: ${data.user_id}\n\nItems:\n`;
      data.items.forEach(item => {
        text += `- ${item.name} (ID ${item.product_id}) x${item.quantity} | ${item.price} kr\n`;
      });

      out.textContent = text;
    })
    .catch(err => {
      out.textContent = "Fel: " + err.message;
    });
}

// autoladda produkter när sidan öppnas
loadProducts();