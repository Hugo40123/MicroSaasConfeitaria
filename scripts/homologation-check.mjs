const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "UPLOAD_STORAGE_DRIVER"
];

function isPlaceholder(name, value) {
  if (!value) return true;
  if (name === "DATABASE_URL") {
    return value.includes("USER:PASSWORD") || value.startsWith("postgresql://user:password@localhost:5432");
  }
  if (name === "NEXT_PUBLIC_APP_URL") {
    return value.includes("seu-dominio.com");
  }
  return false;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

for (const name of required) {
  const value = process.env[name]?.trim();
  if (isPlaceholder(name, value)) {
    fail(`${name} nao esta configurada para homologacao.`);
  }
}

const storageDriver = process.env.UPLOAD_STORAGE_DRIVER?.trim().toLowerCase();

if (storageDriver === "supabase") {
  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"]) {
    if (!process.env[name]?.trim()) {
      fail(`${name} e obrigatoria quando UPLOAD_STORAGE_DRIVER=supabase.`);
    }
  }
}

if (storageDriver && storageDriver !== "local" && storageDriver !== "supabase") {
  fail("UPLOAD_STORAGE_DRIVER deve ser local ou supabase.");
}

if (!process.exitCode) {
  console.log("Configuracao de homologacao pronta.");
}
