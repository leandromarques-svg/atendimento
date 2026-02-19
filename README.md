# Como rodar frontend e backend juntos

1. Instale as dependências do projeto e do backend:
   ```
   npm install
   cd api && npm install && cd ..
   ```

2. Para rodar frontend e backend juntos:
   ```
   npm run start:all
   ```

Se for a primeira vez, o comando acima instalará o pacote npm-run-all automaticamente.
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/126LoFOqrAAYEEBa_YWdH1ebHZhYGXHi4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
