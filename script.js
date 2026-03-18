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
        const reader = new FileReader();
        reader.readAsDataURL(file);
        const base64Data = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
        });

        // Link oficial e estável (v1)
        const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

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
            // Se a chave estiver errada ou expirada, limpamos para pedir de novo
            if (data.error.status === "PERMISSION_DENIED") {
                localStorage.removeItem('GEMINI_KEY');
                alert("Sua chave foi negada pelo Google. Verifique se copiou a nova chave corretamente.");
            } else {
                alert("Erro do Google: " + data.error.message);
            }
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
        alert("Erro técnico. Tente atualizar a página.");
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
