import { h, mount, toast } from "../ui.js";

export function renderLogin(root, store, go) {
  const error = h("p", { class: "alert", role: "alert", hidden: true });
  const email = h("input", { id: "email", type: "email", autocomplete: "email", required: true });
  const pass = h("input", { id: "password", type: "password", autocomplete: "current-password", required: true });
  const btn = h("button", { type: "submit", class: "btn" }, "Ingresar");

  const fail = (m) => { error.textContent = m; error.hidden = false; };

  mount(root,
    h("main", { class: "narrow" },
      h("a", { href: "#/", class: "brand-link" }, "Reputación OS"),
      h("div", { class: "card" },
        h("h1", {}, "Ingresá a tu panel"),
        store.mode === "demo"
          ? h("div", { class: "stack" },
              h("p", { class: "muted" }, "Esta web está en modo demo (todavía no se configuró Firebase)."),
              h("button", { class: "btn", type: "button", onclick: async () => { await store.signIn(); go("#/panel"); } }, "Entrar a la demo"),
            )
          : h("form", { class: "stack", onsubmit: async (e) => {
                e.preventDefault();
                error.hidden = true;
                btn.disabled = true;
                btn.textContent = "Ingresando…";
                try {
                  await store.signIn(email.value.trim(), pass.value);
                  go("#/panel");
                } catch (err) {
                  fail(err.message);
                } finally {
                  btn.disabled = false;
                  btn.textContent = "Ingresar";
                }
              } },
              error,
              h("div", {}, h("label", { for: "email", class: "small strong" }, "Email"), email),
              h("div", {}, h("label", { for: "password", class: "small strong" }, "Contraseña"), pass),
              btn,
              h("button", { type: "button", class: "link small", onclick: async () => {
                if (!email.value.trim()) return fail("Escribí tu email arriba y volvé a tocar «Olvidé mi contraseña».");
                try {
                  await store.resetPassword(email.value.trim());
                  toast("Te enviamos un email para elegir una contraseña nueva.");
                } catch (err) {
                  fail(err.message);
                }
              } }, "Olvidé mi contraseña"),
            ),
      ),
    ),
  );
}
