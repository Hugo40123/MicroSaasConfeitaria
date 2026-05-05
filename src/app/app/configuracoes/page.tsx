import { requirePermission } from "@/lib/current-user";
import { store } from "@/lib/sample-data";
import { Save, Store, ToggleLeft } from "lucide-react";

export default async function SettingsPage() {
  const user = await requirePermission("manage_settings");

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Configuracoes</p>
          <h1>Dados da loja, venda online e formas de pagamento.</h1>
          <p className="lead">
            Aqui ficam as regras que controlam o portal publico e a operacao interna.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button">
            <Save aria-hidden="true" />
            Salvar
          </button>
        </div>
      </header>

      <section className="split">
        <form className="panel">
          <div className="section-head">
            <h2>Dados da loja</h2>
            <Store aria-hidden="true" />
          </div>
          <div className="grid">
            <label className="field">
              <span>Nome</span>
              <input className="input" defaultValue={user.storeName} />
            </label>
            <label className="field">
              <span>Link publico</span>
              <input className="input" defaultValue={user.storeSlug} />
            </label>
            <label className="field">
              <span>Telefone</span>
              <input className="input" defaultValue={store.phone} />
            </label>
            <label className="field">
              <span>Endereco</span>
              <input className="input" defaultValue={store.address} />
            </label>
          </div>
        </form>

        <section className="panel">
          <div className="section-head">
            <h2>Venda online</h2>
            <ToggleLeft aria-hidden="true" />
          </div>
          <div className="list">
            {[
              "Aceitar pedidos pelo portal",
              "Permitir retirada",
              "Permitir entrega",
              "Solicitar sinal antes da producao"
            ].map((item) => (
              <label className="cart-line" key={item}>
                <span className="item-title">{item}</span>
                <input defaultChecked type="checkbox" />
              </label>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
