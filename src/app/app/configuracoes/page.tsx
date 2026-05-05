import { requirePermission } from "@/lib/current-user";
import { updateStoreSettingsAction } from "@/lib/store-actions";
import { getStoreSettings } from "@/lib/store-settings";
import { Save, Store, ToggleLeft } from "lucide-react";

export default async function SettingsPage() {
  const user = await requirePermission("manage_settings");
  const settingsResult = await getStoreSettings(user.storeId);
  const settings = settingsResult.data;
  const isMock = settingsResult.source === "mock";

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Configuracoes</p>
          <h1>Dados da loja, venda online e formas de pagamento.</h1>
          <p className="lead">
            Aqui ficam as regras que controlam o portal publico e a operacao interna.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte das configuracoes:{" "}
            {settingsResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              Configuracoes em modo leitura enquanto o PostgreSQL real nao estiver
              configurado.
            </p>
          ) : null}
        </div>
        <div className="actions">
          <button className="btn btn-primary" disabled={isMock} form="store-settings" type="submit">
            <Save aria-hidden="true" />
            Salvar
          </button>
        </div>
      </header>

      <form action={updateStoreSettingsAction} className="split" id="store-settings">
        <section className="panel">
          <div className="section-head">
            <h2>Dados da loja</h2>
            <Store aria-hidden="true" />
          </div>
          <div className="grid">
            <label className="field">
              <span>Nome</span>
              <input
                className="input"
                defaultValue={settings.name}
                disabled={isMock}
                name="name"
                required
              />
            </label>
            <label className="field">
              <span>Link publico</span>
              <input
                className="input"
                defaultValue={settings.publicSlug}
                disabled={isMock}
                name="publicSlug"
                required
              />
            </label>
            <label className="field">
              <span>Telefone</span>
              <input
                className="input"
                defaultValue={settings.phone}
                disabled={isMock}
                name="phone"
              />
            </label>
            <label className="field">
              <span>WhatsApp</span>
              <input
                className="input"
                defaultValue={settings.whatsapp}
                disabled={isMock}
                name="whatsapp"
              />
            </label>
            <label className="field">
              <span>Endereco</span>
              <input
                className="input"
                defaultValue={settings.address}
                disabled={isMock}
                name="address"
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <h2>Venda online</h2>
            <ToggleLeft aria-hidden="true" />
          </div>
          <div className="list">
            <label className="cart-line">
              <span className="item-title">Aceitar pedidos pelo portal</span>
              <input
                defaultChecked={settings.onlineOrdersEnabled}
                disabled={isMock}
                name="onlineOrdersEnabled"
                type="checkbox"
              />
            </label>
            <label className="cart-line">
              <span className="item-title">Permitir retirada</span>
              <input
                defaultChecked={settings.pickupEnabled}
                disabled={isMock}
                name="pickupEnabled"
                type="checkbox"
              />
            </label>
            <label className="cart-line">
              <span className="item-title">Permitir entrega</span>
              <input
                defaultChecked={settings.deliveryEnabled}
                disabled={isMock}
                name="deliveryEnabled"
                type="checkbox"
              />
            </label>
          </div>
        </section>
      </form>
    </>
  );
}
