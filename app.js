const STORAGE_KEY = "coffeeflow-pos-v2";

const app = {
  tabs: document.querySelectorAll(".tab"),
  panels: document.querySelectorAll(".tab-panel"),
  businessLabel: document.getElementById("businessLabel"),
  productSearch: document.getElementById("productSearch"),
  catalog: document.getElementById("catalog"),
  serverSelect: document.getElementById("serverSelect"),
  serverQuickList: document.getElementById("serverQuickList"),
  tableInput: document.getElementById("tableInput"),
  cartList: document.getElementById("cartList"),
  subtotal: document.getElementById("subtotal"),
  taxRateLabel: document.getElementById("taxRateLabel"),
  taxAmount: document.getElementById("taxAmount"),
  total: document.getElementById("total"),
  clearCartBtn: document.getElementById("clearCartBtn"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  printLastTicketBtn: document.getElementById("printLastTicketBtn"),
  closeDayBtn: document.getElementById("closeDayBtn"),
  productForm: document.getElementById("productForm"),
  productName: document.getElementById("productName"),
  productCategory: document.getElementById("productCategory"),
  productPrice: document.getElementById("productPrice"),
  productStock: document.getElementById("productStock"),
  productThreshold: document.getElementById("productThreshold"),
  saveProductBtn: document.getElementById("saveProductBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  inventoryList: document.getElementById("inventoryList"),
  settingsForm: document.getElementById("settingsForm"),
  businessName: document.getElementById("businessName"),
  currency: document.getElementById("currency"),
  taxRate: document.getElementById("taxRate"),
  ticketFooter: document.getElementById("ticketFooter"),
  printerName: document.getElementById("printerName"),
  autoPrint: document.getElementById("autoPrint"),
  servers: document.getElementById("servers"),
  ticketsCount: document.getElementById("ticketsCount"),
  revenue: document.getElementById("revenue"),
  itemsSold: document.getElementById("itemsSold"),
  topServer: document.getElementById("topServer"),
  historyList: document.getElementById("historyList"),
  closeHistoryList: document.getElementById("closeHistoryList"),
  printDayReportBtn: document.getElementById("printDayReportBtn"),
  printDialog: document.getElementById("printDialog"),
  printTitle: document.getElementById("printTitle"),
  printContent: document.getElementById("printContent"),
  nativePrintBtn: document.getElementById("nativePrintBtn"),
  closePrintDialogBtn: document.getElementById("closePrintDialogBtn"),
};

let state = loadState();
let editingProductId = null;
let lastPrintable = "";

function defaultState() {
  return {
    settings: {
      businessName: "Mon Café",
      currency: "EUR",
      taxRate: 10,
      ticketFooter: "Merci et à bientôt ☕",
      printerName: "Imprimante Comptoir",
      autoPrint: true,
      servers: ["Nadia", "Youssef", "Karim"],
    },
    products: [
      { id: crypto.randomUUID(), name: "Expresso", category: "Boissons", price: 1.8, stock: 80, threshold: 8 },
      { id: crypto.randomUUID(), name: "Cappuccino", category: "Boissons", price: 2.9, stock: 40, threshold: 6 },
      { id: crypto.randomUUID(), name: "Croissant", category: "Snacks", price: 1.5, stock: 30, threshold: 5 },
      { id: crypto.randomUUID(), name: "Eau 50cl", category: "Boissons", price: 1.0, stock: 100, threshold: 10 },
    ],
    currentCart: [],
    sales: [],
    dayClosings: [],
    lastTicket: null,
  };
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!raw) return defaultState();
    return {
      ...defaultState(),
      ...raw,
      currentCart: [],
    };
  } catch {
    return defaultState();
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      settings: state.settings,
      products: state.products,
      sales: state.sales,
      dayClosings: state.dayClosings,
      lastTicket: state.lastTicket,
    }),
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: state.settings.currency || "EUR" }).format(value);
}

function setTab(tabName) {
  app.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  app.panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tabName));
}

function renderHeader() {
  app.businessLabel.textContent = `${state.settings.businessName} · ${state.settings.printerName}`;
}

function renderServers() {
  const selectedServer = app.serverSelect.value || state.settings.servers[0] || "";
  app.serverSelect.innerHTML = "";
  app.serverQuickList.innerHTML = "";

  state.settings.servers.forEach((server) => {
    const option = document.createElement("option");
    option.value = server;
    option.textContent = server;
    app.serverSelect.append(option);

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "server-chip";
    chip.textContent = server;
    chip.addEventListener("click", () => {
      app.serverSelect.value = server;
      renderServers();
    });
    app.serverQuickList.append(chip);
  });

  if (state.settings.servers.includes(selectedServer)) {
    app.serverSelect.value = selectedServer;
  }

  [...app.serverQuickList.querySelectorAll(".server-chip")].forEach((chip) => {
    chip.classList.toggle("active", chip.textContent === app.serverSelect.value);
  });
}

function stockClass(product) {
  if (product.stock <= 0) return "out";
  if (product.stock <= product.threshold) return "low";
  return "ok";
}

function stockText(product) {
  if (product.stock <= 0) return "Rupture";
  if (product.stock <= product.threshold) return `Bas (${product.stock})`;
  return `Stock: ${product.stock}`;
}

function renderCatalog() {
  const term = app.productSearch.value.trim().toLowerCase();
  app.catalog.innerHTML = "";
  state.products
    .filter((p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
    .forEach((product) => {
      const item = document.createElement("article");
      item.className = "product";
      item.innerHTML = `
        <strong>${product.name}</strong>
        <small>${product.category}</small>
        <small class="${stockClass(product)}">${stockText(product)}</small>
        <footer>
          <strong>${formatMoney(product.price)}</strong>
          <button ${product.stock <= 0 ? "disabled" : ""}>Ajouter</button>
        </footer>
      `;
      item.querySelector("button").addEventListener("click", () => addToCart(product.id));
      app.catalog.append(item);
    });
}

function addToCart(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product || product.stock <= 0) return;

  const found = state.currentCart.find((line) => line.productId === productId);
  if (found) {
    found.qty += 1;
  } else {
    state.currentCart.push({ lineId: crypto.randomUUID(), productId, name: product.name, unitPrice: product.price, qty: 1 });
  }
  renderCart();
}

function updateCartQty(lineId, delta) {
  const line = state.currentCart.find((x) => x.lineId === lineId);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) state.currentCart = state.currentCart.filter((x) => x.lineId !== lineId);
  renderCart();
}

function cartTotals() {
  const subtotal = state.currentCart.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const taxAmount = subtotal * (state.settings.taxRate / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

function renderCart() {
  app.cartList.innerHTML = "";
  state.currentCart.forEach((line) => {
    const li = document.createElement("li");
    li.className = "cart-row";
    li.innerHTML = `
      <div>
        <strong>${line.name}</strong>
        <small>${formatMoney(line.unitPrice)} x ${line.qty}</small>
      </div>
      <div>
        <button class="secondary">-</button>
        <button class="secondary">+</button>
      </div>
    `;
    const [minus, plus] = li.querySelectorAll("button");
    minus.addEventListener("click", () => updateCartQty(line.lineId, -1));
    plus.addEventListener("click", () => updateCartQty(line.lineId, 1));
    app.cartList.append(li);
  });

  const { subtotal, taxAmount, total } = cartTotals();
  app.subtotal.textContent = formatMoney(subtotal);
  app.taxAmount.textContent = formatMoney(taxAmount);
  app.total.textContent = formatMoney(total);
  app.taxRateLabel.textContent = `${state.settings.taxRate}%`;
}

function productFormReset() {
  app.productForm.reset();
  app.cancelEditBtn.classList.add("hidden");
  app.saveProductBtn.textContent = "Enregistrer";
  editingProductId = null;
}

function renderInventory() {
  app.inventoryList.innerHTML = "";
  state.products.forEach((product) => {
    const li = document.createElement("li");
    li.className = "inventory-row";
    li.innerHTML = `
      <div>
        <strong>${product.name}</strong>
        <small>${product.category} · ${formatMoney(product.price)} · <span class="${stockClass(product)}">${stockText(product)}</span></small>
      </div>
      <div>
        <button class="secondary">Modifier</button>
        <button class="danger">Supprimer</button>
      </div>
    `;
    const [editBtn, deleteBtn] = li.querySelectorAll("button");
    editBtn.addEventListener("click", () => {
      editingProductId = product.id;
      app.productName.value = product.name;
      app.productCategory.value = product.category;
      app.productPrice.value = product.price;
      app.productStock.value = product.stock;
      app.productThreshold.value = product.threshold;
      app.cancelEditBtn.classList.remove("hidden");
      app.saveProductBtn.textContent = "Mettre à jour";
      setTab("produits");
      app.productName.focus();
    });

    deleteBtn.addEventListener("click", () => {
      if (!confirm(`Supprimer ${product.name} ?`)) return;
      state.products = state.products.filter((p) => p.id !== product.id);
      persist();
      renderAll();
    });

    app.inventoryList.append(li);
  });
}

function renderSettings() {
  app.businessName.value = state.settings.businessName;
  app.currency.value = state.settings.currency;
  app.taxRate.value = state.settings.taxRate;
  app.ticketFooter.value = state.settings.ticketFooter;
  app.printerName.value = state.settings.printerName;
  app.autoPrint.value = String(state.settings.autoPrint);
  app.servers.value = state.settings.servers.join(", ");
}

function summarizeSales(sales) {
  const revenue = sales.reduce((sum, s) => sum + s.total, 0);
  const itemsSold = sales.reduce((sum, s) => sum + s.lines.reduce((n, l) => n + l.qty, 0), 0);
  const perServer = sales.reduce((map, s) => {
    map[s.server] = (map[s.server] || 0) + s.total;
    return map;
  }, {});
  const topServer = Object.entries(perServer).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  return { revenue, itemsSold, topServer };
}

function renderReports() {
  app.historyList.innerHTML = "";
  app.closeHistoryList.innerHTML = "";

  const summary = summarizeSales(state.sales);
  app.ticketsCount.textContent = state.sales.length;
  app.revenue.textContent = formatMoney(summary.revenue);
  app.itemsSold.textContent = summary.itemsSold;
  app.topServer.textContent = summary.topServer;

  [...state.sales].reverse().forEach((sale) => {
    const li = document.createElement("li");
    li.className = "history-row";
    li.innerHTML = `
      <div>
        <strong>#${sale.id.slice(0, 6).toUpperCase()}</strong>
        <small>${sale.server} · ${sale.table || "Sans table"} · ${sale.time}</small>
      </div>
      <strong>${formatMoney(sale.total)}</strong>
    `;
    app.historyList.append(li);
  });

  [...state.dayClosings].reverse().forEach((closing) => {
    const li = document.createElement("li");
    li.className = "close-row";
    li.innerHTML = `
      <div>
        <strong>${closing.date}</strong>
        <small>${closing.tickets} tickets · ${closing.itemsSold} articles · top: ${closing.topServer}</small>
      </div>
      <strong>${formatMoney(closing.revenue)}</strong>
    `;
    app.closeHistoryList.append(li);
  });
}

function buildTicketText(sale) {
  const lines = sale.lines
    .map((line) => `${line.name.padEnd(18, " ")} x${line.qty} ${formatMoney(line.qty * line.unitPrice)}`)
    .join("\n");

  return [
    `${state.settings.businessName}`,
    `Imprimante: ${state.settings.printerName}`,
    `Ticket: ${sale.id}`,
    `Heure: ${sale.time}`,
    `Serveur: ${sale.server}`,
    `Table: ${sale.table || "-"}`,
    "-------------------------------",
    lines,
    "-------------------------------",
    `Sous-total: ${formatMoney(sale.subtotal)}`,
    `TVA ${state.settings.taxRate}%: ${formatMoney(sale.taxAmount)}`,
    `TOTAL: ${formatMoney(sale.total)}`,
    "",
    state.settings.ticketFooter,
  ].join("\n");
}

function openPrintDialog(title, text) {
  app.printTitle.textContent = title;
  app.printContent.textContent = text;
  lastPrintable = text;
  app.printDialog.showModal();
}

function checkout() {
  if (state.currentCart.length === 0) {
    alert("Le ticket est vide.");
    return;
  }

  const insufficient = state.currentCart.find((line) => {
    const p = state.products.find((x) => x.id === line.productId);
    return !p || p.stock < line.qty;
  });

  if (insufficient) {
    alert(`Stock insuffisant pour ${insufficient.name}.`);
    return;
  }

  state.currentCart.forEach((line) => {
    const p = state.products.find((x) => x.id === line.productId);
    p.stock -= line.qty;
  });

  const totals = cartTotals();
  const sale = {
    id: crypto.randomUUID(),
    time: new Date().toLocaleString("fr-FR"),
    server: app.serverSelect.value,
    table: app.tableInput.value.trim(),
    lines: structuredClone(state.currentCart),
    ...totals,
  };

  state.sales.push(sale);
  state.lastTicket = sale;
  state.currentCart = [];
  app.tableInput.value = "";
  persist();
  renderAll();

  const text = buildTicketText(sale);
  if (state.settings.autoPrint) {
    openPrintDialog("Ticket de vente", text);
  }
}

function closeDay() {
  if (state.sales.length === 0) {
    alert("Aucune vente à clôturer.");
    return;
  }

  const summary = summarizeSales(state.sales);
  const report = {
    date: new Date().toLocaleDateString("fr-FR"),
    tickets: state.sales.length,
    revenue: summary.revenue,
    itemsSold: summary.itemsSold,
    topServer: summary.topServer,
  };

  state.dayClosings.push(report);
  const text = [
    `Rapport fin de journée - ${report.date}`,
    `${state.settings.businessName}`,
    "-----------------------------",
    `Tickets: ${report.tickets}`,
    `Articles vendus: ${report.itemsSold}`,
    `CA: ${formatMoney(report.revenue)}`,
    `Top serveur: ${report.topServer}`,
  ].join("\n");

  state.sales = [];
  state.currentCart = [];
  persist();
  renderAll();
  openPrintDialog("Fin de journée", text);
}

function printDayReport() {
  const summary = summarizeSales(state.sales);
  const text = [
    `Rapport en cours - ${new Date().toLocaleDateString("fr-FR")}`,
    `${state.settings.businessName}`,
    "-----------------------------",
    `Tickets: ${state.sales.length}`,
    `Articles vendus: ${summary.itemsSold}`,
    `CA: ${formatMoney(summary.revenue)}`,
    `Top serveur: ${summary.topServer}`,
  ].join("\n");
  openPrintDialog("Rapport du jour", text);
}

function renderAll() {
  renderHeader();
  renderServers();
  renderCatalog();
  renderCart();
  renderInventory();
  renderSettings();
  renderReports();
}

app.tabs.forEach((tab) => tab.addEventListener("click", () => setTab(tab.dataset.tab)));
app.productSearch.addEventListener("input", renderCatalog);
app.serverSelect.addEventListener("change", renderServers);
app.clearCartBtn.addEventListener("click", () => {
  state.currentCart = [];
  renderCart();
});
app.checkoutBtn.addEventListener("click", checkout);
app.printLastTicketBtn.addEventListener("click", () => {
  if (!state.lastTicket) {
    alert("Aucun ticket disponible.");
    return;
  }
  openPrintDialog("Dernier ticket", buildTicketText(state.lastTicket));
});
app.closeDayBtn.addEventListener("click", closeDay);
app.printDayReportBtn.addEventListener("click", printDayReport);

app.productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = {
    name: app.productName.value.trim(),
    category: app.productCategory.value.trim(),
    price: Number(app.productPrice.value),
    stock: Number(app.productStock.value),
    threshold: Number(app.productThreshold.value),
  };

  if (!payload.name || !payload.category || payload.price <= 0 || payload.stock < 0 || payload.threshold < 0) {
    alert("Veuillez remplir les champs produit correctement.");
    return;
  }

  if (editingProductId) {
    state.products = state.products.map((p) => (p.id === editingProductId ? { ...p, ...payload } : p));
  } else {
    state.products.push({ id: crypto.randomUUID(), ...payload });
  }

  persist();
  productFormReset();
  renderAll();
});

app.cancelEditBtn.addEventListener("click", productFormReset);

app.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const servers = app.servers.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (servers.length === 0) {
    alert("Ajoutez au moins un serveur.");
    return;
  }

  state.settings = {
    businessName: app.businessName.value.trim(),
    currency: app.currency.value.trim().toUpperCase(),
    taxRate: Number(app.taxRate.value),
    ticketFooter: app.ticketFooter.value.trim(),
    printerName: app.printerName.value.trim(),
    autoPrint: app.autoPrint.value === "true",
    servers,
  };

  persist();
  renderAll();
  alert("Paramètres sauvegardés.");
});

app.nativePrintBtn.addEventListener("click", () => {
  const printWindow = window.open("", "PRINT", "height=600,width=420");
  if (!printWindow) return;
  printWindow.document.write(`<pre>${lastPrintable}</pre>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
});
app.closePrintDialogBtn.addEventListener("click", () => app.printDialog.close());

renderAll();
setTab("vente");
