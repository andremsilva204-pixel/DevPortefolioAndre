import { apiRequest } from "./api.js";
import {
    getCurrentUser,
    requireAuth
} from "./auth.js";


// ======================================================
// ESTADO
// ======================================================

let projects = [];

let currentUser = null;


// ======================================================
// ELEMENTOS
// ======================================================

const container =
    document.querySelector(
        "#projects-container"
    );

const search =
    document.querySelector(
        "#search"
    );

const form =
    document.querySelector(
        "#project-form"
    );

const message =
    document.querySelector(
        "#message"
    );


// ======================================================
// UTILIDADES
// ======================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// CARREGAR PROJETOS
// ======================================================

export async function loadProjects() {

    if (!container) {
        return;
    }

    try {

        const data =
            await apiRequest(
                "/api/projects"
            );

        projects =
            data.projects || [];

        renderProjects(projects);

    } catch (error) {

        console.error(
            "Erro ao carregar projetos:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">
                Erro ao carregar projetos.
            </div>
        `;
    }
}


// ======================================================
// VERIFICAR PERMISSÃO
// ======================================================

function canManageProject(project) {

    if (!currentUser) {
        return false;
    }

    const isOwner =
        Number(project.user_id) ===
        Number(currentUser.id);

    const isTeacher =
        currentUser.role === "teacher";

    return isOwner || isTeacher;
}


// ======================================================
// RENDERIZAR PROJETOS
// ======================================================

export function renderProjects(items) {

    if (!container) {
        return;
    }

    if (!items.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum projeto encontrado.
            </div>
        `;

        return;
    }


    container.innerHTML =
        items.map(project => {

            const canManage =
                canManageProject(project);

            return `

                <article
                    class="project-card">

                    ${
                        project.image_url
                        ? `
                            <img
                                src="${escapeHTML(project.image_url)}"
                                alt="${escapeHTML(project.title)}">
                        `
                        : ""
                    }

                    <div
                        class="project-card-content">

                        <h3>
                            ${escapeHTML(project.title)}
                        </h3>

                        <p>
                            ${escapeHTML(project.description)}
                        </p>

                        <small>
                            ${escapeHTML(project.author)}
                        </small>

                        <br><br>

                        <a
                            href="/dashboard/project.html?id=${encodeURIComponent(project.id)}"
                            class="btn">
                            Ver projeto
                        </a>

                        ${
                            canManage
                            ? `
                                <button
                                    type="button"
                                    class="btn btn-edit"
                                    data-id="${project.id}">
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-danger delete-project"
                                    data-id="${project.id}">
                                    Eliminar
                                </button>
                            `
                            : ""
                        }

                    </div>

                </article>

            `;

        }).join("");
}


// ======================================================
// PESQUISA
// ======================================================

function setupSearch() {

    if (!search) {
        return;
    }

    search.addEventListener(
        "input",
        () => {

            const value =
                search.value
                    .trim()
                    .toLowerCase();

            const filtered =
                projects.filter(project => {

                    const title =
                        String(project.title || "")
                            .toLowerCase();

                    const description =
                        String(project.description || "")
                            .toLowerCase();

                    const author =
                        String(project.author || "")
                            .toLowerCase();

                    return (
                        title.includes(value) ||
                        description.includes(value) ||
                        author.includes(value)
                    );

                });

            renderProjects(filtered);
        }
    );
}


// ======================================================
// CRIAR PROJETO
// ======================================================

async function createProject(event) {

    event.preventDefault();

    if (!form) {
        return;
    }

    if (message) {

        message.textContent = "";

        message.className =
            "message";
    }


    const title =
        document
            .querySelector("#title")
            ?.value
            .trim();

    const description =
        document
            .querySelector("#description")
            ?.value
            .trim();

    const longDescription =
        document
            .querySelector("#long_description")
            ?.value
            .trim();

    const githubUrl =
        document
            .querySelector("#github_url")
            ?.value
            .trim();

    const liveUrl =
        document
            .querySelector("#live_url")
            ?.value
            .trim();

    const level =
        document
            .querySelector("#level")
            ?.value;


    if (!title || !description) {

        if (message) {

            message.textContent =
                "Título e descrição são obrigatórios.";

            message.classList.add(
                "error"
            );
        }

        return;
    }


    const button =
        form.querySelector(
            "button[type='submit']"
        );

    if (button) {
        button.disabled = true;
        button.textContent =
            "A criar...";
    }


    try {

        await apiRequest(
            "/api/projects",
            {
                method: "POST",

                body: JSON.stringify({

                    title,

                    description,

                    long_description:
                        longDescription || null,

                    github_url:
                        githubUrl || null,

                    live_url:
                        liveUrl || null,

                    level:
                        level || null

                })
            }
        );


        if (message) {

            message.textContent =
                "Projeto criado com sucesso.";

            message.classList.add(
                "success"
            );
        }


        form.reset();

        await loadProjects();


    } catch (error) {

        if (message) {

            message.textContent =
                error.message ||
                "Erro ao criar projeto.";

            message.classList.add(
                "error"
            );
        }

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Criar projeto";
        }
    }
}


// ======================================================
// APAGAR PROJETO
// ======================================================

async function deleteProject(id) {

    if (!confirm(
        "Tens a certeza que queres apagar este projeto?"
    )) {
        return;
    }


    try {

        await apiRequest(
            `/api/projects/${id}`,
            {
                method: "DELETE"
            }
        );

        await loadProjects();

    } catch (error) {

        alert(
            error.message ||
            "Erro ao apagar o projeto."
        );
    }
}


// ======================================================
// EVENTOS DOS PROJETOS
// ======================================================

function setupProjectActions() {

    document.addEventListener(
        "click",
        async (event) => {

            const deleteButton =
                event.target.closest(
                    ".delete-project"
                );

            if (deleteButton) {

                await deleteProject(
                    deleteButton.dataset.id
                );

                return;
            }


            const editButton =
                event.target.closest(
                    ".btn-edit"
                );

            if (editButton) {

                const id =
                    editButton.dataset.id;

                window.location.href =
                    `/dashboard/project.html?id=${encodeURIComponent(id)}&edit=true`;
            }

        }
    );
}


// ======================================================
// PROJETO INDIVIDUAL
// ======================================================

export async function loadSingleProject(id) {

    if (!container) {
        return;
    }

    try {

        const data =
            await apiRequest(
                `/api/projects/${encodeURIComponent(id)}`
            );

        const project =
            data.project;


        const canManage =
            canManageProject(project);


        const params =
            new URLSearchParams(
                window.location.search
            );

        const editMode =
            params.get("edit") === "true";


        // ==================================================
        // MODO DE EDIÇÃO
        // ==================================================

        if (editMode && canManage) {

            container.innerHTML = `

                <article class="project-card">

                    <div
                        class="project-card-content">

                        <h1>
                            Editar projeto
                        </h1>

                        <br>

                        <form
                            id="edit-project-form"
                            class="form-container">

                            <!-- TÍTULO -->

                            <div class="form-group">

                                <label for="edit-title">
                                    Título
                                </label>

                                <input
                                    type="text"
                                    id="edit-title"
                                    value="${escapeHTML(project.title)}"
                                    required>

                            </div>


                            <!-- DESCRIÇÃO -->

                            <div class="form-group">

                                <label for="edit-description">
                                    Descrição
                                </label>

                                <textarea
                                    id="edit-description"
                                    required>${escapeHTML(project.description)}</textarea>

                            </div>


                            <!-- DESCRIÇÃO COMPLETA -->

                            <div class="form-group">

                                <label for="edit-long-description">
                                    Descrição completa
                                </label>

                                <textarea
                                    id="edit-long-description">${escapeHTML(project.long_description || "")}</textarea>

                            </div>


                            <!-- IMAGEM -->

                            <div class="form-group">

                                <label for="edit-image-url">
                                    Imagem
                                </label>

                                <input
                                    type="url"
                                    id="edit-image-url"
                                    value="${escapeHTML(project.image_url || "")}"
                                    placeholder="https://...">

                            </div>


                            <!-- GITHUB -->

                            <div class="form-group">

                                <label for="edit-github-url">
                                    GitHub
                                </label>

                                <input
                                    type="url"
                                    id="edit-github-url"
                                    value="${escapeHTML(project.github_url || "")}"
                                    placeholder="https://github.com/...">

                            </div>


                            <!-- LINK ONLINE -->

                            <div class="form-group">

                                <label for="edit-live-url">
                                    Link online
                                </label>

                                <input
                                    type="url"
                                    id="edit-live-url"
                                    value="${escapeHTML(project.live_url || "")}"
                                    placeholder="https://...">

                            </div>


                            <!-- NÍVEL -->

                            <div class="form-group">

                                <label for="edit-level">
                                    Nível
                                </label>

                                <select
                                    id="edit-level">

                                    <option
                                        value=""
                                        ${!project.level ? "selected" : ""}>
                                        Selecionar
                                    </option>

                                    <option
                                        value="Iniciante"
                                        ${project.level === "Iniciante" ? "selected" : ""}>
                                        Iniciante
                                    </option>

                                    <option
                                        value="Intermédio"
                                        ${project.level === "Intermédio" ? "selected" : ""}>
                                        Intermédio
                                    </option>

                                    <option
                                        value="Avançado"
                                        ${project.level === "Avançado" ? "selected" : ""}>
                                        Avançado
                                    </option>

                                </select>

                            </div>


                            <div
                                id="edit-message"
                                class="message">
                            </div>


                            <br>


                            <button
                                type="submit"
                                class="btn"
                                id="save-project-button">

                                Guardar alterações

                            </button>


                            <a
                                href="/dashboard/project.html?id=${encodeURIComponent(project.id)}"
                                class="btn btn-secondary">

                                Cancelar

                            </a>

                        </form>

                    </div>

                </article>

            `;


            const editForm =
                document.querySelector(
                    "#edit-project-form"
                );

            const editMessage =
                document.querySelector(
                    "#edit-message"
                );

            const saveButton =
                document.querySelector(
                    "#save-project-button"
                );


            editForm.addEventListener(
                "submit",
                async (event) => {

                    event.preventDefault();


                    const title =
                        document
                            .querySelector("#edit-title")
                            .value
                            .trim();

                    const description =
                        document
                            .querySelector("#edit-description")
                            .value
                            .trim();

                    const longDescription =
                        document
                            .querySelector("#edit-long-description")
                            .value
                            .trim();

                    const imageUrl =
                        document
                            .querySelector("#edit-image-url")
                            .value
                            .trim();

                    const githubUrl =
                        document
                            .querySelector("#edit-github-url")
                            .value
                            .trim();

                    const liveUrl =
                        document
                            .querySelector("#edit-live-url")
                            .value
                            .trim();

                    const level =
                        document
                            .querySelector("#edit-level")
                            .value;


                    if (!title || !description) {

                        editMessage.textContent =
                            "Título e descrição são obrigatórios.";

                        editMessage.className =
                            "message error";

                        return;
                    }


                    saveButton.disabled = true;

                    saveButton.textContent =
                        "A guardar...";


                    try {

                        await apiRequest(
                            `/api/projects/${encodeURIComponent(project.id)}`,
                            {
                                method: "PUT",

                                body: JSON.stringify({

                                    title,

                                    description,

                                    long_description:
                                        longDescription || null,

                                    image_url:
                                        imageUrl || null,

                                    github_url:
                                        githubUrl || null,

                                    live_url:
                                        liveUrl || null,

                                    level:
                                        level || null

                                })
                            }
                        );


                        editMessage.textContent =
                            "Projeto atualizado com sucesso.";

                        editMessage.className =
                            "message success";


                        setTimeout(() => {

                            window.location.href =
                                `/dashboard/project.html?id=${encodeURIComponent(project.id)}`;

                        }, 700);


                    } catch (error) {

                        editMessage.textContent =
                            error.message ||
                            "Erro ao atualizar o projeto.";

                        editMessage.className =
                            "message error";


                    } finally {

                        saveButton.disabled = false;

                        saveButton.textContent =
                            "Guardar alterações";

                    }

                }
            );


            return;
        }


        // ==================================================
        // VISUALIZAÇÃO NORMAL
        // ==================================================

        container.innerHTML = `

            <article
                class="project-card">

                ${
                    project.image_url
                    ? `
                        <img
                            src="${escapeHTML(project.image_url)}"
                            alt="${escapeHTML(project.title)}">
                    `
                    : ""
                }

                <div
                    class="project-card-content">

                    <h1>
                        ${escapeHTML(project.title)}
                    </h1>

                    <br>

                    <p>
                        ${escapeHTML(project.description)}
                    </p>

                    ${
                        project.long_description
                        ? `
                            <br>

                            <p>
                                ${escapeHTML(project.long_description)}
                            </p>
                        `
                        : ""
                    }

                    <br>

                    <small>
                        Desenvolvido por:
                        ${escapeHTML(project.author)}
                    </small>

                    <br><br>

                    ${
                        project.github_url
                        ? `
                            <a
                                href="${escapeHTML(project.github_url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn">
                                GitHub
                            </a>
                        `
                        : ""
                    }

                    ${
                        project.live_url
                        ? `
                            <a
                                href="${escapeHTML(project.live_url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn">
                                Ver projeto online
                            </a>
                        `
                        : ""
                    }

                    ${
                        canManage
                        ? `
                            <br><br>

                            <button
                                type="button"
                                class="btn btn-edit"
                                data-id="${project.id}">
                                Editar projeto
                            </button>

                            <button
                                type="button"
                                class="btn btn-danger delete-project"
                                data-id="${project.id}">
                                Eliminar projeto
                            </button>
                        `
                        : ""
                    }

                    <br><br>

                    <a
                        href="/dashboard/project.html"
                        class="btn btn-secondary">
                        ← Voltar aos projetos
                    </a>

                </div>

            </article>

        `;

    } catch (error) {

        console.error(
            "Erro ao carregar projeto:",
            error
        );

        container.innerHTML = `
            <div class="empty-state">

                <h2>
                    Projeto não encontrado
                </h2>

                <p>
                    Não foi possível carregar o projeto.
                </p>

                <br>

                <a
                    href="/dashboard/project.html"
                    class="btn">
                    Voltar aos projetos
                </a>

            </div>
        `;
    }
}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

async function init() {

    currentUser =
        await getCurrentUser();


    // Dashboard protegido

    if (form) {

        const user =
            await requireAuth();

        if (!user) {
            return;
        }

        currentUser =
            user;

        await loadProjects();

        form.addEventListener(
            "submit",
            createProject
        );
    }


    // Página pública de projetos

    if (container && !form) {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const projectId =
            params.get("id");


        if (projectId) {

            await loadSingleProject(
                projectId
            );

        } else {

            await loadProjects();

        }
    }


    setupSearch();

    setupProjectActions();
}


init();
