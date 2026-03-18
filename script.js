let API_KEY = localStorage.getItem('gemini_key') || "";
let currentTheme = "engraçado";

// Gerenciamento de botões de tema
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
    };
});

document.getElementById('uploadArea').onclick = () => document.getElementById('fileInput').click();

document.getElementById('fileInput').onchange = (e) => {
    if (e.target.files[0]) gerarMemeIA(e.target.files[0]);
};

async function gerarMemeIA(file) {
    if (!API_KEY) {
        API_KEY = prompt("Cole sua Gemini API KEY aqui:");
        if (API_KEY) localStorage.setItem('gemini_key', API_KEY);
        else return;
    }

    const loading = document.getElementById('loadingArea');
    const result = document.getElementById('resultArea');
    loading.style.display = 'block';
    result.style.display = 'none';

    try {
        // 1. DESCOBRE O MODELO AUTOMATICAMENTE
        const mRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const mData = await mRes.json();
        const model = mData.models.find(m => m.supportedGenerationMethods.includes("generateContent")).name;

        // 2. PEGA TEMA E IDIOMA DOS INPUTS
        const userTheme = document.getElementById('customTheme').value || "Geral";
        const userLang = document.getElementById('customLang').value || "Português";

        // 3. CONVERTE IMAGEM
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const base64 = await new Promise(r => reader.onload = () => r(reader.result.split(',')[1]));
        document.getElementById('uploadedImage').src = URL.createObjectURL(file);

        // 4. CHAMA A IA
        const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: `Crie um meme sobre "${userTheme}" em "${userLang}". Humor: ${currentTheme}. Retorne: TEXTO CIMA | TEXTO BAIXO` },
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
        alert("Erro! Verifique a chave ou a conexão.");
        loading.style.display = 'none';
    }
}

// Botão de Download
document.getElementById('downloadBtn').onclick = () => {
    html2canvas(document.getElementById('memeExport')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'meme-felix-ai.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};
