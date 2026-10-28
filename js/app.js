import { createClientsModule } from "./clients.js";
import { createInventoryModule } from "./inventory.js";
import { createOrdersModule } from "./orders.js";
import { createSalesModule } from "./sales.js";

document.addEventListener("DOMContentLoaded", () => {
    const appContainer = document.querySelector(".app-container");
    const mainContent = document.querySelector(".main-content");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const moduleView = document.getElementById("module-view");
    const navigationLinks = document.querySelectorAll(".nav-link[data-page]");

    if (!mainContent || !moduleView) {
        console.error("No se encontró el contenedor principal del sistema.");
        return;
    }

    const topbar = mainContent.querySelector(".topbar");
    const dashboardElements = [...mainContent.children].filter(
        (element) => element !== topbar && element !== moduleView
    );
    const breadcrumb = topbar?.querySelector(".breadcrumb");
    const pageTitle = topbar?.querySelector("h2");
    const pageDescription = topbar?.querySelector(".page-description");
    const dashboardHeader = {
        title: pageTitle?.textContent ?? "Panel de control",
        description: pageDescription?.textContent ?? "Resumen general de tu negocio.",
        breadcrumb: breadcrumb?.textContent ?? "Menú principal / Dashboard"
    };

    let ordersModule;
    const clientsModule = createClientsModule({
        moduleView,
        getOrders: () => ordersModule.getOrders()
    });
    ordersModule = createOrdersModule({
        moduleView,
        getClients: clientsModule.getClients,
        getOrderPaymentTotal: (orderId) =>
            salesModule?.getOrderPaymentTotal(orderId) ?? 0
    });
    let salesModule;
    const inventoryModule = createInventoryModule({
        moduleView,
        hasActiveSaleForProduct: (productId) =>
            salesModule?.hasActiveSaleForProduct(productId) ?? false
    });
    salesModule = createSalesModule({
        moduleView,
        getClients: clientsModule.getClients,
        getOrders: ordersModule.getOrders,
        setOrderStatus: ordersModule.setOrderStatus,
        getInventory: inventoryModule.getInventory,
        adjustStock: inventoryModule.adjustStock
    });

    const placeholderContent = (
        kicker,
        heading,
        description,
        symbol,
        sectionTitle,
        sectionDescription
    ) => `
        <div class="module-heading">
            <div>
                <p class="module-kicker">${kicker}</p>
                <h3>${heading}</h3>
                <p>${description}</p>
            </div>
        </div>
        <div class="module-empty">
            <span class="module-symbol" aria-hidden="true">${symbol}</span>
            <h4>${sectionTitle}</h4>
            <p>${sectionDescription}</p>
        </div>
    `;

    const pages = {
        dashboard: dashboardHeader,
        pedidos: {
            title: "Gestión de pedidos",
            description: "Registra pedidos y controla su preparación y entrega.",
            breadcrumb: "Menú principal / Pedidos",
            render: ordersModule.render
        },
        clientes: {
            title: "Gestión de clientes",
            description: "Organiza la información de tus clientes.",
            breadcrumb: "Menú principal / Clientes",
            render: clientsModule.render
        },
        inventario: {
            title: "Gestión de inventario",
            description: "Controla productos, precios y existencias.",
            breadcrumb: "Menú principal / Inventario",
            render: inventoryModule.render
        },
        ventas: {
            title: "Ventas, pagos y finanzas",
            description: "Registra ventas, consulta saldos y controla los movimientos financieros.",
            breadcrumb: "Menú principal / Ventas",
            render: salesModule.render
        },
        gastos: {
            title: "Gastos y compras",
            description: "Registra gastos, clasifica movimientos y controla las compras de insumos.",
            breadcrumb: "Menú principal / Gastos",
            render: salesModule.render
        },
        reportes: {
            title: "Reportes e indicadores",
            description: "Consulta resúmenes de la actividad comercial.",
            breadcrumb: "Menú principal / Reportes",
            content: placeholderContent(
                "ANÁLISIS DEL NEGOCIO",
                "Reportes e indicadores",
                "Revisa información consolidada de pedidos, ventas, gastos e inventario.",
                "↗",
                "Información para tomar decisiones",
                "Los indicadores y reportes se construirán cuando tengamos datos disponibles."
            )
        },
        usuarios: {
            title: "Gestión de usuarios",
            description: "Administra las cuentas autorizadas del sistema.",
            breadcrumb: "Configuración / Usuarios",
            content: placeholderContent(
                "ACCESO AL SISTEMA",
                "Usuarios",
                "Esta sección permitirá administrar las cuentas autorizadas y sus permisos.",
                "♙",
                "Usuarios y permisos",
                "El registro de usuarios, la autenticación y los roles requieren una implementación posterior."
            )
        }
    };

    function navigateTo(pageName) {
        const page = pages[pageName];
        if (!page) return;

        const isDashboard = pageName === "dashboard";
        clientsModule.clearEditing();
        ordersModule.clearEditing();
        inventoryModule.clearEditing();
        dashboardElements.forEach((element) => {
            element.hidden = !isDashboard;
        });
        moduleView.hidden = isDashboard;

        if (!isDashboard) {
            if (page.render) page.render();
            else moduleView.innerHTML = page.content;
        }

        if (breadcrumb) breadcrumb.textContent = page.breadcrumb;
        if (pageTitle) pageTitle.textContent = page.title;
        if (pageDescription) pageDescription.textContent = page.description;

        navigationLinks.forEach((link) => {
            const isActive = link.dataset.page === pageName;
            link.classList.toggle("active", isActive);
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }

    function handleRoute() {
        const requested = window.location.hash.slice(1);
        if (pages[requested]) {
            navigateTo(requested);
            return;
        }
        if (requested && document.getElementById(requested)) return;
        navigateTo("dashboard");
    }

    window.addEventListener("hashchange", handleRoute);
    if (appContainer && sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            const isCollapsed = appContainer.classList.toggle("sidebar-collapsed");
            sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
            sidebarToggle.setAttribute(
                "aria-label",
                isCollapsed ? "Expandir men? lateral" : "Plegar men? lateral"
            );
        });
    }

    handleRoute();
});