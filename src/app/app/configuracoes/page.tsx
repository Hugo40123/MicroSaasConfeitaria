import { requirePermission } from "@/lib/current-user";
import { updateStoreSettingsAction } from "@/lib/store-actions";
import { getStoreSettings } from "@/lib/store-settings";
import { changeOwnPasswordAction, createAttendantAction } from "@/lib/user-actions";
import { listTeamUsers } from "@/lib/user-repository";
import { Save, ShieldCheck, Store, ToggleLeft, UserPlus } from "lucide-react";

export default async function SettingsPage() {
  const user = await requirePermission("manage_settings");
  const settingsResult = await getStoreSettings(user.storeId);
  const teamResult = await listTeamUsers(user.storeId);
  const settings = settingsResult.data;
  const isMock = settingsResult.source === "mock";

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1>Dados da loja, venda online e formas de pagamento.</h1>
          <p className="lead">
            Aqui ficam as regras que controlam o portal público e a operação interna.
          </p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Fonte das configurações:{" "}
            {settingsResult.source === "database" ? "PostgreSQL" : "dados de exemplo"}
          </p>
          {isMock ? (
            <p className="form-error" style={{ marginTop: "0.9rem" }}>
              Configurações em modo leitura enquanto o PostgreSQL real não estiver
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
                <span>Link público</span>
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
                <span>Endereço</span>
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

      <section className="split" style={{ marginTop: "1rem" }}>
        <div className="panel">
          <div className="section-head">
            <h2>Equipe</h2>
            <UserPlus aria-hidden="true" />
          </div>
          <form action={createAttendantAction} className="product-form">
            <div className="form-grid">
              <label className="field">
                <span>Nome</span>
                <input className="input" disabled={isMock} name="name" required />
              </label>
              <label className="field">
                <span>E-mail</span>
                <input className="input" disabled={isMock} name="email" required type="email" />
              </label>
              <label className="field">
                <span>Senha temporária</span>
                <input className="input" disabled={isMock} minLength={8} name="password" required type="password" />
              </label>
            </div>
            <div className="actions">
              <button className="btn btn-primary" disabled={isMock} type="submit">
                <UserPlus aria-hidden="true" />
                Criar atendente
              </button>
            </div>
          </form>
          <div className="list" style={{ marginTop: "1rem" }}>
            {teamResult.data.map((teamUser) => (
              <article className="item-card" key={teamUser.id}>
                <div className="item-main">
                  <div>
                    <p className="item-title">{teamUser.name}</p>
                    <p className="item-subtitle">{teamUser.email}</p>
                  </div>
                  <span className="badge neutral">
                    {teamUser.role === "ADMIN" ? "Admin" : "Atendente"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2>Segurança</h2>
            <ShieldCheck aria-hidden="true" />
          </div>
          <form action={changeOwnPasswordAction} className="product-form">
            <label className="field">
              <span>Senha atual</span>
              <input className="input" disabled={isMock} name="currentPassword" required type="password" />
            </label>
            <label className="field">
              <span>Nova senha</span>
              <input className="input" disabled={isMock} minLength={8} name="newPassword" required type="password" />
            </label>
            <div className="actions">
              <button className="btn btn-primary" disabled={isMock} type="submit">
                <ShieldCheck aria-hidden="true" />
                Trocar senha
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
