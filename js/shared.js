const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
});

export function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (character) => htmlEntities[character]
    );
}

export function formatCOP(value) {
    return currencyFormatter.format(value);
}

export function createId(prefix) {
    return globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createCollectionStore(key, loadError, saveError, saveAlert) {
    return {
        load() {
            try {
                const saved = localStorage.getItem(key);
                const value = saved ? JSON.parse(saved) : [];
                return Array.isArray(value) ? value : [];
            } catch (error) {
                console.error(loadError, error);
                return [];
            }
        },
        save(value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error(saveError, error);
                alert(saveAlert);
                return false;
            }
        }
    };
}