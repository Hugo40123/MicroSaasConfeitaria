const baseUrl = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getSetCookie(response) {
  const cookieHeader = response.headers.get("set-cookie");
  if (!cookieHeader) return "";

  return cookieHeader
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers
    }
  });
  const text = await response.text();

  return {
    response,
    text
  };
}

async function login(email) {
  const { response, text } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "12345678"
    })
  });

  assert(response.status === 200, `Login falhou para ${email}: ${response.status} ${text}`);

  const cookie = getSetCookie(response);
  assert(cookie.includes("confeitaria_session="), `Cookie de sessao nao retornou para ${email}.`);

  return cookie;
}

async function expectOk(path, cookie, label, options = {}) {
  const { response, text } = await request(path, { cookie, ...options });

  assert(response.status === 200, `${label} deveria retornar 200, retornou ${response.status}.`);
  assert(!text.includes("Application error"), `${label} renderizou erro de aplicacao.`);

  return text;
}

async function main() {
  console.log(`Smoke test em ${baseUrl}`);

  const health = await request("/api/health");
  assert(
    health.response.status === 200 || health.response.status === 503,
    `Healthcheck retornou status inesperado: ${health.response.status}.`
  );
  await expectOk("/login", "", "Login page");
  await expectOk("/loja/doce-maria", "", "Portal publico");

  const adminCookie = await login("admin@demo.local");
  await expectOk("/app", adminCookie, "Resumo admin");
  await expectOk("/app/produtos", adminCookie, "Produtos admin");
  await expectOk("/app/pedidos", adminCookie, "Pedidos admin");
  await expectOk("/app/configuracoes", adminCookie, "Configuracoes admin");

  const attendantCookie = await login("atendente@demo.local");
  await expectOk("/app/pedidos", attendantCookie, "Pedidos atendente");
  const forbiddenText = await expectOk("/app/produtos", attendantCookie, "Produtos atendente", {
    redirect: "follow"
  });
  assert(
    forbiddenText.includes("Sem permissao"),
    "Atendente deveria ver a tela de sem permissao ao acessar produtos."
  );

  console.log("Smoke test concluido com sucesso.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
