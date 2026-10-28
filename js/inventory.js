import { createCollectionStore, createId, escapeHTML, formatCOP } from "./shared.js";

export function createInventoryModule({ moduleView, hasActiveSaleForProduct }) {
    const store = createCollectionStore(
        "juangel_regalos_inventario",
        "No se pudo cargar el inventario:",
        "No se pudo guardar el inventario:",
        "No fue posible guardar el inventario en este navegador."
    );
    let inventory = store.load();
    let editingProductId = null;
    const saveInventory = () => store.save(inventory);

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
        if (hasActiveSaleForProduct(productId)) {
            alert("No se puede eliminar: el producto tiene ventas activas asociadas.");
            return;
        }

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

    function adjustStock(items, direction) {
        if (![1, -1].includes(direction)) return false;
        if (items.some(({ productId, quantity }) =>
            !inventory.some((product) => product.id === productId) ||
            !Number.isInteger(quantity) ||
            quantity < 1
        )) return false;

        const quantities = new Map();

        items.forEach(({ productId, quantity }) => {
            quantities.set(
                productId,
                (quantities.get(productId) || 0) + quantity * direction
            );
        });

        const updatedInventory = inventory.map((product) => {
            const change = quantities.get(product.id) || 0;
            return { ...product, stock: product.stock + change };
        });

        const hasInvalidStock = updatedInventory.some(
            (product) =>
                !Number.isInteger(product.stock) ||
                product.stock < 0 ||
                product.stock > 1000000
        );

        if (hasInvalidStock) return false;
        if (!store.save(updatedInventory)) return false;

        inventory = updatedInventory;
        return true;
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
            const timestamp = new Date().toISOString();
            inventory = [...inventory, {
                id: createId("product"),
                name,
                category,
                description,
                price,
                stock,
                minStock,
                createdAt: timestamp,
                updatedAt: timestamp
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

        moduleView.querySelector("#inventory-table-body").innerHTML =
            buildInventoryRows(event.target.value);
    });


    return {
        render: renderInventory,
        getInventory: () => inventory.map((product) => ({ ...product })),
        adjustStock,
        clearEditing: () => { editingProductId = null; }
    };
}