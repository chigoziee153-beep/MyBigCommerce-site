/**
 * Hydrate Page Builder page widgets with live store data.
 * Widget templates only receive their own fields. Each page template leaves
 * a JSON script and/or <template id="tac-live-*"> for the parts that must
 * stay server-rendered (forms, prices, catalog HTML).
 */
(function () {
  function pageData() {
    var el = document.getElementById("tac-page-data");
    if (!el) return {};
    try {
      return JSON.parse(el.textContent || "{}");
    } catch (e) {
      return {};
    }
  }

  function templateHasNodes(tpl) {
    if (!tpl || !tpl.content) return false;
    var html = tpl.innerHTML || "";
    return html.replace(/\s+/g, "").length > 0;
  }

  function applySlots(host) {
    var add = host.getAttribute("data-add-label");
    var ask = host.getAttribute("data-ask-label");
    var askUrl = host.getAttribute("data-ask-url");
    var qty = host.getAttribute("data-qty-label");
    var button = host.getAttribute("data-button-label");
    if (add) {
      var submit = host.querySelector('[data-tac-slot="add"]');
      if (submit) submit.value = add;
    }
    if (ask) {
      var link = host.querySelector('[data-tac-slot="ask"]');
      if (link) {
        link.textContent = ask;
        if (askUrl) link.setAttribute("href", askUrl);
      }
    }
    if (qty) {
      var label = host.querySelector('[data-tac-slot="qty"]');
      if (label) label.textContent = qty;
    }
    if (button) {
      var btn = host.querySelector("button.tac-btn, button[type='submit']");
      if (btn) btn.textContent = button;
    }
  }

  function hydrate() {
    var data = pageData();

    document.querySelectorAll("[data-tac-text]").forEach(function (el) {
      if (el.getAttribute("data-tac-ready") === "1") return;
      var val = data[el.getAttribute("data-tac-text")];
      if (val == null || val === "") return;
      el.textContent = String(val);
      el.hidden = false;
      el.setAttribute("data-tac-ready", "1");
    });

    document.querySelectorAll("[data-tac-attr]").forEach(function (el) {
      if (el.getAttribute("data-tac-attr-ready") === "1") return;
      el.getAttribute("data-tac-attr").split(/\s+/).forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i < 1) return;
        var key = pair.slice(i + 1);
        if (data[key]) el.setAttribute(pair.slice(0, i), String(data[key]));
      });
      el.setAttribute("data-tac-attr-ready", "1");
    });

    document.querySelectorAll("[data-tac-qty]").forEach(function (el) {
      if (el.getAttribute("data-tac-ready") === "1") return;
      el.setAttribute("data-tac-ready", "1");
      if (data.quantity) el.textContent = " (" + data.quantity + ")";
    });

    document.querySelectorAll("[data-tac-query]").forEach(function (el) {
      if (el.getAttribute("data-tac-ready") === "1") return;
      el.setAttribute("data-tac-ready", "1");
      if (data.query) el.textContent = ": " + data.query;
    });

    document.querySelectorAll("[data-tac-order-id]").forEach(function (el) {
      if (el.getAttribute("data-tac-ready") === "1") return;
      el.setAttribute("data-tac-ready", "1");
      if (data.orderId) el.textContent = " (" + data.orderId + ")";
    });

    document.querySelectorAll("[data-tac-customer-name]").forEach(function (el) {
      if (data.customerName) el.textContent = String(data.customerName);
    });
    document.querySelectorAll("[data-tac-customer-email]").forEach(function (el) {
      if (!data.customerEmail) return;
      el.textContent = String(data.customerEmail);
      var wrap = el.closest("[data-tac-email-wrap]");
      if (wrap) wrap.hidden = false;
    });
    document.querySelectorAll("[data-tac-registered]").forEach(function (el) {
      if (data.customerEmail) el.hidden = false;
    });

    document.querySelectorAll("[data-tac-requirements]").forEach(function (el) {
      if (data.requirements) el.textContent = String(data.requirements);
    });

    document.querySelectorAll("[data-tac-count]").forEach(function (el) {
      if (el.getAttribute("data-tac-ready") === "1") return;
      el.setAttribute("data-tac-ready", "1");
      var suffix = el.getAttribute("data-suffix") || "products";
      var fallback = el.getAttribute("data-fallback") || "Products";
      if (data.categoryCount === 0 || data.categoryCount) {
        el.textContent = data.categoryCount + " " + suffix;
      } else {
        el.textContent = fallback;
      }
    });

    document.querySelectorAll("[data-tac-mount]").forEach(function (host) {
      if (host.getAttribute("data-tac-ready") === "1") return;
      host.setAttribute("data-tac-ready", "1");
      var tpl = document.getElementById("tac-live-" + host.getAttribute("data-tac-mount"));
      if (!templateHasNodes(tpl)) return;
      host.appendChild(tpl.content.cloneNode(true));
      applySlots(host);
    });

    document.querySelectorAll("[data-tac-empty-for]").forEach(function (el) {
      var host = document.querySelector('[data-tac-mount="' + el.getAttribute("data-tac-empty-for") + '"]');
      var empty = !host || !host.children.length;
      el.hidden = !empty;
    });

    document.querySelectorAll("[data-tac-hide-if-empty]").forEach(function (section) {
      var mount = section.matches("[data-tac-mount]")
        ? section
        : section.querySelector("[data-tac-mount]");
      if (!mount || !mount.children.length) section.hidden = true;
    });
  }

  function bindPasswordToggles(root) {
    (root || document).querySelectorAll("[data-tac-password-toggle]").forEach(function (btn) {
      if (btn.getAttribute("data-tac-ready") === "1") return;
      btn.setAttribute("data-tac-ready", "1");
      var showLabel = btn.getAttribute("data-show-label") || "Show";
      var hideLabel = btn.getAttribute("data-hide-label") || "Hide";
      btn.addEventListener("click", function () {
        var input = document.getElementById(btn.getAttribute("data-tac-password-toggle"));
        if (!input) return;
        var reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        btn.textContent = reveal ? hideLabel : showLabel;
        btn.setAttribute("aria-pressed", reveal ? "true" : "false");
      });
    });
  }

  var JOIN_FIELDS = {
    EmailAddress: 1,
    Password: 1,
    ConfirmPassword: 1,
    FirstName: 1,
    LastName: 1,
  };

  function joinField(form, type) {
    var wrap = form.querySelector('.form-field[data-type="' + type + '"]');
    return wrap ? wrap.querySelector("input, select, textarea") : null;
  }

  function showJoinError(form, message) {
    var card = form.closest(".tac-join__card") || document;
    var host = card.querySelector('[data-tac-mount="create-error"]');
    if (!host) return;
    host.innerHTML = "";
    if (!message) return;
    var p = document.createElement("p");
    p.className = "tac-form__error";
    p.setAttribute("role", "alert");
    p.textContent = message;
    host.appendChild(p);
  }

  function joinErrorText(status, body) {
    var message = "";
    if (body && typeof body.message === "string") message = body.message;
    else if (body && typeof body.title === "string") message = body.title;
    if (status === 409) return "There's already an account for that email. Sign in instead.";
    if (status === 429) return "Please confirm you are not a robot and try again.";
    if (message) return message;
    return "We couldn't create the account. Check the fields and try again.";
  }

  function trimJoinFields(form) {
    form.querySelectorAll(".form-field[data-type]").forEach(function (field) {
      if (!JOIN_FIELDS[field.getAttribute("data-type")]) field.remove();
    });
  }

  function bindJoinForm() {
    var form = document.querySelector("form[data-create-account-form]");
    if (!form || form.getAttribute("data-tac-join-ready") === "1") return;
    trimJoinFields(form);
    if (!form.querySelector(".form-field")) return;
    form.setAttribute("data-tac-join-ready", "1");
    var confirm = joinField(form, "ConfirmPassword");
    var password = joinField(form, "Password");
    if (confirm && password) {
      confirm.addEventListener("input", function () {
        confirm.setCustomValidity(confirm.value && confirm.value !== password.value ? "Passwords do not match." : "");
      });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (confirm && password) {
        confirm.setCustomValidity(confirm.value !== password.value ? "Passwords do not match." : "");
      }
      if (!form.reportValidity()) return;
      var tokenEl = form.querySelector('[name="g-recaptcha-response"]');
      var token = tokenEl ? tokenEl.value : "";
      if (!token && window.grecaptcha && window.grecaptcha.getResponse) token = window.grecaptcha.getResponse() || "";
      if (form.querySelector(".g-recaptcha") && !token) {
        showJoinError(form, "Please confirm you are not a robot.");
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      showJoinError(form, "");
      function valueOf(type) {
        var input = joinField(form, type);
        return input ? String(input.value || "").trim() : "";
      }
      var payload = {
        firstName: valueOf("FirstName"),
        lastName: valueOf("LastName"),
        email: valueOf("EmailAddress"),
        password: password ? password.value : "",
      };
      if (token) payload.token = token;
      var data = pageData();
      fetch("/api/storefront/customers", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (res.status === 204 || res.ok) return null;
          return res.json().catch(function () { return {}; }).then(function (body) {
            throw new Error(joinErrorText(res.status, body));
          });
        })
        .then(function () {
          var login = new URLSearchParams();
          login.set("login_email", payload.email.trim());
          login.set("login_pass", payload.password);
          return fetch(data.checkLoginUrl || "/login.php?action=check_login", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: login.toString(),
          }).catch(function () { return null; });
        })
        .then(function () {
          window.location.assign(data.accountUrl || "/account.php");
        })
        .catch(function (err) {
          if (button) button.disabled = false;
          if (window.grecaptcha && window.grecaptcha.reset) window.grecaptcha.reset();
          showJoinError(form, err && err.message ? err.message : "We couldn't create the account. Check the fields and try again.");
        });
    });
  }

  function boot() {
    hydrate();
    bindPasswordToggles(document);
    bindJoinForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  var main = document.getElementById("main-content");
  if (main && window.MutationObserver) {
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        hydrate();
        bindPasswordToggles(document);
        bindJoinForm();
        document.dispatchEvent(new CustomEvent("tac-pb-hydrated"));
      }, 50);
    }).observe(main, { childList: true, subtree: true });
  }
})();
