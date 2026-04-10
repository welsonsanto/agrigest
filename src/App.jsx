import { useState, useEffect } from "react";

const theme = {
  bg: "#0d1117",
  surface: "#161b22",
  card: "#1c2128",
  border: "#30363d",
  accent: "#2ea043",
  accentDark: "#238636",
  accentLight: "#3fb950",
  gold: "#d4a843",
  text: "#e6edf3",
  muted: "#8b949e",
  danger: "#f85149",
  warning: "#d29922",
  info: "#58a6ff",
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
};

const graosOpcoes = ["Soja", "Milho", "Sorgo", "Milheto", "Gergelim"];
const safrasOpcoes = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
const uid = () => Math.random().toString(36).slice(2, 9);
const padNum = (n) => String(n).padStart(5, "0");

// ─── CÁLCULO DE DESCONTO DE UMIDADE — DUPLA FAIXA ────────────────────────────
function calcDescUmidade(umidade, umRef, umDesc, umDescPesado) {
  const v = parseFloat(umidade) || 0;
  const r = parseFloat(umRef) || 0;
  const pN = parseFloat(umDesc) || 0;
  const pP = parseFloat(umDescPesado) || 0;

  if (v <= r) return { desconto: "0.00", faixa: "normal" };
  if (v < 20) {
    return { desconto: ((v - r) * pN).toFixed(2), faixa: "normal" };
  } else {
    return { desconto: ((v - r) * pP).toFixed(2), faixa: "pesada" };
  }
}

function calcDesc(val, ref, pct) {
  const v = parseFloat(val) || 0, r = parseFloat(ref) || 0, p = parseFloat(pct) || 0;
  return v > r ? ((v - r) * p).toFixed(2) : "0.00";
}

const Btn = ({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) => {
  const variants = {
    primary: { background: theme.accent, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: theme.text, border: `1px solid ${theme.border}` },
    danger: { background: `${theme.danger}22`, color: theme.danger, border: `1px solid ${theme.danger}44` },
    gold: { background: `${theme.gold}22`, color: theme.gold, border: `1px solid ${theme.gold}44` },
    info: { background: `${theme.info}22`, color: theme.info, border: `1px solid ${theme.info}44` },
  };
  const sizes = {
    sm: { padding: "5px 12px", fontSize: 12 },
    md: { padding: "9px 18px", fontSize: 13 },
    lg: { padding: "13px 26px", fontSize: 15 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size],
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", fontWeight: 600, transition: "all .2s",
      opacity: disabled ? .5 : 1, whiteSpace: "nowrap", ...style,
    }}>{children}</button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, ...style }}>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children, width = 600 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, children, style = {} }) => (
  <div style={{ marginBottom: 14, ...style }}>
    <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>{label}</div>
    {children}
  </div>
);

const Input = ({ value, onChange, onKeyDown, placeholder, type = "text", readOnly = false, highlight, step }) => (
  <input
    type={type} step={step} value={value || ""} onChange={onChange} onKeyDown={onKeyDown}
    placeholder={placeholder} readOnly={readOnly}
    style={{
      width: "100%", background: readOnly ? theme.surface : theme.bg,
      border: `1px solid ${theme.border}`, color: highlight || theme.text,
      padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13,
      outline: "none", boxSizing: "border-box"
    }}
  />
);

const Select = ({ value, onChange, children }) => (
  <select value={value || ""} onChange={onChange} style={{
    width: "100%", background: theme.bg, border: `1px solid ${theme.border}`,
    color: theme.text, padding: "9px 12px", borderRadius: 8,
    fontFamily: "inherit", fontSize: 13, outline: "none"
  }}>
    {children}
  </select>
);

const Row = ({ children, cols = 2 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, marginBottom: 4 }}>
    {children}
  </div>
);

const SectionTitle = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
    <h2 style={{ fontWeight: 800, fontSize: 20, color: theme.text, margin: 0 }}>{children}</h2>
    {action}
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div style={{ textAlign: "center", padding: "48px 20px", color: theme.muted }}>
    <div style={{ fontSize: 44, marginBottom: 10 }}>{icon}</div>
    <p style={{ fontSize: 13 }}>{text}</p>
  </div>
);

const Badge = ({ children, color = "green" }) => {
  const colors = {
    green: { bg: `${theme.accent}22`, text: theme.accentLight, border: `${theme.accent}44` },
    gold: { bg: `${theme.gold}22`, text: theme.gold, border: `${theme.gold}44` },
    blue: { bg: `${theme.info}22`, text: theme.info, border: `${theme.info}44` },
    red: { bg: `${theme.danger}22`, text: theme.danger, border: `${theme.danger}44` },
  };
  const c = colors[color] || colors.green;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`
    }}>{children}</span>
  );
};

const Table = ({ headers, rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h} style={{
              textAlign: "left", padding: "10px 14px", fontSize: 11, letterSpacing: 1,
              textTransform: "uppercase", color: theme.muted, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap"
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

const Td = ({ children }) => (
  <td style={{ padding: "11px 14px", borderBottom: `1px solid ${theme.border}18`, fontSize: 13 }}>
    {children}
  </td>
);

const STORAGE_KEY = "agrigest_data";

const initState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.talhoes) parsed.talhoes = [];
      return parsed;
    }
  } catch (e) {}
  return {
    fazenda: null, clientes: [], transportadoras: [], fornecedores: [], caminhoes: [], motoristas: [],
    contratos: [], insumos: [], estoqueInsumos: [], recebimentoInsumos: [],
    romaneiosEntrada: [], romaneiosSaida: [], romaneiosEntradaLixeira: [], romaneiosSaidalixeira: [],
    expedicoes: [], classificacaoParams: {}, romaneioCounter: 1, talhoes: [],
    usuarios: [{ id: "1", nome: "Administrador", login: "admin", senha: "agro2024", role: "admin" }]
  };
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin, usuarios }) {
  const [login, setLogin]       = useState("");
  const [senha, setSenha]       = useState("");
  const [err, setErr]           = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const handleLogin = () => {
    const loginTrim = login.trim().toLowerCase();
    const senhaTrim = senha.trim();
    // Busca ignorando maiúsculas/minúsculas no login e sem espaços extras
    const user = (usuarios || []).find(
      u => u.login?.trim().toLowerCase() === loginTrim && u.senha?.trim() === senhaTrim
    );
    if (user) {
      setErr("");
      onLogin(user);
    } else {
      setErr("Usuário ou senha inválidos.");
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 65% 40%, ${theme.accent}1a 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, ${theme.gold}12 0%, transparent 50%)` }} />
      <div style={{ width: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 68, height: 68, background: `linear-gradient(135deg,${theme.accent},${theme.gold})`, borderRadius: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 34, marginBottom: 14, boxShadow: `0 0 40px ${theme.accent}44` }}>🌾</div>
          <h1 style={{ fontWeight: 900, fontSize: 30, color: theme.text, letterSpacing: -1, margin: 0 }}>AgriGest</h1>
          <p style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>Sistema de Gestão do Agronegócio</p>
        </div>
        <Card>
          <Field label="Usuário">
            <Input
              value={login}
              onChange={e => { setLogin(e.target.value); setErr(""); }}
              onKeyDown={handleKey}
              placeholder="Digite seu usuário"
            />
          </Field>
          <Field label="Senha">
            <div style={{ position: "relative" }}>
              <input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={e => { setSenha(e.target.value); setErr(""); }}
                onKeyDown={handleKey}
                placeholder="••••••••"
                style={{
                  width: "100%", background: theme.bg, border: `1px solid ${err ? theme.danger : theme.border}`,
                  color: theme.text, padding: "9px 42px 9px 12px", borderRadius: 8,
                  fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowSenha(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: theme.muted, fontSize: 16, lineHeight: 1 }}
              >{showSenha ? "🙈" : "👁️"}</button>
            </div>
          </Field>

          {err && (
            <div style={{ background: `${theme.danger}18`, border: `1px solid ${theme.danger}44`, borderRadius: 8, padding: "8px 12px", marginBottom: 10, color: theme.danger, fontSize: 13 }}>
              ⚠️ {err}
            </div>
          )}

          <Btn onClick={handleLogin} style={{ width: "100%", marginTop: 4, padding: 13 }} size="lg">
            Entrar no Sistema
          </Btn>
        </Card>
      </div>
    </div>
  );
}

// ─── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
const navGroups = (isAdmin) => [
  {
    title: "🌾 GRÃOS", icon: "🌾",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "fazenda", label: "Fazenda", icon: "🏡" },
      { id: "graos", label: "Grãos em Produção", icon: "🌾" },
      { id: "talhoes", label: "Talhões", icon: "🗺️" },
      { id: "produtividade", label: "Produtividade", icon: "📈" },
      { id: "classificacao", label: "Classificação", icon: "⚙️" },
      { id: "contratos", label: "Contratos", icon: "📋" },
      { id: "romaneiosEntrada", label: "Recebimento de Grãos", icon: "📥" },
      { id: "romaneiosSaida", label: "Expedição de Grãos", icon: "📤" },
      { id: "expedicao", label: "Agendamentos", icon: "🚚" },
      { id: "relatorioMotoristas", label: "Rel. Motoristas", icon: "📊" },
      { id: "relatoriosDiarios", label: "Rel. Diário de Colheita", icon: "📅" },
    ]
  },
  {
    title: "🧪 INSUMOS", icon: "🧪",
    items: [
      { id: "insumos", label: "Cadastro de Insumos", icon: "🧪" },
      { id: "estoque", label: "Estoque", icon: "📦" },
      { id: "recebimentoInsumos", label: "Recebimento de Insumos", icon: "📥" },
    ]
  },
  {
    title: "📋 CADASTROS", icon: "📋",
    items: [
      { id: "clientes", label: "Clientes", icon: "👥" },
      { id: "transportadoras", label: "Transportadoras", icon: "🚛" },
      { id: "fornecedores", label: "Fornecedores", icon: "🏭" },
      { id: "caminhoes", label: "Caminhões", icon: "🚜" },
      { id: "motoristas", label: "Motoristas", icon: "👷" },
    ]
  },
  ...(isAdmin ? [{
    title: "⚙️ ADMIN", icon: "⚙️",
    items: [
      { id: "usuarios", label: "Usuários", icon: "👥" },
      { id: "lixeira", label: "Lixeira", icon: "🗑️" },
    ]
  }] : [])
];

function Sidebar({ active, setActive, fazenda, usuario }) {
  const groups = navGroups(usuario?.role === "admin");
  return (
    <div style={{ width: 240, background: theme.surface, borderRight: `1px solid ${theme.border}`, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
      <div style={{ padding: "16px 14px", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${theme.accent},${theme.gold})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌾</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: theme.text }}>AgriGest</div>
            <div style={{ fontSize: 10, color: theme.muted, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fazenda?.nome || "Sem fazenda"}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: theme.gold, marginTop: 8, textAlign: "center" }}>
          👤 {usuario?.nome} ({usuario?.role === "admin" ? "Admin" : "Operador"})
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {groups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: theme.gold, marginBottom: 8, paddingLeft: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{group.icon}</span><span>{group.title}</span>
            </div>
            {group.items.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 7,
                background: active === item.id ? `${theme.accent}22` : "transparent",
                border: active === item.id ? `1px solid ${theme.accent}44` : "1px solid transparent",
                color: active === item.id ? theme.accentLight : theme.muted,
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                fontWeight: active === item.id ? 600 : 400, textAlign: "left", transition: "all .15s", marginBottom: 2,
              }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ state }) {
  const stats = [
    { label: "Contratos Ativos", value: state.contratos.filter(c => c.status === "Ativo").length, icon: "📋", color: theme.accent },
    { label: "Romaneios Entrada", value: state.romaneiosEntrada.length, icon: "📥", color: theme.info },
    { label: "Romaneios Saída", value: state.romaneiosSaida.length, icon: "📤", color: theme.gold },
    { label: "Estoque (un)", value: state.estoqueInsumos.reduce((a, i) => a + (parseFloat(i.qtd) || 0), 0).toFixed(0), icon: "📦", color: theme.warning },
    { label: "Clientes", value: state.clientes.length, icon: "👥", color: theme.accentLight },
    { label: "Motoristas", value: state.motoristas.length, icon: "👷", color: theme.muted },
  ];
  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>
      {state.fazenda ? (
        <Card style={{ marginBottom: 20, background: `linear-gradient(135deg,${theme.accent}14,${theme.gold}0a)`, borderColor: `${theme.accent}44` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, background: `${theme.accent}2a`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>{state.fazenda.nome}</div>
              <div style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>{state.fazenda.produtor} · {state.fazenda.cidade}/{state.fazenda.estado}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {state.fazenda.graos?.map(g => <Badge key={g} color="green">{g}</Badge>)}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 20, borderColor: `${theme.gold}44`, background: `${theme.gold}0a` }}>
          <p style={{ color: theme.gold, fontSize: 13 }}>⚠️ Nenhuma fazenda cadastrada. Vá em <strong>Fazenda</strong> para começar.</p>
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ borderLeft: `3px solid ${s.color}`, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: theme.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontWeight: 900, fontSize: 32, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FAZENDA ──────────────────────────────────────────────────────────────────
function Fazenda({ state, setState }) {
  const [form, setForm] = useState(state.fazenda || { nome: "", produtor: "", cpfCnpj: "", ie: "", cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "", graos: [], logo: null });
  const [saved, setSaved] = useState(false);
  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleGrao = g => fp("graos", form.graos.includes(g) ? form.graos.filter(x => x !== g) : [...form.graos, g]);
  const handleLogo = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => fp("logo", ev.target.result); r.readAsDataURL(file);
  };
  const save = () => { setState(s => ({ ...s, fazenda: form })); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  return (
    <div>
      <SectionTitle>🏡 Cadastro da Fazenda</SectionTitle>
      <Card>
        <div style={{ display: "flex", gap: 20, marginBottom: 20, alignItems: "flex-start" }}>
          <div style={{ width: 100, height: 100, background: theme.bg, border: `2px dashed ${theme.border}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {form.logo ? <img src={form.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 36 }}>🏡</span>}
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Logo da Fazenda">
              <input type="file" accept="image/*" onChange={handleLogo} style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "8px 12px", borderRadius: 8, fontSize: 12, width: "100%", cursor: "pointer" }} />
            </Field>
          </div>
        </div>
        <Row>
          <Field label="Nome da Fazenda"><Input value={form.nome} onChange={e => fp("nome", e.target.value)} placeholder="Ex: Fazenda São João" /></Field>
          <Field label="Nome do Produtor"><Input value={form.produtor} onChange={e => fp("produtor", e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="CPF / CNPJ"><Input value={form.cpfCnpj} onChange={e => fp("cpfCnpj", e.target.value)} /></Field>
          <Field label="Inscrição Estadual (I.E)"><Input value={form.ie} onChange={e => fp("ie", e.target.value)} /></Field>
        </Row>
        <Row cols={4}>
          <Field label="CEP"><Input value={form.cep} onChange={e => fp("cep", e.target.value)} /></Field>
          <div style={{ gridColumn: "span 2" }}><Field label="Endereço"><Input value={form.endereco} onChange={e => fp("endereco", e.target.value)} /></Field></div>
          <Field label="Número"><Input value={form.numero} onChange={e => fp("numero", e.target.value)} /></Field>
        </Row>
        <Row cols={3}>
          <Field label="Bairro"><Input value={form.bairro} onChange={e => fp("bairro", e.target.value)} /></Field>
          <Field label="Cidade"><Input value={form.cidade} onChange={e => fp("cidade", e.target.value)} /></Field>
          <Field label="UF"><Input value={form.estado} onChange={e => fp("estado", e.target.value.slice(0, 2).toUpperCase())} /></Field>
        </Row>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>Grãos Produzidos</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {graosOpcoes.map(g => (
              <button key={g} onClick={() => toggleGrao(g)} style={{
                padding: "7px 16px", borderRadius: 20, cursor: "pointer",
                border: form.graos.includes(g) ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                background: form.graos.includes(g) ? `${theme.accent}28` : "transparent",
                color: form.graos.includes(g) ? theme.accentLight : theme.muted,
                fontFamily: "inherit", fontSize: 12, fontWeight: 600, transition: "all .2s",
              }}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Btn onClick={save}>💾 Salvar Fazenda</Btn>
          {saved && <span style={{ color: theme.accent, fontSize: 13 }}>✓ Salvo!</span>}
        </div>
      </Card>
    </div>
  );
}

// ─── CLASSIFICAÇÃO ───────────────────────────────────────────────────────────
function Classificacao({ state, setState }) {
  const available = state.fazenda?.graos || graosOpcoes;
  const [grao, setGrao] = useState(available[0]);
  const [params, setParams] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setParams(state.classificacaoParams?.[grao] || {
      umRef: "", umDesc: "", umDescPesado: "",
      impRef: "", impDesc: "",
      avRef: "", avDesc: "",
    });
  }, [grao, state.classificacaoParams]);

  const fp = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const save = () => {
    setState(s => ({ ...s, classificacaoParams: { ...s.classificacaoParams, [grao]: params } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const blockStyle = { border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 };
  const blockHeader = (icon, title, sub, color) => (
    <div style={{ padding: "10px 16px", background: `${color}0f`, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div>
      <SectionTitle>⚙️ Parâmetros de Classificação</SectionTitle>
      <Card style={{ marginBottom: 14 }}>
        <p style={{ color: theme.muted, fontSize: 13, marginBottom: 14 }}>
          Configure as tolerâncias por grão. Aplicadas automaticamente nos romaneios de recebimento (entrada).
        </p>
        <Field label="Grão">
          <Select value={grao} onChange={e => setGrao(e.target.value)}>
            {available.map(g => <option key={g}>{g}</option>)}
          </Select>
        </Field>
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 16, color: theme.gold, marginBottom: 18 }}>Parâmetros para: {grao}</div>

        <div style={blockStyle}>
          {blockHeader("💧", "Umidade — Faixa Normal", "Aplicada quando umidade aferida está entre a tolerância e 19,99%", theme.info)}
          <div style={{ padding: 16, background: theme.bg }}>
            <Row cols={2}>
              <Field label="Tolerância máxima (%)">
                <Input type="number" step="0.01" value={params.umRef} onChange={e => fp("umRef", e.target.value)} placeholder="Ex: 14" />
              </Field>
              <Field label="Desconto por ponto acima (%)">
                <Input type="number" step="0.01" value={params.umDesc} onChange={e => fp("umDesc", e.target.value)} placeholder="Ex: 1.5" />
              </Field>
            </Row>
          </div>
        </div>

        <div style={blockStyle}>
          {blockHeader("🌊", "Umidade — Faixa Pesada", "Aplicada quando umidade aferida é igual ou superior a 20%", theme.danger)}
          <div style={{ padding: 16, background: `${theme.danger}06` }}>
            <Field label="Desconto por ponto acima da tolerância (%)">
              <Input type="number" step="0.01" value={params.umDescPesado} onChange={e => fp("umDescPesado", e.target.value)} placeholder="Ex: 2.0" />
            </Field>
          </div>
        </div>

        <div style={blockStyle}>
          {blockHeader("🪨", "Impureza", null, theme.warning)}
          <div style={{ padding: 16, background: theme.bg }}>
            <Row cols={2}>
              <Field label="Tolerância máxima (%)">
                <Input type="number" step="0.01" value={params.impRef} onChange={e => fp("impRef", e.target.value)} placeholder="Ex: 1" />
              </Field>
              <Field label="Desconto por ponto acima (%)">
                <Input type="number" step="0.01" value={params.impDesc} onChange={e => fp("impDesc", e.target.value)} placeholder="Ex: 1.0" />
              </Field>
            </Row>
          </div>
        </div>

        <div style={blockStyle}>
          {blockHeader("🔴", "Avariado", null, theme.danger)}
          <div style={{ padding: 16, background: theme.bg }}>
            <Row cols={2}>
              <Field label="Tolerância máxima (%)">
                <Input type="number" step="0.01" value={params.avRef} onChange={e => fp("avRef", e.target.value)} placeholder="Ex: 8" />
              </Field>
              <Field label="Desconto por ponto acima (%)">
                <Input type="number" step="0.01" value={params.avDesc} onChange={e => fp("avDesc", e.target.value)} placeholder="Ex: 1.0" />
              </Field>
            </Row>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Btn onClick={save}>💾 Salvar Parâmetros</Btn>
          {saved && <span style={{ color: theme.accent, fontSize: 13 }}>✓ Salvo!</span>}
        </div>
      </Card>
    </div>
  );
}

// ─── GENERIC CRUD ─────────────────────────────────────────────────────────────
function CrudPage({ title, icon, fields, stateKey, state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const items = (state[stateKey] || []).filter(i => Object.values(i).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  const tableFields = fields.filter(f => f.table);
  const openNew = () => { setForm({}); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, [stateKey]: s[stateKey].filter(i => i.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, [stateKey]: editing ? s[stateKey].map(i => i.id === editing ? item : i) : [...s[stateKey], item] }));
    setOpen(false);
  };
  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo</Btn>}>{icon} {title}s</SectionTitle>
      <Card>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Buscar ${title.toLowerCase()}...`} />
        <div style={{ marginTop: 16 }}>
          {items.length === 0 ? (
            <EmptyState icon={icon} text={`Nenhum ${title.toLowerCase()} cadastrado.`} />
          ) : (
            <Table
              headers={[...tableFields.map(f => f.label), "Ações"]}
              rows={items.map(item => (
                <tr key={item.id}>
                  {tableFields.map(f => <Td key={f.key}>{item[f.key] || "—"}</Td>)}
                  <Td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="secondary" onClick={() => openEdit(item)}>✏️</Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(item.id)}>🗑️</Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            />
          )}
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} ${title}`}>
        {fields.map(f => (
          <Field key={f.key} label={f.label}>
            {f.type === "select" ? (
              <Select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
                <option value="">Selecione...</option>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </Select>
            ) : f.type === "file" ? (
              <div>
                <input type="file" onChange={e => {
                  const file = e.target.files[0]; if (!file) return;
                  const r = new FileReader();
                  r.onload = ev => setForm(p => ({ ...p, [f.key]: ev.target.result, [f.key + "Name"]: file.name }));
                  r.readAsDataURL(file);
                }} style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "8px 12px", borderRadius: 8, fontSize: 12, width: "100%", cursor: "pointer" }} />
                {form[f.key + "Name"] && <p style={{ color: theme.muted, fontSize: 11, marginTop: 4 }}>📎 {form[f.key + "Name"]}</p>}
                {f.optional && <p style={{ color: theme.muted, fontSize: 10, marginTop: 2 }}>Campo opcional</p>}
              </div>
            ) : (
              <Input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || ""} />
            )}
          </Field>
        ))}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────
function Usuarios({ state, setState }) {
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState({});
  const [editing, setEditing] = useState(null);
  const [showSenha, setShowSenha]     = useState(false);
  const [confirma, setConfirma]       = useState("");
  const [erroForm, setErroForm]       = useState("");

  const usuarios = state.usuarios || [];

  const openNew = () => {
    setForm({ role: "operador", nome: "", login: "", senha: "" });
    setEditing(null);
    setConfirma("");
    setErroForm("");
    setShowSenha(false);
    setOpen(true);
  };

  const openEdit = u => {
    // Ao editar, mantemos a senha já salva mas exibimos em texto para o admin ver
    setForm({ ...u });
    setEditing(u.id);
    setConfirma(u.senha); // preenche confirmação com a senha atual
    setErroForm("");
    setShowSenha(false);
    setOpen(true);
  };

  const del = id => {
    if (id === "1") { alert("O usuário administrador padrão não pode ser excluído."); return; }
    if (usuarios.length === 1) { alert("Não é possível excluir o único usuário."); return; }
    if (window.confirm("Excluir este usuário?"))
      setState(s => ({ ...s, usuarios: s.usuarios.filter(u => u.id !== id) }));
  };

  const save = () => {
    setErroForm("");
    if (!form.nome?.trim())  { setErroForm("Preencha o nome completo."); return; }
    if (!form.login?.trim()) { setErroForm("Preencha o login."); return; }
    if (!form.senha?.trim()) { setErroForm("Preencha a senha."); return; }
    if (form.senha.length < 4) { setErroForm("A senha deve ter pelo menos 4 caracteres."); return; }
    if (form.senha !== confirma) { setErroForm("As senhas não coincidem."); return; }

    // Verifica login duplicado
    const loginExiste = usuarios.some(u => u.login === form.login.trim() && u.id !== editing);
    if (loginExiste) { setErroForm("Este login já está em uso por outro usuário."); return; }

    const item = { ...form, login: form.login.trim(), nome: form.nome.trim(), id: editing || uid() };
    setState(s => ({
      ...s,
      usuarios: editing
        ? s.usuarios.map(u => u.id === editing ? item : u)
        : [...s.usuarios, item]
    }));
    setOpen(false);
  };

  const fp = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const senhaInput = (label, val, onChange) => (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <input
          type={showSenha ? "text" : "password"}
          value={val}
          onChange={onChange}
          autoComplete="new-password"
          style={{
            width: "100%", background: theme.bg, border: `1px solid ${theme.border}`,
            color: theme.text, padding: "9px 40px 9px 12px", borderRadius: 8,
            fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box"
          }}
        />
        <button
          type="button"
          onClick={() => setShowSenha(s => !s)}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: theme.muted, fontSize: 16, lineHeight: 1
          }}
        >{showSenha ? "🙈" : "👁️"}</button>
      </div>
    </Field>
  );

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Usuário</Btn>}>👥 Usuários do Sistema</SectionTitle>

      <Card style={{ marginBottom: 16, background: `${theme.info}0a`, borderColor: `${theme.info}33` }}>
        <p style={{ color: theme.muted, fontSize: 13 }}>
          ℹ️ Usuários cadastrados aqui podem acessar o sistema com seu login e senha. O administrador pode criar, editar e excluir usuários.
        </p>
      </Card>

      <Card>
        {usuarios.length === 0 ? <EmptyState icon="👥" text="Nenhum usuário cadastrado." /> : (
          <Table
            headers={["Nome", "Login", "Nível de Acesso", "Ações"]}
            rows={usuarios.map(u => (
              <tr key={u.id}>
                <Td><strong>{u.nome}</strong></Td>
                <Td>
                  <span style={{ fontFamily: "monospace", background: theme.surface, padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>
                    {u.login}
                  </span>
                </Td>
                <Td>
                  <Badge color={u.role === "admin" ? "gold" : "blue"}>
                    {u.role === "admin" ? "👑 Administrador" : "👤 Operador"}
                  </Badge>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(u)}>✏️ Editar</Btn>
                    <Btn size="sm" variant="danger"    onClick={() => del(u.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Usuário`}>
        <Field label="Nome Completo">
          <Input value={form.nome} onChange={e => fp("nome", e.target.value)} placeholder="Ex: João da Silva" />
        </Field>

        <Field label="Login (usado para entrar no sistema)">
          <Input
            value={form.login}
            onChange={e => fp("login", e.target.value.toLowerCase().replace(/\s/g, ""))}
            placeholder="Ex: joao.silva"
          />
        </Field>

        <Row>
          {senhaInput("Senha", form.senha || "", e => fp("senha", e.target.value))}
          {senhaInput("Confirmar Senha", confirma, e => setConfirma(e.target.value))}
        </Row>

        <Field label="Nível de Acesso">
          <Select value={form.role || "operador"} onChange={e => fp("role", e.target.value)}>
            <option value="operador">👤 Operador</option>
            <option value="admin">👑 Administrador</option>
          </Select>
        </Field>

        {erroForm && (
          <div style={{ background: `${theme.danger}18`, border: `1px solid ${theme.danger}44`, borderRadius: 8, padding: "10px 14px", marginTop: 8, color: theme.danger, fontSize: 13 }}>
            ⚠️ {erroForm}
          </div>
        )}

        {/* Dica visual de força da senha */}
        {form.senha && (
          <div style={{ marginTop: 8, fontSize: 12, color: theme.muted }}>
            Senha: {" "}
            {form.senha.length < 4
              ? <span style={{ color: theme.danger }}>muito curta</span>
              : form.senha.length < 8
                ? <span style={{ color: theme.warning }}>razoável</span>
                : <span style={{ color: theme.accent }}>boa ✓</span>
            }
            {form.senha && confirma && form.senha !== confirma && (
              <span style={{ color: theme.danger, marginLeft: 12 }}>senhas não coincidem ✗</span>
            )}
            {form.senha && confirma && form.senha === confirma && (
              <span style={{ color: theme.accent, marginLeft: 12 }}>senhas coincidem ✓</span>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar Usuário</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── LIXEIRA ──────────────────────────────────────────────────────────────────
function Lixeira({ state, setState }) {
  const [aba, setAba] = useState("entrada");
  const restaurar = (item, tipo) => {
    if (window.confirm(`Restaurar romaneio Nº ${item.numero}?`)) {
      const chave = tipo === "entrada" ? "romaneiosEntrada" : "romaneiosSaida";
      const lixChave = tipo === "entrada" ? "romaneiosEntradaLixeira" : "romaneiosSaidalixeira";
      setState(s => ({ ...s, [chave]: [...s[chave], item], [lixChave]: s[lixChave].filter(i => i.id !== item.id) }));
    }
  };
  const excluirPermanente = (item, tipo) => {
    if (window.confirm(`Excluir permanentemente o romaneio Nº ${item.numero}?`)) {
      const lixChave = tipo === "entrada" ? "romaneiosEntradaLixeira" : "romaneiosSaidalixeira";
      setState(s => ({ ...s, [lixChave]: s[lixChave].filter(i => i.id !== item.id) }));
    }
  };
  const lixeiraEntrada = state.romaneiosEntradaLixeira || [];
  const lixeiraSaida = state.romaneiosSaidalixeira || [];
  return (
    <div>
      <SectionTitle>🗑️ Lixeira</SectionTitle>
      <Card>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: `1px solid ${theme.border}`, paddingBottom: 10 }}>
          {[["entrada", "📥 Recebimentos", lixeiraEntrada.length], ["saida", "📤 Expedições", lixeiraSaida.length]].map(([k, l, c]) => (
            <button key={k} onClick={() => setAba(k)} style={{ padding: "8px 20px", background: aba === k ? `${theme.accent}22` : "transparent", border: aba === k ? `1px solid ${theme.accent}44` : "none", borderRadius: 8, color: aba === k ? theme.accentLight : theme.muted, cursor: "pointer", fontFamily: "inherit" }}>
              {l} ({c})
            </button>
          ))}
        </div>
        {(aba === "entrada" ? lixeiraEntrada : lixeiraSaida).length === 0 ? (
          <EmptyState icon="🗑️" text="Lixeira vazia." />
        ) : (
          <Table
            headers={aba === "entrada" ? ["Nº", "Data", "Grão", "Placa", "Motorista", "Peso Final", "Ações"] : ["Nº", "Data", "Grão", "Placa", "Motorista", "Contrato", "Peso Final", "Ações"]}
            rows={(aba === "entrada" ? lixeiraEntrada : lixeiraSaida).map(r => (
              <tr key={r.id} style={{ opacity: 0.7 }}>
                <Td><span style={{ fontFamily: "monospace", color: theme.info }}>{r.numero}</span></Td>
                <Td>{r.data}</Td><Td>{r.grao}</Td><Td>{r.placa}</Td><Td>{r.motorista}</Td>
                {aba === "saida" && <Td>{r.contrato}</Td>}
                <Td><strong>{r.pesoFinal} kg</strong></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="primary" onClick={() => restaurar(r, aba)}>↩️ Restaurar</Btn>
                    <Btn size="sm" variant="danger" onClick={() => excluirPermanente(r, aba)}>🗑️ Excluir</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>
    </div>
  );
}

// ─── CONTRATOS ────────────────────────────────────────────────────────────────
function Contratos({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const contratos = state.contratos || [];
  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ status: "Ativo" }); setEditing(null); setOpen(true); };
  const openEdit = c => { setForm({ ...c }); setEditing(c.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, contratos: s.contratos.filter(c => c.id !== id) }));
  const save = () => {
    const c = { ...form, id: editing || uid(), numero: editing ? form.numero : `CT-${padNum(contratos.length + 1)}` };
    setState(s => ({ ...s, contratos: editing ? s.contratos.map(x => x.id === editing ? c : x) : [...s.contratos, c] }));
    setOpen(false);
  };
  const statusColor = { Ativo: "green", Encerrado: "red", Pendente: "gold" };
  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Contrato</Btn>}>📋 Contratos</SectionTitle>
      <Card>
        {contratos.length === 0 ? <EmptyState icon="📋" text="Nenhum contrato cadastrado." /> : (
          <Table headers={["Número", "Cliente", "Grão", "Qtd (sc)", "Preço", "Vencimento", "Status", "Ações"]} rows={contratos.map(c => (
            <tr key={c.id}>
              <Td><span style={{ fontFamily: "monospace", color: theme.info }}>{c.numero}</span></Td>
              <Td>{c.cliente}</Td><Td>{c.grao}</Td><Td>{c.quantidade}</Td>
              <Td>R$ {c.preco}</Td><Td>{c.vencimento}</Td>
              <Td><Badge color={statusColor[c.status] || "gold"}>{c.status}</Badge></Td>
              <Td>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn size="sm" variant="secondary" onClick={() => openEdit(c)}>✏️</Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(c.id)}>🗑️</Btn>
                </div>
              </Td>
            </tr>
          ))} />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Contrato`}>
        <Row>
          <Field label="Cliente">
            <Select value={form.cliente} onChange={e => fp("cliente", e.target.value)}>
              <option value="">Selecione...</option>
              {state.clientes.map(c => <option key={c.id}>{c.nome}</option>)}
            </Select>
          </Field>
          <Field label="Grão">
            <Select value={form.grao} onChange={e => fp("grao", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.fazenda?.graos || graosOpcoes).map(g => <option key={g}>{g}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Quantidade (sc)"><Input type="number" value={form.quantidade} onChange={e => fp("quantidade", e.target.value)} /></Field>
          <Field label="Preço/Saca (R$)"><Input type="number" value={form.preco} onChange={e => fp("preco", e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Vencimento"><Input type="date" value={form.vencimento} onChange={e => fp("vencimento", e.target.value)} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => fp("status", e.target.value)}>
              {["Ativo", "Pendente", "Encerrado"].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Observações">
          <textarea value={form.obs || ""} onChange={e => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── TALHÕES ──────────────────────────────────────────────────────────────────
function Talhoes({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [talhaoNome, setTalhaoNome] = useState("");
  const [culturas, setCulturas] = useState([]);
  const [saved, setSaved] = useState(false);
  const talhoes = state.talhoes || [];
  const graosDisponiveis = state.fazenda?.graos || graosOpcoes;

  const openNew = () => {
    setTalhaoNome(""); setCulturas([{ id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]);
    setEditing(null); setOpen(true); setSaved(false);
  };
  const openEdit = (t) => {
    setTalhaoNome(t.nome);
    setCulturas(t.culturas?.length > 0 ? t.culturas.map(c => ({ ...c })) : [{ id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]);
    setEditing(t.id); setOpen(false); setSaved(false); setTimeout(() => setOpen(true), 10);
  };
  const addCultura = () => setCulturas(prev => [...prev, { id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]);
  const removeCultura = (cid) => setCulturas(prev => prev.filter(c => c.id !== cid));
  const updateCultura = (cid, field, value) => setCulturas(prev => prev.map(c => c.id === cid ? { ...c, [field]: value } : c));
  const save = () => {
    if (!talhaoNome.trim()) { alert("Informe o nome do talhão."); return; }
    if (culturas.length === 0) { alert("Adicione ao menos uma cultura."); return; }
    if (culturas.some(c => !c.area || isNaN(parseFloat(c.area)))) { alert("Preencha a área para todas as culturas."); return; }
    const item = { id: editing || uid(), nome: talhaoNome.trim(), culturas: culturas.map(c => ({ ...c, area: parseFloat(c.area) || 0 })) };
    setState(prev => ({ ...prev, talhoes: editing ? prev.talhoes.map(t => t.id === editing ? item : t) : [...(prev.talhoes || []), item] }));
    setSaved(true); setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  };
  const del = (id) => { if (window.confirm("Excluir este talhão?")) setState(prev => ({ ...prev, talhoes: prev.talhoes.filter(t => t.id !== id) })); };

  const SC_KG = 60;
  const areaTotalTalhao = (t) => (t.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0).toFixed(2);

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Talhão</Btn>}>🗺️ Talhões da Fazenda</SectionTitle>
      <Card>
        {talhoes.length === 0 ? (
          <EmptyState icon="🗺️" text="Nenhum talhão cadastrado." />
        ) : (
          <div>
            {talhoes.map(t => (
              <div key={t.id} style={{ marginBottom: 16, border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: `${theme.accent}0a`, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>🗺️ {t.nome}</span>
                    <span style={{ color: theme.muted, fontSize: 12, marginLeft: 14 }}>
                      Área total: <strong style={{ color: theme.accent }}>{areaTotalTalhao(t)} ha</strong>
                      {" · "}{(t.culturas || []).length} cultura(s)
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(t)}>✏️ Editar</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(t.id)}>🗑️</Btn>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: theme.surface }}>
                      {["Cultura (Grão)", "Área (ha)", "Observações", "Sacas Colhidas", "Média (sc/ha)"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: 11, color: theme.muted, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(t.culturas || []).map(c => {
                      const areaC = parseFloat(c.area) || 0;
                      const totalKgC = (state.romaneiosEntrada || []).filter(r => r.talhao === t.nome && r.grao === c.grao).reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
                      const sacasC = totalKgC > 0 ? Math.round(totalKgC / SC_KG) : null;
                      const mediaC = areaC > 0 && totalKgC > 0 ? (totalKgC / SC_KG / areaC).toFixed(1) : null;
                      return (
                        <tr key={c.id} style={{ borderBottom: `1px solid ${theme.border}18` }}>
                          <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 600 }}>🌾 {c.grao}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13 }}>{c.area} ha</td>
                          <td style={{ padding: "9px 14px", fontSize: 13, color: theme.muted }}>{c.obs || "—"}</td>
                          <td style={{ padding: "9px 14px", fontSize: 13 }}>
                            {sacasC !== null ? <span style={{ fontWeight: 700, color: theme.info }}>{sacasC.toLocaleString()} sc</span> : <span style={{ color: theme.muted, fontSize: 11 }}>—</span>}
                          </td>
                          <td style={{ padding: "9px 14px", fontSize: 13 }}>
                            {mediaC ? <span style={{ fontWeight: 700, color: theme.accent }}>{mediaC} sc/ha</span> : <span style={{ color: theme.muted, fontSize: 11 }}>Sem romaneios</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Talhão`} width={700}>
        <Field label="Nome do Talhão">
          <Input value={talhaoNome} onChange={e => setTalhaoNome(e.target.value)} placeholder="Ex: Talhão A, Gleba Norte..." />
        </Field>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Culturas</div>
          {culturas.map((c, idx) => (
            <div key={c.id} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Cultura {idx + 1}</span>
                {culturas.length > 1 && <Btn size="sm" variant="danger" onClick={() => removeCultura(c.id)}>✕ Remover</Btn>}
              </div>
              <Row cols={2}>
                <Field label="Grão">
                  <Select value={c.grao} onChange={e => updateCultura(c.id, "grao", e.target.value)}>
                    {graosDisponiveis.map(g => <option key={g}>{g}</option>)}
                  </Select>
                </Field>
                <Field label="Área (ha)">
                  <Input type="number" value={c.area} onChange={e => updateCultura(c.id, "area", e.target.value)} placeholder="Ex: 50.5" />
                </Field>
              </Row>
              <Field label="Observações">
                <Input value={c.obs} onChange={e => updateCultura(c.id, "obs", e.target.value)} placeholder="Opcional" />
              </Field>
            </div>
          ))}
          <Btn variant="secondary" onClick={addCultura}>+ Adicionar Cultura</Btn>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          {saved ? <span style={{ color: theme.accent, fontWeight: 700, padding: "9px 18px" }}>✓ Salvo!</span> : <Btn onClick={save}>💾 Salvar Talhão</Btn>}
        </div>
      </Modal>
    </div>
  );
}

// ─── PRODUTIVIDADE ───────────────────────────────────────────────────────────
function Produtividade({ state }) {
  const talhoes = state.talhoes || [];
  const romaneiosEntrada = state.romaneiosEntrada || [];
  const SC_KG = 60;

  const [filtroTalhao, setFiltroTalhao] = useState("");
  const [filtroCultura, setFiltroCultura] = useState("");

  const talhoesLista = [...new Set(talhoes.map(t => t.nome))];
  const culturasLista = [...new Set(talhoes.flatMap(t => (t.culturas || []).map(c => c.grao)).filter(Boolean))];

  const produtividadePorTalhao = {};

  romaneiosEntrada.forEach(rom => {
    if (!rom.talhao) return;
    const talhaoInfo = talhoes.find(t => t.nome === rom.talhao);
    if (!talhaoInfo) return;
    if (filtroTalhao && rom.talhao !== filtroTalhao) return;
    if (filtroCultura && rom.grao !== filtroCultura) return;

    const talhaoNome = rom.talhao;
    const grao = rom.grao || "Grão";
    const pesoFinal = parseFloat(rom.pesoFinal) || 0;
    const sacas = pesoFinal / SC_KG;

    if (!produtividadePorTalhao[talhaoNome]) {
      const areaTotalTalhao = (talhaoInfo.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0);
      produtividadePorTalhao[talhaoNome] = {
        area: areaTotalTalhao,
        culturasDet: talhaoInfo.culturas || [],
        porGrao: {},
        totalKg: 0,
        totalSacas: 0,
      };
    }

    if (!produtividadePorTalhao[talhaoNome].porGrao[grao]) {
      const culturaInfo = (talhaoInfo.culturas || []).find(c => c.grao === grao);
      produtividadePorTalhao[talhaoNome].porGrao[grao] = {
        kg: 0,
        sacas: 0,
        areaCultura: parseFloat(culturaInfo?.area) || 0,
      };
    }
    produtividadePorTalhao[talhaoNome].porGrao[grao].kg += pesoFinal;
    produtividadePorTalhao[talhaoNome].porGrao[grao].sacas += sacas;
    produtividadePorTalhao[talhaoNome].totalKg += pesoFinal;
    produtividadePorTalhao[talhaoNome].totalSacas += sacas;
  });

  Object.values(produtividadePorTalhao).forEach(t => {
    t.produtividadeTotal = t.area > 0 ? (t.totalSacas / t.area).toFixed(1) : 0;
    Object.keys(t.porGrao).forEach(grao => {
      const areaRef = t.porGrao[grao].areaCultura > 0 ? t.porGrao[grao].areaCultura : t.area;
      t.porGrao[grao].produtividade = areaRef > 0 ? (t.porGrao[grao].sacas / areaRef).toFixed(1) : 0;
    });
  });

  const hasData = Object.keys(produtividadePorTalhao).length > 0;
  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <SectionTitle>📈 Produtividade por Talhão</SectionTitle>
      {talhoes.length === 0 && (
        <Card style={{ marginBottom: 20, borderColor: `${theme.warning}44`, background: `${theme.warning}0a` }}>
          <p style={{ color: theme.warning, fontSize: 13 }}>⚠️ Nenhum talhão cadastrado. Vá em <strong>Talhões</strong> para cadastrar.</p>
        </Card>
      )}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>🔍 Filtros</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>🗺️ Talhão</label>
            <select value={filtroTalhao} onChange={e => setFiltroTalhao(e.target.value)} style={selectStyle}>
              <option value="">Todos os talhões</option>
              {talhoesLista.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>🌾 Cultura</label>
            <select value={filtroCultura} onChange={e => setFiltroCultura(e.target.value)} style={selectStyle}>
              <option value="">Todas as culturas</option>
              {culturasLista.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </Card>
      <Card>
        {!hasData ? (
          <EmptyState icon="📈" text="Nenhum dado encontrado. Verifique se há romaneios de entrada vinculados a talhões." />
        ) : (
          <div>
            {Object.entries(produtividadePorTalhao).map(([nome, data]) => (
              <div key={nome} style={{ marginBottom: 28, background: theme.bg, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", background: `${theme.accent}0a`, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>🗺️ {nome}</div>
                    <div style={{ color: theme.muted, fontSize: 12, marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span>Culturas:</span>
                      {data.culturasDet.map(c => (<Badge key={c.id || c.grao} color="blue">{c.grao} ({c.area} ha)</Badge>))}
                      <span>· Área total: <strong>{data.area} ha</strong></span>
                      <span>· Total recebido: <strong>{data.totalKg.toLocaleString()} kg</strong> ({Math.round(data.totalSacas).toLocaleString()} sc)</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: theme.muted }}>Produtividade Média</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: theme.accent }}>{data.produtividadeTotal} <span style={{ fontSize: 14 }}>sc/ha</span></div>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme.surface }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: theme.muted }}>Grão</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: theme.muted }}>Área (ha)</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: theme.muted }}>Total (kg)</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: theme.muted }}>Total (sacas)</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: theme.muted }}>Produtividade (sc/ha)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.porGrao).map(([grao, gData]) => (
                        <tr key={grao} style={{ borderBottom: `1px solid ${theme.border}18` }}>
                          <td style={{ padding: "10px 16px", fontWeight: 600 }}>🌾 {grao}</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", color: theme.muted }}>{gData.areaCultura > 0 ? `${gData.areaCultura} ha` : "—"}</td>
                          <td style={{ padding: "10px 16px", textAlign: "right" }}>{gData.kg.toLocaleString()} kg</td>
                          <td style={{ padding: "10px 16px", textAlign: "right" }}>{Math.round(gData.sacas).toLocaleString()} sc</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: theme.accent }}>{gData.produtividade} sc/ha</td>
                        </tr>
                      ))}
                      {Object.keys(data.porGrao).length > 1 && (
                        <tr style={{ background: `${theme.accent}0a`, borderTop: `1px solid ${theme.border}` }}>
                          <td style={{ padding: "10px 16px", fontWeight: 800 }}>📊 TOTAL</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: theme.muted }}>{data.area} ha</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700 }}>{data.totalKg.toLocaleString()} kg</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700 }}>{Math.round(data.totalSacas).toLocaleString()} sc</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, color: theme.accent }}>{data.produtividadeTotal} sc/ha</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── ROMANEIOS DE ENTRADA ─────────────────────────────────────────────────────
function RomaneiosEntrada({ state, setState }) {
  return <RomaneiosGeneric state={state} setState={setState} tipo="Entrada" />;
}

// ─── ROMANEIOS DE SAÍDA ───────────────────────────────────────────────────────
function RomaneiosSaida({ state, setState }) {
  return <RomaneiosGeneric state={state} setState={setState} tipo="Saída" />;
}

// ─── ROMANEIOS GENÉRICO ──────────────────────────────────────────────────────
function RomaneiosGeneric({ state, setState, tipo }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const key = tipo === "Entrada" ? "romaneiosEntrada" : "romaneiosSaida";
  const lixeiraKey = tipo === "Entrada" ? "romaneiosEntradaLixeira" : "romaneiosSaidalixeira";
  const items = state[key] || [];

  const del = id => {
    if (window.confirm(`Mover romaneio para a lixeira? Você poderá restaurá-lo depois.`)) {
      const itemToDelete = items.find(i => i.id === id);
      setState(s => ({
        ...s,
        [key]: s[key].filter(x => x.id !== id),
        [lixeiraKey]: [...(s[lixeiraKey] || []), { ...itemToDelete, deletedAt: new Date().toISOString() }]
      }));
    }
  };

  const getUfPlaca = (placa) => {
    const caminhao = state.caminhoes?.find(c => c.placa === placa);
    return caminhao?.uf || "";
  };

  const RomForm = ({ onClose, item }) => {
    const grao0 = state.fazenda?.graos?.[0] || "Soja";
    const isEntrada = tipo === "Entrada";

    let baseFields = {
      numero: padNum(state.romaneioCounter || 1),
      tipo,
      data: new Date().toISOString().split("T")[0],
      grao: grao0,
      placa: "",
      motorista: "",
      transportadora: "",
      pesoBruto: "",
      pesoTara: "",
      umidade: "",
      impureza: "",
      avariado: "",
      obs: "",
      talhao: "",
      safra: safrasOpcoes[0],
    };

    if (!isEntrada) {
      baseFields.cliente = "";
      baseFields.contrato = "";
    }

    const [form, setForm] = useState(item || baseFields);
    const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const p = state.classificacaoParams?.[form.grao] || {};
    const liq = Math.max(0, (parseFloat(form.pesoBruto) || 0) - (parseFloat(form.pesoTara) || 0));

    // Cálculo da umidade com dupla faixa
    const umidadeResult = calcDescUmidade(form.umidade, p.umRef, p.umDesc, p.umDescPesado);
    const dUm = umidadeResult.desconto;
    const faixaUmidade = umidadeResult.faixa;

    const dImp = calcDesc(form.impureza, p.impRef, p.impDesc);
    const dAv = calcDesc(form.avariado, p.avRef, p.avDesc);
    const totalDesc = (parseFloat(dUm) + parseFloat(dImp) + parseFloat(dAv)).toFixed(2);
    const pesoFinal = Math.max(0, liq * (1 - parseFloat(totalDesc) / 100)).toFixed(0);

    const save = () => {
      const saved = { ...form, liq, pesoFinal, dUm, dImp, dAv, totalDesc, faixaUmidade, id: item?.id || uid() };
      setState(s => ({
        ...s,
        [key]: item ? s[key].map(x => x.id === item.id ? saved : x) : [...(s[key] || []), saved],
        romaneioCounter: item ? s.romaneioCounter : (s.romaneioCounter || 1) + 1,
      }));
      onClose();
    };

    const gerarHTML = () => {
      const faz = state.fazenda || {};
      const viaCliente = isEntrada ? "VIA DO PRODUTOR / RECEBEDOR" : "VIA DO CLIENTE";
      const viaTransportadora = isEntrada ? "VIA DA TRANSPORTADORA" : "VIA DA EXPEDIÇÃO / CONTROLE";
      const ufPlaca = getUfPlaca(form.placa);
      const talhaoInfo = state.talhoes?.find(t => t.nome === form.talhao);
      const dataFormatada = form.data ? formatDate(form.data) : "—";

      const via = (tituloVia) => `
      <div class="via">
        <div class="via-label">${tituloVia}</div>
        <div class="cabecalho">
          <div class="cab-esquerda">
            ${faz.logo ? `<img src="${faz.logo}" class="logo" alt="logo"/>` : `<div class="logo-placeholder">🌾</div>`}
            <div class="faz-info">
              <div class="faz-nome">${faz.nome || "FAZENDA"}</div>
              <div class="faz-sub">Produtor: <strong>${faz.produtor || "—"}</strong></div>
              <div class="faz-sub">CNPJ/CPF: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div>
              <div class="faz-sub">${faz.endereco || ""} ${faz.numero || ""}, ${faz.cidade || ""}/${faz.estado || ""}</div>
            </div>
          </div>
          <div class="cab-direita">
            <div class="tipo-badge ${isEntrada ? "badge-entrada" : "badge-saida"}">${isEntrada ? "RECEBIMENTO" : "EXPEDIÇÃO"}</div>
            <div class="romaneio-num">Nº ${form.numero}</div>
            <div class="romaneio-data">${dataFormatada}</div>
          </div>
        </div>

        <div class="sec-title">DADOS DO TRANSPORTE</div>
        <table class="info-table">
          <tr><td class="lbl">Motorista</td><td class="val bold">${form.motorista || "—"}</td><td class="lbl">Placa</td><td class="val bold">${form.placa || "—"}${ufPlaca ? " · " + ufPlaca : ""}</td></tr>
          <tr><td class="lbl">Transportadora</td><td class="val" colspan="3">${form.transportadora || "—"}</td></tr>
          <tr><td class="lbl">Grão</td><td class="val bold accent">${form.grao || "—"}</td>${isEntrada ? `<td class="lbl">Talhão</td><td class="val bold">${form.talhao || "—"}</td>` : `<td class="lbl">Contrato</td><td class="val bold">${form.contrato || "—"}</td>`}</tr>
          ${!isEntrada ? `<tr><td class="lbl">Cliente</td><td class="val bold" colspan="3">${form.cliente || "—"}</td></tr>` : ""}
          ${isEntrada && talhaoInfo ? `<tr><td class="lbl">Cultura(s)</td><td class="val" colspan="3">${(talhaoInfo.culturas || []).map(c => `${c.grao} (${c.area} ha)`).join(", ")}</td></tr>` : ""}
        </table>

        <div class="sec-title">PESAGEM</div>
        <div class="pesagem-box">
          <div class="peso-item"><div class="peso-lbl">PESO BRUTO</div><div class="peso-val">${parseFloat(form.pesoBruto || 0).toLocaleString("pt-BR")} <span class="kg">kg</span></div></div>
          <div class="peso-sep">−</div>
          <div class="peso-item"><div class="peso-lbl">TARA</div><div class="peso-val">${parseFloat(form.pesoTara || 0).toLocaleString("pt-BR")} <span class="kg">kg</span></div></div>
          <div class="peso-sep">=</div>
          <div class="peso-item destaque"><div class="peso-lbl">PESO LÍQUIDO</div><div class="peso-val green">${parseFloat(liq).toLocaleString("pt-BR")} <span class="kg">kg</span></div></div>
        </div>

        <div class="sec-title">CLASSIFICAÇÃO</div>
        <table class="class-table">
          <thead><tr><th>ITEM</th><th>VALOR AFERIDO</th><th>TOLERÂNCIA</th><th>DESCONTO</th></tr></thead>
          <tbody>
            <tr><td class="item-name">Umidade ${faixaUmidade === "pesada" ? '<span class="umidade-badge">⚠️ PESADA</span>' : ''}</td><td class="center">${form.umidade || "0,00"} %</td><td class="center">${p.umRef || "—"} %</td><td class="center ${parseFloat(dUm) > 0 ? "desc-red" : ""}">${dUm} %</td></tr>
            <tr class="alt"><td class="item-name">Impureza</td><td class="center">${form.impureza || "0,00"} %</td><td class="center">${p.impRef || "—"} %</td><td class="center ${parseFloat(dImp) > 0 ? "desc-red" : ""}">${dImp} %</td></tr>
            <tr><td class="item-name">Avariado</td><td class="center">${form.avariado || "0,00"} %</td><td class="center">${p.avRef || "—"} %</td><td class="center ${parseFloat(dAv) > 0 ? "desc-red" : ""}">${dAv} %</td></tr>
            <tr class="total-row"><td colspan="3" class="total-label">TOTAL DE DESCONTO</td><td class="center total-desc-val">${totalDesc} %</td></tr>
          </tbody>
        </table>

        <div class="resultado-box">
          <div class="res-linha"><span class="res-lbl">Peso Líquido</span><span class="res-val">${parseFloat(liq).toLocaleString("pt-BR")} kg</span></div>
          <div class="res-linha red"><span class="res-lbl">( − ) Desconto Total</span><span class="res-val">${totalDesc} %</span></div>
          <div class="res-final"><span class="res-final-lbl">PESO FINAL LÍQUIDO SECO</span><span class="res-final-val">${parseFloat(pesoFinal).toLocaleString("pt-BR")} kg</span></div>
        </div>

        ${form.obs ? `<div class="obs-box"><strong>Observações:</strong> ${form.obs}</div>` : ""}

        <div class="assinaturas">
          <div class="ass"><div class="ass-linha"></div><div class="ass-nome">Motorista / Transportador</div></div>
          <div class="ass"><div class="ass-linha"></div><div class="ass-nome">Responsável pelo Recebimento</div></div>
          <div class="ass"><div class="ass-linha"></div><div class="ass-nome">Responsável pela Expedição</div></div>
        </div>

        <div class="via-footer">AgriGest · Romaneio Nº ${form.numero} · Emitido em ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      `;

      return `<!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8"/>
        <title>Romaneio Nº ${form.numero} — ${isEntrada ? "Recebimento" : "Expedição"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          @page { size: A4 portrait; margin: 0.7cm 1cm; }
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f1f5f9; padding: 10px 12px; font-size: 9px; color: #1e293b; }
          .page { max-width: 190mm; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
          .via { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px 8px; box-shadow: 0 1px 3px rgba(0,0,0,.07); }
          .corte { text-align: center; padding: 5px 0; font-size: 8px; font-weight: 700; letter-spacing: 2px; color: #92400e; border-top: 1.5px dashed #fbbf24; border-bottom: 1.5px dashed #fbbf24; background: #fffbeb; margin: 4px 0; }
          .via-label { text-align: center; font-size: 7px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: ${isEntrada ? "#1d4ed8" : "#92400e"}; background: ${isEntrada ? "#dbeafe" : "#fef3c7"}; border: 1px solid ${isEntrada ? "#93c5fd" : "#fcd34d"}; border-radius: 20px; padding: 2px 12px; display: inline-block; margin-bottom: 7px; }
          .cabecalho { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px; gap: 8px; }
          .cab-esquerda { display: flex; align-items: center; gap: 8px; }
          .logo { width: 36px; height: 36px; object-fit: contain; border-radius: 4px; }
          .logo-placeholder { width: 36px; height: 36px; background: #f0fdf4; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 1px solid #bbf7d0; }
          .faz-nome { font-size: 10px; font-weight: 900; color: #0f172a; }
          .faz-sub { font-size: 7px; color: #475569; margin-top: 1px; line-height: 1.4; }
          .cab-direita { text-align: right; flex-shrink: 0; }
          .tipo-badge { font-size: 6.5px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 8px; border-radius: 20px; display: inline-block; margin-bottom: 3px; }
          .badge-entrada { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
          .badge-saida { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
          .romaneio-num { font-size: 20px; font-weight: 900; font-family: monospace; color: #0f172a; line-height: 1; }
          .romaneio-data { font-size: 7.5px; color: #64748b; margin-top: 2px; }
          .sec-title { font-size: 6.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #166534; background: #f0fdf4; border-left: 3px solid #16a34a; padding: 3px 7px; margin: 6px 0 4px; border-radius: 0 3px 3px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
          .info-table td { padding: 3px 5px; border: 1px solid #e2e8f0; font-size: 8px; }
          .lbl { background: #f8fafc; font-weight: 700; color: #475569; font-size: 7px; width: 20%; white-space: nowrap; }
          .val { color: #0f172a; }
          .val.bold { font-weight: 600; }
          .val.accent { color: #16a34a; font-weight: 700; font-size: 8.5px; }
          .pesagem-box { display: flex; align-items: center; border: 1.5px solid #e2e8f0; border-radius: 5px; overflow: hidden; margin-bottom: 3px; }
          .peso-item { flex: 1; text-align: center; padding: 5px 3px; border-right: 1px solid #e2e8f0; }
          .peso-item:last-child { border-right: none; }
          .peso-item.destaque { background: #f0fdf4; }
          .peso-sep { font-size: 11px; font-weight: 900; color: #94a3b8; padding: 0 4px; flex-shrink: 0; }
          .peso-lbl { font-size: 5.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 2px; }
          .peso-val { font-size: 12px; font-weight: 900; color: #1e293b; }
          .peso-val.green { color: #16a34a; font-size: 13px; }
          .kg { font-size: 6px; font-weight: 500; color: #64748b; }
          .class-table { width: 100%; border-collapse: collapse; margin-bottom: 3px; }
          .class-table th { background: #1e293b; color: #fff; padding: 4px 5px; font-size: 6px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .class-table td { padding: 4px 5px; border: 1px solid #e2e8f0; font-size: 7.5px; }
          .class-table tr.alt td { background: #f8fafc; }
          .item-name { font-weight: 600; color: #334155; }
          .center { text-align: center; }
          .desc-red { color: #dc2626; font-weight: 700; }
          .total-row td { background: #fef2f2; border-top: 1.5px solid #fca5a5; }
          .total-label { font-weight: 700; font-size: 6.5px; color: #7f1d1d; padding: 4px 5px; }
          .total-desc-val { text-align: center; font-weight: 900; font-size: 11px; color: #dc2626; }
          .umidade-badge { font-size: 6px; font-weight: 700; background: #fee2e2; padding: 2px 4px; border-radius: 4px; margin-left: 4px; color: #dc2626; }
          .resultado-box { border: 1.5px solid #0f172a; border-radius: 5px; overflow: hidden; margin: 5px 0; }
          .res-linha { display: flex; justify-content: space-between; align-items: center; padding: 3px 8px; border-bottom: 1px solid #e2e8f0; font-size: 7.5px; }
          .res-linha.red { color: #dc2626; }
          .res-lbl { font-weight: 500; }
          .res-val { font-weight: 700; font-family: monospace; }
          .res-final { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #0f172a; }
          .res-final-lbl { font-size: 6.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #94a3b8; }
          .res-final-val { font-size: 15px; font-weight: 900; font-family: monospace; color: #4ade80; }
          .obs-box { background: #fefce8; border: 1px solid #fde68a; border-left: 2px solid #f59e0b; border-radius: 3px; padding: 3px 6px; font-size: 6.5px; color: #78350f; margin: 4px 0; }
          .assinaturas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 8px; margin-bottom: 4px; }
          .ass { text-align: center; }
          .ass-linha { border-top: 1px solid #0f172a; margin-bottom: 4px; }
          .ass-nome { font-size: 7px; font-weight: 600; color: #475569; }
          .via-footer { text-align: center; font-size: 5.5px; color: #94a3b8; margin-top: 5px; border-top: 1px solid #f1f5f9; padding-top: 4px; }
          @media print { body { background: #fff; padding: 0; margin: 0; } @page { size: A4 portrait; margin: 0.7cm 1cm; } .page { max-width: 100%; } .via { box-shadow: none; border: 1px solid #aaa; break-inside: avoid; } .corte { break-inside: avoid; border-color: #999; } }
        </style>
      </head>
      <body>
        <div class="page">
          ${via(viaCliente)}
          <div class="corte">✂ &nbsp;&nbsp; RECORTE AQUI &nbsp;&nbsp; ✂</div>
          ${via(viaTransportadora)}
        </div>
      </body>
      </html>`;
    };

    const handleImprimir = () => {
      const win = window.open("", "_blank");
      win.document.write(gerarHTML());
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    };

    const handleSalvarPDF = () => {
      const win = window.open("", "_blank");
      win.document.write(gerarHTML());
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    };

    const talhaoSelecionado = state.talhoes?.find(t => t.nome === form.talhao);
    useEffect(() => {
      if (talhaoSelecionado && isEntrada && !form.safra) {
        const safra = talhaoSelecionado.culturas?.[0]?.safra;
        if (safra) fp("safra", safra);
      }
    }, [talhaoSelecionado]);

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: theme.gold }}>Nº {form.numero}</span>
          <Badge color={tipo === "Entrada" ? "blue" : "gold"}>{tipo}</Badge>
        </div>
        <Row>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
          <Field label="Grão">
            <Select value={form.grao} onChange={e => fp("grao", e.target.value)}>
              {(state.fazenda?.graos || graosOpcoes).map(g => <option key={g}>{g}</option>)}
            </Select>
          </Field>
        </Row>
        {isEntrada && (
          <Row>
            <Field label="🌾 Talhão">
              <Select value={form.talhao} onChange={e => {
                fp("talhao", e.target.value);
                const talh = state.talhoes?.find(t => t.nome === e.target.value);
                const primeirasSafra = talh?.culturas?.[0]?.safra;
                if (primeirasSafra) fp("safra", primeirasSafra);
              }}>
                <option value="">Selecione o talhão...</option>
                {(state.talhoes || []).map(t => {
                  const areaTotal = (t.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0).toFixed(1);
                  const graos = (t.culturas || []).map(c => c.grao).join(", ");
                  return <option key={t.id} value={t.nome}>{t.nome} ({graos} - {areaTotal} ha)</option>;
                })}
              </Select>
            </Field>
            <Field label="📅 Ano Safra">
              <Select value={form.safra} onChange={e => fp("safra", e.target.value)}>
                {safrasOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </Row>
        )}
        <Row>
          <Field label="Placa">
            <Select value={form.placa} onChange={e => fp("placa", e.target.value)}>
              <option value="">Selecione...</option>
              {state.caminhoes.map(c => <option key={c.id}>{c.placa}-{c.uf}</option>)}
            </Select>
          </Field>
          <Field label="Motorista">
            <Select value={form.motorista} onChange={e => fp("motorista", e.target.value)}>
              <option value="">Selecione...</option>
              {state.motoristas.map(m => <option key={m.id}>{m.nome}</option>)}
            </Select>
          </Field>
        </Row>
        {!isEntrada && (
          <Row>
            <Field label="Cliente">
              <Select value={form.cliente} onChange={e => fp("cliente", e.target.value)}>
                <option value="">Selecione...</option>
                {state.clientes.map(c => <option key={c.id}>{c.nome}</option>)}
              </Select>
            </Field>
            <Field label="Contrato">
              <Select value={form.contrato} onChange={e => fp("contrato", e.target.value)}>
                <option value="">Selecione...</option>
                {state.contratos.map(c => <option key={c.id}>{c.numero}</option>)}
              </Select>
            </Field>
          </Row>
        )}
        <Field label="Transportadora">
          <Select value={form.transportadora} onChange={e => fp("transportadora", e.target.value)}>
            <option value="">Selecione...</option>
            {state.transportadoras.map(t => <option key={t.id}>{t.nome}</option>)}
          </Select>
        </Field>
        <Row cols={3}>
          <Field label="Peso Bruto (kg)"><Input type="number" value={form.pesoBruto} onChange={e => fp("pesoBruto", e.target.value)} /></Field>
          <Field label="Tara (kg)"><Input type="number" value={form.pesoTara} onChange={e => fp("pesoTara", e.target.value)} /></Field>
          <Field label="Líquido (kg)"><Input value={liq || ""} readOnly highlight={theme.accent} /></Field>
        </Row>
        <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: theme.gold, marginBottom: 14, fontSize: 13 }}>⚖️ Classificação</div>
          {[{ label: "Umidade", k: "umidade", ref: p.umRef, desc: dUm, faixa: faixaUmidade },
            { label: "Impureza", k: "impureza", ref: p.impRef, desc: dImp },
            { label: "Avariado", k: "avariado", ref: p.avRef, desc: dAv }].map(item => (
            <div key={item.k} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10, alignItems: "end" }}>
              <Field label={item.label}>
                <Input type="number" step="0.1" value={form[item.k]} onChange={e => fp(item.k, e.target.value)} placeholder="0.0" />
                {item.faixa === "pesada" && <span style={{ fontSize: 10, color: theme.danger, marginTop: 2 }}>⚠️ Faixa pesada aplicada</span>}
              </Field>
              <Field label="Tolerância"><Input value={item.ref ? `${item.ref}%` : "—"} readOnly /></Field>
              <Field label="Desconto"><Input value={`${item.desc}%`} readOnly highlight={parseFloat(item.desc) > 0 ? theme.danger : theme.muted} /></Field>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${theme.border}`, paddingTop: 10, marginTop: 4 }}>
            <span style={{ color: theme.muted, fontSize: 12 }}>Total Desconto</span>
            <strong style={{ color: theme.danger }}>{totalDesc}%</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ color: theme.muted, fontSize: 12 }}>Peso Final</span>
            <strong style={{ color: theme.accent, fontSize: 16 }}>{pesoFinal} kg</strong>
          </div>
        </div>
        <Field label="Observações">
          <textarea value={form.obs} onChange={e => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </Field>
        <div style={{ marginTop: 16, padding: 14, background: theme.bg, borderRadius: 10, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>Ações do Romaneio</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant="secondary" onClick={onClose}>✖ Cancelar</Btn>
            <Btn variant="info" onClick={handleImprimir}>🖨️ Imprimir</Btn>
            <Btn variant="gold" onClick={handleSalvarPDF}>📄 Salvar PDF</Btn>
            <Btn onClick={save}>💾 Salvar Romaneio</Btn>
          </div>
          <p style={{ color: theme.muted, fontSize: 11, marginTop: 10 }}>💡 Para salvar como PDF: clique em <strong style={{color:theme.gold}}>Salvar PDF</strong> → na janela de impressão → selecione <strong style={{color:theme.gold}}>"Salvar como PDF"</strong>.</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={() => { setEditItem(null); setOpen(true); }}>+ Novo {tipo === "Entrada" ? "Recebimento" : "Expedição"}</Btn>}>
        {tipo === "Entrada" ? "📥 Recebimento de Grãos" : "📤 Expedição de Grãos"}
      </SectionTitle>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="📄" text={`Nenhum ${tipo === "Entrada" ? "recebimento" : "expedição"} de grãos registrado.`} />
        ) : (
          <Table
            headers={["Nº", "Data", "Grão", "Placa", "Motorista", ...(tipo === "Entrada" ? ["Talhão", "Safra"] : ["Contrato"]), "Peso Final", "Ações"]}
            rows={items.map(r => (
              <tr key={r.id}>
                <Td><span style={{ fontFamily: "monospace", color: theme.info }}>{r.numero}</span></Td>
                <Td>{r.data}</Td><Td>{r.grao}</Td><Td>{r.placa}</Td><Td>{r.motorista}</Td>
                {tipo === "Entrada" ? (
                  <><Td>{r.talhao ? <Badge color="blue">{r.talhao}</Badge> : "—"}</Td>
                  <Td>{r.safra ? <Badge color="gold">{r.safra}</Badge> : "—"}</Td></>
                ) : (<Td>{r.contrato}</Td>)}
                <Td><strong style={{ color: theme.accent }}>{r.pesoFinal} kg</strong></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => { setEditItem(r); setOpen(true); }}>✏️ Editar</Btn>
                    <Btn size="sm" variant="info" onClick={() => { setEditItem(r); setOpen(true); }}>🖨️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(r.id)}>🗑️ Excluir</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${tipo === "Entrada" ? "Recebimento" : "Expedição"} de Grãos`} width={700}>
        <RomForm onClose={() => setOpen(false)} item={editItem} />
      </Modal>
    </div>
  );
}

// ─── EXPEDIÇÃO (AGENDAMENTOS) ─────────────────────────────────────────────────
function Expedicao({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.expedicoes || [];
  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ status: "Pendente" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, expedicoes: s.expedicoes.filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid(), numero: editing ? form.numero : `EXP-${padNum(items.length + 1)}` };
    setState(s => ({ ...s, expedicoes: editing ? s.expedicoes.map(x => x.id === editing ? item : x) : [...(s.expedicoes || []), item] }));
    setOpen(false);
  };
  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Nova Expedição</Btn>}>🚚 Agendamentos</SectionTitle>
      <Card>
        {items.length === 0 ? <EmptyState icon="🚚" text="Nenhum agendamento registrado." /> : (
          <Table headers={["Número", "Data", "Contrato", "Cliente", "Grão", "Status", "Ações"]} rows={items.map(i => (
            <tr key={i.id}>
              <Td><span style={{ fontFamily: "monospace", color: theme.info }}>{i.numero}</span></Td>
              <Td>{i.data}</Td><Td>{i.contrato}</Td><Td>{i.cliente}</Td><Td>{i.grao}</Td>
              <Td><Badge color={i.status === "Concluída" ? "green" : "gold"}>{i.status}</Badge></Td>
              <Td><div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="secondary" onClick={() => openEdit(i)}>✏️</Btn><Btn size="sm" variant="danger" onClick={() => del(i.id)}>🗑️</Btn></div></Td>
            </tr>
          ))} />        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Agendamento">
        <Row>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
          <Field label="Contrato">
            <Select value={form.contrato} onChange={e => fp("contrato", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.contratos || []).map(c => <option key={c.id}>{c.numero}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Cliente">
            <Select value={form.cliente} onChange={e => fp("cliente", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.clientes || []).map(c => <option key={c.id}>{c.nome}</option>)}
            </Select>
          </Field>
          <Field label="Grão">
            <Select value={form.grao} onChange={e => fp("grao", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.fazenda?.graos || graosOpcoes).map(g => <option key={g}>{g}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Romaneio de Saída">
            <Select value={form.romaneio} onChange={e => fp("romaneio", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.romaneiosSaida || []).map(r => <option key={r.id}>Nº {r.numero}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => fp("status", e.target.value)}>
              {["Pendente","Em trânsito","Concluída"].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </Row>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── ESTOQUE ──────────────────────────────────────────────────────────────────
function Estoque({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const estoque = state.estoqueInsumos || [];
  const addMov = () => {
    setState(s => {
      const est = [...(s.estoqueInsumos || [])];
      const ins = (s.insumos || []).find(i => i.id === form.insumoId);
      const idx = est.findIndex(e => e.insumoId === form.insumoId);
      const delta = form.tipo === "Saída" ? -(parseFloat(form.qtd) || 0) : (parseFloat(form.qtd) || 0);
      if (idx >= 0) est[idx] = { ...est[idx], qtd: ((parseFloat(est[idx].qtd) || 0) + delta).toFixed(2) };
      else est.push({ insumoId: form.insumoId, insumoNome: ins?.nome, qtd: delta.toFixed(2), unidade: ins?.unidade });
      return { ...s, estoqueInsumos: est };
    });
    setOpen(false);
    setForm({});
  };
  return (
    <div>
      <SectionTitle action={<Btn onClick={() => { setForm({}); setOpen(true); }}>+ Movimentar</Btn>}>📦 Estoque de Insumos</SectionTitle>
      <Card>
        {estoque.length === 0 ? <EmptyState icon="📦" text="Nenhum insumo em estoque." /> : (
          <Table headers={["Insumo", "Quantidade", "Unidade", "Status"]} rows={estoque.map(e => {
            const qty = parseFloat(e.qtd);
            return (
              <tr key={e.insumoId}>
                <Td>{e.insumoNome}</Td>
                <Td><strong style={{ color: qty > 0 ? theme.accent : theme.danger }}>{e.qtd}</strong></Td>
                <Td>{e.unidade}</Td>
                <Td><Badge color={qty > 10 ? "green" : qty > 0 ? "gold" : "red"}>{qty > 10 ? "Normal" : qty > 0 ? "Baixo" : "Zerado"}</Badge></Td>
              </tr>
            );
          })} />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Movimentação de Estoque">
        <Field label="Insumo">
          <Select value={form.insumoId} onChange={e => setForm(f => ({ ...f, insumoId: e.target.value }))}>
            <option value="">Selecione...</option>
            {(state.insumos || []).map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </Select>
        </Field>
        <Row>
          <Field label="Tipo">
            <Select value={form.tipo || "Entrada"} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option>Entrada</option><option>Saída</option>
            </Select>
          </Field>
          <Field label="Quantidade">
            <Input type="number" value={form.qtd} onChange={e => setForm(f => ({ ...f, qtd: e.target.value }))} />
          </Field>
        </Row>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={addMov}>Registrar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── GRÃOS ────────────────────────────────────────────────────────────────────
function Graos({ state }) {
  const graos = state.fazenda?.graos || [];
  return (
    <div>
      <SectionTitle>🌾 Grãos em Produção</SectionTitle>
      {graos.length === 0 ? (
        <Card><EmptyState icon="🌾" text="Cadastre a fazenda e selecione os grãos produzidos." /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {graos.map(g => {
            const ent = (state.romaneiosEntrada || []).filter(r => r.grao === g).reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
            const sai = (state.romaneiosSaida || []).filter(r => r.grao === g).reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
            const saldo = ent - sai;
            return (
              <Card key={g} style={{ borderTop: `3px solid ${theme.accent}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🌾</div>
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 14 }}>{g}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.muted, fontSize: 12 }}>Entrada</span>
                    <span style={{ color: theme.info, fontWeight: 600 }}>{ent.toLocaleString()} kg</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.muted, fontSize: 12 }}>Saída</span>
                    <span style={{ color: theme.gold, fontWeight: 600 }}>{sai.toLocaleString()} kg</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.muted, fontSize: 12 }}>Saldo</span>
                    <span style={{ color: saldo >= 0 ? theme.accent : theme.danger, fontWeight: 800, fontSize: 17 }}>{saldo.toLocaleString()} kg</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── RELATÓRIO DE MOTORISTAS ─────────────────────────────────────────────────
function RelatorioMotoristas({ state }) {
  const SC_KG = 60;
  const fazenda = state.fazenda || {};
  const romaneios = state.romaneiosEntrada || [];

  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [filtroTransportadora, setFiltroTransportadora] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [expandido, setExpandido] = useState({});

  const motoristasLista = [...new Set([...(state.motoristas || []).map(m => m.nome), ...romaneios.map(r => r.motorista)].filter(Boolean))].sort();
  const transportadorasLista = [...new Set([...(state.transportadoras || []).map(t => t.nome), ...romaneios.map(r => r.transportadora)].filter(Boolean))].sort();

  const romaneiosFiltrados = romaneios.filter(r => {
    const matchMot = filtroMotorista ? r.motorista === filtroMotorista : true;
    const matchTransp = filtroTransportadora ? r.transportadora === filtroTransportadora : true;
    let matchData = true;
    if (filtroData) matchData = r.data === filtroData;
    else if (periodoInicio && periodoFim) matchData = r.data >= periodoInicio && r.data <= periodoFim;
    else if (periodoInicio) matchData = r.data >= periodoInicio;
    else if (periodoFim) matchData = r.data <= periodoFim;
    return matchMot && matchTransp && matchData;
  });

  const porMotorista = {};
  romaneiosFiltrados.forEach(r => {
    const nome = r.motorista || "Sem nome";
    if (!porMotorista[nome]) porMotorista[nome] = [];
    porMotorista[nome].push(r);
  });

  const dados = Object.entries(porMotorista).map(([nome, viagens]) => {
    const totalKg = viagens.reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
    const totalTon = totalKg / 1000;
    const totalSacos = totalKg / SC_KG;
    const totalViagens = viagens.length;
    const mediaTon = totalViagens > 0 ? totalTon / totalViagens : 0;
    const mediaSacos = totalViagens > 0 ? totalSacos / totalViagens : 0;
    const transpMotorista = [...new Set(viagens.map(v => v.transportadora).filter(Boolean))];
    const porDia = {};
    viagens.forEach(r => { if (!porDia[r.data]) porDia[r.data] = []; porDia[r.data].push(r); });
    const diasDetalhes = Object.entries(porDia).map(([data, vs]) => {
      const kgDia = vs.reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
      return { data, viagensDia: vs.length, tonDia: (kgDia / 1000).toFixed(3), sacosDia: (kgDia / SC_KG).toFixed(1) };
    }).sort((a, b) => a.data.localeCompare(b.data));
    return { nome, totalKg, totalTon, totalSacos, totalViagens, mediaTon, mediaSacos, diasDetalhes, transpMotorista };
  }).sort((a, b) => b.totalKg - a.totalKg);

  const grandTotalKg = dados.reduce((a, d) => a + d.totalKg, 0);
  const grandTotalTon = grandTotalKg / 1000;
  const grandTotalSacos = grandTotalKg / SC_KG;
  const grandTotalViagens = dados.reduce((a, d) => a + d.totalViagens, 0);
  const temFiltro = filtroMotorista || filtroTransportadora || filtroData || periodoInicio || periodoFim;
  const limpar = () => { setFiltroMotorista(""); setFiltroTransportadora(""); setFiltroData(""); setPeriodoInicio(""); setPeriodoFim(""); };
  const toggleExpand = (nome) => setExpandido(e => ({ ...e, [nome]: !e[nome] }));

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    const periodoLabel = filtroData ? `Data: ${filtroData}` : periodoInicio || periodoFim ? `De ${periodoInicio || "—"} até ${periodoFim || "—"}` : "Todos os períodos";
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Relatório de Motoristas</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:20px;gap:12px}.logo-img{width:56px;height:56px;object-fit:contain}.faz-nome{font-size:17px;font-weight:900}.faz-sub{font-size:10px;color:#555;margin-top:2px}h2{font-size:13px;margin:18px 0 8px;font-weight:800;border-left:4px solid #16a34a;padding-left:9px}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd;font-size:11px}.tot td{font-weight:700;background:#f0fdf4}.grand td{font-weight:900;background:#dcfce7;font-size:13px}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:8px}</style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:14px">
        ${faz.logo ? `<img src="${faz.logo}" class="logo-img"/>` : '<span style="font-size:36px">🌾</span>'}
        <div><div class="faz-nome">${faz.nome || "Fazenda"}</div><div class="faz-sub">Produtor: ${faz.produtor || "—"}</div><div class="faz-sub">CPF/CNPJ: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div></div>
      </div>
      <div style="text-align:right;font-size:11px;color:#444"><strong>Relatório de Recebimento por Motorista</strong><br/>📅 ${periodoLabel}<br/><span style="font-size:9px;color:#999">Gerado: ${new Date().toLocaleString("pt-BR")}</span></div>
    </div>
    ${dados.map(d => `
      <h2>👷 ${d.nome}</h2>
      <table>
        <tr><th>Data</th><th>Viagens no Dia</th><th>Toneladas no Dia</th><th>Sacos no Dia</th></tr>
        ${d.diasDetalhes.map(dd => `<tr><td>${dd.data}</td><td>${dd.viagensDia}</td><td>${dd.tonDia} t</td><td>${dd.sacosDia} sc</td></tr>`).join("")}
        <tr class="tot"><td>TOTAL</td><td>${d.totalViagens} viagens</td><td>${d.totalTon.toFixed(3)} t</td><td>${Math.round(d.totalSacos).toLocaleString()} sc</td></tr>
        <tr class="tot"><td>MÉDIA/VIAGEM</td><td>—</td><td>${d.mediaTon.toFixed(3)} t</td><td>${d.mediaSacos.toFixed(1)} sc</td></tr>
      </table>
    `).join("")}
    <table><tr class="grand"><td>▶ TOTAIS GERAIS</td><td>${grandTotalViagens} viagens</td><td>${grandTotalTon.toFixed(3)} t</td><td>${Math.round(grandTotalSacos).toLocaleString()} sc</td></tr></table>
    <div class="footer">AgriGest · Relatório de Motoristas · ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const inputStyle = { ...selectStyle };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };
  const statCard = (label, value, sub, color) => (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "14px 18px", borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 26, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📊 Relatório de Motoristas</h2>
        <Btn variant="info" onClick={imprimir}>🖨️ Imprimir / Salvar PDF</Btn>
      </div>
      {fazenda.nome && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, background: theme.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {fazenda.logo ? <img src={fazenda.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 26 }}>🌾</span>}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{fazenda.nome}</div>
            <div style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>Produtor: {fazenda.produtor} · {fazenda.cidade}/{fazenda.estado}</div>
          </div>
        </div>
      )}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>🔍 Filtros</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>👷 Motorista</label><select value={filtroMotorista} onChange={e => setFiltroMotorista(e.target.value)} style={selectStyle}><option value="">Todos os motoristas</option>{motoristasLista.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label style={labelStyle}>🚛 Transportadora</label><select value={filtroTransportadora} onChange={e => setFiltroTransportadora(e.target.value)} style={selectStyle}><option value="">Todas as transportadoras</option>{transportadorasLista.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>📅 Data Exata</label><input type="date" value={filtroData} onChange={e => { setFiltroData(e.target.value); setPeriodoInicio(""); setPeriodoFim(""); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>📅 Período — Início</label><input type="date" value={periodoInicio} onChange={e => { setPeriodoInicio(e.target.value); setFiltroData(""); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>📅 Período — Fim</label><input type="date" value={periodoFim} onChange={e => { setPeriodoFim(e.target.value); setFiltroData(""); }} style={inputStyle} /></div>
        </div>
        {temFiltro && (
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={limpar} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.muted, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>✕ Limpar filtros</button>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {statCard("Total de Viagens", grandTotalViagens, `${dados.length} motorista(s)`, theme.info)}
        {statCard("Total Toneladas", grandTotalTon.toFixed(3) + " t", `${grandTotalKg.toLocaleString()} kg`, theme.accent)}
        {statCard("Total de Sacos", Math.round(grandTotalSacos).toLocaleString() + " sc", "1 sc = 60 kg", theme.gold)}
        {statCard("Romaneios", romaneiosFiltrados.length, "registros no período", theme.info)}
      </div>
      {dados.length === 0 ? (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20 }}>
          <EmptyState icon="📭" text="Nenhum dado encontrado para os filtros selecionados." />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {dados.map(d => (
            <div key={d.nome} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${theme.border}`, background: `${theme.accent}0a` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: `${theme.accent}22`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👷</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{d.nome}</div>
                    <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                      {d.totalViagens} viagens · {d.diasDetalhes.length} dia(s)
                      {d.transpMotorista.length > 0 && <span style={{ marginLeft: 10, color: theme.gold }}>🚛 {d.transpMotorista.join(", ")}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleExpand(d.nome)} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.muted, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                  {expandido[d.nome] ? "▲ Recolher" : "▼ Ver detalhes"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)" }}>
                {[
                  { label: "Total Viagens", value: d.totalViagens, unit: "", color: theme.info },
                  { label: "Total Toneladas", value: d.totalTon.toFixed(3), unit: " t", color: theme.accent },
                  { label: "Total Sacos", value: Math.round(d.totalSacos).toLocaleString(), unit: " sc", color: theme.gold },
                  { label: "Média t/Viagem", value: d.mediaTon.toFixed(3), unit: " t", color: theme.accentLight },
                  { label: "Média sc/Viagem", value: d.mediaSacos.toFixed(1), unit: " sc", color: theme.warning },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "14px 16px", borderRight: i < 4 ? `1px solid ${theme.border}` : "none", borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontWeight: 900, fontSize: 22, color: item.color }}>{item.value}<span style={{ fontSize: 13, fontWeight: 400 }}>{item.unit}</span></div>
                  </div>
                ))}
              </div>
              {expandido[d.nome] && (
                <div style={{ borderTop: `1px solid ${theme.border}` }}>
                  <div style={{ padding: "10px 20px", fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Detalhes por dia</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme.surface }}>
                        {["Data", "Viagens no Dia", "Toneladas no Dia", "Sacos no Dia"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "9px 20px", fontSize: 11, color: theme.muted, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.diasDetalhes.map(dd => (
                        <tr key={dd.data} style={{ borderBottom: `1px solid ${theme.border}18` }}>
                          <td style={{ padding: "10px 20px", fontSize: 13 }}>{dd.data}</td>
                          <td style={{ padding: "10px 20px", fontSize: 13 }}><span style={{ background: `${theme.info}22`, color: theme.info, border: `1px solid ${theme.info}44`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{dd.viagensDia} viagem(ns)</span></td>
                          <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: theme.accent }}>{dd.tonDia} t</td>
                          <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: theme.gold }}>{dd.sacosDia} sc</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: `${theme.accent}0f`, borderTop: `1px solid ${theme.border}` }}>
                        <td style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: theme.muted }}>TOTAL</td>
                        <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: theme.info }}>{d.totalViagens} viagens</td>
                        <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: theme.accent }}>{d.totalTon.toFixed(3)} t</td>
                        <td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: theme.gold }}>{Math.round(d.totalSacos).toLocaleString()} sc</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RELATÓRIO DIÁRIO DE COLHEITA ────────────────────────────────────────────
function RelatoriosDiarios({ state }) {
  const SC_KG = 60;
  const romaneios = state.romaneiosEntrada || [];
  const talhoes = state.talhoes || [];
  const fazenda = state.fazenda || {};
  const hoje = new Date().toISOString().split("T")[0];
  const [dataFiltro, setDataFiltro] = useState(hoje);
  const [filtroTalhao, setFiltroTalhao] = useState("");
  const talhoesLista = [...new Set(romaneios.map(r => r.talhao).filter(Boolean))].sort();
  const romaneiosFiltrados = romaneios.filter(r => {
    const matchData = dataFiltro ? r.data === dataFiltro : true;
    const matchTalhao = filtroTalhao ? r.talhao === filtroTalhao : true;
    return matchData && matchTalhao && r.talhao;
  });
  const porTalhao = {};
  romaneiosFiltrados.forEach(r => {
    const nome = r.talhao;
    if (!porTalhao[nome]) porTalhao[nome] = { cargas: [], totalKg: 0 };
    porTalhao[nome].cargas.push(r);
    porTalhao[nome].totalKg += parseFloat(r.pesoFinal) || 0;
  });
  const talhaoEntries = Object.entries(porTalhao);
  const totalCargasDia = romaneiosFiltrados.length;
  const totalKgDia = romaneiosFiltrados.reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
  const totalSacasDia = totalKgDia / SC_KG;

  const imprimir = () => {
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório Diário - ${dataFiltro}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:20px;gap:12px}.logo-img{width:56px;height:56px;object-fit:contain}.faz-nome{font-size:17px;font-weight:900}.faz-sub{font-size:10px;color:#555}.resumo{display:flex;gap:20px;margin-bottom:20px}.resumo-card{flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center}.resumo-card .val{font-size:22px;font-weight:900;color:#16a34a}.resumo-card .lbl{font-size:9px;text-transform:uppercase;color:#888;margin-top:3px}h2{font-size:13px;margin:18px 0 8px;font-weight:800;border-left:4px solid #16a34a;padding-left:9px}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd;font-size:11px}.tot td{font-weight:700;background:#f0fdf4}.grand{background:#dcfce7;font-weight:900;font-size:13px;border-top:2px solid #16a34a}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:8px}</style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:14px">${fazenda.logo ? `<img src="${fazenda.logo}" class="logo-img"/>` : '<span style="font-size:36px">🌾</span>'}<div><div class="faz-nome">${fazenda.nome || "Fazenda"}</div><div class="faz-sub">Produtor: ${fazenda.produtor || "—"}</div></div></div>
      <div style="text-align:right;font-size:11px;color:#444"><strong>Relatório Diário de Colheita</strong><br/>📅 ${dataFiltro || "Todos os dias"}<br/><span style="font-size:9px;color:#999">Gerado: ${new Date().toLocaleString("pt-BR")}</span></div>
    </div>
    <div class="resumo">
      <div class="resumo-card"><div class="val">${talhaoEntries.length}</div><div class="lbl">Talhões colhidos</div></div>
      <div class="resumo-card"><div class="val">${totalCargasDia}</div><div class="lbl">Cargas no dia</div></div>
      <div class="resumo-card"><div class="val">${Math.round(totalSacasDia).toLocaleString()}</div><div class="lbl">Sacas colhidas</div></div>
      <div class="resumo-card"><div class="val">${(totalKgDia / 1000).toFixed(1)} t</div><div class="lbl">Toneladas</div></div>
    </div>
    ${talhaoEntries.map(([nome, dados]) => {
      const sacasTalhao = dados.totalKg / SC_KG;
      const info = talhoes.find(t => t.nome === nome);
      const areaTotal = (info?.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0);
      return `<h2>🗺️ ${nome}</h2><table><tr><th>Nº Romaneio</th><th>Grão</th><th>Placa</th><th>Motorista</th><th>Peso Final (kg)</th><th>Sacas (60kg)</th></tr>${dados.cargas.map(r => `<tr><td style="font-family:monospace">${r.numero}</td><td>${r.grao || "—"}</td><td>${r.placa || "—"}</td><td>${r.motorista || "—"}</td><td>${(parseFloat(r.pesoFinal) || 0).toLocaleString()} kg</td><td>${Math.round((parseFloat(r.pesoFinal) || 0) / SC_KG)} sc</td></tr>`).join("")}<tr class="tot"><td colspan="3">TOTAL DO TALHÃO</td><td>${dados.cargas.length} carga(s)</td><td>${dados.totalKg.toLocaleString()} kg</td><td>${Math.round(sacasTalhao).toLocaleString()} sc${areaTotal > 0 ? ` · ${(sacasTalhao / areaTotal).toFixed(1)} sc/ha` : ""}</td></tr></table>`;
    }).join("")}
    <table><tr class="grand"><td>▶ TOTAL GERAL DO DIA</td><td>${talhaoEntries.length} talhão(ões)</td><td>${totalCargasDia} carga(s)</td><td>${totalKgDia.toLocaleString()} kg</td><td colspan="2">${Math.round(totalSacasDia).toLocaleString()} sacas</td></tr></table>
    <div class="footer">AgriGest · Relatório Diário de Colheita · ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📅 Relatório Diário de Colheita</h2>
        {talhaoEntries.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Imprimir / PDF</Btn>}
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>📅 Data</label><input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} style={selectStyle} /></div>
          <div><label style={labelStyle}>🗺️ Talhão</label><select value={filtroTalhao} onChange={e => setFiltroTalhao(e.target.value)} style={selectStyle}><option value="">Todos os talhões</option>{talhoesLista.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
      </Card>
      {romaneiosFiltrados.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Talhões Colhidos", value: talhaoEntries.length, unit: "", color: theme.gold, icon: "🗺️" },
            { label: "Cargas no Dia", value: totalCargasDia, unit: "", color: theme.info, icon: "🚜" },
            { label: "Sacas Colhidas", value: Math.round(totalSacasDia).toLocaleString(), unit: " sc", color: theme.accent, icon: "🌾" },
            { label: "Toneladas", value: (totalKgDia / 1000).toFixed(1), unit: " t", color: theme.accentLight, icon: "⚖️" },
          ].map((s, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: theme.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}<span style={{ fontSize: 14, fontWeight: 400 }}>{s.unit}</span></div>
                </div>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {talhaoEntries.length === 0 ? (
        <Card><EmptyState icon="📅" text={dataFiltro ? `Nenhum recebimento registrado em ${dataFiltro}.` : "Selecione uma data para ver o relatório."} /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {talhaoEntries.map(([nome, dados]) => {
            const sacasTalhao = dados.totalKg / SC_KG;
            const info = talhoes.find(t => t.nome === nome);
            const areaTotal = (info?.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0);
            const mediaDia = areaTotal > 0 ? (sacasTalhao / areaTotal).toFixed(1) : null;
            return (
              <Card key={nome} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", background: `${theme.accent}0a`, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: `${theme.accent}22`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🗺️</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17 }}>{nome}</div>
                      <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                        {areaTotal > 0 && <span>Área: <strong>{areaTotal.toFixed(1)} ha</strong> · </span>}
                        {(info?.culturas || []).map(c => c.grao).join(", ")}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { label: "Cargas", value: dados.cargas.length, color: theme.info },
                      { label: "Sacas", value: `${Math.round(sacasTalhao).toLocaleString()} sc`, color: theme.accent },
                      ...(mediaDia ? [{ label: "Média dia", value: `${mediaDia} sc/ha`, color: theme.gold }] : []),
                    ].map((item, i) => (
                      <div key={i} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                        <div style={{ fontWeight: 900, fontSize: 16, color: item.color, marginTop: 2 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: theme.surface }}>
                      {["Nº Romaneio", "Grão", "Placa", "Motorista", "Peso Final (kg)", "Sacas (60kg)"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "9px 16px", fontSize: 11, color: theme.muted, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dados.cargas.map((r, idx) => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}18`, background: idx % 2 === 0 ? "transparent" : `${theme.surface}66` }}>
                        <td style={{ padding: "10px 16px", fontFamily: "monospace", color: theme.info, fontWeight: 700 }}>{r.numero}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>🌾 {r.grao}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>{r.placa || "—"}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13 }}>{r.motorista || "—"}</td>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{(parseFloat(r.pesoFinal) || 0).toLocaleString()} kg</td>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: theme.accent }}>{Math.round((parseFloat(r.pesoFinal) || 0) / SC_KG)} sc</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: `${theme.accent}0a`, borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: theme.muted }} colSpan={3}>TOTAL DO TALHÃO NO DIA</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: theme.info }}>{dados.cargas.length} carga(s)</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700 }}>{dados.totalKg.toLocaleString()} kg</td>
                      <td style={{ padding: "10px 16px", fontSize: 14, fontWeight: 900, color: theme.accent }}>{Math.round(sacasTalhao).toLocaleString()} sc</td>
                    </tr>
                  </tfoot>
                </table>
              </Card>
            );
          })}
          <Card style={{ background: `${theme.accent}0a`, borderColor: `${theme.accent}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>▶ TOTAL GERAL DO DIA</span>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { label: "Talhões", value: talhaoEntries.length, color: theme.gold },
                  { label: "Cargas", value: totalCargasDia, color: theme.info },
                  { label: "Sacas", value: `${Math.round(totalSacasDia).toLocaleString()} sc`, color: theme.accent },
                  { label: "Toneladas", value: `${(totalKgDia / 1000).toFixed(1)} t`, color: theme.accentLight },
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [state, setState] = useState(initState());
  const [toast, setToast] = useState("");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  const setStateAndSave = (updater) => {
    setState(updater);
    setToast("✓ Dados salvos!");
    setTimeout(() => setToast(""), 2000);
  };

  const clearData = () => {
    if (window.confirm("Apagar TODOS os dados? Esta ação não pode ser desfeita.")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(initState());
      setUsuarioLogado(null);
      setLoggedIn(false);
    }
  };

  const handleLogin = (user) => { setUsuarioLogado(user); setLoggedIn(true); };
  const handleLogout = () => { setUsuarioLogado(null); setLoggedIn(false); };

  const usuariosAtivos = (state.usuarios && state.usuarios.length > 0)
    ? state.usuarios
    : [{ id: "1", nome: "Administrador", login: "admin", senha: "agro2024", role: "admin" }];

  if (!loggedIn) return <Login onLogin={handleLogin} usuarios={usuariosAtivos} />;

  const crudPages = {
    clientes: { title: "Cliente", icon: "👥", stateKey: "clientes", fields: [
      { key: "nome", label: "Nome / Razão Social", table: true }, { key: "cpfCnpj", label: "CPF / CNPJ", table: true },
      { key: "contato", label: "Telefone", table: true }, { key: "email", label: "E-mail", table: true },
      { key: "cidade", label: "Cidade", table: true }, { key: "estado", label: "UF", table: true },
    ]},
    transportadoras: { title: "Transportadora", icon: "🚛", stateKey: "transportadoras", fields: [
      { key: "nome", label: "Razão Social", table: true }, { key: "cnpj", label: "CNPJ", table: true },
      { key: "contato", label: "Contato", table: true }, { key: "cidade", label: "Cidade", table: true }, { key: "estado", label: "UF", table: true },
    ]},
    fornecedores: { title: "Fornecedor", icon: "🏭", stateKey: "fornecedores", fields: [
      { key: "nome", label: "Nome", table: true }, { key: "cnpj", label: "CNPJ", table: true },
      { key: "segmento", label: "Segmento", table: true }, { key: "contato", label: "Contato", table: true },
    ]},
    caminhoes: { title: "Caminhão", icon: "🚜", stateKey: "caminhoes", fields: [
      { key: "placa", label: "Placa", table: true }, { key: "uf", label: "UF", table: true },
      { key: "arquivo", label: "Documento (Opcional)", type: "file", optional: true },
    ]},
    motoristas: { title: "Motorista", icon: "👷", stateKey: "motoristas", fields: [
      { key: "nome", label: "Nome Completo", table: true }, { key: "cnh", label: "CNH", table: true },
      { key: "arquivo", label: "Arquivo CNH (Opcional)", type: "file", optional: true },
    ]},
    insumos: { title: "Insumo", icon: "🧪", stateKey: "insumos", fields: [
      { key: "nome", label: "Nome", table: true },
      { key: "unidade", label: "Unidade", type: "select", options: ["kg","L","un","sc","t"], table: true },
      { key: "categoria", label: "Categoria", type: "select", options: ["Fertilizante","Defensivo","Semente","Combustível","Outros"], table: true },
      { key: "fornecedor", label: "Fornecedor", table: true },
    ]},
    recebimentoInsumos: { title: "Recebimento de Insumo", icon: "📥", stateKey: "recebimentoInsumos", fields: [
      { key: "produto", label: "Produto", table: true }, { key: "nf", label: "Nº NF", table: true },
      { key: "recebidoPor", label: "Recebido Por", table: true }, { key: "data", label: "Data", type: "date", table: true },
      { key: "fotoNF", label: "Foto da NF (Opcional)", type: "file", optional: true },
      { key: "fotoProduto", label: "Foto do Produto (Opcional)", type: "file", optional: true },
    ]},
  };

  const ss = setStateAndSave;
  const page = () => {
    if (crudPages[active]) return <CrudPage key={active} {...crudPages[active]} state={state} setState={ss} />;
    switch (active) {
      case "dashboard": return <Dashboard state={state} />;
      case "fazenda": return <Fazenda state={state} setState={ss} />;
      case "graos": return <Graos state={state} />;
      case "talhoes": return <Talhoes state={state} setState={ss} />;
      case "produtividade": return <Produtividade state={state} />;
      case "classificacao": return <Classificacao state={state} setState={ss} />;
      case "contratos": return <Contratos state={state} setState={ss} />;
      case "romaneiosEntrada": return <RomaneiosEntrada state={state} setState={ss} />;
      case "romaneiosSaida": return <RomaneiosSaida state={state} setState={ss} />;
      case "expedicao": return <Expedicao state={state} setState={ss} />;
      case "estoque": return <Estoque state={state} setState={ss} />;
      case "recebimentoInsumos": return <CrudPage {...crudPages.recebimentoInsumos} state={state} setState={ss} />;
      case "usuarios": return <Usuarios state={state} setState={ss} />;
      case "relatorioMotoristas": return <RelatorioMotoristas state={state} />;
      case "relatoriosDiarios": return <RelatoriosDiarios state={state} />;
      case "lixeira": return <Lixeira state={state} setState={ss} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: theme.bg, color: theme.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", overflow: "hidden" }}>
      <Sidebar active={active} setActive={setActive} fazenda={state.fazenda} usuario={usuarioLogado} />
      <main style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 20 }}>
          {toast && <span style={{ background: `${theme.accent}22`, color: theme.accentLight, border: `1px solid ${theme.accent}44`, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{toast}</span>}
          <span style={{ color: theme.muted, fontSize: 11 }}>💾 Dados salvos automaticamente</span>
          <button onClick={handleLogout} style={{ background: `${theme.danger}18`, color: theme.danger, border: `1px solid ${theme.danger}33`, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>🚪 Sair</button>
          <button onClick={clearData} style={{ background: `${theme.warning}18`, color: theme.warning, border: `1px solid ${theme.warning}33`, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>🗑️ Limpar Dados</button>
        </div>
        <div style={{ maxWidth: 1000 }}>{page()}</div>
      </main>
    </div>
  );
}
