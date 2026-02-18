const application = document.querySelector("#application");

const el = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "text") node.textContent = v;
    else if (k === "className") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
};

const msg = el("div", { id: "msg" });
const out = el("pre");

const input = (labelText, attrs = {}) => {
  const i = el("input", attrs);
  return { wrap: el("div", {}, el("label", { text: labelText }), i), node: i };
};

const textarea = (labelText, attrs = {}) => {
  const t = el("textarea", attrs);
  return { wrap: el("div", {}, el("label", { text: labelText }), t), node: t };
};

const show = (text, ok = true) => {
  msg.style.background = ok ? "#eaffea" : "#ffecec";
  msg.textContent = text;
};

const first = input("First name", { placeholder: "First name" });
const last = input("Last name", { placeholder: "Last name" });
const age = input("Age", { type: "number", min: "0", step: "1", placeholder: "Age" });
const subject = input("Subject", { placeholder: "Subject" });
const degree = input("Degree type", { placeholder: "Degree type" });
const year = input("Year of study", { type: "number", min: "1", step: "1", placeholder: "Year" });
const email = input("Email", { type: "email", placeholder: "name@example.com" });
const desc = textarea("Description (max ~1000 chars)", { rows: "4", maxlength: "1000" });
const pass = input("Password (min 8 chars)", { type: "password", minlength: "8" });

async function refreshUsers() {
  const r = await fetch("/users");
  const data = await r.json();
  out.textContent = JSON.stringify(data, null, 2);
}

async function createUser() {
  const payload = {
    first_name: first.node.value.trim(),
    last_name: last.node.value.trim(),
    age: Number(age.node.value),
    subject: subject.node.value.trim(),
    degree_type: degree.node.value.trim(),
    year_of_study_currunt: Number(year.node.value),
    email: email.node.value.trim().toLowerCase(),
    description: desc.node.value.trim(),
    password: pass.node.value,
  };

  const r = await fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Failed");

  show(`✅ Created user id ${data.id}`, true);

  // clear inputs
  [first.node, last.node, age.node, subject.node, degree.node, year.node, email.node, pass.node].forEach(n => n.value = "");
  desc.node.value = "";

  await refreshUsers();
}

const btn = el("button", {
  text: "Create user",
  onclick: async () => {
    try {
      await createUser();
    } catch (e) {
      show(`❌ ${e.message}`, false);
    }
  },
});

application.append(
  el("h1", { text: "Register user" }),
  msg,
  first.wrap,
  last.wrap,
  age.wrap,
  subject.wrap,
  degree.wrap,
  year.wrap,
  email.wrap,
  desc.wrap,
  pass.wrap,
  btn,
  el("h2", { text: "Users" }),
  el("button", { text: "Refresh", onclick: refreshUsers }),
  out
);

refreshUsers();