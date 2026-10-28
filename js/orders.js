import { createCollectionStore, createId, escapeHTML, formatCOP } from "./shared.js";

export function createOrdersModule({ moduleView, getClients }) {
    const store = createCollectionStore(
        "juangel_regalos_pedidos",
        "No se pudieron cargar los pedidos:",
        "No se pudieron guardar los pedidos:",
        "No fue posible guardar los pedidos en este navegador."
    );
    let orders = store.load();
    let editingOrderId = null;
    const saveOrders = () => store.save(orders);

    const ORDER_STATUSES = [
        "Pendiente",
        "En preparación",
        "Listo",
        "Entregado",
        "Cancelado"
    ];


    function getOrderTotal(order) {
        return order.products.reduce(
            (sum, product) => sum + product.quantity * product.unitPrice,
            0
        );
    }

    function getOrderClientName(clientId) {
        const client = getClients().find((item) => item.id === clientId);
        return client ? client.name : "Cliente no disponible";
    }

    function orderProductRow(product = {}) {
        return `
            <div class="order-product-row">
                <div class="order-product-field">
                    <label>Producto o artículo *</label>
                    <input
                        type="text"
                        name="productName"
                        maxlength="120"
                        placeholder="Ej. Ancheta personalizada"
                        value="${escapeHTML(product.name || "")}"
                        required
                    >
                </div>

                <div class="order-product-field">
                    <label>Cantidad *</label>
                    <input
                        type="number"
                        name="productQuantity"
                        min="1"
                        max="9999"
                        step="1"
                        value="${product.quantity ?? 1}"
                        required
                    >
                </div>

                <div class="order-product-field">
                    <label>Precio unitario (COP) *</label>
                    <input
                        type="number"
                        name="productPrice"
                        min="0"
                        max="1000000000"
                        step="1"
                        value="${product.unitPrice ?? ""}"
                        placeholder="Ej. 45000"
                        required
                    >
                </div>

                <button
                    type="button"
                    class="order-remove-product"
                    aria-label="Eliminar producto de este pedido"
                    title="Eliminar producto"
                >×</button>
            </div>
        `;
    }

    function buildOrderRows(searchTerm = "", statusFilter = "Todos") {
        const term = searchTerm.trim().toLowerCase();

        const filteredOrders = orders.filter((order) => {
            const clientName = getOrderClientName(order.clientId);
            const searchable = [
                order.id,
                clientName,
                ...order.products.map((product) => product.name)
            ].join(" ").toLowerCase();

            const matchesSearch = searchable.includes(term);
            const matchesStatus =
                statusFilter === "Todos" || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return filteredOrders.length
            ? filteredOrders.map((order) => {
                const total = getOrderTotal(order);
                const balance = total - order.advance;

                const productSummary = order.products.map((product) =>
                    `${product.quantity} × ${escapeHTML(product.name)}`
                ).join("<br>");

                return `
                    <tr>
                        <td>
                            <strong>${escapeHTML(order.id.slice(-8))}</strong>
                            <small class="order-secondary">
                                Entrega: ${escapeHTML(order.deliveryDate || "Sin fecha")}
                            </small>
                        </td>
                        <td>
                            <strong>${escapeHTML(getOrderClientName(order.clientId))}</strong>
                            <small class="order-secondary">${productSummary}</small>
                        </td>
                        <td>
                            <strong>${formatCOP(total)}</strong>
                            <small class="order-secondary">
                                Saldo: ${formatCOP(balance)}
                            </small>
                        </td>
                        <td>
                            <select
                                class="order-status-select"
                                data-order-status="${escapeHTML(order.id)}"
                                aria-label="Estado del pedido"
                            >
                                ${ORDER_STATUSES.map((status) => `
                                    <option value="${status}"
                                        ${order.status === status ? "selected" : ""}>
                                        ${status}
                                    </option>
                                `).join("")}
                            </select>
                        </td>
                        <td>
                            <button
                                type="button"
                                class="order-action-btn"
                                data-order-edit="${escapeHTML(order.id)}"
                            >Editar</button>
                        </td>
                    </tr>
                `;
            }).join("")
            : `
                <tr>
                    <td colspan="5" class="order-no-results">
                        ${term || statusFilter !== "Todos"
                            ? "No hay pedidos que coincidan con los filtros."
                            : "Todavía no hay pedidos registrados."}
                    </td>
                </tr>
            `;
    }

    function renderOrders(searchTerm = "", statusFilter = "Todos") {
        const clients = getClients();
        const clientOptions = clients.map((client) => `
            <option value="${escapeHTML(client.id)}">
                ${escapeHTML(client.name)} — ${escapeHTML(client.phone)}
            </option>
        `).join("");

        const rows = buildOrderRows(searchTerm, statusFilter);

        moduleView.innerHTML = `
            <section class="orders-module">
                <div class="module-heading">
                    <div>
                        <p class="module-kicker">OPERACIÓN DEL NEGOCIO</p>
                        <h3>Gestión de pedidos</h3>
                        <p>Registra pedidos con varios productos y controla
                        su preparación, pago y entrega.</p>
                    </div>
                    <div class="orders-total">
                        <strong>${orders.length}</strong>
                        <span>Pedidos registrados</span>
                    </div>
                </div>

                ${clients.length === 0 ? `
                    <div class="orders-notice">
                        Todavía no hay clientes registrados. Registra primero
                        un cliente en el módulo Clientes para crear un pedido.
                    </div>
                ` : ""}

                <section class="order-form-panel">
                    <h4 id="order-form-title">Registrar pedido</h4>
                    <p class="order-help">
                        Los campos marcados con * son obligatorios.
                    </p>

                    <form id="order-form">
                        <div class="order-main-fields">
                            <div class="order-field">
                                <label for="order-client">Cliente *</label>
                                <select id="order-client" name="clientId" required>
                                    <option value="">Selecciona un cliente</option>
                                    ${clientOptions}
                                </select>
                            </div>

                            <div class="order-field">
                                <label for="order-date">Fecha de entrega *</label>
                                <input
                                    id="order-date"
                                    name="deliveryDate"
                                    type="date"
                                    required
                                >
                            </div>
                        </div>

                        <div class="order-products-heading">
                            <div>
                                <h4>Productos del pedido</h4>
                                <p>Añade una línea por cada producto o artículo.</p>
                            </div>
                            <button
                                type="button"
                                id="order-add-product"
                                class="order-secondary-btn"
                            >+ Añadir producto</button>
                        </div>

                        <div id="order-products-list">
                            ${orderProductRow()}
                        </div>

                        <div class="order-financial-fields">
                            <div class="order-field">
                                <label for="order-advance">Anticipo (COP)</label>
                                <input
                                    id="order-advance"
                                    name="advance"
                                    type="number"
                                    min="0"
                                    max="1000000000"
                                    step="1"
                                    value="0"
                                    required
                                >
                            </div>

                            <div class="order-field">
                                <label>Total del pedido</label>
                                <output id="order-total" class="order-money">
                                    $ 0
                                </output>
                            </div>

                            <div class="order-field">
                                <label>Saldo pendiente</label>
                                <output id="order-balance" class="order-money">
                                    $ 0
                                </output>
                            </div>
                        </div>

                        <div class="order-field">
                            <label for="order-notes">Observaciones</label>
                            <textarea
                                id="order-notes"
                                name="notes"
                                rows="3"
                                maxlength="1000"
                                placeholder="Detalles de personalización, mensaje, colores o contenido de la ancheta..."
                            ></textarea>
                        </div>

                        <div class="order-form-actions">
                            <button
                                type="submit"
                                class="order-primary-btn"
                                ${clients.length === 0 ? "disabled" : ""}
                            >Guardar pedido</button>

                            <button
                                type="button"
                                id="order-cancel-edit"
                                class="order-secondary-btn"
                                hidden
                            >Cancelar edición</button>
                        </div>

                        <p id="order-form-message"
                           class="order-message"
                           role="status"
                           aria-live="polite"></p>
                    </form>
                </section>

                <section class="orders-list-panel">
                    <div class="orders-list-heading">
                        <div>
                            <h4>Pedidos registrados</h4>
                            <p>Consulta los productos, importes y estados.</p>
                        </div>
                        <div class="orders-filters">
                            <input
                                id="order-search"
                                type="search"
                                placeholder="Buscar pedido o cliente..."
                                aria-label="Buscar pedidos"
                            >
                            <select id="order-status-filter"
                                    aria-label="Filtrar pedidos por estado">
                                <option value="Todos">Todos los estados</option>
                                ${ORDER_STATUSES.map((status) => `
                                    <option value="${status}">${status}</option>
                                `).join("")}
                            </select>
                        </div>
                    </div>

                    <div class="orders-table-wrapper">
                        <table class="orders-table">
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Cliente y productos</th>
                                    <th>Total y saldo</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="orders-table-body">${rows}</tbody>
                        </table>
                    </div>
                </section>
            </section>
        `;

        moduleView.querySelector("#order-search").value = searchTerm;
        moduleView.querySelector("#order-status-filter").value = statusFilter;

        updateOrderTotals();
    }

    function updateOrderTotals() {
        const form = moduleView.querySelector("#order-form");
        if (!form) return;

        const quantities = [...form.querySelectorAll('[name="productQuantity"]')];
        const prices = [...form.querySelectorAll('[name="productPrice"]')];

        let total = 0;

        quantities.forEach((input, index) => {
            const quantity = Number(input.value);
            const price = Number(prices[index]?.value);

            if (
                Number.isInteger(quantity) && quantity > 0 &&
                Number.isFinite(price) && price >= 0
            ) {
                total += quantity * price;
            }
        });

        const advanceInput = form.elements.advance;
        const advance = Number(advanceInput.value);
        const validAdvance = Number.isFinite(advance) && advance >= 0;

        moduleView.querySelector("#order-total").textContent = formatCOP(total);
        moduleView.querySelector("#order-balance").textContent =
            formatCOP(Math.max(0, total - (validAdvance ? advance : 0)));
    }

    function showOrderMessage(message) {
        const element = moduleView.querySelector("#order-form-message");
        if (element) element.textContent = message;
    }

    function resetOrderForm() {
        editingOrderId = null;
        renderOrders();

        const title = moduleView.querySelector("#order-form-title");
        const submit = moduleView.querySelector(
            '#order-form button[type="submit"]'
        );

        title.textContent = "Registrar pedido";
        submit.textContent = "Guardar pedido";
        moduleView.querySelector("#order-cancel-edit").hidden = true;
    }

    function editOrder(orderId) {
        const order = orders.find((item) => item.id === orderId);
        if (!order) return;

        if (!getClients().some((client) => client.id === order.clientId)) {
            alert(
                "El cliente asociado ya no está disponible. " +
                "No se puede editar el pedido hasta resolver esa relación."
            );
            return;
        }

        editingOrderId = order.id;
        renderOrders();

        const form = moduleView.querySelector("#order-form");
        form.elements.clientId.value = order.clientId;
        form.elements.deliveryDate.value = order.deliveryDate;
        form.elements.advance.value = order.advance;
        form.elements.notes.value = order.notes || "";

        const productsList = moduleView.querySelector("#order-products-list");
        productsList.innerHTML = order.products.map((product) =>
            orderProductRow(product)
        ).join("");

        moduleView.querySelector("#order-form-title").textContent =
            `Editar pedido ${order.id.slice(-8)}`;

        moduleView.querySelector(
            '#order-form button[type="submit"]'
        ).textContent = "Guardar cambios";

        moduleView.querySelector("#order-cancel-edit").hidden = false;

        updateOrderTotals();
        moduleView.querySelector("#order-client").focus();
    }

    moduleView.addEventListener("submit", (event) => {
        if (event.target.id !== "order-form") return;

        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const clientId = String(formData.get("clientId") || "");
        const deliveryDate = String(formData.get("deliveryDate") || "");
        const advance = Number(formData.get("advance"));
        const notes = String(formData.get("notes") || "").trim();

        if (!getClients().some((client) => client.id === clientId)) {
            showOrderMessage("Selecciona un cliente registrado.");
            return;
        }

        const productNames = formData.getAll("productName").map(
            (value) => String(value).trim()
        );
        const quantities = formData.getAll("productQuantity").map(Number);
        const prices = formData.getAll("productPrice").map(Number);

        if (
            productNames.length === 0 ||
            productNames.some((name) => !name)
        ) {
            showOrderMessage("Añade al menos un producto e indica su nombre.");
            return;
        }

        const products = productNames.map((name, index) => ({
            name,
            quantity: quantities[index],
            unitPrice: prices[index]
        }));

        const invalidProduct = products.some((product) =>
            !Number.isInteger(product.quantity) ||
            product.quantity < 1 ||
            product.quantity > 9999 ||
            !Number.isFinite(product.unitPrice) ||
            product.unitPrice < 0 ||
            product.unitPrice > 1000000000
        );

        if (invalidProduct) {
            showOrderMessage(
                "Revisa las cantidades y los precios de los productos."
            );
            return;
        }

        const total = products.reduce(
            (sum, product) => sum + product.quantity * product.unitPrice,
            0
        );

        if (!Number.isSafeInteger(total) || total > 1000000000) {
            showOrderMessage("El total del pedido supera el límite permitido.");
            return;
        }

        if (
            !Number.isFinite(advance) ||
            advance < 0 ||
            advance > total
        ) {
            showOrderMessage(
                "El anticipo debe ser igual o mayor que cero y no superar el total."
            );
            return;
        }

        if (!deliveryDate) {
            showOrderMessage("Indica la fecha prevista de entrega.");
            return;
        }

        const previousOrders = orders;

        if (editingOrderId) {
            orders = orders.map((order) =>
                order.id === editingOrderId
                    ? {
                        ...order,
                        clientId,
                        deliveryDate,
                        products,
                        advance,
                        notes,
                        updatedAt: new Date().toISOString()
                    }
                    : order
            );
        } else {
            orders = [...orders, {
                id: createId("order"),
                clientId,
                deliveryDate,
                products,
                advance,
                notes,
                status: "Pendiente",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }];
        }

        if (!saveOrders()) {
            orders = previousOrders;
            return;
        }

        editingOrderId = null;
        renderOrders();
    });

    moduleView.addEventListener("click", (event) => {
        if (event.target.closest("#order-add-product")) {
            moduleView.querySelector("#order-products-list").insertAdjacentHTML(
                "beforeend",
                orderProductRow()
            );
            updateOrderTotals();
            return;
        }

        const removeButton = event.target.closest(".order-remove-product");

        if (removeButton) {
            const productRows = moduleView.querySelectorAll(".order-product-row");

            if (productRows.length <= 1) {
                showOrderMessage("Cada pedido debe tener al menos un producto.");
                return;
            }

            removeButton.closest(".order-product-row").remove();
            updateOrderTotals();
            return;
        }

        const editButton = event.target.closest("[data-order-edit]");

        if (editButton) {
            editOrder(editButton.dataset.orderEdit);
            return;
        }

        if (event.target.closest("#order-cancel-edit")) {
            resetOrderForm();
        }
    });

    moduleView.addEventListener("change", (event) => {
        // El filtro por estado no tenía manejador propio
        if (event.target.id === "order-status-filter") {
            moduleView.querySelector("#orders-table-body").innerHTML =
                buildOrderRows(
                    moduleView.querySelector("#order-search").value,
                    event.target.value
                );
            return;
        }

        const statusSelect = event.target.closest("[data-order-status]");
        if (!statusSelect) return;

        const orderId = statusSelect.dataset.orderStatus;
        const newStatus = statusSelect.value;

        if (!ORDER_STATUSES.includes(newStatus)) return;

        const previousOrders = orders;

        orders = orders.map((order) =>
            order.id === orderId
                ? {
                    ...order,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                }
                : order
        );

        if (!saveOrders()) {
            orders = previousOrders;
        }

        moduleView.querySelector("#orders-table-body").innerHTML =
            buildOrderRows(
                moduleView.querySelector("#order-search")?.value || "",
                moduleView.querySelector("#order-status-filter")?.value || "Todos"
            );
    });

    moduleView.addEventListener("input", (event) => {
        if (event.target.id === "order-search") {
            moduleView.querySelector("#orders-table-body").innerHTML =
                buildOrderRows(
                    event.target.value,
                    moduleView.querySelector("#order-status-filter").value
                );
            return;
        }

        if (
            event.target.id === "order-advance" ||
            event.target.name === "productQuantity" ||
            event.target.name === "productPrice"
        ) {
            updateOrderTotals();
        }
    });




    return {
        render: renderOrders,
        getOrders: () => orders,
        clearEditing: () => { editingOrderId = null; }
    };
}