console.log('Showdown disponível:', typeof showdown);
console.log('Window showdown:', window.showdown);
const apiKeyInput = document.getElementById('apiKey')
const gameselect = document.getElementById('gameselect')
const questionInput = document.getElementById('questioninput')
const form = document.getElementById('form')
const askButton = document.getElementById('askbutton')
const aiResponse = document.getElementById('airesponse')
const markdownToHTML = (text) => {
    try {
        // Verifica se o Showdown está disponível
        if (typeof showdown === 'undefined') {
            console.warn('Showdown não carregado, usando fallback');
            return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

        const converter = new showdown.Converter();
        return converter.makeHtml(text); // Note: é makeHtml, não makeHTML

    } catch (error) {
        console.error('Erro no markdownToHTML:', error);
        // Fallback simples para quebras de linha
        return text.replace(/\n/g, '<br>');
    }
}

const perguntarAI = async (question, game, apiKey) => {
    const model = "gemini-2.0-flash"
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const pergunta = `
        ## Especialidade
        Voce é um especialista assistente de meta para o jogo ${game}

        ## Tarefa
        Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo, estrategias builds e dicas.

        ## Regras
         - Se voce nao sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
         - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'
         - Considera a data atual ${new Date().toLocaleDateString}
         - Faça pesquisas atualizadas sobre o patch atual, baseado na dat atual, para dar uma resposta coerente.
         - Nunca responda itens que voce nao tenha certeza de que existe no patch atual

        ## Respostas
        Economize na resposta, seja direto e responda com no maximo 500 caracteres. 
        Responda em markdown.
        Não precisa realizar nenhuma saudação ou despedida, apenas responda o que o usuario está querendo .

        ## Exemplo de resposta
         Pergunta do usuario: Melhor build para Vi jungler
         Resposta: A build mais atual é: \n\n **Itens:**\n\n coloque os itens aqui. \n\n**Runas:**\n\n
         ---
         Aqui está a pergunta do usuario: ${question}
`

    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }]

    const tools = [{
        google_search: {}
    }]

    const response = await fetch(geminiURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents,
            tools
        })
    })

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const data = await response.json()
    console.log({ data })
    return data.candidates[0].content.parts[0].text
}

const sendForm = async (event) => {
    event.preventDefault()

    const apiKey = apiKeyInput.value
    const game = gameselect.value
    const question = questionInput.value

    if (apiKey === "" || game === "" || question === "") {
        alert("Por favor, preencha todos os campos")
        return
    }

    askButton.disabled = true
    askButton.textContent = 'Perguntando...'
    askButton.classList.add("loading")

    try {
        const text = await perguntarAI(question, game, apiKey)
        aiResponse.querySelector('.response-content').innerHTML = markdownToHTML(text)

    } catch (error) {
        console.log('Erro: ', error)
    } finally {
        askButton.disabled = false
        askButton.textContent = 'Perguntar'
        askButton.classList.remove("loading")
    }
}

form.addEventListener('submit', sendForm)
