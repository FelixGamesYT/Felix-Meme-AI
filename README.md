# MemeVision AI Pro

App web (PWA) estático: envie uma imagem e o Gemini cria 4 ideias de meme em português brasileiro.

## Rodar
Hospede os arquivos (GitHub Pages, por exemplo) ou rode `python3 -m http.server` nesta pasta e abra no navegador. Em Configurações, cole sua chave do Google AI Studio.

## Segurança
Não existe mais chave padrão no código. A chave fica só no `localStorage` do aparelho e é enviada ao Google por cabeçalho, nunca na URL. Revogue a chave que estava embutida no projeto antigo (aistudio.google.com/apikey): ela continua pública no histórico do repositório.

## Velocidade
Uma única chamada por geração (sem listar modelos), imagem reduzida para 1024px, thinking desligado nos modelos 2.5, timeout de 25 s e uma nova tentativa só em erro 5xx ou timeout.
