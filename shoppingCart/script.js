const API = "https://api.escuelajs.co/api/v1";

let all = [],
  filtered = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let activeCat = null;
let minPrice = null, maxPrice = null;

async function init() {
  fetchCategories();
  const res = await fetch(`${API}/products?limit=200`).catch(() => null);
  if (!res) {
    document.getElementById("grid").innerHTML =
      '<div class="status">Failed to load.</div>';
    return;
  }
  all = await res.json();
  applyFilters();
  updateCount();
}

async function fetchCategories() {
  const res = await fetch(`${API}/categories`).catch(() => null);
  if (!res) return;
  const cats = await res.json();
  const list = document.getElementById("cat-list");
  list.innerHTML = `<button class="cat-btn active" onclick="setCat(null,this)">All</button>`;
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.className = "cat-btn";
    b.textContent = c.name;
    b.onclick = (e) => setCat(c.id, e.target);
    list.appendChild(b);
  });
}

function setCat(id, el) {
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.remove("active"));
  el.classList.add("active");
  activeCat = id;
  applyFilters();
}

function onSearch() {
  applyFilters();
}

function onPriceChange() {
  minPrice = parseFloat(document.getElementById("min-price").value) || null;
  maxPrice = parseFloat(document.getElementById("max-price").value) || null;
  applyFilters();
}

function applyFilters() {
  const q = document.getElementById("search").value.toLowerCase();
  filtered = all.filter(
    (p) =>
      (!activeCat || p.category?.id === activeCat) &&
      (!q || p.title.toLowerCase().includes(q)) &&
      (!minPrice || p.price >= minPrice) &&
      (!maxPrice || p.price <= maxPrice),
  );
  document.getElementById("result-count").textContent =
    `${filtered.length} results`;
  renderGrid();
}

function getImg(p) {
  if (!Array.isArray(p.images) || !p.images[0])
    return "https://placehold.co/200x200/eee/999?text=?";
  return p.images[0].replace(/[\[\]"]/g, "");
}

function renderGrid() {
  const grid = document.getElementById("grid");
  if (!filtered.length) {
    grid.innerHTML = '<div class="status">No products found.</div>';
    return;
  }

  grid.innerHTML = filtered
    .map((p) => {
      const inCart = cart.some((c) => c.id === p.id);
      return `<div class="card">
      <img src="${getImg(p)}" onerror="this.src='https://placehold.co/200x200/eee/999?text=?'" alt="">
      <div class="card-cat">${p.category?.name || ""}</div>
      <div class="card-name">${p.title}</div>
      <div class="card-price">$${p.price.toFixed(2)}</div>
      <button onclick="addToCart(${p.id})" id="btn-${p.id}" class="${inCart ? "in-cart" : ""}">${inCart ? "IN CART" : "ADD TO CART"}</button>
    </div>`;
    })
    .join("");
}

function addToCart(id) {
  const p = all.find((x) => x.id === id);
  if (!p) return;
  const ex = cart.find((c) => c.id === id);
  if (ex) ex.qty++;
  else
    cart.push({ id, name: p.title, price: p.price, img: getImg(p), qty: 1 });
  save();
  updateCount();
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.textContent = "IN CART";
    btn.classList.add("in-cart");
  }
  toast("Added to cart");
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  save();
  renderCart();
  updateCount();
  const btn = document.getElementById(`btn-${id}`);
  if (btn) {
    btn.textContent = "ADD TO CART";
    btn.classList.remove("in-cart");
  }
}

function changeQty(id, d) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  save();
  renderCart();
}

function save() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCount() {
  document.getElementById("cart-count").textContent = cart.reduce(
    (s, c) => s + c.qty,
    0,
  );
}

function renderCart() {
  const el = document.getElementById("drawer-items");
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
  updateCount();
  if (!cart.length) {
    el.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }
  el.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <img src="${item.img}" onerror="this.src='https://placehold.co/50x50/eee/999?text=?'">
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">$${(item.price * item.qty).toFixed(2)}</div>
        <div class="ci-qty">
          <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
        </div>
      </div>
      <button class="rm-btn" onclick="removeFromCart(${item.id})">✕</button>
    </div>`,
    )
    .join("");
}

function openCart() {
  renderCart();
  document.getElementById("overlay").classList.add("open");
  document.getElementById("drawer").classList.add("open");
}

function closeCart() {
  document.getElementById("overlay").classList.remove("open");
  document.getElementById("drawer").classList.remove("open");
}

function checkout() {
  if (!cart.length) {
    toast("Cart is empty");
    return;
  }
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.email) {
    toast("Please login first");
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const order = { user, items: cart, total };
  toast("Processing order...");
  setTimeout(() => {
    if (Math.random() > 0.1) { // 90% success
      const orders = JSON.parse(localStorage.getItem("orders") || "[]");
      orders.push(order);
      localStorage.setItem("orders", JSON.stringify(orders));
      cart = [];
      save();
      updateCount();
      renderGrid();
      closeCart();
      toast("Order placed successfully!");
    } else {
      toast("Order failed. Please try again.");
    }
  }, 2000);
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
}

init();
