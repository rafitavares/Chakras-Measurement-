# Medição de Chakras

App web para registrar medições de chakras de clientes pelo método de leitura
com pêndulo (Barbara Brennan), guardar tudo na nuvem (Firebase) e acompanhar a
evolução de cada cliente em gráficos. Feito para uso no celular, protegido por
login — só você acessa seus dados.

Este guia foi escrito para quem **não é programador**. Siga na ordem, sem
pular etapas. No total leva uns 15-20 minutos, e você só faz isso **uma vez**.

---

## Como o app funciona (visão geral)

- É um site estático: só HTML, CSS e JavaScript. Não tem servidor próprio.
- Ele é publicado gratuitamente pelo **GitHub Pages**.
- Os dados (clientes, medições) ficam guardados no **Firebase Firestore**,
  um banco de dados na nuvem do Google. É por isso que os dados aparecem
  iguais em qualquer aparelho em que você fizer login.
- O acesso é protegido por **Firebase Authentication** (login com e-mail e
  senha). Só existe uma conta: a sua.
- A segurança de verdade vem das **Security Rules** do Firestore (arquivo
  `firestore.rules`), que garantem que ninguém, mesmo logado com outra conta
  Google, consegue ler ou alterar os seus dados.

---

## Passo 1 — Criar o projeto no Firebase

1. Acesse **https://console.firebase.google.com** e faça login com sua conta
   Google.
2. Clique em **"Adicionar projeto"** (ou "Criar projeto").
3. Dê um nome (ex: `chakras-medicao`) e avance. Pode desativar o Google
   Analytics — não é necessário para este app.
4. Clique em **"Criar projeto"** e aguarde.

## Passo 2 — Ativar Authentication (login por e-mail/senha)

1. No menu lateral do console do Firebase, clique em **Build > Authentication**.
2. Clique em **"Vamos começar"** (Get started).
3. Na lista de provedores, clique em **"E-mail/senha"**.
4. Ative a primeira opção (**Ativar**) e clique em **Salvar**.

## Passo 3 — Ativar o Firestore Database

1. No menu lateral, clique em **Build > Firestore Database**.
2. Clique em **"Criar banco de dados"**.
3. Escolha o modo **produção** (production mode).
4. Escolha uma localização (qualquer uma próxima do Brasil, ex:
   `southamerica-east1`) e clique em **Ativar**.

## Passo 4 — Colar as Security Rules

1. Ainda em **Firestore Database**, clique na aba **"Regras"** (Rules).
2. Apague o conteúdo que estiver lá.
3. Abra o arquivo `firestore.rules` deste repositório, copie **todo** o
   conteúdo e cole no lugar.
4. Clique em **"Publicar"**.

Isso garante que cada usuário só acessa os próprios dados
(`users/{seu-uid}/...`). Sem isso publicado, ninguém consegue ler nem
escrever nada — o app vai parecer "travado".

## Passo 5 — Criar seu usuário (o login que você vai usar)

1. Volte em **Authentication > Users** (Usuários).
2. Clique em **"Adicionar usuário"**.
3. Digite o e-mail e a senha que você vai usar para entrar no app (pode ser
   um e-mail qualquer, não precisa ser uma conta Google real — é só uma
   credencial de login).
4. Clique em **Adicionar**.

Guarde esse e-mail e senha: é com eles que você vai entrar no app depois de
publicado.

## Passo 6 — Pegar o `firebaseConfig` e colar no app

1. No console do Firebase, clique no ícone de engrenagem (⚙️) ao lado de
   "Visão geral do projeto" > **Configurações do projeto**.
2. Role até **"Seus apps"** e clique no ícone **`</>`** (Web) para registrar
   um app web.
3. Dê um apelido (ex: `chakras-web`) e clique em **Registrar app**. Não
   marque a opção de Firebase Hosting.
4. O Firebase vai mostrar um bloco de código parecido com este:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "chakras-medicao.firebaseapp.com",
     projectId: "chakras-medicao",
     storageBucket: "chakras-medicao.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

5. Abra o arquivo **`js/firebase-config.js`** neste repositório.
6. Substitua os valores de exemplo pelos valores que o Firebase te deu,
   mantendo o formato. É só isso — nenhum outro arquivo precisa ser tocado.

> **Esses dados são secretos?** Não. O `apiKey` e os outros campos aqui são
> identificadores públicos por design — o próprio Google explica isso na
> documentação do Firebase. Eles podem ficar visíveis no código de um site
> estático sem problema. Quem protege seus dados de verdade são as
> **Security Rules** (Passo 4) junto com o **login obrigatório** — não o
> sigilo dessas chaves.

## Passo 7 — Publicar no GitHub Pages

1. Garanta que todos os arquivos deste repositório (incluindo o
   `js/firebase-config.js` já editado) estejam no branch `main`, na raiz do
   repositório (não dentro de nenhuma subpasta).
2. No GitHub, vá em **Settings > Pages** do repositório.
3. Em **"Build and deployment"**, escolha a fonte **"Deploy from a branch"**.
4. Em **Branch**, selecione `main` e a pasta `/ (root)`. Clique em **Save**.
5. Aguarde 1-2 minutos. A URL do site vai aparecer no topo dessa mesma
   página, algo como:

   ```
   https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
   ```

Abra essa URL no navegador do celular e faça login com o e-mail e senha
criados no Passo 5.

## Passo 8 — Adicionar à tela inicial do celular (opcional, recomendado)

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

## Usando o app

1. **Login** — só você tem uma conta; não existe cadastro público.
2. **Clientes** — toque no botão **+** para criar um cliente novo (só o nome
   é obrigatório).
3. **Nova medição** — dentro do cliente, escolha a data e a notação de spin
   de cada um dos 12 chakras (o diâmetro é opcional). O resumo (Razão /
   Emoção / Vontade, domínio dominante, NEI, TNDC) é calculado na hora.
4. **Histórico** — lista todas as medições; toque em uma para editar ou
   excluir.
5. **Gráficos** — evolução por domínio, NEI, TNDC e por chakra individual
   (a partir de 2 medições registradas).
6. **Exportar** — na aba Histórico, exporte o histórico do cliente em CSV ou
   JSON para backup.

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

Esses valores nunca são salvos prontos no banco — são sempre recalculados a
partir das notações escolhidas (`spins`), garantindo consistência.

---

## Estrutura do projeto

```
index.html              tela única do app (login + telas internas)
css/styles.css          estilo mobile-first
js/firebase-config.js   ← ÚNICO arquivo que você precisa editar (Passo 6)
js/firebase.js          inicializa Firebase (Auth + Firestore)
js/calculations.js      tabela de notações e cálculos do método (fonte única da verdade)
js/auth.js              login / logout
js/clients.js           CRUD de clientes no Firestore
js/visits.js            CRUD de medições (visitas) no Firestore
js/charts.js            gráficos (Chart.js)
js/export.js            exportação CSV / JSON
js/ui.js                pequenos utilitários de interface
js/app.js               controlador principal (telas, navegação, eventos)
firestore.rules         regras de segurança para colar no console do Firebase
manifest.json + sw.js   suporte a instalação como PWA
tests/calculations.test.mjs   teste de sanidade dos cálculos (rode com `node tests/calculations.test.mjs`)
```

### Modelo de dados (Firestore)

```
users/{uid}/clients/{clientId}
    name, birthdate?, complaint?, contact?
    lastVisitDate, visitCount   (denormalizado, para a lista de clientes)
    createdAt, updatedAt

users/{uid}/clients/{clientId}/visits/{visitId}
    date                 (YYYY-MM-DD)
    spins: { "7":"C", "6A":"CCEL", ... }     (as 12 notações)
    diameters?: { "7": 8.5, ... }            (opcional, cm)
    notes?
    createdAt
```

Os totais (Razão/Emoção/Vontade, NEI, TNDC) **não** ficam salvos no banco —
são sempre calculados a partir de `spins` na hora de exibir, usando
`js/calculations.js` como única fonte da verdade.

### Rodando o teste de sanidade dos cálculos

Se você (ou alguém te ajudando) tiver o Node.js instalado, pode conferir que
os cálculos batem com o exemplo da planilha original:

```
node tests/calculations.test.mjs
```

Isso é opcional e só serve para desenvolvimento — o app publicado no GitHub
Pages não depende do Node em nenhum momento.

---

## Limitações conhecidas

- A visualização offline funciona para dados já carregados antes de perder a
  internet (cache do Firestore); criar ou editar dados exige conexão.
- Não existe tela de "esqueci minha senha" no app — se precisar trocar a
  senha, faça isso em **Firebase Console > Authentication > Users**.
- Não há cadastro público: novos usuários só são criados manualmente pelo
  console do Firebase (Passo 5), de propósito, para manter o app privado.
