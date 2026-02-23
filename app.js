const STORAGE_KEY = "cafe-caisse-data-v1";

const productForm = document.getElementById("productForm");
const productNameInput = document.getElementById("productName");
const productPriceInput = document.getElementById("productPrice");
const productList = document.getElementById("productList");
const cartList = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const salesCountEl = document.getElementById("salesCount");
const dailyRevenueEl = document.getElementById("dailyRevenue");
const historyList = document.getElementById("historyList");
const checkoutBtn = document.getElementById("checkoutBtn");
const resetDayBtn = document.getElementById("resetDayBtn");

const productItemTemplate = document.getElementById("productItemTemplate");
const cartItemTemplate = document.getElementById("cartItemTemplate");

let state = loadState();

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed) throw new Error("empty");
    return {
      products: parsed.products || defaultProducts(),
      cart: [],
      salesHistory: parsed.salesHistory || [],
    };
  } catch {
    return {
      products: defaultProducts(),
      cart: [],
      salesHistory: [],
    };
  }
}

function defaultProducts() {
  return [
    { id: crypto.randomUUID(), name: "Expresso", price: 1.8 },
    { id: crypto.randomUUID(), name: "Cappuccino", price: 2.9 },
    { id: crypto.randomUUID(), name: "Croissant", price: 1.5 },
  ];
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      products: state.products,
      salesHistory: state.salesHistory,
    }),
  );
}

function formatPrice(value) {
  return `${value.toFixed(2)} €`;
}

function renderProducts() {
  productList.innerHTML = "";

  state.products.forEach((product) => {
    const node = productItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".p-name").textContent = product.name;
    node.querySelector(".p-price").textContent = formatPrice(product.price);

    node.querySelector(".add").addEventListener("click", () => {
      state.cart.push({ ...product, lineId: crypto.randomUUID() });
      renderCart();
    });

    node.querySelector(".remove").addEventListener("click", () => {
      state.products = state.products.filter((p) => p.id !== product.id);
      saveState();
      renderProducts();
    });

    productList.appendChild(node);
  });
}

function renderCart() {
  cartList.innerHTML = "";

  state.cart.forEach((item) => {
    const node = cartItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".c-name").textContent = item.name;
    node.querySelector(".c-price").textContent = formatPrice(item.price);

    node.querySelector(".c-remove").addEventListener("click", () => {
      state.cart = state.cart.filter((x) => x.lineId !== item.lineId);
      renderCart();
    });

    cartList.appendChild(node);
  });

  const total = state.cart.reduce((sum, item) => sum + item.price, 0);
  cartTotalEl.textContent = formatPrice(total);
}

function renderSummary() {
  const count = state.salesHistory.length;
  const revenue = state.salesHistory.reduce((sum, sale) => sum + sale.total, 0);

  salesCountEl.textContent = count;
  dailyRevenueEl.textContent = formatPrice(revenue);

  historyList.innerHTML = "";
  [...state.salesHistory].reverse().forEach((sale) => {
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <div>
        <strong>Ticket #${sale.id.slice(0, 5).toUpperCase()}</strong>
        <span>${sale.items.length} article(s) - ${sale.time}</span>
      </div>
      <strong>${formatPrice(sale.total)}</strong>
    `;
    historyList.appendChild(li);
  });
}

productForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = productNameInput.value.trim();
  const price = Number(productPriceInput.value);

  if (!name || Number.isNaN(price) || price <= 0) {
    alert("Veuillez saisir un produit et un prix valide.");
    return;
  }

  state.products.push({ id: crypto.randomUUID(), name, price });
  productForm.reset();
  saveState();
  renderProducts();
});

checkoutBtn.addEventListener("click", () => {
  if (state.cart.length === 0) {
    alert("Le ticket est vide.");
    return;
  }

  const sale = {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    total: state.cart.reduce((sum, item) => sum + item.price, 0),
    items: state.cart,
  };

  state.salesHistory.push(sale);
  state.cart = [];
  saveState();
  renderCart();
  renderSummary();
});

resetDayBtn.addEventListener("click", () => {
  const ok = confirm("Confirmer la réinitialisation de la journée ?");
  if (!ok) return;

  state.salesHistory = [];
  state.cart = [];
  saveState();
  renderCart();
  renderSummary();
});

renderProducts();
renderCart();
renderSummary();
