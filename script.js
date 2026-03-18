/* ===== MAP TAB -> FILE ===== */
const TAB_FILES = {
  new: "products-new.html",
  rolife: "products-rolife.html",
  tonecheer: "products-tonecheer.html",
  cutebee: "products-cutebee.html",
  cuteroom: "products-cuteroom.html",
  greathouse: "products-greathouse.html",
  other: "products-other.html"
};

/* ===== LOAD CONTENT CHO TAB ===== */
async function loadTab(tabId) {
  const container = document.getElementById(tabId);
  if (!container) return;

  // nếu đã load rồi thì không load lại
  if (container.dataset.loaded === "true") return;

  const file = TAB_FILES[tabId];
  if (!file) return;

  try {
    const res = await fetch(file, { cache: "no-store" });
    if (!res.ok) throw new Error("Load failed");

    const html = await res.text();
    container.innerHTML = html;
    container.dataset.loaded = "true";
  } catch (err) {
    container.innerHTML =
      "<p style='color:#999;'>⚠️ Không tải được sản phẩm</p>";
  }
}

/* ===== TAB SWITCH ===== */
function showTab(id, btn) {
  document.querySelectorAll(".products")
    .forEach(p => p.classList.remove("active"));

  document.querySelectorAll(".tabs button")
    .forEach(b => b.classList.remove("active"));

  const tab = document.getElementById(id);
  if (!tab) return;

  tab.classList.add("active");
  btn.classList.add("active");

  // load sản phẩm
  loadTab(id);

  // 🔥 THÊM Ở ĐÂY (quan trọng)
  setTimeout(updatePrices, 200);
}

/* ===== TOTAL PRICE ===== */
function updateTotal() {
  let total = 0;
  document
    .querySelectorAll('input[type="checkbox"]:checked')
    .forEach(cb => {
      total += Number(cb.dataset.price || 0);
    });

  const totalEl = document.getElementById("total");
  if (totalEl) {
    totalEl.innerText = total.toLocaleString("vi-VN");
  }
}

/* ===== BEFORE SUBMIT ===== */
function beforeSend() {
  const checked = document.querySelectorAll(
    'input[type="checkbox"]:checked'
  );

  if (checked.length === 0) {
    alert("Bạn chưa chọn sản phẩm nào 💛");
    return false;
  }

  let list = [];
  let total = 0;

  checked.forEach(cb => {
    list.push(cb.dataset.name);
    total += Number(cb.dataset.price || 0);
  });

  const productsInput = document.getElementById("products");
  const totalInput = document.getElementById("totalInput");

  if (productsInput) productsInput.value = list.join("\n");
  if (totalInput) totalInput.value = total.toLocaleString("vi-VN") + "đ";

  return true;
}

/* ===== EVENT ===== */
document.addEventListener("change", updateTotal);

/* ===== AUTO LOAD TAB ĐẦU ===== */
document.addEventListener("DOMContentLoaded", () => {
  loadTab("new");
});

