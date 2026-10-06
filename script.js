const form = document.getElementById("contactForm");
const button = document.getElementById("submitButton");
const status = document.getElementById("status");

// URL do backend hospedado no Render
const API_URL = "https://renan-portifolio-api.onrender.com";

if (!form || !button || !status) {
    console.error("Elementos do formulário não foram encontrados.");
} else {

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        // Limpa o status anterior
        status.textContent = "";
        status.className = "";

        // Desativa o botão durante o envio
        button.disabled = true;
        button.textContent = "Enviando...";

        // Pega os dados do formulário
        const formData = new FormData(form);

        const data = {
            name: formData.get("name")?.trim() || "",
            email: formData.get("email")?.trim() || "",
            project: formData.get("project")?.trim() || "",
            budget: formData.get("budget")?.trim() || "",
            subject: formData.get("subject")?.trim() || "",
            message: formData.get("message")?.trim() || ""
        };

        try {

            // Validação dos campos obrigatórios
            if (
                !data.name ||
                !data.email ||
                !data.project ||
                !data.subject ||
                !data.message
            ) {
                throw new Error(
                    "Preencha todos os campos obrigatórios."
                );
            }

            // Envia os dados para o backend
            const response = await fetch(
                `${API_URL}/api/contact`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify(data)
                }
            );

            // Verifica o tipo de resposta
            const contentType =
                response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {

                const text = await response.text();

                console.error(
                    "Resposta inesperada do servidor:",
                    text
                );

                throw new Error(
                    "O servidor retornou uma resposta inválida."
                );
            }

            // Converte a resposta para JSON
            const result = await response.json();

            // Verifica erros HTTP
            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Não foi possível enviar a mensagem."
                );
            }

            // Sucesso
            status.textContent =
                result.message ||
                "Mensagem enviada com sucesso!";

            status.className = "success";

            // Limpa o formulário
            form.reset();

        } catch (error) {

            console.error(
                "Erro no formulário:",
                error
            );

            status.textContent =
                error.message ||
                "Não foi possível enviar a mensagem.";

            status.className = "error";

        } finally {

            // Reativa o botão
            button.disabled = false;

            button.textContent =
                "Enviar proposta";
        }

    });

}

