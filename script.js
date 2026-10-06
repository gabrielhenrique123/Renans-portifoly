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

// Primeiro lê a resposta como TEXTO
const responseText = await response.text();

console.log("Status HTTP:", response.status);
console.log("Resposta do servidor:", responseText);

// Se não veio absolutamente nada
if (!responseText.trim()) {
    throw new Error(
        `O servidor retornou uma resposta vazia (HTTP ${response.status}).`
    );
}

// Tenta converter manualmente para JSON
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

// Verifica erro HTTP
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