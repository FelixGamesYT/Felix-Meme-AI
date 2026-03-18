let API_KEY = localStorage.getItem('gemini_key') || "";
let currentTheme = "engraçado";

// Inicialização segura
window.onload = () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // Correção do Toque
    uploadArea.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        if (e.target.files[0]) gerarMemeIA(e.target.files[0]);
    };

    // Botão de Download
    document.getElementById('downloadBtn').onclick = async () => {
        const canvas = await html2canvas(document.getElementById('memeExport'), { useCORS: true });
        const link = document.createElement('a');
        link.download = `meme-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };
};

// Seletor de Humores
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
    };
});

async function gerarMemeIA(file) {
    if (!API_KEY) {
        API_KEY = prompt("Cole sua Gemini API KEY:");
        if (API_KEY) localStorage.setItem('gemini_key', API_KEY);
        else return;
    }

    const loading = document.getElementById('loadingArea');
    const result = document.getElementById('resultArea');
    loading.style.display = 'block';
    result.style.display = 'none';

    try {
        // 1. Busca automática do modelo (v1beta para garantir suporte)
        const mRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const mData = await mRes.json();
        const model = mData.models.find(m => m.supportedGenerationMethods.includes("generateContent")).name;

        // 2. Coleta tema e idioma
        const userTheme = document.getElementById('customTheme').value || "Geral";
        const userLang = document.getElementById('customLang').value || "Português";

        // 3. Processa imagem
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const base64 = await new Promise(r => reader.onload = () => r(reader.result.split(',')[1]));
        document.getElementById('uploadedImage').src = URL.createObjectURL(file);

        // 4. Envia para o Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: `Analise a imagem e crie um meme sobre "${userTheme}" em "${userLang}". O estilo deve ser ${currentTheme}. Retorne estritamente: TEXTO CIMA | TEXTO BAIXO` },
                    { inline_data: { mime_type: "image/jpeg", data: base64 } }
                ]}]
            })
        });

        const data = await response.json();
        const texto = data.candidates[0].content.parts[0].text;
        const [top, bottom] = texto.split('|');

        document.getElementById('topText').innerText = top?.trim() || "";
        document.getElementById('bottomText').innerText = bottom?.trim() || "";
        
        loading.style.display = 'none';
        result.style.display = 'block';
    } catch (err) {
        console.error(err);
        alert("Erro na conexão! Verifique sua chave.");
        loading.style.display = 'none';
    }
}
