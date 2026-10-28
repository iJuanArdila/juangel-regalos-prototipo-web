document.addEventListener("DOMContentLoaded", () => {
    console.log("Juangel Regalos iniciado correctamente.");

    // Elementos principales
    const appContainer = document.querySelector(".app-container");
    const mainContent = document.querySelector(".main-content");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const moduleView = document.getElementById("module-view");
    const navigationLinks = document.querySelectorAll(
        ".nav-link[data-page]"
    );

    if (!mainContent || !moduleView) {
        console.error("No se encontró el contenedor principal del sistema.");
        return;
    }

    // Identificar el encabezado y las secciones del dashboard
    const topbar = mainContent.querySelector(".topbar");

    const dashboardElements = Array.from(mainContent.children).filter(
        (element) =>
            element !== topbar &&
            element !== moduleView
    );

    const breadcrumb = topbar?.querySelector(".breadcrumb");
    const pageTitle = topbar?.querySelector("h2");
    const pageDescription = topbar?.querySelector(".page-description");

    // Guardar los textos originales del dashboard
    const dashboardHeader = {
        breadcrumb: breadcrumb?.textContent ?? "Menú principal / Dashboard",
        title: pageTitle?.textContent ?? "Panel de control",
        description:
            pageDescription?.textContent ??
            "Resumen general de tu negocio."
    };

    // Vistas provisionales de los módulos
    const pages = {
        dashboard: {
            title: dashboardHeader.title,
            description: dashboardHeader.description,
            breadcrumb: dashboardHeader.breadcrumb
        },

   
    pedidos: {
        title: "Gestión de pedidos",
        description: "Registra pedidos y controla su preparación y entrega.",
        breadcrumb: "Menú principal / Pedidos",
        content: ""
    },


        clientes: {
            title: "Gestión de clientes",
            description: "Organiza la información de tus clientes.",
            breadcrumb: "Menú principal / Clientes",
            content: ""
        },

        
    inventario: {
        title: "Gestión de inventario",
        description: "Controla productos, precios y existencias.",
        breadcrumb: "Menú principal / Inventario",
        content: ""
    },


        ventas: {
            title: "Gestión de ventas",
            description: "Consulta y organiza las ventas registradas.",
            breadcrumb: "Menú principal / Ventas",
            content: `
                <div class="module-heading">
                    <div>
                        <p class="module-kicker">MOVIMIENTOS COMERCIALES</p>
                        <h3>Ventas</h3>
                        <p>Consulta las ventas y su relación con los pedidos.</p>
                    </div>
                </div>

                <div class="module-empty">
                    <span class="module-symbol" aria-hidden="true">$</span>
                    <h4>Registro de ventas</h4>
                    <p>La consulta de ventas y el registro de pagos
                    se desarrollarán en una etapa posterior.</p>
                </div>
            `
        },

        gastos: {
            title: "Gestión de gastos",
            description: "Organiza los gastos del negocio.",
            breadcrumb: "Menú principal / Gastos",
            content: `
                <div class="module-heading">
                    <div>
                        <p class="module-kicker">CONTROL FINANCIERO</p>
                        <h3>Gastos</h3>
                        <p>Centraliza los gastos para facilitar el seguimiento
                        financiero del emprendimiento.</p>
                    </div>
                </div>

                <div class="module-empty">
                    <span class="module-symbol" aria-hidden="true">$</span>
                    <h4>Registro de gastos</h4>
                    <p>Más adelante añadiremos el formulario, las categorías
                    y la consulta de gastos registrados.</p>
                </div>
            `
        },

        reportes: {
            title: "Reportes e indicadores",
            description: "Consulta resúmenes de la actividad comercial.",
            breadcrumb: "Menú principal / Reportes",
            content: `
                <div class="module-heading">
                    <div>
                        <p class="module-kicker">ANÁLISIS DEL NEGOCIO</p>
                        <h3>Reportes e indicadores</h3>
                        <p>Revisa información consolidada de pedidos,
                        ventas, gastos e inventario.</p>
                    </div>
                </div>

                <div class="module-empty">
                    <span class="module-symbol" aria-hidden="true">↗</span>
                    <h4>Información para tomar decisiones</h4>
                    <p>Los indicadores y reportes se construirán cuando
                    tengamos datos disponibles.</p>
                </div>
            `
        },

        usuarios: {
            title: "Gestión de usuarios",
            description: "Administra las cuentas autorizadas del sistema.",
            breadcrumb: "Configuración / Usuarios",
            content: `
                <div class="module-heading">
                    <div>
                        <p class="module-kicker">ACCESO AL SISTEMA</p>
                        <h3>Usuarios</h3>
                        <p>Esta sección permitirá administrar las cuentas
                        autorizadas y sus permisos.</p>
                    </div>
                </div>

                <div class="module-empty">
                    <span class="module-symbol" aria-hidden="true">♙</span>
                    <h4>Usuarios y permisos</h4>
                    <p>El registro de usuarios, la autenticación y los roles
                    requieren una implementación posterior.</p>
                </div>
            `
        }
    };
    
const CLIENTS_STORAGE_KEY = "juangel_regalos_clientes";

function loadClients() {
    try {
        const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
        const clients = saved ? JSON.parse(saved) : [];

        return Array.isArray(clients) ? clients : [];
    } catch (error) {
        console.error("No se pudieron cargar los clientes:", error);
        return [];
    }
}

let clients = loadClients();
let editingClientId = null;

function saveClients() {
    try {
        localStorage.setItem(
            CLIENTS_STORAGE_KEY,
            JSON.stringify(clients)
        );
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los clientes:", error);
        alert("No fue posible guardar los datos en este navegador.");
        return false;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function buildClientRows(searchTerm = "") {
    const term = searchTerm.trim().toLowerCase();

    const filteredClients = clients.filter((client) => {
        const searchableText = [
            client.name,
            client.document,
            client.phone,
            client.email
        ].join(" ").toLowerCase();

        return searchableText.includes(term);
    });

    return filteredClients.length
        ? filteredClients.map((client) => `
            <tr>
                <td>
                    <strong>${escapeHTML(client.name)}</strong>
                    <small class="client-secondary">
                        ${escapeHTML(client.document || "Sin documento")}
                    </small>
                </td>
                <td>${escapeHTML(client.phone)}</td>
                <td>${escapeHTML(client.email || "No registrado")}</td>
                <td>
                    <div class="client-actions">
                        <button
                            type="button"
                            class="client-action-btn"
                            data-action="edit"
                            data-id="${escapeHTML(client.id)}"
                        >Editar</button>
                        <button
                            type="button"
                            class="client-action-btn client-delete-btn"
                            data-action="delete"
                            data-id="${escapeHTML(client.id)}"
                        >Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join("")
        : `
            <tr>
                <td colspan="4" class="client-no-results">
                    ${term
                        ? "No se encontraron clientes con esa búsqueda."
                        : "Todavía no hay clientes registrados."}
                </td>
            </tr>
        `;
}

function renderClients(searchTerm = "") {
    const rows = buildClientRows(searchTerm);

    moduleView.innerHTML = `
        <section class="clients-module">
            <div class="module-heading">
                <div>
                    <p class="module-kicker">RELACIONES CON CLIENTES</p>
                    <h3>Directorio de clientes</h3>
                    <p>Registra y consulta los datos de las personas
                    que realizan pedidos.</p>
                </div>
                <div class="clients-total">
                    <strong>${clients.length}</strong>
                    <span>Clientes registrados</span>
                </div>
            </div>

            <div class="clients-layout">
                <section class="clients-form-panel">
                    <h4 id="client-form-title">Registrar cliente</h4>
                    <p class="clients-help">
                        Los campos marcados con * son obligatorios.
                    </p>

                    <form id="client-form">
                        <label for="client-name">Nombre completo *</label>
                        <input
                            id="client-name"
                            name="name"
                            type="text"
                            maxlength="100"
                            autocomplete="name"
                            placeholder="Ej. María Fernanda López"
                            required
                        >

                        <label for="client-phone">Teléfono *</label>
                        <input
                            id="client-phone"
                            name="phone"
                            type="tel"
                            maxlength="20"
                            autocomplete="tel"
                            placeholder="Ej. 3001234567"
                            required
                        >

                        <label for="client-document">Documento</label>
                        <input
                            id="client-document"
                            name="document"
                            type="text"
                            maxlength="30"
                            placeholder="Número de documento"
                        >

                        <label for="client-email">Correo electrónico</label>
                        <input
                            id="client-email"
                            name="email"
                            type="email"
                            maxlength="120"
                            autocomplete="email"
                            placeholder="correo@ejemplo.com"
                        >

                        <label for="client-address">Dirección</label>
                        <input
                            id="client-address"
                            name="address"
                            type="text"
                            maxlength="150"
                            autocomplete="street-address"
                            placeholder="Dirección de entrega habitual"
                        >

                        <div class="client-form-actions">
                            <button type="submit" class="client-primary-btn">
                                Guardar cliente
                            </button>
                            <button
                                type="button"
                                id="client-cancel-edit"
                                class="client-secondary-btn"
                                hidden
                            >Cancelar edición</button>
                        </div>

                        <p id="client-form-message"
                           class="client-form-message"
                           role="status"
                           aria-live="polite"></p>
                    </form>
                </section>

                <section class="clients-list-panel">
                    <div class="clients-list-heading">
                        <div>
                            <h4>Clientes registrados</h4>
                            <p>Busca por nombre, documento, teléfono o correo.</p>
                        </div>
                        <input
                            id="client-search"
                            type="search"
                            placeholder="Buscar cliente..."
                            aria-label="Buscar clientes"
                        >
                    </div>

                    <div class="clients-table-wrapper">
                        <table class="clients-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Teléfono</th>
                                    <th>Correo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="clients-table-body">
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </section>
    `;

    const searchInput = moduleView.querySelector("#client-search");
    searchInput.value = searchTerm;
}

function resetClientForm() {
    const form = moduleView.querySelector("#client-form");
    if (!form) return;

    form.reset();
    editingClientId = null;

    moduleView.querySelector("#client-form-title").textContent =
        "Registrar cliente";

    moduleView.querySelector(".client-primary-btn").textContent =
        "Guardar cliente";

    moduleView.querySelector("#client-cancel-edit").hidden = true;
    moduleView.querySelector("#client-form-message").textContent = "";
}

function showClientMessage(message) {
    const element = moduleView.querySelector("#client-form-message");
    if (element) element.textContent = message;
}

function editClient(clientId) {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;

    editingClientId = client.id;

    const form = moduleView.querySelector("#client-form");
    form.elements.name.value = client.name;
    form.elements.phone.value = client.phone;
    form.elements.document.value = client.document || "";
    form.elements.email.value = client.email || "";
    form.elements.address.value = client.address || "";

    moduleView.querySelector("#client-form-title").textContent =
        "Editar cliente";

    moduleView.querySelector(".client-primary-btn").textContent =
        "Guardar cambios";

    moduleView.querySelector("#client-cancel-edit").hidden = false;
    showClientMessage("Editando los datos del cliente.");

    moduleView.querySelector("#client-name").focus();
}

function deleteClient(clientId) {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;

    const linkedOrders = orders.filter(
        (order) => order.clientId === clientId
    ).length;

    if (linkedOrders > 0) {
        alert(
            `No se puede eliminar a "${client.name}": tiene ` +
            `${linkedOrders} pedido${linkedOrders === 1 ? "" : "s"} asociado${linkedOrders === 1 ? "" : "s"}. ` +
            "Cada pedido debe conservar su cliente."
        );
        return;
    }

    const confirmed = confirm(
        `¿Eliminar al cliente "${client.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    const previousClients = clients;
    clients = clients.filter((item) => item.id !== clientId);

    if (!saveClients()) {
        clients = previousClients;
        return;
    }

    editingClientId = null;
    renderClients();
}

moduleView.addEventListener("submit", (event) => {
    if (event.target.id !== "client-form") return;

    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const documentNumber = String(formData.get("document") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const address = String(formData.get("address") || "").trim();

    if (!name || !phone) {
        showClientMessage("Completa el nombre y el teléfono.");
        return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        showClientMessage(
            "Revisa el teléfono: debe contener entre 7 y 15 dígitos."
        );
        return;
    }

    const normalizedDocument = documentNumber.toLowerCase();

    if (normalizedDocument) {
        const duplicateDocument = clients.some((client) =>
            client.id !== editingClientId &&
            (client.document || "").trim().toLowerCase() === normalizedDocument
        );

        if (duplicateDocument) {
            showClientMessage(
                "Ya existe un cliente con ese número de documento."
            );
            return;
        }
    }

    const previousClients = clients;

    if (editingClientId) {
        clients = clients.map((client) =>
            client.id === editingClientId
                ? {
                    ...client,
                    name,
                    phone,
                    document: documentNumber,
                    email,
                    address
                }
                : client
        );
    } else {
        const newClient = {
            id: (globalThis.crypto?.randomUUID)
                ? globalThis.crypto.randomUUID()
                : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name,
            phone,
            document: documentNumber,
            email,
            address,
            createdAt: new Date().toISOString()
        };

        clients = [...clients, newClient];
    }

    if (!saveClients()) {
        clients = previousClients;
        return;
    }

    editingClientId = null;
    renderClients();
});

moduleView.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");

    if (actionButton && moduleView.contains(actionButton)) {
        const clientId = actionButton.dataset.id;

        if (actionButton.dataset.action === "edit") {
            editClient(clientId);
        }

        if (actionButton.dataset.action === "delete") {
            deleteClient(clientId);
        }

        return;
    }

    if (event.target.closest("#client-cancel-edit")) {
        resetClientForm();
    }
});

moduleView.addEventListener("input", (event) => {
    if (event.target.id !== "client-search") return;

    const searchInput = event.target;
    const searchTerm = searchInput.value;
    const cursorPosition = searchInput.selectionStart;

    moduleView.querySelector("#clients-table-body").innerHTML =
        buildClientRows(searchTerm);

    const updatedInput = moduleView.querySelector("#client-search");
    updatedInput.focus();

    if (cursorPosition !== null) {
        updatedInput.setSelectionRange(cursorPosition, cursorPosition);
    }
});


const ORDERS_STORAGE_KEY = "juangel_regalos_pedidos";

const ORDER_STATUSES = [
    "Pendiente",
    "En preparación",
    "Listo",
    "Entregado",
    "Cancelado"
];

let orders = loadOrders();
let editingOrderId = null;

function loadOrders() {
    try {
        const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("No se pudieron cargar los pedidos:", error);
        return [];
    }
}

function saveOrders() {
    try {
        localStorage.setItem(
            ORDERS_STORAGE_KEY,
            JSON.stringify(orders)
        );
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los pedidos:", error);
        alert("No fue posible guardar los pedidos en este navegador.");
        return false;
    }
}

function formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(value);
}

function getOrderTotal(order) {
    return order.products.reduce(
        (sum, product) => sum + product.quantity * product.unitPrice,
        0
    );
}

function getOrderClientName(clientId) {
    const client = clients.find((item) => item.id === clientId);
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

    if (!clients.some((client) => client.id === order.clientId)) {
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

    if (!clients.some((client) => client.id === clientId)) {
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
            id: (globalThis.crypto?.randomUUID)
                ? globalThis.crypto.randomUUID()
                : `order-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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
        const searchTerm = event.target.value;
        const cursorPosition = event.target.selectionStart;
        const statusFilter =
            moduleView.querySelector("#order-status-filter").value;

        moduleView.querySelector("#orders-table-body").innerHTML =
            buildOrderRows(searchTerm, statusFilter);

        const input = moduleView.querySelector("#order-search");
        input.focus();

        if (cursorPosition !== null) {
            input.setSelectionRange(cursorPosition, cursorPosition);
        }

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


const INVENTORY_STORAGE_KEY = "juangel_regalos_inventario";

let inventory = loadInventory();
let editingProductId = null;

function loadInventory() {
    try {
        const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("No se pudo cargar el inventario:", error);
        return [];
    }
}

function saveInventory() {
    try {
        localStorage.setItem(
            INVENTORY_STORAGE_KEY,
            JSON.stringify(inventory)
        );
        return true;
    } catch (error) {
        console.error("No se pudo guardar el inventario:", error);
        alert("No fue posible guardar el inventario en este navegador.");
        return false;
    }
}

function inventoryStockStatus(product) {
    if (product.stock <= 0) return "Agotado";
    if (product.stock <= product.minStock) return "Stock bajo";
    return "Disponible";
}

function buildInventoryRows(searchTerm = "") {
    const term = searchTerm.trim().toLowerCase();

    const filteredProducts = inventory.filter((product) =>
        [product.name, product.category, product.description]
            .join(" ")
            .toLowerCase()
            .includes(term)
    );

    return filteredProducts.length
        ? filteredProducts.map((product) => {
            const status = inventoryStockStatus(product);
            const statusClass = status === "Disponible"
                ? "stock-status-ok"
                : status === "Agotado"
                    ? "stock-status-out"
                    : "stock-status-low";

            return `
                <tr>
                    <td>
                        <strong>${escapeHTML(product.name)}</strong>
                        <small class="inventory-secondary">
                            ${escapeHTML(product.description || "Sin descripción")}
                        </small>
                    </td>
                    <td>${escapeHTML(product.category)}</td>
                    <td><strong>${formatCOP(product.price)}</strong></td>
                    <td>
                        <strong>${product.stock}</strong>
                        <small class="inventory-secondary">
                            Mínimo: ${product.minStock}
                        </small>
                    </td>
                    <td>
                        <span class="stock-status ${statusClass}">
                            ${status}
                        </span>
                    </td>
                    <td>
                        <div class="inventory-actions">
                            <button
                                type="button"
                                class="inventory-action-btn"
                                data-inventory-edit="${escapeHTML(product.id)}"
                            >Editar</button>
                            <button
                                type="button"
                                class="inventory-action-btn inventory-delete-btn"
                                data-inventory-delete="${escapeHTML(product.id)}"
                            >Eliminar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="6" class="inventory-no-results">
                    ${term
                        ? "No se encontraron productos."
                        : "Todavía no hay productos registrados."}
                </td>
            </tr>
        `;
}

function renderInventory(searchTerm = "") {
    const rows = buildInventoryRows(searchTerm);
    const lowStockCount = inventory.filter(
        (product) => product.stock <= product.minStock
    ).length;

    moduleView.innerHTML = `
        <section class="inventory-module">
            <div class="module-heading">
                <div>
                    <p class="module-kicker">PRODUCTOS Y EXISTENCIAS</p>
                    <h3>Inventario</h3>
                    <p>Administra el catálogo y controla las existencias
                    de los productos del negocio.</p>
                </div>
                <div class="inventory-total">
                    <strong>${inventory.length}</strong>
                    <span>Productos registrados</span>
                </div>
            </div>

            <div class="inventory-summary">
                <article class="inventory-summary-card">
                    <span>Productos en catálogo</span>
                    <strong>${inventory.length}</strong>
                </article>
                <article class="inventory-summary-card">
                    <span>Con stock bajo o agotado</span>
                    <strong>${lowStockCount}</strong>
                </article>
                <article class="inventory-summary-card">
                    <span>Unidades disponibles</span>
                    <strong>${inventory.reduce(
                        (sum, product) => sum + product.stock, 0
                    )}</strong>
                </article>
            </div>

            <section class="inventory-form-panel">
                <h4 id="inventory-form-title">Registrar producto</h4>
                <p class="inventory-help">
                    Los campos marcados con * son obligatorios.
                </p>

                <form id="inventory-form">
                    <div class="inventory-form-grid">
                        <div class="inventory-field">
                            <label for="inventory-name">Nombre del producto *</label>
                            <input
                                id="inventory-name"
                                name="name"
                                type="text"
                                maxlength="120"
                                placeholder="Ej. Taza personalizada"
                                required
                            >
                        </div>

                        <div class="inventory-field">
                            <label for="inventory-category">Categoría *</label>
                            <input
                                id="inventory-category"
                                name="category"
                                type="text"
                                maxlength="60"
                                placeholder="Ej. Tazas, anchetas, agendas"
                                required
                            >
                        </div>

                        <div class="inventory-field">
                            <label for="inventory-price">Precio de venta (COP) *</label>
                            <input
                                id="inventory-price"
                                name="price"
                                type="number"
                                min="0"
                                max="1000000000"
                                step="1"
                                placeholder="Ej. 25000"
                                required
                            >
                        </div>

                        <div class="inventory-field">
                            <label for="inventory-stock">Existencias actuales *</label>
                            <input
                                id="inventory-stock"
                                name="stock"
                                type="number"
                                min="0"
                                max="1000000"
                                step="1"
                                value="0"
                                required
                            >
                        </div>

                        <div class="inventory-field">
                            <label for="inventory-min-stock">Stock mínimo *</label>
                            <input
                                id="inventory-min-stock"
                                name="minStock"
                                type="number"
                                min="0"
                                max="1000000"
                                step="1"
                                value="3"
                                required
                            >
                        </div>

                        <div class="inventory-field inventory-description-field">
                            <label for="inventory-description">Descripción</label>
                            <textarea
                                id="inventory-description"
                                name="description"
                                rows="2"
                                maxlength="500"
                                placeholder="Características, tamaños, colores..."
                            ></textarea>
                        </div>
                    </div>

                    <div class="inventory-form-actions">
                        <button type="submit" class="inventory-primary-btn">
                            Guardar producto
                        </button>
                        <button
                            type="button"
                            id="inventory-cancel-edit"
                            class="inventory-secondary-btn"
                            hidden
                        >Cancelar edición</button>
                    </div>

                    <p id="inventory-form-message"
                       class="inventory-message"
                       role="status"
                       aria-live="polite"></p>
                </form>
            </section>

            <section class="inventory-list-panel">
                <div class="inventory-list-heading">
                    <div>
                        <h4>Catálogo de productos</h4>
                        <p>Consulta precios, cantidades y alertas de stock.</p>
                    </div>
                    <input
                        id="inventory-search"
                        type="search"
                        placeholder="Buscar producto o categoría..."
                        aria-label="Buscar productos del inventario"
                    >
                </div>

                <div class="inventory-table-wrapper">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Existencias</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">${rows}</tbody>
                    </table>
                </div>
            </section>
        </section>
    `;

    moduleView.querySelector("#inventory-search").value = searchTerm;
}

function showInventoryMessage(message) {
    const element = moduleView.querySelector("#inventory-form-message");
    if (element) element.textContent = message;
}

function resetInventoryForm() {
    const form = moduleView.querySelector("#inventory-form");
    if (!form) return;

    form.reset();
    editingProductId = null;

    form.elements.stock.value = "0";
    form.elements.minStock.value = "3";

    moduleView.querySelector("#inventory-form-title").textContent =
        "Registrar producto";

    moduleView.querySelector(
        '#inventory-form button[type="submit"]'
    ).textContent = "Guardar producto";

    moduleView.querySelector("#inventory-cancel-edit").hidden = true;
    showInventoryMessage("");
}

function editInventoryProduct(productId) {
    const product = inventory.find((item) => item.id === productId);
    if (!product) return;

    editingProductId = product.id;

    const form = moduleView.querySelector("#inventory-form");

    form.elements.name.value = product.name;
    form.elements.category.value = product.category;
    form.elements.price.value = product.price;
    form.elements.stock.value = product.stock;
    form.elements.minStock.value = product.minStock;
    form.elements.description.value = product.description || "";

    moduleView.querySelector("#inventory-form-title").textContent =
        "Editar producto";

    moduleView.querySelector(
        '#inventory-form button[type="submit"]'
    ).textContent = "Guardar cambios";

    moduleView.querySelector("#inventory-cancel-edit").hidden = false;
    showInventoryMessage("Editando los datos del producto.");

    moduleView.querySelector("#inventory-name").focus();
}

function deleteInventoryProduct(productId) {
    const product = inventory.find((item) => item.id === productId);
    if (!product) return;

    const confirmed = confirm(
        `¿Eliminar "${product.name}" del inventario?`
    );

    if (!confirmed) return;

    const previousInventory = inventory;
    inventory = inventory.filter((item) => item.id !== productId);

    if (!saveInventory()) {
        inventory = previousInventory;
        return;
    }

    editingProductId = null;
    renderInventory();
}

moduleView.addEventListener("submit", (event) => {
    if (event.target.id !== "inventory-form") return;

    event.preventDefault();

    const form = event.target;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const category = String(data.get("category") || "").trim();
    const description = String(data.get("description") || "").trim();
    const price = Number(data.get("price"));
    const stock = Number(data.get("stock"));
    const minStock = Number(data.get("minStock"));

    if (!name || !category) {
        showInventoryMessage("El nombre y la categoría son obligatorios.");
        return;
    }

    if (
        !Number.isFinite(price) ||
        price < 0 ||
        price > 1000000000
    ) {
        showInventoryMessage("Ingresa un precio válido.");
        return;
    }

    if (
        !Number.isInteger(stock) ||
        stock < 0 ||
        stock > 1000000 ||
        !Number.isInteger(minStock) ||
        minStock < 0 ||
        minStock > 1000000
    ) {
        showInventoryMessage(
            "Las existencias y el stock mínimo deben ser números enteros no negativos."
        );
        return;
    }

    const duplicateName = inventory.some((product) =>
        product.id !== editingProductId &&
        product.name.trim().toLowerCase() === name.toLowerCase()
    );

    if (duplicateName) {
        showInventoryMessage(
            "Ya existe un producto con ese nombre. Edita el registro existente si corresponde."
        );
        return;
    }

    const previousInventory = inventory;

    if (editingProductId) {
        inventory = inventory.map((product) =>
            product.id === editingProductId
                ? {
                    ...product,
                    name,
                    category,
                    description,
                    price,
                    stock,
                    minStock,
                    updatedAt: new Date().toISOString()
                }
                : product
        );
    } else {
        inventory = [...inventory, {
            id: (globalThis.crypto?.randomUUID)
                ? globalThis.crypto.randomUUID()
                : `product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name,
            category,
            description,
            price,
            stock,
            minStock,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }];
    }

    if (!saveInventory()) {
        inventory = previousInventory;
        return;
    }

    editingProductId = null;
    renderInventory();
});

moduleView.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-inventory-edit]");

    if (editButton) {
        editInventoryProduct(editButton.dataset.inventoryEdit);
        return;
    }

    const deleteButton = event.target.closest("[data-inventory-delete]");

    if (deleteButton) {
        deleteInventoryProduct(deleteButton.dataset.inventoryDelete);
        return;
    }

    if (event.target.closest("#inventory-cancel-edit")) {
        resetInventoryForm();
    }
});

moduleView.addEventListener("input", (event) => {
    if (event.target.id !== "inventory-search") return;

    const searchTerm = event.target.value;
    const cursorPosition = event.target.selectionStart;

    moduleView.querySelector("#inventory-table-body").innerHTML =
        buildInventoryRows(searchTerm);

    const input = moduleView.querySelector("#inventory-search");
    input.focus();

    if (cursorPosition !== null) {
        input.setSelectionRange(cursorPosition, cursorPosition);
    }
});

    // Mostrar el módulo seleccionado
    function navigateTo(pageName) {
        const page = pages[pageName];

        if (!page) {
            return;
        }

        const isDashboard = pageName === "dashboard";

        // Al cambiar de módulo se descarta cualquier edición en curso
        editingClientId = null;
        editingOrderId = null;
        editingProductId = null;

        // Mostrar dashboard o vista del módulo
        dashboardElements.forEach((element) => {
            element.hidden = !isDashboard;
        });

        moduleView.hidden = isDashboard;

  
if (!isDashboard) {
    if (pageName === "clientes") {
        renderClients();
    } else if (pageName === "pedidos") {
        renderOrders();
    } else if (pageName === "inventario") {
        renderInventory();
    } else {
        moduleView.innerHTML = page.content;
    }
}


        // Actualizar el encabezado compartido
        if (breadcrumb) {
            breadcrumb.textContent = page.breadcrumb;
        }

        if (pageTitle) {
            pageTitle.textContent = page.title;
        }

        if (pageDescription) {
            pageDescription.textContent = page.description;
        }

        // Indicar qué opción está seleccionada
        navigationLinks.forEach((link) => {
            const isActive = link.dataset.page === pageName;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    // Navegación por hash: el menú, los enlaces internos y el botón "atrás"
    // usan el mismo mecanismo, así que siempre quedan sincronizados.
    function handleRoute() {
        const requested = window.location.hash.slice(1);

        if (pages[requested]) {
            navigateTo(requested);
            return;
        }

        // Anclas internas (p. ej. #pedidos-prioritarios): no cambian de módulo
        if (requested && document.getElementById(requested)) return;

        navigateTo("dashboard");
    }

    window.addEventListener("hashchange", handleRoute);

    // Permitir plegar el menú lateral, si existe el botón
    if (appContainer && sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            const isCollapsed = appContainer.classList.toggle(
                "sidebar-collapsed"
            );

            sidebarToggle.setAttribute(
                "aria-expanded",
                String(!isCollapsed)
            );

            sidebarToggle.setAttribute(
                "aria-label",
                isCollapsed
                    ? "Expandir menú lateral"
                    : "Plegar menú lateral"
            );
        });
    }

    // Abrir el módulo indicado en la URL, si existe
    handleRoute();
});