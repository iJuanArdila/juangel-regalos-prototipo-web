import {
    createCollectionStore,
    createId,
    escapeHTML,
    formatCOP
} from "./shared.js";

const PAYMENT_METHODS_KEY = "juangel_regalos_metodos_pago";
const PAYMENT_METHODS_DEFAULT = [
    "Efectivo",
    "Nequi",
    "Bancolombia",
    "Daviplata",
    "Transferencia",
    "Tarjeta"
];
const EXPENSE_CATEGORIES = [
    "Insumos",
    "Empaque",
    "Transporte",
    "Servicios",
    "Marketing",
    "Arriendo",
    "Otros"
];

export function createSalesModule({
    moduleView,
    getClients,
    getOrders,
    setOrderStatus,
    getInventory,
    adjustStock
}) {
    const salesStore = createCollectionStore(
        "juangel_regalos_ventas",
        "No se pudieron cargar las ventas:",
        "No se pudieron guardar las ventas:",
        "No fue posible guardar las ventas en este navegador."
    );
    const paymentsStore = createCollectionStore(
        "juangel_regalos_pagos",
        "No se pudieron cargar los pagos:",
        "No se pudieron guardar los pagos:",
        "No fue posible guardar los pagos en este navegador."
    );
    const expensesStore = createCollectionStore(
        "juangel_regalos_gastos",
        "No se pudieron cargar los gastos:",
        "No se pudieron guardar los gastos:",
        "No fue posible guardar los gastos en este navegador."
    );
    const methodsStore = createCollectionStore(
        PAYMENT_METHODS_KEY,
        "No se pudieron cargar los métodos de pago:",
        "No se pudieron guardar los métodos de pago:",
        "No fue posible guardar los métodos de pago en este navegador."
    );

    let sales = salesStore.load();
    let payments = paymentsStore.load();
    let expenses = expensesStore.load();
    let paymentMethods = methodsStore.load();
    if (!paymentMethods.length) paymentMethods = [...PAYMENT_METHODS_DEFAULT];

    const today = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    const activeSales = () => sales.filter((sale) => sale.status !== "Anulada");
    const orderCanBeSold = (order) =>
        ["Pendiente", "En preparación", "Listo"].includes(order.status);
    const totalForSale = (sale) =>
        sale.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const paymentsForSale = (saleId) => {
        const sale = sales.find((item) => item.id === saleId);
        return payments.filter((payment) =>
            payment.saleId === saleId ||
            (sale?.orderId && payment.orderId === sale.orderId)
        );
    };
    const paidForSale = (saleId) => {
        const sale = sales.find((item) => item.id === saleId);
        if (sale?.status === "Anulada") return 0;
        const order = sale?.orderId
            ? getOrders().find((item) => item.id === sale.orderId)
            : null;
        const advance = order?.advance || 0;
        return advance + paymentsForSale(saleId)
            .filter((payment) => !payment.orderAdvance)
            .reduce((sum, payment) => sum + payment.amount, 0);
    };
    const orderTotal = (order) =>
        order.products.reduce(
            (sum, product) => sum + product.quantity * product.unitPrice,
            0
        );
    const paidForOrder = (orderId) =>
        payments
            .filter((payment) => payment.orderId === orderId)
            .reduce((sum, payment) => sum + payment.amount, 0);
    const saleStatus = (sale) => {
        const balance = totalForSale(sale) - paidForSale(sale.id);
        return balance <= 0 ? "Pagada" : paidForSale(sale.id) > 0 ? "Abono" : "Pendiente";
    };
    const getClientName = (clientId) =>
        getClients().find((client) => client.id === clientId)?.name || "Venta local";

    function render() {
        const clients = getClients();
        const inventory = getInventory();
        const orders = getOrders();
        const availableOrders = orders.filter(
            (order) =>
                orderCanBeSold(order) &&
                !activeSales().some((sale) => sale.orderId === order.id)
        );

        moduleView.innerHTML = `
            <section class="sales-module">
                <div class="module-heading">
                    <div>
                        <p class="module-kicker">CONTROL FINANCIERO</p>
                        <h3>Ventas, pagos y gastos</h3>
                        <p>Registra operaciones, controla saldos y consulta los movimientos del negocio.</p>
                    </div>
                    <div class="sales-total">
                        <strong>${activeSales().length}</strong>
                        <span>Ventas activas</span>
                    </div>
                </div>

                <nav class="sales-section-nav" aria-label="Secciones financieras">
                    <a href="#sales-register">Registrar venta</a>
                    <a href="#sales-history">Ventas y saldos</a>
                    <a href="#payment-register">Registrar pago</a>
                    <a href="#expense-register">Gastos y compras</a>
                    <a href="#payment-methods">Métodos de pago</a>
                </nav>

                <section class="sales-form-panel" id="sales-register">
                    <h4>Registrar venta</h4>
                    <p class="sales-help">Asocia la venta a un pedido o registra una venta directa. El inventario se descuenta al guardar.</p>
                    <form id="sale-form">
                        <div class="sales-form-grid">
                            <div class="sales-field">
                                <label for="sale-order">Pedido asociado</label>
                                <select id="sale-order" name="orderId">
                                    <option value="">Venta directa (sin pedido)</option>
                                    ${availableOrders.map((order) => `
                                        <option value="${escapeHTML(order.id)}">
                                            ${escapeHTML(order.id.slice(-8))} · ${escapeHTML(getClientName(order.clientId))}
                                        </option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="sales-field">
                                <label for="sale-client">Cliente</label>
                                <select id="sale-client" name="clientId">
                                    <option value="">Venta local sin cliente</option>
                                    ${clients.map((client) => `
                                        <option value="${escapeHTML(client.id)}">${escapeHTML(client.name)}</option>
                                    `).join("")}
                                </select>
                            </div>
                            <div class="sales-field">
                                <label for="sale-date">Fecha de venta *</label>
                                <input id="sale-date" name="date" type="date" value="${today()}" required>
                            </div>
                        </div>
                        <div class="sales-products-heading">
                            <div>
                                <h5>Productos vendidos</h5>
                                <p>Selecciona artículos del inventario y define cantidades y precios.</p>
                            </div>
                            <div class="sales-form-actions">
                                <button type="button" class="sales-secondary-btn" id="sale-load-order" ${availableOrders.length ? "" : "disabled"}>Cargar productos del pedido</button>
                                <button type="button" class="sales-secondary-btn" id="sale-add-item">+ Agregar producto</button>
                            </div>
                        </div>
                        <div id="sale-items">${saleItemRow(inventory)}</div>
                        <div class="sales-form-actions">
                            <button type="submit" class="sales-primary-btn" ${inventory.length ? "" : "disabled"}>Registrar venta y descontar stock</button>
                        </div>
                        <p class="sales-message" id="sale-message" role="status" aria-live="polite"></p>
                    </form>
                </section>

                <section class="sales-list-panel" id="sales-history">
                    <div class="sales-list-heading">
                        <div>
                            <h4>Consulta de ventas y saldos</h4>
                            <p>Filtra por fecha, cliente o estado de pago.</p>
                        </div>
                        <div class="sales-filters">
                            <label>Desde <input id="sales-from" type="date" aria-label="Fecha inicial de ventas"></label>
                            <label>Hasta <input id="sales-to" type="date" aria-label="Fecha final de ventas"></label>
                            <select id="sales-client-filter" aria-label="Filtrar por cliente">
                                <option value="">Todos los clientes</option>
                                ${clients.map((client) => `<option value="${escapeHTML(client.id)}">${escapeHTML(client.name)}</option>`).join("")}
                            </select>
                            <select id="sales-status-filter" aria-label="Filtrar por estado de pago">
                                <option value="">Todos los pagos</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Abono">Con abono</option>
                                <option value="Pagada">Pagada</option>
                                <option value="Anulada">Anulada</option>
                            </select>
                        </div>
                    </div>
                    <div class="sales-table-wrapper">
                        <table class="sales-table">
                            <thead><tr><th>Venta</th><th>Cliente / pedido</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody id="sales-table-body">${saleRows()}</tbody>
                        </table>
                    </div>
                </section>

                <section class="sales-list-panel" id="payment-register">
                    <h4>Registrar pago</h4>
                    <p class="sales-help">Los pagos pueden asociarse a una venta o directamente a un pedido.</p>
                    <form id="payment-form">
                        <div class="sales-form-grid">
                            <div class="sales-field">
                                <label for="payment-target">Venta o pedido *</label>
                                <select id="payment-target" name="target" required>${paymentTargetOptions()}</select>
                            </div>
                            <div class="sales-field">
                                <label for="payment-amount">Valor recibido (COP) *</label>
                                <input id="payment-amount" name="amount" type="number" min="1" max="1000000000" step="1" required>
                            </div>
                            <div class="sales-field">
                                <label for="payment-method">Medio de pago *</label>
                                <select id="payment-method" name="method" required>${paymentMethodOptions()}</select>
                            </div>
                            <div class="sales-field">
                                <label for="payment-date">Fecha *</label>
                                <input id="payment-date" name="date" type="date" value="${today()}" required>
                            </div>
                            <div class="sales-field">
                                <label for="payment-reference">Referencia / comprobante</label>
                                <input id="payment-reference" name="reference" type="text" maxlength="100" placeholder="Referencia de Nequi, Daviplata, banco...">
                            </div>
                        </div>
                        <div class="sales-form-actions"><button type="submit" class="sales-primary-btn">Guardar pago</button></div>
                        <p class="sales-message" id="payment-message" role="status" aria-live="polite"></p>
                    </form>
                    <div class="sales-table-wrapper">
                        <table class="sales-table">
                            <thead><tr><th>Fecha</th><th>Venta / pedido</th><th>Medio</th><th>Referencia</th><th>Valor</th></tr></thead>
                            <tbody id="payments-table-body">${paymentRows()}</tbody>
                        </table>
                    </div>
                </section>

                <section class="sales-list-panel" id="expense-register">
                    <h4>Registrar gasto o compra de insumos</h4>
                    <p class="sales-help">Una compra asociada a un producto del inventario aumenta sus existencias; los demás movimientos se registran como gasto.</p>
                    <form id="expense-form">
                        <div class="sales-form-grid">
                            <div class="sales-field">
                                <label for="expense-type">Tipo de movimiento *</label>
                                <select id="expense-type" name="type">
                                    <option value="Gasto">Gasto del negocio</option>
                                    <option value="Compra">Compra de insumos</option>
                                </select>
                            </div>
                            <div class="sales-field">
                                <label for="expense-category">Categoría *</label>
                                <select id="expense-category" name="category" required>
                                    ${EXPENSE_CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("")}
                                </select>
                            </div>
                            <div class="sales-field">
                                <label for="expense-date">Fecha *</label>
                                <input id="expense-date" name="date" type="date" value="${today()}" required>
                            </div>
                            <div class="sales-field">
                                <label for="expense-amount">Valor (COP) *</label>
                                <input id="expense-amount" name="amount" type="number" min="1" max="1000000000" step="1" required>
                            </div>
                            <div class="sales-field">
                                <label for="expense-product">Producto de inventario (opcional)</label>
                                <select id="expense-product" name="productId">
                                    <option value="">No actualizar inventario</option>
                                    ${inventory.map((product) => `<option value="${escapeHTML(product.id)}">${escapeHTML(product.name)}</option>`).join("")}
                                </select>
                            </div>
                            <div class="sales-field">
                                <label for="expense-quantity">Unidades compradas</label>
                                <input id="expense-quantity" name="quantity" type="number" min="1" max="1000000" step="1" value="1">
                            </div>
                            <div class="sales-field sales-field-wide">
                                <label for="expense-description">Descripción *</label>
                                <input id="expense-description" name="description" type="text" maxlength="200" required placeholder="Detalle del gasto o insumo comprado">
                            </div>
                        </div>
                        <div class="sales-form-actions"><button type="submit" class="sales-primary-btn">Registrar movimiento</button></div>
                        <p class="sales-message" id="expense-message" role="status" aria-live="polite"></p>
                    </form>
                    <div class="sales-list-heading">
                        <div><h5>Consulta de gastos y compras</h5><p>Filtra por rango de fechas y categoría.</p></div>
                        <div class="sales-filters">
                            <label>Desde <input id="expenses-from" type="date"></label>
                            <label>Hasta <input id="expenses-to" type="date"></label>
                            <select id="expenses-category-filter" aria-label="Filtrar gastos por categoría">
                                <option value="">Todas las categorías</option>
                                ${EXPENSE_CATEGORIES.map((category) => `<option value="${category}">${category}</option>`).join("")}
                            </select>
                        </div>
                    </div>
                    <div class="sales-table-wrapper">
                        <table class="sales-table">
                            <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Valor</th></tr></thead>
                            <tbody id="expenses-table-body">${expenseRows()}</tbody>
                        </table>
                    </div>
                </section>

                <section class="sales-list-panel" id="payment-methods">
                    <h4>Métodos de pago</h4>
                    <p class="sales-help">Administra los medios disponibles para registrar pagos digitales y presenciales.</p>
                    <form id="payment-method-form" class="sales-inline-form">
                        <label for="payment-method-name">Nuevo método</label>
                        <input id="payment-method-name" name="name" type="text" maxlength="40" required placeholder="Ej. Llave Bre-B">
                        <button type="submit" class="sales-secondary-btn">Agregar método</button>
                    </form>
                    <ul class="payment-method-list" id="payment-method-list">${methodRows()}</ul>
                </section>
            </section>
        `;
        bindRenderedValues();
    }
    function saleItemRow(inventory, selectedId = "", quantity = 1, unitPrice = "") {
        return `
            <div class="sale-item-row">
                <label>Producto del inventario *
                    <select name="productId" required>
                        <option value="">Selecciona un producto</option>
                        ${inventory.map((product) => `
                            <option value="${escapeHTML(product.id)}" ${product.id === selectedId ? "selected" : ""}>${escapeHTML(product.name)} · ${product.stock} disponibles</option>
                        `).join("")}
                    </select>
                </label>
                <label>Cantidad *
                    <input name="quantity" type="number" min="1" max="1000000" step="1" value="${quantity}" required>
                </label>
                <label>Precio unitario (COP) *
                    <input name="unitPrice" type="number" min="0" max="1000000000" step="1" value="${unitPrice}" required>
                </label>
                <button type="button" class="sales-remove-item" aria-label="Quitar producto">×</button>
            </div>
        `;
    }

    function paymentMethodOptions() {
        return paymentMethods.map((method) =>
            `<option value="${escapeHTML(method)}">${escapeHTML(method)}</option>`
        ).join("");
    }

    function paymentTargetOptions() {
        const saleOptions = activeSales()
            .filter((sale) => totalForSale(sale) - paidForSale(sale.id) > 0)
            .map((sale) => `<option value="sale:${escapeHTML(sale.id)}">Venta ${escapeHTML(sale.id.slice(-8))} · saldo ${formatCOP(totalForSale(sale) - paidForSale(sale.id))}</option>`);
        const orderOptions = getOrders()
            .filter((order) =>
                order.status !== "Cancelado" &&
                !activeSales().some((sale) => sale.orderId === order.id)
            )
            .map((order) => {
                const balance = orderTotal(order) - order.advance - paidForOrder(order.id);
                return balance > 0
                    ? `<option value="order:${escapeHTML(order.id)}">Pedido ${escapeHTML(order.id.slice(-8))} · ${escapeHTML(getClientName(order.clientId))} · saldo ${formatCOP(balance)}</option>`
                    : "";
            });
        return `<option value="">Selecciona venta o pedido</option>${saleOptions.join("")}${orderOptions.join("")}`;
    }

    function saleRows() {
        const from = moduleView.querySelector("#sales-from")?.value || "";
        const to = moduleView.querySelector("#sales-to")?.value || "";
        const clientId = moduleView.querySelector("#sales-client-filter")?.value || "";
        const status = moduleView.querySelector("#sales-status-filter")?.value || "";
        const filtered = sales.filter((sale) =>
            (!from || sale.date >= from) &&
            (!to || sale.date <= to) &&
            (!clientId || sale.clientId === clientId) &&
            (!status || (status === "Anulada" ? sale.status === "Anulada" : sale.status !== "Anulada" && saleStatus(sale) === status))
        );

        if (!filtered.length) {
            return `<tr><td colspan="7" class="sales-empty">No hay ventas que coincidan con los filtros.</td></tr>`;
        }

        return filtered.map((sale) => {
            const total = totalForSale(sale);
            const paid = paidForSale(sale.id);
            const balance = sale.status === "Anulada" ? 0 : Math.max(0, total - paid);
            return `
                <tr>
                    <td><strong>${escapeHTML(sale.id.slice(-8))}</strong><small>${escapeHTML(sale.date)}</small></td>
                    <td>${escapeHTML(getClientName(sale.clientId))}<small>${sale.orderId ? `Pedido ${escapeHTML(sale.orderId.slice(-8))}` : "Venta directa"}</small></td>
                    <td>${formatCOP(total)}</td>
                    <td>${formatCOP(paid)}</td>
                    <td>${formatCOP(balance)}</td>
                    <td><span class="sales-status ${sale.status === "Anulada" ? "is-cancelled" : `is-${saleStatus(sale).toLowerCase()}`}">${sale.status === "Anulada" ? "Anulada" : saleStatus(sale)}</span></td>
                    <td class="sales-actions">
                        <button type="button" class="sales-secondary-btn" data-sale-receipt="${escapeHTML(sale.id)}">Comprobante</button>
                        ${sale.status !== "Anulada" ? `<button type="button" class="sales-danger-btn" data-sale-cancel="${escapeHTML(sale.id)}">Anular</button>` : ""}
                    </td>
                </tr>
            `;
        }).join("");
    }

    function paymentRows() {
        if (!payments.length) {
            return `<tr><td colspan="5" class="sales-empty">Todavía no hay pagos registrados.</td></tr>`;
        }
        return [...payments].reverse().map((payment) => {
            const sale = sales.find((item) => item.id === payment.saleId);
            const order = getOrders().find((item) => item.id === payment.orderId);
            const target = sale
                ? `Venta ${sale.id.slice(-8)}`
                : `Pedido ${payment.orderId?.slice(-8) || "no disponible"}`;
            return `
                <tr class="${payment.amount < 0 ? "is-refund" : ""}">
                    <td>${escapeHTML(payment.date)}</td>
                    <td>${escapeHTML(target)}${order ? `<small>${escapeHTML(getClientName(order.clientId))}</small>` : ""}</td>
                    <td>${escapeHTML(payment.method)}</td>
                    <td>${escapeHTML(payment.reference || (payment.amount < 0 ? "Devolución por anulación" : "—"))}</td>
                    <td>${formatCOP(payment.amount)}</td>
                </tr>
            `;
        }).join("");
    }

    function expenseRows() {
        const from = moduleView.querySelector("#expenses-from")?.value || "";
        const to = moduleView.querySelector("#expenses-to")?.value || "";
        const category = moduleView.querySelector("#expenses-category-filter")?.value || "";
        const filtered = expenses.filter((item) =>
            (!from || item.date >= from) &&
            (!to || item.date <= to) &&
            (!category || item.category === category)
        );
        if (!filtered.length) {
            return `<tr><td colspan="5" class="sales-empty">No hay movimientos que coincidan con los filtros.</td></tr>`;
        }
        return [...filtered].reverse().map((item) => `
            <tr>
                <td>${escapeHTML(item.date)}</td>
                <td>${escapeHTML(item.type)}</td>
                <td>${escapeHTML(item.category)}</td>
                <td>${escapeHTML(item.description)}${item.productName ? `<small>Inventario: ${escapeHTML(item.productName)} × ${item.quantity}</small>` : ""}</td>
                <td>${formatCOP(item.amount)}</td>
            </tr>
        `).join("");
    }

    function methodRows() {
        return paymentMethods.map((method) => {
            const inUse = payments.some((payment) => payment.method === method);
            return `
                <li>
                    <span>${escapeHTML(method)}</span>
                    <button type="button" class="sales-danger-btn" data-method-delete="${escapeHTML(method)}" ${inUse ? "disabled title=\"No se puede quitar: tiene pagos asociados\"" : ""}>Quitar</button>
                </li>
            `;
        }).join("");
    }

    function bindRenderedValues() {
        moduleView.querySelector("#sale-date").value = today();
        moduleView.querySelector("#payment-date").value = today();
        moduleView.querySelector("#expense-date").value = today();
    }

    function showMessage(id, message) {
        const element = moduleView.querySelector(`#${id}`);
        if (element) element.textContent = message;
    }

    function loadOrderProducts() {
        const orderId = moduleView.querySelector("#sale-order").value;
        const order = getOrders().find((item) => item.id === orderId);
        if (!order) {
            showMessage("sale-message", "Selecciona un pedido antes de cargar sus productos.");
            return;
        }

        const inventory = getInventory();
        const matched = order.products.map((item) => {
            const product = inventory.find(
                (candidate) =>
                    candidate.name.trim().toLowerCase() === item.name.trim().toLowerCase()
            );
            return product ? { product, item } : null;
        });
        const missing = matched
            .map((item, index) => item ? null : order.products[index].name)
            .filter(Boolean);
        if (missing.length) {
            showMessage(
                "sale-message",
                `No hay coincidencia de inventario para: ${missing.join(", ")}.`
            );
            return;
        }

        moduleView.querySelector("#sale-client").value = order.clientId;
        moduleView.querySelector("#sale-items").innerHTML = matched.map(
            ({ product, item }) =>
                saleItemRow(inventory, product.id, item.quantity, item.unitPrice)
        ).join("");
        showMessage("sale-message", "Productos del pedido cargados. Confirma existencias antes de registrar.");
    }

    function registerSale(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const orderId = String(formData.get("orderId") || "");
        const clientId = String(formData.get("clientId") || "");
        const date = String(formData.get("date") || "");
        const productIds = formData.getAll("productId").map(String);
        const quantities = formData.getAll("quantity").map(Number);
        const prices = formData.getAll("unitPrice").map(Number);
        const items = productIds.map((productId, index) => ({
            productId,
            quantity: quantities[index],
            unitPrice: prices[index]
        }));

        if (!date || !items.length || items.some((item) =>
            !item.productId ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            !Number.isSafeInteger(item.unitPrice) ||
            item.unitPrice < 0
        )) {
            showMessage("sale-message", "Completa fecha, producto, cantidades y precios válidos.");
            return;
        }
        const order = orderId
            ? getOrders().find((item) => item.id === orderId && orderCanBeSold(item))
            : null;
        if (orderId && !order) {
            showMessage("sale-message", "El pedido no está disponible para registrar la venta.");
            return;
        }
        if (orderId && activeSales().some((sale) => sale.orderId === orderId)) {
            showMessage("sale-message", "Este pedido ya tiene una venta activa.");
            return;
        }
        if (items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) > 1000000000) {
            showMessage("sale-message", "El total de la venta supera el límite permitido.");
            return;
        }

        const inventory = getInventory();
        const saleItems = items.map((item) => {
            const product = inventory.find((entry) => entry.id === item.productId);
            return product ? { ...item, name: product.name } : null;
        });
        if (saleItems.some((item) => !item)) {
            showMessage("sale-message", "Uno de los productos ya no está en el inventario.");
            return;
        }
        if (order) {
            const signature = (item) =>
                `${item.productId}|${item.quantity}|${item.unitPrice}`;
            const saleLines = new Map();
            saleItems.forEach((item) => {
                const key = signature(item);
                saleLines.set(key, (saleLines.get(key) || 0) + 1);
            });
            const orderLines = new Map();
            const orderMatchesInventory = order.products.every((item) => {
                const product = inventory.find(
                    (entry) => entry.name.trim().toLowerCase() === item.name.trim().toLowerCase()
                );
                if (!product) return false;
                const key = signature({
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                });
                orderLines.set(key, (orderLines.get(key) || 0) + 1);
                return true;
            });
            const matchesOrder = orderMatchesInventory &&
                saleLines.size === orderLines.size &&
                [...orderLines].every(([key, count]) => saleLines.get(key) === count);
            if (!matchesOrder) {
                showMessage("sale-message", "Los productos, cantidades y precios deben coincidir con el pedido asociado.");
                return;
            }
        }

        const sale = {
            id: createId("sale"),
            orderId: orderId || null,
            clientId: order?.clientId || clientId || null,
            date,
            items: saleItems,
            status: "Activa",
            createdAt: new Date().toISOString()
        };
        if (!adjustStock(items, -1)) {
            showMessage("sale-message", "No hay existencias suficientes o no se pudo actualizar el inventario.");
            return;
        }
        const previousSales = sales;
        const previousPayments = payments;
        sales = [...sales, sale];
        const orderAdvancePayment = order?.advance > 0
            ? {
                id: createId("payment"),
                saleId: sale.id,
                orderId: order.id,
                orderAdvance: true,
                amount: order.advance,
                method: "Anticipo del pedido",
                date,
                reference: "Anticipo registrado en el pedido",
                createdAt: new Date().toISOString()
            }
            : null;
        if (orderAdvancePayment) payments = [...payments, orderAdvancePayment];
        if (!salesStore.save(sales) || (orderAdvancePayment && !paymentsStore.save(payments))) {
            sales = previousSales;
            payments = previousPayments;
            salesStore.save(sales);
            if (orderAdvancePayment) paymentsStore.save(payments);
            adjustStock(items, 1);
            return;
        }
        if (order?.status === "Pendiente" &&
            !setOrderStatus(orderId, "En preparación")
        ) {
            sales = previousSales;
            payments = previousPayments;
            salesStore.save(sales);
            if (orderAdvancePayment) paymentsStore.save(payments);
            adjustStock(items, 1);
            showMessage("sale-message", "No se pudo actualizar el estado del pedido; se revirtió la venta.");
            return;
        }

        render();
        showMessage("sale-message", "Venta registrada y stock actualizado.");
    }

    function registerPayment(event) {
        event.preventDefault();
        const data = new FormData(event.target);
        const target = String(data.get("target") || "");
        const amount = Number(data.get("amount"));
        const method = String(data.get("method") || "");
        const date = String(data.get("date") || "");
        const reference = String(data.get("reference") || "").trim();

        if (!target || !Number.isSafeInteger(amount) || amount <= 0 || !date || !paymentMethods.includes(method)) {
            showMessage("payment-message", "Completa los datos del pago con valores válidos.");
            return;
        }
        if (method !== "Efectivo" && !reference) {
            showMessage("payment-message", "Ingresa la referencia del pago digital o transferencia.");
            return;
        }
        const [type, id] = target.split(":");
        if (!id || !["sale", "order"].includes(type)) {
            showMessage("payment-message", "Selecciona una venta o pedido válido.");
            return;
        }
        let balance;
        if (type === "sale") {
            const sale = activeSales().find((item) => item.id === id);
            if (!sale) {
                showMessage("payment-message", "La venta seleccionada no está disponible.");
                return;
            }
            balance = totalForSale(sale) - paidForSale(id);
        } else {
            const order = getOrders().find((item) => item.id === id && item.status !== "Cancelado");
            if (!order) {
                showMessage("payment-message", "El pedido seleccionado no está disponible.");
                return;
            }
            balance = orderTotal(order) - order.advance - paidForOrder(id);
        }
        if (amount > balance) {
            showMessage("payment-message", `El pago supera el saldo pendiente de ${formatCOP(balance)}.`);
            return;
        }

        const previousPayments = payments;
        payments = [...payments, {
            id: createId("payment"),
            saleId: type === "sale" ? id : null,
            orderId: type === "order" ? id : null,
            amount,
            method,
            date,
            reference,
            createdAt: new Date().toISOString()
        }];
        if (!paymentsStore.save(payments)) {
            payments = previousPayments;
            return;
        }
        render();
        showMessage("payment-message", "Pago registrado correctamente.");
    }

    function registerExpense(event) {
        event.preventDefault();
        const data = new FormData(event.target);
        const type = String(data.get("type"));
        const category = String(data.get("category") || "");
        const date = String(data.get("date") || "");
        const amount = Number(data.get("amount"));
        const description = String(data.get("description") || "").trim();
        const productId = String(data.get("productId") || "");
        const quantity = Number(data.get("quantity"));

        if (!["Gasto", "Compra"].includes(type) ||
            !EXPENSE_CATEGORIES.includes(category) ||
            !date ||
            !category ||
            !description ||
            !Number.isSafeInteger(amount) ||
            amount <= 0 ||
            amount > 1000000000
        ) {
            showMessage("expense-message", "Completa fecha, categoría, descripción y un valor válido.");
            return;
        }
        const product = productId
            ? getInventory().find((item) => item.id === productId)
            : null;
        if (type === "Compra" && productId && (!product || !Number.isInteger(quantity) || quantity < 1)) {
            showMessage("expense-message", "Selecciona un producto válido y una cantidad entera mayor que cero.");
            return;
        }

        const expense = {
            id: createId("expense"),
            type,
            category,
            date,
            amount,
            description,
            productId: type === "Compra" && product ? product.id : null,
            productName: type === "Compra" && product ? product.name : "",
            quantity: type === "Compra" && product ? quantity : 0,
            createdAt: new Date().toISOString()
        };
        if (expense.productId && !adjustStock([{ productId, quantity }], 1)) {
            showMessage("expense-message", "No se pudo actualizar el stock del producto comprado.");
            return;
        }

        const previousExpenses = expenses;
        expenses = [...expenses, expense];
        if (!expensesStore.save(expenses)) {
            expenses = previousExpenses;
            if (expense.productId) adjustStock([{ productId, quantity }], -1);
            return;
        }
        render();
        showMessage("expense-message", "Movimiento registrado correctamente.");
    }

    function cancelSale(saleId) {
        const sale = sales.find((item) => item.id === saleId && item.status !== "Anulada");
        if (!sale) return;
        if (!confirm("¿Anular esta venta? Se devolverán los productos al inventario y se registrará la devolución de los pagos.")) return;

        const salePayments = paymentsForSale(sale.id).filter((payment) => payment.amount > 0);
        const refunds = salePayments.map((payment) => ({
            ...payment,
            id: createId("refund"),
            amount: -payment.amount,
            reference: "Devolución por anulación",
            date: today(),
            createdAt: new Date().toISOString()
        }));
        const order = sale.orderId
            ? getOrders().find((item) => item.id === sale.orderId)
            : null;
        if (order?.advance > 0 && !salePayments.some((payment) => payment.orderAdvance)) {
            refunds.push({
                id: createId("refund"),
                saleId: sale.id,
                orderId: sale.orderId,
                amount: -order.advance,
                method: "Devolución de anticipo",
                reference: "Devolución por anulación",
                date: today(),
                createdAt: new Date().toISOString()
            });
        }

        if (!adjustStock(sale.items, 1)) {
            alert("No se pudo devolver el inventario. La venta no fue anulada.");
            return;
        }
        const previousSales = sales;
        const previousPayments = payments;
        sales = sales.map((item) =>
            item.id === sale.id ? { ...item, status: "Anulada", cancelledAt: new Date().toISOString() } : item
        );
        payments = [...payments, ...refunds];
        if (!salesStore.save(sales) || !paymentsStore.save(payments)) {
            sales = previousSales;
            payments = previousPayments;
            salesStore.save(sales);
            paymentsStore.save(payments);
            adjustStock(sale.items, -1);
            alert("No se pudieron guardar todos los cambios. Se intentó revertir la operación.");
            return;
        }
        if (sale.orderId && !setOrderStatus(sale.orderId, "Cancelado")) {
            sales = previousSales;
            payments = previousPayments;
            salesStore.save(sales);
            paymentsStore.save(payments);
            adjustStock(sale.items, -1);
            alert("No se pudo cancelar el pedido asociado. Se intentó revertir la anulación.");
            return;
        }
        render();
    }

    function printReceipt(saleId) {
        const sale = sales.find((item) => item.id === saleId);
        if (!sale) return;
        const receiptWindow = window.open("", "_blank", "width=720,height=800");
        if (!receiptWindow) {
            alert("Permite las ventanas emergentes para generar el comprobante.");
            return;
        }

        const items = sale.items.map((item) => `
            <tr><td>${escapeHTML(item.name)}</td><td>${item.quantity}</td><td>${formatCOP(item.unitPrice)}</td><td>${formatCOP(item.quantity * item.unitPrice)}</td></tr>
        `).join("");
        const salePayments = paymentsForSale(sale.id);
        const receiptEntries = salePayments.map((payment) => `
            <li>${escapeHTML(payment.date)} · ${escapeHTML(payment.method)} · ${formatCOP(payment.amount)}</li>
        `);
        const associatedOrder = sale.orderId
            ? getOrders().find((item) => item.id === sale.orderId)
            : null;
        if (sale.status !== "Anulada" &&
            associatedOrder?.advance > 0 &&
            !salePayments.some((payment) => payment.orderAdvance)
        ) {
            receiptEntries.unshift(`
                <li>${escapeHTML(associatedOrder.date || sale.date)} · Anticipo del pedido · ${formatCOP(associatedOrder.advance)}</li>
            `);
        }
        const receiptPayments = receiptEntries.join("");
        receiptWindow.document.write(`<!doctype html>
            <html lang="es"><head><meta charset="utf-8"><title>Comprobante ${escapeHTML(sale.id.slice(-8))}</title>
            <style>body{font:14px Arial,sans-serif;max-width:760px;margin:32px auto;color:#402919}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;padding:9px;border-bottom:1px solid #ddd}footer{margin-top:32px;color:#666}@media print{button{display:none}}</style>
            </head><body><h1>Juangel Regalos · Comprobante de venta</h1>
            <p>Venta: ${escapeHTML(sale.id)} · Fecha: ${escapeHTML(sale.date)}</p>
            <p>Cliente: ${escapeHTML(getClientName(sale.clientId))}</p>
            ${sale.orderId ? `<p>Pedido asociado: ${escapeHTML(sale.orderId)}</p>` : ""}
            <table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${items}</tbody></table>
            <h2>Total: ${formatCOP(totalForSale(sale))}</h2><p>Pagado: ${formatCOP(paidForSale(sale.id))} · Saldo: ${formatCOP(Math.max(0, totalForSale(sale) - paidForSale(sale.id)))}</p>
            <h3>Pagos</h3><ul>${receiptPayments || "<li>Sin pagos registrados</li>"}</ul>
            <footer>Comprobante generado desde el sistema administrativo. No reemplaza una factura electrónica.</footer>
            <script>window.onload=()=>window.print();</script></body></html>`);
        receiptWindow.document.close();
    }

    moduleView.addEventListener("submit", (event) => {
        if (event.target.id === "sale-form") registerSale(event);
        if (event.target.id === "payment-form") registerPayment(event);
        if (event.target.id === "expense-form") registerExpense(event);
        if (event.target.id === "payment-method-form") {
            event.preventDefault();
            const name = String(new FormData(event.target).get("name") || "").trim();
            if (!name || paymentMethods.some((method) => method.toLowerCase() === name.toLowerCase())) {
                showMessage("payment-message", "El método ya existe o el nombre está vacío.");
                return;
            }
            const previousMethods = paymentMethods;
            paymentMethods = [...paymentMethods, name];
            if (!methodsStore.save(paymentMethods)) {
                paymentMethods = previousMethods;
                return;
            }
            render();
            moduleView.querySelector("#payment-method-name").focus();
        }
    });

    moduleView.addEventListener("click", (event) => {
        if (event.target.closest("#sale-add-item")) {
            moduleView.querySelector("#sale-items").insertAdjacentHTML(
                "beforeend",
                saleItemRow(getInventory())
            );
            return;
        }
        if (event.target.closest("#sale-load-order")) {
            loadOrderProducts();
            return;
        }
        const removeItem = event.target.closest(".sales-remove-item");
        if (removeItem) {
            const rows = moduleView.querySelectorAll(".sale-item-row");
            if (rows.length === 1) {
                showMessage("sale-message", "La venta debe incluir al menos un producto.");
                return;
            }
            removeItem.closest(".sale-item-row").remove();
            return;
        }
        const receiptButton = event.target.closest("[data-sale-receipt]");
        if (receiptButton) {
            printReceipt(receiptButton.dataset.saleReceipt);
            return;
        }
        const cancelButton = event.target.closest("[data-sale-cancel]");
        if (cancelButton) {
            cancelSale(cancelButton.dataset.saleCancel);
            return;
        }
        const deleteMethod = event.target.closest("[data-method-delete]");
        if (deleteMethod && !deleteMethod.disabled) {
            const previousMethods = paymentMethods;
            paymentMethods = paymentMethods.filter(
                (method) => method !== deleteMethod.dataset.methodDelete
            );
            if (methodsStore.save(paymentMethods)) render();
            else paymentMethods = previousMethods;
        }
    });

    moduleView.addEventListener("change", (event) => {
        if (event.target.id === "sale-order") {
            const order = getOrders().find((item) => item.id === event.target.value);
            if (order) moduleView.querySelector("#sale-client").value = order.clientId;
        }
        if (event.target.matches('#sale-items select[name="productId"]')) {
            const product = getInventory().find((item) => item.id === event.target.value);
            const row = event.target.closest(".sale-item-row");
            if (product && row) row.querySelector('[name="unitPrice"]').value = product.price;
        }
        if (event.target.id === "expense-type") {
            const productField = moduleView.querySelector("#expense-product");
            productField.disabled = event.target.value !== "Compra";
        }
        if (event.target.matches("#sales-from, #sales-to, #sales-client-filter, #sales-status-filter")) {
            const body = moduleView.querySelector("#sales-table-body");
            if (body) body.innerHTML = saleRows();
        }
        if (event.target.matches("#expenses-from, #expenses-to, #expenses-category-filter")) {
            const body = moduleView.querySelector("#expenses-table-body");
            if (body) body.innerHTML = expenseRows();
        }
    });

    return {
        render,
        getOrderPaymentTotal: (orderId) =>
            payments
                .filter((payment) => payment.orderId === orderId)
                .reduce((sum, payment) => sum + payment.amount, 0),
        hasActiveSaleForProduct: (productId) =>
            activeSales().some((sale) =>
                sale.items.some((item) => item.productId === productId)
            )
    };
}
