import { apiRequest } from "./api.js";


// ======================================================
// UTILIZADOR ATUAL
// ======================================================

let currentUser = null;


// ======================================================
// OBTER UTILIZADOR AUTENTICADO
// ======================================================

export async function getCurrentUser() {

    if (currentUser) {
        return currentUser;
    }

    try {

        const data =
            await apiRequest("/api/auth/me");

        currentUser =
            data.user;

        return currentUser;

    } catch {

        currentUser = null;

        return null;
    }
}


// ======================================================
// EXIGIR AUTENTICAÇÃO
// ======================================================

export async function requireAuth() {

    const user =
        await getCurrentUser();

    if (!user) {

        window.location.href =
            "/login.html";

        return null;
    }

    return user;
}


// ======================================================
// VERIFICAR ROLE
// ======================================================

export async function hasRole(role) {

    const user =
        await getCurrentUser();

    if (!user) {
        return false;
    }

    return user.role === role;
}


// ======================================================
// LOGOUT
// ======================================================

export async function logout() {

    try {

        await apiRequest(
            "/api/auth/logout",
            {
                method: "POST"
            }
        );

    } finally {

        currentUser = null;

        window.location.href =
            "/login.html";
    }
}


// ======================================================
// CONFIGURAR BOTÃO LOGOUT
// ======================================================

export function setupLogout(buttonId = "#logout") {

    const button =
        document.querySelector(buttonId);

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async () => {

            button.disabled = true;

            try {

                await logout();

            } catch {

                button.disabled = false;

            }

        }
    );
}


// ======================================================
// MOSTRAR UTILIZADOR
// ======================================================

export function getUser() {

    return currentUser;
}