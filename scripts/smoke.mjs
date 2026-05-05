const baseUrl = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || "admin@demo.local";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || "12345678";
const attendantEmail = process.env.SMOKE_ATTENDANT_EMAIL || "atendente@demo.local";
const attendantPassword = process.env.SMOKE_ATTENDANT_PASSWORD || "12345678";
const shouldCreateOrder = process.env.SMOKE_CREATE_ORDER === "true";

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

async function login(email, password) {
  const { response, text } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password
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

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return date.toISOString().slice(0, 10);
}

async function createPortalOrder() {
  const { response, text } = await request("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      storeSlug: "doce-maria",
      customerName: "Cliente Smoke",
      customerWhatsapp: "11999990000",
      fulfillment: "Retirada",
      deliveryDate: tomorrowDate(),
      deliveryTime: "10:30",
      paymentMethod: "PIX",
      customerNotes: "Pedido criado pelo smoke test.",
      items: [
        {
          productId: "p2",
          quantity: 1
        }
      ]
    })
  });

  assert(response.status === 201, `Criacao de pedido falhou: ${response.status} ${text}`);

  const result = JSON.parse(text);
  const code = result.data?.code;
  assert(code, "API de pedido nao retornou codigo.");

  await expectOk(`/pedido/${code}`, "", "Acompanhamento do pedido criado");

  return code;
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

  const createdOrderCode = shouldCreateOrder ? await createPortalOrder() : null;

  const adminCookie = await login(adminEmail, adminPassword);
  await expectOk("/app", adminCookie, "Resumo admin");
  await expectOk("/app/produtos", adminCookie, "Produtos admin");
  const ordersText = await expectOk("/app/pedidos", adminCookie, "Pedidos admin");
  if (createdOrderCode) {
    assert(
      ordersText.includes(createdOrderCode),
      "Pedido criado pelo smoke nao apareceu no painel de pedidos."
    );
  }
  await expectOk("/app/configuracoes", adminCookie, "Configuracoes admin");

  const attendantCookie = await login(attendantEmail, attendantPassword);
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
