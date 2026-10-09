# Medição de Chakras

App web para registrar medições de chakras de clientes pelo método de leitura
com pêndulo (Barbara Brennan) e acompanhar a evolução de cada cliente em
gráficos. Feito para uso no celular. Publicado como site estático no
**GitHub Pages**; os dados ficam salvos **localmente, só neste aparelho**.

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
  botões **Exportar backup** / **Importar backup** na tela de clientes — eles
  geram/leem um arquivo `.json` com tudo.

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

1. **Clientes** — toque no botão **+** para criar um cliente novo (só o nome
   é obrigatório).
2. **Nova medição** — dentro do cliente, escolha a data e a notação de spin
   de cada um dos 12 chakras (o diâmetro é opcional). O resumo (Razão /
   Emoção / Vontade, domínio dominante, NEI, TNDC) é calculado na hora.
3. **Histórico** — lista todas as medições; toque em uma para editar ou
   excluir.
4. **Gráficos** — evolução por domínio, NEI, TNDC e por chakra individual
   (a partir de 2 medições registradas).
5. **Exportar (por cliente)** — na aba Histórico de cada cliente, exporte o
   histórico dele em CSV ou JSON (para analisar numa planilha, por exemplo).
6. **Backup (todos os clientes)** — no menu ⋮ da tela de clientes, exporte
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
js/store.js             motor de armazenamento local (localStorage)
js/calculations.js      tabela de notações e cálculos do método (fonte única da verdade)
js/clients.js           CRUD de clientes (local)
js/visits.js            CRUD de medições/visitas (local)
js/backup.js            exportar/importar backup completo (.json)
js/export.js            exportação CSV/JSON por cliente
js/charts.js            gráficos (Chart.js)
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
      id, name, birthdate, complaint, contact,
      lastVisitDate, visitCount, createdAt, updatedAt,
      visits: [
        { id, date, spins: { "7":"C", "6A":"CCEL", ... }, diameters: { "7": 8.5, ... }, notes, createdAt }
      ]
    }
  ]
}
```

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
