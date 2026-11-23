const invoiceRows = document.querySelector("#invoice-rows");
const searchInput = document.querySelector("#invoice-search");
const filterButtons = [...document.querySelectorAll(".filter-tab")];
const emptyState = document.querySelector("#empty-state");
const resultsCount = document.querySelector("#results-count");
const dialog = document.querySelector("#invoice-dialog");
const invoiceForm = document.querySelector("#invoice-form");
const toast = document.querySelector("#toast");
const sidebar = document.querySelector("#sidebar");
let activeStatus = "all";
let invoiceNumber = 1088;
let toastTimeout;

function filterInvoices() {
  const query = searchInput.value.trim().toLowerCase();
  const rows = [...invoiceRows.querySelectorAll("tr")];
  let visibleCount = 0;

  rows.forEach((row) => {
    const matchesStatus = activeStatus === "all" || row.dataset.status === activeStatus;
    const matchesSearch = row.dataset.search.toLowerCase().includes(query);
    row.hidden = !(matchesStatus && matchesSearch);
    if (!row.hidden) visibleCount += 1;
  });

  emptyState.hidden = visibleCount > 0;
  resultsCount.innerHTML = `Showing <strong>${visibleCount}</strong> of 48 invoices`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.status;
    filterButtons.forEach((tab) => tab.classList.toggle("active", tab === button));
    filterInvoices();
  });
});

searchInput.addEventListener("input", filterInvoices);

document.querySelector("#new-invoice-button").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());

invoiceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!invoiceForm.reportValidity()) return;

  const formData = new FormData(invoiceForm);
  const customer = formData.get("customer").trim();
  const amount = Number(formData.get("amount"));
  const dueDate = new Date(`${formData.get("dueDate")}T00:00:00`);
  const id = `INV-${new Date().getFullYear()}-${invoiceNumber++}`;
  const initials = customer.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const displayDate = dueDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const row = document.createElement("tr");
  row.dataset.status = "Pending";
  row.dataset.search = `${id} ${customer}`;
  row.innerHTML = `
    <td><input type="checkbox" aria-label="Select invoice ${id}"></td>
    <td><span class="invoice-id"></span></td>
    <td><span class="customer-cell"><span class="customer-avatar lavender"></span></span></td>
    <td>${new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</td>
    <td></td>
    <td class="amount"></td>
    <td><span class="status-badge pending-badge"><i></i>Pending</span></td>
    <td><button class="row-menu" aria-label="Options for invoice ${id}">···</button></td>`;
  row.querySelector(".invoice-id").textContent = id;
  row.querySelector(".customer-avatar").textContent = initials;
  row.querySelector(".customer-cell").append(document.createTextNode(customer));
  row.children[4].textContent = displayDate;
  row.querySelector(".amount").textContent = `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  invoiceRows.prepend(row);
  invoiceForm.reset();
  dialog.close();
  activeStatus = "all";
  filterButtons.forEach((tab) => tab.classList.toggle("active", tab.dataset.status === "all"));
  searchInput.value = "";
  filterInvoices();
  showToast(`${id} created successfully`);
});

document.querySelector("#report-button").addEventListener("click", () => {
  const visibleRows = [...invoiceRows.querySelectorAll("tr")].filter((row) => !row.hidden);
  const headers = ["Invoice", "Customer", "Issue date", "Due date", "Amount", "Status"];
  const records = visibleRows.map((row) => [
    row.querySelector(".invoice-id").textContent,
    row.querySelector(".customer-cell").textContent.trim(),
    row.children[3].textContent,
    row.children[4].textContent,
    row.querySelector(".amount").textContent,
    row.dataset.status,
  ]);
  const csv = [headers, ...records].map((record) => record.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const downloadUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "invoice-report.csv";
  link.click();
  URL.revokeObjectURL(downloadUrl);
  showToast("Invoice report exported");
});

document.querySelector("#menu-button").addEventListener("click", (event) => {
  const isOpen = sidebar.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
  document.querySelector("#overlay").hidden = !isOpen;
});

document.querySelector("#overlay").addEventListener("click", () => {
  sidebar.classList.remove("open");
  document.querySelector("#menu-button").setAttribute("aria-expanded", "false");
  document.querySelector("#overlay").hidden = true;
});

document.querySelector("#period-button").addEventListener("click", () => showToast("Showing payment activity for the last 7 days"));

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    sidebar.classList.remove("open");
    document.querySelector("#menu-button").setAttribute("aria-expanded", "false");
    document.querySelector("#overlay").hidden = true;
  });
});
