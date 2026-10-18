/* ===== NGUỒN DỮ LIỆU SẢN PHẨM ===== */
const NEW_PRODUCTS_FILE = "products-new.html";
const PRODUCT_FILES = [
  "products-rolife.html",
  "products-tonecheer.html",
  "products-cutebee.html",
  "products-cuteroom.html",
  "products-greathouse.html",
  "products-jifangshiguang.html",
  "products-aslowsnail.html",
  "products-fifijoy.html",
  "products-hongda.html",
  "products-rokr.html",
  "products-ytop.html",
  "products-tianyu.html",
  "products-qiaoyun.html",
  "products-xinyue.html",
  "products-maotiankong.html",
  "products-zhiwo.html",
  "products-other.html"
];

const VIETNAMESE_ALPHABET = ["A", "B", "C", "D", "Đ", "E", "G", "H", "I", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y"];
let allAlphabetItems = [];
let alphabetLoaded = false;
let activeLetter = null;
let activeSearchQuery = "";

function getProductName(item) {
  // Ưu tiên data-name nếu có, nhưng loại bỏ emoji/ký hiệu đứng đầu tên.
  const input = item.querySelector("input");
  const label = item.querySelector("label");
  let name = (input?.dataset.name || label?.textContent || item.textContent || "").trim();
  // Bỏ các emoji/ký hiệu trang trí ở đầu để tìm theo tên mô hình thật.
  name = name.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\p{S}\p{P}]+/u, "").trim();
  return name;
}

function getInitial(name) {
  // Bỏ emoji/ký hiệu trước khi lấy chữ cái đầu của tên mô hình.
  const clean = (name || "").trim().replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\p{S}\p{P}]+/u, "");
  const first = Array.from(clean)[0]?.toLocaleUpperCase("vi-VN") || "";
  if (!first) return "";
  // Gom A/Ă/Â về A, E/Ê về E, O/Ô/Ơ về O, U/Ư về U để khách dễ tìm.
  if (first === "Đ") return "Đ";
  return first.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function sortProducts(container) {
  const items = Array.from(container.querySelectorAll(".item"));
  items.sort((a, b) => getProductName(a).localeCompare(getProductName(b), "vi"));
  items.forEach(item => container.appendChild(item));
}

async function fetchProductItems(file) {
  const res = await fetch(file, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được ${file}`);
  const html = await res.text();
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const items = Array.from(temp.querySelectorAll(".item"));

  // Gắn tên hãng theo file nguồn để tìm được hãng kể cả khi data-name
  // chỉ lưu tên mô hình, không lưu tên nhà sản xuất.
  const brandFromFile = file
    .replace(/^products-/, "")
    .replace(/\.html$/i, "")
    .replace(/-/g, " ");
  items.forEach(item => {
    item.dataset.brand = brandFromFile;
  });
  return items;
}

async function loadNewProducts() {
  const container = document.getElementById("new");
  if (!container || container.dataset.loaded === "true") return;
  try {
    const items = await fetchProductItems(NEW_PRODUCTS_FILE);
    items.forEach(item => container.appendChild(item));
    sortProducts(container);
    container.dataset.loaded = "true";
  } catch (err) {
    container.innerHTML = "<p style='color:#999;'>⚠️ Không tải được sản phẩm mới. Vui lòng thử tải lại trang.</p>";
  }
}

async function loadAlphabetProducts() {
  const container = document.getElementById("alphabet");
  const select = document.getElementById("brandSelect");
  if (!container || alphabetLoaded) return;
  container.innerHTML = "<p style='color:#999;'>Đang tải danh sách mô hình... 🐰</p>";

  const results = await Promise.allSettled(PRODUCT_FILES.map(fetchProductItems));
  allAlphabetItems = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      allAlphabetItems.push(...result.value);
    } else {
      console.warn("Không tải được file sản phẩm:", PRODUCT_FILES[index], result.reason);
    }
  });

  container.innerHTML = "";
  const available = new Set();
  allAlphabetItems.forEach(item => {
    const name = getProductName(item);
    item.dataset.initial = getInitial(name);
    available.add(item.dataset.initial);
    container.appendChild(item);
  });
  sortProducts(container);

  // Chỉ hiện chữ cái có sản phẩm, theo thứ tự bảng chữ cái tiếng Việt.
  const letters = VIETNAMESE_ALPHABET.filter(letter => available.has(letter));
  // Tạo các nút ABC trực tiếp trên giao diện, chỉ với chữ có sản phẩm.
  const nav = document.getElementById("alphabetNav");
  if (nav) {
    nav.innerHTML = "";
    letters.forEach(letter => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "letter-btn";
      button.textContent = letter;
      button.setAttribute("aria-label", `Lọc mô hình bắt đầu bằng chữ ${letter}`);
      button.addEventListener("click", () => {
        activeLetter = letter;
        activeSearchQuery = "";
        const searchInput = document.getElementById("productSearch");
        if (searchInput) searchInput.value = "";
        document.getElementById("new")?.classList.remove("active");
        document.getElementById("alphabet")?.classList.add("active");
        document.getElementById("newCategory")?.classList.remove("active");
        document.getElementById("allCategory")?.classList.remove("active");
        nav.querySelectorAll(".letter-btn").forEach(btn => btn.classList.toggle("active", btn === button));
        applyProductFilters();
      });
      nav.appendChild(button);
    });
  }

  if (select) {
    select.innerHTML = '<option value="new">🔥 Mẫu mới</option><option value="all">📚 Tất cả sản phẩm</option>';
  }
  alphabetLoaded = true;
  container.dataset.loaded = "true";
  filterAlphabetProducts("all");
}

function normalizeSearchText(value) {
  return (value || "")
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function getProductSearchText(item) {
  const input = item.querySelector("input");
  const label = item.querySelector("label");
  // Tìm cả tên mô hình, tên hiển thị đầy đủ và tên hãng từ file nguồn.
  return [
    input?.dataset.name,
    label?.textContent,
    item.textContent,
    item.dataset.brand
  ].filter(Boolean).join(" ");
}

function applyProductFilters() {
  const container = document.getElementById("alphabet");
  const status = document.getElementById("searchStatus");
  if (!container) return;
  const query = normalizeSearchText(activeSearchQuery);
  const visibleItems = [];

  allAlphabetItems.forEach(item => {
    const searchText = getProductSearchText(item);
    const matchesLetter = !activeLetter || item.dataset.initial === activeLetter;
    const matchesQuery = !query || normalizeSearchText(searchText).includes(query);
    const visible = matchesLetter && matchesQuery;
    item.style.display = visible ? "" : "none";
    if (visible) visibleItems.push(item);
  });

  if (status) {
    if (activeSearchQuery) {
      status.textContent = visibleItems.length
        ? `🔎 Tìm thấy ${visibleItems.length} sản phẩm phù hợp.`
        : "Không tìm thấy mô hình phù hợp. Bạn thử từ khóa khác nhé!";
    } else if (activeLetter) {
      status.textContent = `Đang hiển thị ${visibleItems.length} mô hình bắt đầu bằng chữ ${activeLetter}.`;
    } else {
      status.textContent = "Nhập tên mô hình rồi nhấn Tìm kiếm. Có thể tìm không dấu.";
    }
  }
}

function filterAlphabetProducts(selection) {
  activeLetter = selection && selection.startsWith("letter-") ? selection.slice(7) : null;
  activeSearchQuery = "";
  const searchInput = document.getElementById("productSearch");
  if (searchInput) searchInput.value = "";
  applyProductFilters();
}

function searchProducts() {
  const input = document.getElementById("productSearch");
  activeSearchQuery = input?.value || "";
  activeLetter = null;
  const select = document.getElementById("brandSelect");
  if (select) select.value = "all";
  document.querySelectorAll(".products").forEach(div => div.classList.remove("active"));
  document.getElementById("alphabet")?.classList.add("active");
  loadAlphabetProducts().then(() => applyProductFilters());
}

function showBrand(selection) {
  const selected = selection || document.getElementById("brandSelect")?.value || "new";
  document.getElementById("newCategory")?.classList.toggle("active", selected === "new");
  document.getElementById("allCategory")?.classList.toggle("active", selected !== "new");
  document.querySelectorAll(".products").forEach(div => div.classList.remove("active"));
  document.getElementById("alphabetNav")?.querySelectorAll(".letter-btn").forEach(btn => btn.classList.remove("active"));

  if (selected === "new") {
    document.getElementById("new")?.classList.add("active");
    activeLetter = null;
    activeSearchQuery = "";
    const searchInput = document.getElementById("productSearch");
    if (searchInput) searchInput.value = "";
    loadNewProducts();
    applyProductFilters();
    return;
  }
  document.getElementById("alphabet")?.classList.add("active");
  loadAlphabetProducts().then(() => {
    activeLetter = null;
    activeSearchQuery = "";
    const searchInput = document.getElementById("productSearch");
    if (searchInput) searchInput.value = "";
    applyProductFilters();
  });
}

function updateTotal() {
  let total = 0;
  document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    total += Number(cb.dataset.price || 0);
  });
  const totalEl = document.getElementById("total");
  if (totalEl) totalEl.innerText = total.toLocaleString("vi-VN");
}

function beforeSend() {
  const checked = document.querySelectorAll('input[type="checkbox"]:checked');
  if (checked.length === 0) {
    alert("Bạn chưa chọn sản phẩm nào 💛");
    return false;
  }
  const list = [];
  let total = 0;
  checked.forEach(cb => {
    list.push(cb.dataset.name || cb.closest(".item")?.textContent.trim() || "Sản phẩm");
    total += Number(cb.dataset.price || 0);
  });
  const productsInput = document.getElementById("products");
  const totalInput = document.getElementById("totalInput");
  if (productsInput) productsInput.value = list.join("\n");
  if (totalInput) totalInput.value = total.toLocaleString("vi-VN") + "đ";
  return true;
}

document.addEventListener("change", event => {
  if (event.target.matches('input[type="checkbox"]')) updateTotal();
});

document.addEventListener("DOMContentLoaded", () => {
  loadNewProducts();
  // Nạp danh mục ABC ở nền để các chữ cái được tạo theo dữ liệu thực tế.
  loadAlphabetProducts().catch(err => console.error("Lỗi tải danh mục ABC:", err));
  document.getElementById("searchButton")?.addEventListener("click", searchProducts);
  document.getElementById("productSearch")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchProducts();
    }
  });
});
