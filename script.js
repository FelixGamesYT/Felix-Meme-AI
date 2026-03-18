const API_KEY = "AIzaSyCommG1V45nSxFPzUdVudUhzOe6GywqSps";
let currentTheme = 'engraçado';

// 1. Troca de Temas (Sem bug de múltiplos selecionados)
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
    };
});

// 2. Upload (Focado em celular)
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

// 3. Gerar Meme com Gemini 1.5 Flash
async function gerarMemeIA(file) {
    const loading = document.getElementById('loadingArea');
    const result = document.getElementById('resultArea');
    loading.style.display = 'block';
    result.style.display = 'none';
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const base64Promise = new Promise(resolve => reader.onload = () => resolve(reader.result.split(',')[1]));
        const base64Data = await base64Promise;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: `Analise a imagem e crie um meme ${currentTheme}. Retorne APENAS o texto no formato: TEXTO DE CIMA | TEXTO DE BAIXO` },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]}]
            })
        });

        const data = await response.json();
        const textoFull = data.candidates[0].content.parts[0].text;
        const [top, bottom] = textoFull.split('|');
        
        document.getElementById('topText').textContent = top ? top.trim() : "";
        document.getElementById('bottomText').textContent = bottom ? bottom.trim() : "";
        
        loading.style.display = 'none';
        result.style.display = 'block';
    } catch (error) {
        console.error(error);
        alert("Erro ao falar com a IA. Verifique sua chave!");
        loading.style.display = 'none';
    }
}

// 4. Download do Meme
document.getElementById('downloadBtn').onclick = () => {
    html2canvas(document.getElementById('memeExport'), { useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'meu-meme.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};
