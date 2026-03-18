const API_KEY = "AIzaSyCommG1V45nSxFPzUdVudUhzOe6GywqSps";
let currentTheme = 'engraçado';

// 1. Temas
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.dataset.theme;
    };
});

// 2. Upload
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

// 3. Gerar Meme
async function gerarMemeIA(file) {
    const loading = document.getElementById('loadingArea');
    const result = document.getElementById('resultArea');
    loading.style.display = 'block';
    result.style.display = 'none';
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const base64Data = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
        });

        // Link montado sem usar crases para evitar erro de teclado
        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [
                    { text: "Crie um meme " + currentTheme + " para esta imagem. Retorne: TEXTO CIMA | TEXTO BAIXO" },
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
        alert("Erro técnico. Verifique sua conexão.");
        loading.style.display = 'none';
    }
}

// 4. Download
document.getElementById('downloadBtn').onclick = () => {
    html2canvas(document.getElementById('memeExport')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'meme.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};
