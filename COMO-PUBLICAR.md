# Como publicar o site da Conecta + MKT

O site é estático (sem build). O painel administrativo (`/admin`) edita os arquivos da pasta `content/` direto no GitHub, e o Netlify republica sozinho a cada salvamento.

## 1. Colocar no GitHub
1. Crie um repositório novo no GitHub (pode ser privado), por exemplo `conecta-site`.
2. Envie todo o conteúdo desta pasta para ele (no GitHub: **Add file → Upload files**, arrastando tudo).
3. Abra `admin/config.yml` e troque `SEU-USUARIO/SEU-REPOSITORIO` pelo seu (ex.: `diego/conecta-site`). Se a branch não for `main`, ajuste também.

## 2. Publicar no Netlify
1. No Netlify: **Add new site → Import an existing project → GitHub** e escolha o repositório.
2. Build command: deixe vazio. Publish directory: `.` (ponto).
3. Depois de publicado, anote o endereço (`https://algo.netlify.app`) e coloque em `site_url` e `display_url` no `admin/config.yml`.

## 3. Liberar o login do painel
O painel entra com a sua conta do GitHub.
1. No GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL: o endereço do seu site no Netlify.
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Copie o **Client ID** e gere um **Client Secret**.
2. No Netlify: no seu site, procure **Site configuration → Access & security → OAuth** (o nome do menu pode variar) → **Install provider → GitHub** e cole o Client ID e o Secret.
3. Acesse `https://seu-site.netlify.app/admin` e clique em entrar com o GitHub. A conta precisa ter permissão de escrita no repositório.

## 4. Usando o painel
- **Configurações do site**: logo, imagem de fundo da página inicial (testeira), escurecimento da imagem, textos, WhatsApp, Instagram e serviços.
- **Portfólios**: cada um tem a sua própria lista (Clientes, Vídeos, Produtos, Trabalhos feitos). Adicione, apague e arraste para reordenar. Cada portfólio também tem a sua própria imagem de fundo (testeira).
- Cada salvamento vira um commit; o site atualiza em cerca de 1 minuto.

## Dicas
- **Vídeos grandes**: use o link do YouTube (modo "Não listado"), do Vimeo ou do Google Drive. Envio de arquivo MP4 pelo painel serve para vídeos pequenos (o GitHub limita o tamanho dos arquivos).
- **Vídeos verticais** (Reels): escolha o formato 9:16 no cadastro do vídeo.
- **Trabalhos**: a categoria vira filtro automaticamente. Escreva sempre igual (ex.: "Logotipos").
- **Logo**: use PNG com fundo transparente ou SVG em cores claras, porque o fundo do site é escuro.
- As imagens que hoje aparecem são **ilustrativas** (pasta `images/placeholders`). Troque pelas reais no painel.
- Para testar no computador, abra um terminal na pasta e rode `python3 -m http.server 8000`, depois acesse `http://localhost:8000`. O painel só funciona no site publicado.
