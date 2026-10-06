const API_URL = "https://renan-portifolio-api.onrender.com";

const form = document.getElementById("contactForm");
const button = document.getElementById("submitButton");
const status = document.getElementById("status");

if (!form || !button || !status) {
    console.error("Elementos do formulário não foram encontrados.");
} else {

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        status.textContent = "";
        status.className = "";

        button.disabled = true;
        button.textContent = "Enviando...";

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

            console.log("Enviando formulário para:", API_URL);

            // Envia para o backend do Render
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

            // Lê a resposta como texto primeiro
            const responseText = await response.text();

            console.log("Status HTTP:", response.status);
            console.log("Resposta do servidor:", responseText);

            // Resposta vazia
            if (!responseText.trim()) {
                throw new Error(
                    `O servidor retornou uma resposta vazia (HTTP ${response.status}).`
                );
            }

            // Converte manualmente para JSON
            let result;

            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {

                console.error(
                    "Resposta não é JSON válido:",
                    responseText
                );

                throw new Error(
                    "O servidor retornou uma resposta que não é um JSON válido."
                );
            }

            // Erro retornado pelo backend
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

            button.disabled = false;
            button.textContent = "Enviar proposta";

        }

    });

}

