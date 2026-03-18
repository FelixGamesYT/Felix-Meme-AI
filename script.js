let currentTheme = "engraçado";

function setTheme(btn, theme) {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTheme = theme;
}

async function gerarMemeIA(file) {
    if (!file) return;

    let apiKey = localStorage.getItem('gemini_key') || prompt("Cole sua Gemini API Key:");
    if (apiKey) localStorage.setItem('gemini_key', apiKey);
    else return;

    document.getElementById('loadingArea').style.display = 'block';
    document.getElementById('resultArea').style.display = 'none';

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        document.getElementById('uploadedImage').src = URL.createObjectURL(file);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                body: JSON.stringify({
                    contents: [{ parts: [
                        { text: `Analise a imagem e crie um meme sobre "${document.getElementById('customTheme').value || 'geral'}". Estilo: ${currentTheme}. Retorne estritamente: TEXTO CIMA | TEXTO BAIXO` },
                        { inline_data: { mime_type: "image/jpeg", data: base64 } }
                    ]}]
                })
            });

            const data = await response.json();
            let texto = data.candidates[0].content.parts[0].text.replace(/TEXTO CIMA:|TEXTO BAIXO:|CIMA:|BAIXO:/gi, "");
            const partes = texto.split('|');

            document.getElementById('topText').innerText = partes[0]?.trim() || "";
            document.getElementById('bottomText').innerText = partes[1]?.trim() || "";
            
            document.getElementById('loadingArea').style.display = 'none';
            document.getElementById('resultArea').style.display = 'block';
        } catch (e) {
            alert("Erro na IA!");
            document.getElementById('loadingArea').style.display = 'none';
        }
    };
}

async function baixarMeme() {
    const canvas = await html2canvas(document.getElementById('memeExport'), { useCORS: true });
    const link = document.createElement('a');
    link.download = `meme-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}
