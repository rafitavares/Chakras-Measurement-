# Medição de Chakras (Chakra Measurement)

App web para registrar medições de chakras de clientes pelo método de leitura
com pêndulo (Barbara Brennan School of Healing) e acompanhar a evolução de
cada cliente em gráficos e num diagrama corporal colorido. Feito para uso no
celular. Publicado como site estático no **GitHub Pages**; os dados ficam
salvos **localmente, só neste aparelho**.

> O app em si (telas, botões, textos) está **em inglês**. Este guia de
> instalação continua em português, para você.

> A logo usada no cabeçalho e nos ícones (`assets/logo.png`,
> `icons/icon-*.png`) é da **Barbara Brennan School of Healing (BBSH)**, uma
> marca registrada da escola — não é sua. Está sendo usada aqui como
> referência ao método, para uma ferramenta de uso pessoal/privado da sua
> prática. Se em algum momento este app for distribuído publicamente ou
> comercializado, troque essa logo por uma própria.

Este guia foi escrito para quem **não é programador**.

---

## Como o app funciona

- É um site estático: só HTML, CSS e JavaScript. Não tem servidor, não tem
  banco de dados na nuvem, não tem login.
- É publicado gratuitamente pelo **GitHub Pages**.
- Os dados (clientes, medições) ficam guardados **no armazenamento local do
  seu navegador** (`localStorage`), no aparelho em que você está usando.
  Eles **não** sincronizam sozinhos entre celular, tablet e computador.
- Para levar os dados de um aparelho para outro (ou fazer backup), use os
  botões **Export backup** / **Import backup** (menu ⋮ na tela de clientes) —
  eles geram/leem um arquivo `.json` com tudo.

### Por que não tem login?

Porque não existe mais nenhum servidor nem banco de dados remoto para
proteger — os dados nunca saem do seu navegador a não ser que você mesmo
exporte um arquivo. Isso é mais simples, mas tem uma troca importante:

> **Qualquer pessoa que abrir este link no seu celular destravado vê os
> dados de todos os seus clientes.** Não existe senha dentro do app. A
> proteção é a trava de tela do próprio celular. Se isso for um problema
> para você, me avise — dá para adicionar um PIN local simples depois.

---

## Passo 1 — Publicar no GitHub Pages

1. Garanta que todos os arquivos deste repositório estejam no branch padrão
   do repositório, na raiz (não dentro de nenhuma subpasta). Este repositório
   ainda não tem um branch `main` — o branch padrão atual é
   `claude/focused-babbage-p7lmxa`, e é esse que vai aparecer na lista do
   passo 4.
2. No GitHub, vá em **Settings > Pages** do repositório.
3. Em **"Build and deployment"**, escolha a fonte **"Deploy from a branch"**.
4. Em **Branch**, selecione o branch que tem o código (veja o item 1) e a
   pasta `/ (root)`. Clique em **Save**.
5. Aguarde 1-2 minutos. A URL do site vai aparecer no topo dessa mesma
   página, algo como:

   ```
   https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
   ```

> O repositório pode ficar **público** sem problema: o código não contém
> nenhum dado de cliente nem nenhuma chave secreta — os dados só existem no
> seu navegador, depois que você começa a usar o app.

## Passo 2 — Adicionar à tela inicial do celular (opcional, recomendado)

**Android (Chrome):**
1. Abra a URL do app no Chrome.
2. Toque no menu (⋮) no canto superior direito.
3. Toque em **"Adicionar à tela inicial"** (ou "Instalar app").

**iPhone (Safari):**
1. Abra a URL do app no Safari.
2. Toque no ícone de **compartilhar** (o quadrado com uma seta para cima).
3. Toque em **"Adicionar à Tela de Início"**.

Depois disso, o app abre como um aplicativo normal, com ícone próprio.

---

## ⚠️ Avisos importantes sobre os dados locais

- **Limpar os dados do navegador apaga tudo.** Se você limpar o cache/dados
  do site, desinstalar o app da tela inicial de um jeito que "esqueça" os
  dados, usar modo anônimo/privado, ou trocar de navegador (ex: Chrome para
  Safari) no mesmo aparelho, **o histórico dos clientes some** — a não ser
  que você tenha um arquivo de backup exportado.
- **Cada aparelho tem seus próprios dados.** Abrir o app no celular e depois
  no computador mostra duas listas de clientes diferentes e vazias até você
  importar um backup num dos dois.
- **Faça backup com frequência.** Use o botão **Exportar backup** (menu ⋮ na
  tela de clientes) depois de registrar medições importantes, e guarde o
  arquivo `.json` em algum lugar seguro (e-mail para você mesmo, Google
  Drive, iCloud, etc.).
- **Importar substitui tudo.** O botão **Importar backup** apaga os dados
  atuais deste aparelho e coloca os do arquivo no lugar — não faz uma mescla
  dos dois. Use isso para configurar um aparelho novo, não para juntar
  históricos de dois aparelhos diferentes.

---

## Usando o app

1. **Clientes** — toque no botão **+** para criar um cliente novo. Só o nome
   é obrigatório; os demais campos (data de nascimento, sexo, e-mail,
   telefone) são opcionais. No campo de queixa/observações, **cada linha que
   você digitar vira um item com marcador** (bullet point) na tela de dados
   do cliente — útil para listar vários sintomas separadamente.
2. **New Reading** (Nova medição) — dentro do cliente, escolha a data e a
   notação de spin de cada um dos 12 chakras (o diâmetro é opcional). Dois
   painéis são atualizados em tempo real enquanto você preenche:
   - O **resumo** (Reason/Emotion/Will, domínio dominante, NEI, TNDC);
   - O **diagrama corporal**, com um boneco mostrando os 12 pontos de chakra
     na posição anatômica certa, coloridos pelo status de cada um (veja a
     legenda abaixo do diagrama no próprio app: verde = aberto e alinhado,
     tons de verde = aberto mas não alinhado, tons de vermelho = fechando,
     vermelho = fechado, cinza = linha reta, preto = parado).
3. **History** (Histórico) — lista todas as medições; toque em uma para
   editar ou excluir.
4. **Charts** (Gráficos) — evolução por domínio, NEI, TNDC e por chakra
   individual (a partir de 2 medições registradas).
5. **Exportar (por cliente)** — na aba History de cada cliente, exporte o
   histórico dele em CSV ou JSON (para analisar numa planilha, por exemplo).
6. **Generate PDF report** — na aba Client Info, gera e baixa um PDF com os
   dados do cliente, a lista de datas de medição (com semanas entre
   visitas, NEI, TNDC e domínio dominante de cada uma) e os 4 gráficos de
   evolução (a partir de 2 medições registradas). Exige internet na hora de
   gerar (carrega a biblioteca de PDF de um CDN na primeira vez).
7. **Backup (todos os clientes)** — no menu ⋮ da tela de clientes, exporte
   ou importe um backup completo, para levar os dados para outro aparelho.

### O método por trás dos números

- **Domínios:** Razão = chakras 7, 6A, 6B · Emoção = 5A, 4A, 3A, 2A ·
  Vontade = 5B, 4B, 3B, 2B, 1.
- **Valor de cada notação de spin:**

  | Notação | Direção | Valor |
  |---|---|---|
  | C | Horário circular | +1,0 |
  | CER / CEL / CEV / CEH / CEAS | Horário elíptico | +0,5 |
  | V / H / R / L | Linha reta | 0,0 |
  | CCER / CCEL / CCEV / CCEH / CCEAS | Anti-horário elíptico | −0,5 |
  | CC | Anti-horário circular | −1,0 |
  | S | Parado | −2,0 |

- **NEI** (Net Energy Intake) = soma dos 12 chakras. Referência: −12 a +12.
- **TNDC** (Total Number of Distorted Chakras) = quantos dos 12 chakras têm
  notação diferente de `C`.

Esses valores nunca são salvos prontos — são sempre recalculados a partir
das notações escolhidas (`spins`), garantindo consistência.

---

## Estrutura do projeto

```
index.html              tela única do app
css/styles.css          estilo mobile-first
assets/logo.png          logo BBSH usada no cabeçalho
icons/icon-*.png        ícones do PWA (gerados a partir da logo BBSH)
js/store.js             motor de armazenamento local (localStorage)
js/calculations.js      tabela de notações e cálculos do método (fonte única da verdade)
js/clients.js           CRUD de clientes (local)
js/visits.js            CRUD de medições/visitas (local)
js/backup.js            exportar/importar backup completo (.json)
js/export.js            exportação CSV/JSON por cliente
js/report.js            relatório em PDF do cliente (dados + histórico + gráficos)
js/charts.js            gráficos (Chart.js)
js/bodymap.js           diagrama corporal com cores por status do chakra
js/ui.js                pequenos utilitários de interface
js/app.js               controlador principal (telas, navegação, eventos)
manifest.json + sw.js   suporte a instalação como PWA
tests/calculations.test.mjs   teste de sanidade dos cálculos (rode com `node tests/calculations.test.mjs`)
```

### Onde os dados ficam guardados

Tudo sob uma única chave no `localStorage` do navegador:

```js
localStorage["chakras_db_v1"] = {
  clients: [
    {
      id, name, birthdate, sex, email, phone, complaint,
      lastVisitDate, visitCount, createdAt, updatedAt,
      visits: [
        { id, date, spins: { "7":"C", "6A":"CCEL", ... }, diameters: { "7": 8.5, ... }, notes, createdAt }
      ]
    }
  ]
}
```

O campo `complaint` guarda texto livre; cada linha digitada é exibida como um
item de lista com marcador na tela de dados do cliente (não muda como é
salvo, só como é mostrado).

Os totais (Razão/Emoção/Vontade, NEI, TNDC) **não** ficam salvos — são
sempre calculados a partir de `spins` na hora de exibir, usando
`js/calculations.js` como única fonte da verdade.

### Rodando o teste de sanidade dos cálculos

Se você (ou alguém te ajudando) tiver o Node.js instalado:

```
node tests/calculations.test.mjs
```

Isso é opcional e só serve para desenvolvimento — o app publicado no GitHub
Pages não depende do Node em nenhum momento.

---

## Limitações conhecidas

- Sem login/senha dentro do app (veja o aviso no topo deste README).
- Sem sincronização automática entre aparelhos — use exportar/importar.
- Limpar dados do navegador apaga o histórico se não houver backup exportado.
- Não há "desfazer" para excluir cliente ou visita — a confirmação na hora é
  a única proteção.
