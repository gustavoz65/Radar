// One-off helper: writes the bcrypt hash of your password into .env.local.
// Every `$` is escaped as `\$` because @next/env's dotenv-expand otherwise
// treats bcrypt's `$2b$12$...` as variable references and mangles the value
// (observed: 60 chars in the file, 52 after loading).
// Usage:  node set-password.cjs 'your-password'
// The password and the hash are never printed. Delete this file when done.
const fs = require('fs');
const { execFileSync } = require('child_process');
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password || password.trim().length < 4) {
  console.error("Uso: node set-password.cjs 'sua-senha'  (minimo 4 caracteres)");
  process.exit(1);
}
if (!fs.existsSync('.env.local')) {
  console.error('.env.local nao encontrado — rode a partir da raiz do projeto.');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  const escaped = hash.replace(/\$/g, '\\$');
  let text = fs.readFileSync('.env.local', 'utf8');
  const line = `AUTH_USER_PASSWORD_HASH='${escaped}'`;
  if (/^AUTH_USER_PASSWORD_HASH=.*$/m.test(text)) {
    text = text.replace(/^AUTH_USER_PASSWORD_HASH=.*$/m, () => line);
  } else {
    text += `\n${line}\n`;
  }
  fs.writeFileSync('.env.local', text);

  // Real self-check: a FRESH process loads the env exactly the way Next does
  // and verifies the password against what actually arrives in process.env.
  const verdict = execFileSync(
    process.execPath,
    [
      '-e',
      "const{loadEnvConfig}=require('@next/env');loadEnvConfig(process.cwd(),true,{info:()=>{},error:()=>{}});require('bcryptjs').compare(process.argv[1],process.env.AUTH_USER_PASSWORD_HASH||'').then(ok=>console.log(ok))",
      password,
    ],
    { encoding: 'utf8' },
  ).trim();

  if (verdict === 'true') {
    console.log('ok: hash gravado e VERIFICADO contra o env carregado. Reinicie o npm run dev.');
    process.exit(0);
  }
  console.error('ERRO: o hash gravado nao verificou apos o carregamento do env.');
  process.exit(1);
});
