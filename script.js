// 1. Configuração da Chave (Escondida do robô do Google)
let API_KEY = localStorage.getItem('GEMINI_KEY');

function pedirChave() {
    let novaChave = prompt("Por favor, cole sua nova API KEY do Gemini aqui:");
    if (novaChave) {
        localStorage.setItem('GEMINI_KEY', novaChave);
        API_KEY = novaChave;
    }
}

if (!API_KEY) {
    pedirChave();
}

let currentTheme = 'engraçado';

// 2. Seleção de Temas
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
    };
});

// 3. Upload de Imagem
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
uploadArea.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('uploadedImage').src = event.target.result;
            gerarMemeIA(file);
        };
        reader.readAsDataURL(file);
    }
};

// 4. A Função Principal (Onde a mágica acontece)
async function gerarMemeIA(file) {
    if (!API_KEY) {
        pedirChave();
        return;
    }

    const loading = document.getElementById('loadingArea');
    const result = document.getElementById('resultArea');
    loading.style.display = 'block';
    result.style.display = 'none';
    
    try {
        // 1. BUSCA AUTOMÁTICA DE MODELO (O "Pulo do Gato")
        // Vamos perguntar ao Google quais modelos estão ativos para a sua chave
        const modelsResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + API_KEY);
        const modelsData = await modelsResponse.json();
        
        // Pegamos o primeiro modelo que aceite gerar conteúdo (geralmente o Flash ou Pro)
        const modeloAtivo = modelsData.models.find(m => m.supportedGenerationMethods.includes("generateContent")).name;
        console.log("Usando o modelo: " + modeloAtivo);

        // 2. PREPARA A IMAGEM
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const base64Data = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
        });

        // 3. USA O MODELO QUE O SITE ACHOU SOZINHO
        const url = "https://generativelanguage.googleapis.com/v1beta/" + modeloAtivo + ":generateContent?key=" + API_KEY;

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: "Analise a imagem e crie um meme " + currentTheme + ". Retorne APENAS: TEXTO CIMA | TEXTO BAIXO" },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]}]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            alert("Erro do Google: " + data.error.message);
            loading.style.display = 'none';
            return;
        }

        const textoFull = data.candidates[0].content.parts[0].text;
        const partes = textoFull.split('|');
        
        document.getElementById('topText').textContent = partes[0] ? partes[0].trim() : "";
        document.getElementById('bottomText').textContent = partes[1] ? partes[1].trim() : "";
        
        loading.style.display = 'none';
        result.style.display = 'block';
    } catch (error) {
        console.error(error);
        alert("Erro técnico ou chave inválida. Tente novamente.");
        loading.style.display = 'none';
    }
}

// 5. Botão de Download
document.getElementById('downloadBtn').onclick = () => {
    html2canvas(document.getElementById('memeExport')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'meme.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};
