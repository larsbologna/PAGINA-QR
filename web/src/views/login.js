// Ingreso al panel del negocio.
import { BRAND, brandLogo } from "../brand.js";
import { mapArt } from "../map-art.js";
import { h, icon, mount, spinner } from "../ui.js";

export function renderLogin(root, store, go) {
  document.title = `Ingresar · ${BRAND.name}`;
  const msg = h("div", { "aria-live": "polite" });
  const email = h("input", { id: "email", type: "email", autocomplete: "email", required: true, inputmode: "email" });
  const pass = h("input", { id: "password", type: "password", autocomplete: "current-password", required: true });
  const btn = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, h("span", {}, "Ingresar"));
  const show = (kind, text) => msg.replaceChildren(h("p", { class: kind === "ok" ? "success" : "alert", role: kind === "ok" ? "status" : "alert" }, icon(kind === "ok" ? "check" : "alert", 18), h("span", {}, text)));

  mount(
    root,
    h(
      "div",
      { class: "auth" },
      h("div", { class: "auth-map" }, mapArt("ingreso", { width: 1200, height: 800 })),
      h(
        "main",
        { class: "auth-card" },
        brandLogo({ size: 30, href: "#/" }),
        h("h1", { class: "auth-title" }, "Ingresá a tu panel"),
        h("p", { class: "muted" }, "Las opiniones que recibe tu negocio por el QR."),
        h(
          "form",
          {
            class: "stack",
            onsubmit: async (e) => {
              e.preventDefault();
              if (btn.disabled) return;
              msg.replaceChildren();
              if (!email.value.trim() || !pass.value) return show("err", "Completá tu email y tu contraseña.");
              btn.disabled = true;
              btn.replaceChildren(spinner("Ingresando"), h("span", {}, "Ingresando…"));
              try {
                await store.signIn(email.value.trim(), pass.value);
                go("#/panel");
              } catch (err) {
                show("err", err.message);
                btn.disabled = false;
                btn.replaceChildren(h("span", {}, "Ingresar"));
              }
            },
          },
          msg,
          h("div", { class: "field" }, h("label", { for: "email" }, "Email"), email),
          h("div", { class: "field" }, h("label", { for: "password" }, "Contraseña"), pass),
          btn,
          h(
            "button",
            {
              type: "button",
              class: "btn-link center",
              onclick: async () => {
                if (!email.value.trim()) return show("err", "Escribí tu email arriba y volvé a tocar «Olvidé mi contraseña».");
                try {
                  await store.resetPassword(email.value.trim());
                  show("ok", "Si ese email tiene una cuenta, te llegará un mensaje para elegir una contraseña nueva.");
                } catch (err) {
                  show("err", err.message);
                }
              },
            },
            "Olvidé mi contraseña",
          ),
        ),
      ),
    ),
  );
}
