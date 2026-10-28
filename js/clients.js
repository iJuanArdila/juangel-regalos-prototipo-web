import { createCollectionStore, createId, escapeHTML } from "./shared.js";

export function createClientsModule({ moduleView, getOrders }) {
    const store = createCollectionStore(
        "juangel_regalos_clientes",
        "No se pudieron cargar los clientes:",
        "No se pudieron guardar los clientes:",
        "No fue posible guardar los datos en este navegador."
    );
    let clients = store.load();
    let editingClientId = null;
    const saveClients = () => store.save(clients);

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

        const linkedOrders = getOrders().filter(
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
                id: createId("client"),
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

        moduleView.querySelector("#clients-table-body").innerHTML =
            buildClientRows(event.target.value);
    });




    return {
        render: renderClients,
        getClients: () => clients,
        clearEditing: () => { editingClientId = null; }
    };
}