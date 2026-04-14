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

const graosOpcoes = ["Soja", "Milho", "Sorgo", "Milheto", "Gergelim", "Trigo", "Feijão"];
const safrasOpcoes = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── MÓDULOS DE ACESSO ───────────────────────────────────────────────────────
const modulosDisponiveis = [
  { grupo: "🌾 GRÃOS", modulos: [
    { id: "dashboard", label: "Dashboard" },
    { id: "fazenda", label: "Fazenda" },
    { id: "graos", label: "Grãos em Produção" },
    { id: "talhoes", label: "Talhões" },
    { id: "produtividade", label: "Produtividade" },
    { id: "classificacao", label: "Classificação" },
    { id: "contratos", label: "Contratos" },
    { id: "romaneiosEntrada", label: "Recebimento de Grãos" },
    { id: "romaneiosSaida", label: "Expedição de Grãos" },
    { id: "expedicao", label: "Agendamentos" },
    { id: "relatorioMotoristas", label: "Rel. Motoristas" },
    { id: "relatoriosDiarios", label: "Rel. Diário de Colheita" },
    { id: "relatorioCarregamentos", label: "Rel. Carregamentos" },
    { id: "vendaMilho", label: "Venda de Milho" },
  ]},
  { grupo: "🧪 INSUMOS", modulos: [
    { id: "insumos", label: "Cadastro de Insumos" },
    { id: "estoque", label: "Estoque Insumos" },
    { id: "recebimentoInsumos", label: "Recebimento de Insumos" },
    { id: "fichasAplicacao", label: "Fichas de Aplicação" },
  ]},
  { grupo: "⛽ COMBUSTÍVEL", modulos: [
    { id: "maquinas", label: "Máquinas" },
    { id: "abastecimento", label: "Abastecimento" },
    { id: "relatorioCombustivel", label: "Rel. Consumo" },
  ]},
  { grupo: "🔧 ALMOXARIFADO", modulos: [
    { id: "pecas", label: "Peças" },
    { id: "movimentacaoPecas", label: "Movimentação" },
    { id: "estoquePecas", label: "Estoque Peças" },
  ]},
  { grupo: "📋 CADASTROS", modulos: [
    { id: "clientes", label: "Clientes" },
    { id: "transportadoras", label: "Transportadoras" },
    { id: "fornecedores", label: "Fornecedores" },
    { id: "caminhoes", label: "Caminhões" },
    { id: "motoristas", label: "Motoristas" },
  ]},
];

const todosModuloIds = modulosDisponiveis.flatMap(g => g.modulos.map(m => m.id));

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
      if (!parsed.maquinas) parsed.maquinas = [];
      if (!parsed.abastecimentos) parsed.abastecimentos = [];
      if (!parsed.pecas) parsed.pecas = [];
      if (!parsed.movimentacaoPecas) parsed.movimentacaoPecas = [];
      if (!parsed.fichasAplicacao) parsed.fichasAplicacao = [];
      return parsed;
    }
  } catch (e) {}
  return {
    fazenda: null, clientes: [], transportadoras: [], fornecedores: [], caminhoes: [], motoristas: [],
    contratos: [], insumos: [], estoqueInsumos: [], recebimentoInsumos: [],
    romaneiosEntrada: [], romaneiosSaida: [], romaneiosEntradaLixeira: [], romaneiosSaidalixeira: [],
    expedicoes: [], classificacaoParams: {}, romaneioCounter: 1, talhoes: [],
    maquinas: [],
    abastecimentos: [],
    pecas: [],
    movimentacaoPecas: [],
    fichasAplicacao: [],
    usuarios: [{ id: "1", nome: "Administrador", login: "admin", senha: "agro2024", role: "admin" }]
  };
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin, usuarios }) {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const handleLogin = () => {
    const loginTrim = login.trim().toLowerCase();
    const senhaTrim = senha.trim();
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
const navGroups = (isAdmin, userModulos) => {
  const allGroups = [
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
      { id: "relatorioCarregamentos", label: "Rel. Carregamentos", icon: "📦" },
      { id: "vendaMilho", label: "Venda de Milho", icon: "🌽" },
    ]
  },
  {
    title: "🧪 INSUMOS", icon: "🧪",
    items: [
      { id: "insumos", label: "Cadastro de Insumos", icon: "🧪" },
      { id: "estoque", label: "Estoque Insumos", icon: "📦" },
      { id: "recebimentoInsumos", label: "Recebimento de Insumos", icon: "📥" },
      { id: "fichasAplicacao", label: "Fichas de Aplicação", icon: "📋" },
    ]
  },
  {
    title: "⛽ COMBUSTÍVEL", icon: "⛽",
    items: [
      { id: "maquinas", label: "Máquinas", icon: "🚜" },
      { id: "abastecimento", label: "Abastecimento", icon: "⛽" },
      { id: "relatorioCombustivel", label: "Rel. Consumo", icon: "📈" },
    ]
  },
  {
    title: "🔧 ALMOXARIFADO", icon: "🔧",
    items: [
      { id: "pecas", label: "Peças", icon: "🔧" },
      { id: "movimentacaoPecas", label: "Movimentação", icon: "📦" },
      { id: "estoquePecas", label: "Estoque Peças", icon: "📊" },
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

  // Admin tem acesso a tudo
  if (isAdmin) return allGroups;

  // Operador: filtrar por módulos permitidos
  const permitidos = userModulos || [];
  return allGroups
    .map(g => ({ ...g, items: g.items.filter(item => permitidos.includes(item.id)) }))
    .filter(g => g.items.length > 0);
};

function Sidebar({ active, setActive, fazenda, usuario }) {
  const groups = navGroups(usuario?.role === "admin", usuario?.modulos);
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
function Dashboard({ state, setActive }) {
  const totalCombustivel = (state.abastecimentos || []).reduce((sum, a) => sum + (parseFloat(a.litros) || 0), 0);
  const totalFichas      = (state.fichasAplicacao || []).length;
  const totalPecas       = (state.pecas || []).length;
  const estoqueTotal     = state.estoqueInsumos.reduce((a, i) => a + (parseFloat(i.qtd) || 0), 0);
  const saldoEstoquePecas = (state.estoquePecas || []).reduce((a, i) => a + (parseFloat(i.qtd) || 0), 0);

  // Card clicável
  const StatCard = ({ label, value, icon, color, page, sub }) => (
    <div
      onClick={() => page && setActive(page)}
      style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderLeft: `4px solid ${color}`, borderRadius: 10, padding: "14px 16px",
        cursor: page ? "pointer" : "default",
        transition: "all .18s",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => { if (page) { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `color-mix(in srgb, ${color} 8%, ${theme.card})`; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.card; e.currentTarget.style.borderLeftColor = color; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: theme.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>{label}</div>
          <div style={{ fontWeight: 900, fontSize: 30, color, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ color: theme.muted, fontSize: 11, marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{ fontSize: 26 }}>{icon}</span>
          {page && <span style={{ fontSize: 9, color, background: `${color}20`, border: `1px solid ${color}44`, padding: "2px 7px", borderRadius: 20, fontWeight: 700, letterSpacing: .5, whiteSpace: "nowrap" }}>→ Ver</span>}
        </div>
      </div>
    </div>
  );

  // Grupo de seção do dashboard
  const Group = ({ title, color, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color, borderBottom: `2px solid ${color}33`, paddingBottom: 6, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>

      {/* Card da fazenda */}
      {state.fazenda ? (
        <div
          onClick={() => setActive("fazenda")}
          style={{ background: `linear-gradient(135deg,${theme.accent}14,${theme.gold}0a)`, border: `1px solid ${theme.accent}44`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = `${theme.accent}44`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, background: `${theme.accent}2a`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              {state.fazenda.logo
                ? <img src={state.fazenda.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontSize: 28 }}>🏡</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{state.fazenda.nome}</div>
              <div style={{ color: theme.muted, fontSize: 12, marginTop: 3 }}>{state.fazenda.produtor} · {state.fazenda.cidade}/{state.fazenda.estado}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {state.fazenda.graos?.map(g => <Badge key={g} color="green">{g}</Badge>)}
              </div>
            </div>
            <span style={{ fontSize: 10, color: theme.accent, background: `${theme.accent}20`, border: `1px solid ${theme.accent}44`, padding: "4px 12px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>→ Editar Fazenda</span>
          </div>
        </div>
      ) : (
        <div onClick={() => setActive("fazenda")} style={{ background: `${theme.gold}0a`, border: `1px solid ${theme.gold}44`, borderRadius: 12, padding: 16, marginBottom: 24, cursor: "pointer" }}>
          <p style={{ color: theme.gold, fontSize: 13 }}>⚠️ Nenhuma fazenda cadastrada. <strong>Clique aqui para cadastrar →</strong></p>
        </div>
      )}

      {/* ── GRÃOS ── */}
      <Group title="🌾 Grãos & Contratos" color={theme.accent}>
        <StatCard label="Contratos Ativos"    value={state.contratos.filter(c => c.status === "Ativo").length} icon="📋" color={theme.accent}      page="contratos"        sub="Clique para gerenciar" />
        <StatCard label="Recebimentos"        value={state.romaneiosEntrada.length}  icon="📥" color={theme.info}        page="romaneiosEntrada"  sub="Romaneios de entrada" />
        <StatCard label="Expedições"          value={state.romaneiosSaida.length}    icon="📤" color={theme.gold}        page="romaneiosSaida"    sub="Romaneios de saída" />
        <StatCard label="Agendamentos"        value={(state.expedicoes || []).length} icon="🚚" color={theme.warning}    page="expedicao"         sub="Expedições agendadas" />
      </Group>

      {/* ── PRODUÇÃO ── */}
      <Group title="📈 Produção & Talhões" color={theme.accentLight}>
        <StatCard label="Talhões Cadastrados" value={(state.talhoes || []).length}   icon="🗺️" color={theme.accentLight} page="talhoes"          sub="Áreas da fazenda" />
        <StatCard label="Grãos em Produção"   value={(state.fazenda?.graos || []).length} icon="🌾" color={theme.accent} page="graos"            sub="Culturas ativas" />
        <StatCard label="Produtividade"       value={(state.talhoes || []).length > 0 ? "Ver" : "—"} icon="📈" color={theme.info} page="produtividade" sub="sc/ha por talhão" />
        <StatCard label="Fichas de Aplicação" value={totalFichas}                    icon="🧪" color={theme.accent}      page="fichasAplicacao"  sub="Aplicações registradas" />
      </Group>

      {/* ── INSUMOS ── */}
      <Group title="🧪 Insumos & Estoque" color={theme.warning}>
        <StatCard label="Insumos Cadastrados" value={(state.insumos || []).length}   icon="🧪" color={theme.warning}    page="insumos"          sub="Produtos registrados" />
        <StatCard label="Qtd em Estoque"      value={estoqueTotal.toFixed(0)}        icon="📦" color={theme.gold}       page="estoque"          sub="Unidades disponíveis" />
        <StatCard label="Recebimentos Insumo" value={(state.recebimentoInsumos || []).length} icon="📥" color={theme.info} page="recebimentoInsumos" sub="NFs lançadas" />
        <StatCard label="Fichas de Aplicação" value={totalFichas}                   icon="📋" color={theme.accent}      page="fichasAplicacao"  sub="Baixas no estoque" />
      </Group>

      {/* ── FROTA & MANUTENÇÃO ── */}
      <Group title="🚜 Frota & Manutenção" color={theme.info}>
        <StatCard label="Máquinas"            value={(state.maquinas || []).length}  icon="🚜" color={theme.info}       page="maquinas"         sub="Equipamentos cadastrados" />
        <StatCard label="Litros Abastecidos"  value={totalCombustivel.toFixed(0)}    icon="⛽" color={theme.warning}    page="abastecimento"    sub="Total de combustível" />
        <StatCard label="Peças Cadastradas"   value={totalPecas}                     icon="🔧" color={theme.muted}      page="pecas"            sub="Itens de manutenção" />
        <StatCard label="Estoque de Peças"    value={saldoEstoquePecas.toFixed(0)}   icon="📦" color={theme.gold}       page="estoquePecas"     sub="Unidades em estoque" />
      </Group>

      {/* ── CADASTROS & RELATÓRIOS ── */}
      <Group title="📋 Cadastros & Relatórios" color={theme.gold}>
        <StatCard label="Clientes"            value={state.clientes.length}          icon="👥" color={theme.accentLight} page="clientes"        sub="Compradores cadastrados" />
        <StatCard label="Motoristas"          value={state.motoristas.length}        icon="👷" color={theme.muted}       page="motoristas"      sub="Condutores ativos" />
        <StatCard label="Rel. Motoristas"     value={(state.romaneiosEntrada || []).length} icon="📊" color={theme.info} page="relatorioMotoristas" sub="Viagens e toneladas" />
        <StatCard label="Rel. Carregamentos"  value={(state.romaneiosSaida || []).length}  icon="📦" color={theme.gold}  page="relatorioCarregamentos" sub="Expedições por cliente" />
      </Group>
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [showSenha, setShowSenha] = useState(false);
  const [confirma, setConfirma] = useState("");
  const [erroForm, setErroForm] = useState("");

  const usuarios = state.usuarios || [];

  const openNew = () => {
    setForm({ role: "operador", nome: "", login: "", senha: "", modulos: [] });
    setEditing(null);
    setConfirma("");
    setErroForm("");
    setShowSenha(false);
    setOpen(true);
  };

  const openEdit = u => {
    setForm({ ...u });
    setEditing(u.id);
    setConfirma(u.senha);
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
    if (!form.nome?.trim()) { setErroForm("Preencha o nome completo."); return; }
    if (!form.login?.trim()) { setErroForm("Preencha o login."); return; }
    if (!form.senha?.trim()) { setErroForm("Preencha a senha."); return; }
    if (form.senha.length < 4) { setErroForm("A senha deve ter pelo menos 4 caracteres."); return; }
    if (form.senha !== confirma) { setErroForm("As senhas não coincidem."); return; }

    const loginExiste = usuarios.some(u => u.login === form.login.trim() && u.id !== editing);
    if (loginExiste) { setErroForm("Este login já está em uso por outro usuário."); return; }
    if (form.role !== "admin" && (!form.modulos || form.modulos.length === 0)) { setErroForm("Selecione pelo menos um módulo de acesso para o operador."); return; }

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
            headers={["Nome", "Login", "Nível de Acesso", "Módulos", "Ações"]}
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
                  {u.role === "admin" ? (
                    <span style={{ fontSize: 11, color: theme.accent }}>Acesso total</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, maxWidth: 200 }}>
                      {(u.modulos || []).length > 0 ? (
                        (u.modulos || []).length <= 3 ? (
                          (u.modulos || []).map(m => {
                            const mod = modulosDisponiveis.flatMap(g => g.modulos).find(x => x.id === m);
                            return <span key={m} style={{ fontSize: 10, background: `${theme.info}18`, color: theme.info, padding: "2px 6px", borderRadius: 4, border: `1px solid ${theme.info}33` }}>{mod?.label || m}</span>;
                          })
                        ) : (
                          <span style={{ fontSize: 11, color: theme.muted }}>{(u.modulos || []).length} módulos</span>
                        )
                      ) : (
                        <span style={{ fontSize: 11, color: theme.danger }}>Nenhum</span>
                      )}
                    </div>
                  )}
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(u)}>✏️ Editar</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(u.id)}>🗑️</Btn>
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
          <Select value={form.role || "operador"} onChange={e => { fp("role", e.target.value); if (e.target.value === "admin") fp("modulos", []); }}>
            <option value="operador">👤 Operador</option>
            <option value="admin">👑 Administrador</option>
          </Select>
        </Field>

        {form.role !== "admin" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>
              🔒 Módulos com Acesso
            </div>
            <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, maxHeight: 300, overflowY: "auto" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={() => fp("modulos", [...todosModuloIds])} style={{ background: `${theme.accent}22`, color: theme.accentLight, border: `1px solid ${theme.accent}44`, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>✅ Marcar Todos</button>
                <button onClick={() => fp("modulos", [])} style={{ background: `${theme.danger}18`, color: theme.danger, border: `1px solid ${theme.danger}44`, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>❌ Desmarcar Todos</button>
              </div>
              {modulosDisponiveis.map(grupo => (
                <div key={grupo.grupo} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: theme.gold, marginBottom: 6, letterSpacing: 0.5 }}>{grupo.grupo}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {grupo.modulos.map(mod => {
                      const checked = (form.modulos || []).includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          onClick={() => {
                            const cur = form.modulos || [];
                            fp("modulos", checked ? cur.filter(m => m !== mod.id) : [...cur, mod.id]);
                          }}
                          style={{
                            padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                            border: checked ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                            background: checked ? `${theme.accent}28` : "transparent",
                            color: checked ? theme.accentLight : theme.muted,
                            fontFamily: "inherit", fontSize: 11, fontWeight: 600, transition: "all .15s",
                          }}
                        >
                          {checked ? "✅" : "⬜"} {mod.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {(form.modulos || []).length === 0 && (
              <div style={{ color: theme.warning, fontSize: 12, marginTop: 6 }}>⚠️ Selecione pelo menos um módulo para este usuário.</div>
            )}
          </div>
        )}

        {erroForm && (
          <div style={{ background: `${theme.danger}18`, border: `1px solid ${theme.danger}44`, borderRadius: 8, padding: "10px 14px", marginTop: 8, color: theme.danger, fontSize: 13 }}>
            ⚠️ {erroForm}
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

// ─── ESTOQUE INSUMOS ─────────────────────────────────────────────────────────
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

// ─── MÁQUINAS (CADASTRO) ─────────────────────────────────────────────────────
function Maquinas({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.maquinas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ tipo: "Trator", status: "Ativa" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, maquinas: s.maquinas.filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, maquinas: editing ? s.maquinas.map(x => x.id === editing ? item : x) : [...(s.maquinas || []), item] }));
    setOpen(false);
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Nova Máquina</Btn>}>🚜 Máquinas e Equipamentos</SectionTitle>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🚜" text="Nenhuma máquina cadastrada." />
        ) : (
          <Table
            headers={["Identificação", "Tipo", "Modelo", "Placa/Patrimônio", "Status", "Ações"]}
            rows={items.map(m => (
              <tr key={m.id}>
                <Td><strong>{m.nome || "—"}</strong></Td>
                <Td>{m.tipo || "—"}</Td>
                <Td>{m.modelo || "—"}</Td>
                <Td>{m.placa || m.patrimonio || "—"}</Td>
                <Td><Badge color={m.status === "Ativa" ? "green" : "red"}>{m.status || "Ativa"}</Badge></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(m)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(m.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Máquina`}>
        <Row>
          <Field label="Identificação/Nome"><Input value={form.nome} onChange={e => fp("nome", e.target.value)} placeholder="Ex: Trator 5670" /></Field>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
              {["Trator", "Colheitadeira", "Caminhão", "Pulverizador", "Plantadeira", "Outros"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Modelo/Marca"><Input value={form.modelo} onChange={e => fp("modelo", e.target.value)} placeholder="Ex: John Deere 5075E" /></Field>
          <Field label="Placa / Patrimônio"><Input value={form.placa || form.patrimonio} onChange={e => fp("placa", e.target.value)} placeholder="Ex: ABC-1234" /></Field>
        </Row>
        <Row>
          <Field label="Ano Fabricação"><Input type="number" value={form.ano} onChange={e => fp("ano", e.target.value)} placeholder="2020" /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => fp("status", e.target.value)}>
              {["Ativa", "Manutenção", "Inativa"].map(s => <option key={s}>{s}</option>)}
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

// ─── ABASTECIMENTO (COMBUSTÍVEL) ─────────────────────────────────────────────
function Abastecimento({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.abastecimentos || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ tipo: "Diesel", data: new Date().toISOString().split("T")[0] }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, abastecimentos: s.abastecimentos.filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, abastecimentos: editing ? s.abastecimentos.map(x => x.id === editing ? item : x) : [...(s.abastecimentos || []), item] }));
    setOpen(false);
  };

  const totalLitros = items.reduce((sum, a) => sum + (parseFloat(a.litros) || 0), 0);
  const totalGastos = items.reduce((sum, a) => sum + ((parseFloat(a.litros) || 0) * (parseFloat(a.precoLitro) || 0)), 0);

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório de Abastecimento</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}.header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:20px}.faz-nome{font-size:17px;font-weight:900}.faz-sub{font-size:10px;color:#555}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:8px}</style></head><body>
    <div class="header"><div><div class="faz-nome">${faz.nome || "Fazenda"}</div><div class="faz-sub">Relatório de Abastecimento</div></div><div style="text-align:right">Gerado: ${new Date().toLocaleString("pt-BR")}</div></div>
    <table><thead><tr><th>Data</th><th>Máquina</th><th>Operador</th><th>Tipo</th><th>Litros</th><th>Preço/L</th><th>Total</th><th>Hodômetro</th></tr></thead><tbody>
    ${items.map(a => `<tr><td>${a.data}</td><td>${a.maquina}</td><td>${a.operador || "—"}</td><td>${a.tipo || "Diesel"}</td><td>${a.litros} L</td><td>R$ ${parseFloat(a.precoLitro || 0).toFixed(2)}</td><td>R$ ${((parseFloat(a.litros) || 0) * (parseFloat(a.precoLitro) || 0)).toFixed(2)}</td><td>${a.hodometro || "—"}</td>`).join("")}
    </tbody><tfoot><tr class="tot"><td colspan="4"><strong>TOTAIS</strong></td><td><strong>${totalLitros.toFixed(0)} L</strong></td><td></td><td><strong>R$ ${totalGastos.toFixed(2)}</strong></td><td></td></tr></tfoot></table>
    <div class="footer">AgriGest · Relatório de Abastecimento</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>⛽ Abastecimento de Combustível</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {items.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Relatório</Btn>}
          <Btn onClick={openNew}>+ Novo Abastecimento</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Abastecido", value: `${totalLitros.toFixed(0)} L`, color: theme.accent, icon: "⛽" },
          { label: "Total de Abastecimentos", value: items.length, color: theme.info, icon: "📋" },
          { label: "Total Gasto", value: `R$ ${totalGastos.toFixed(2)}`, color: theme.gold, icon: "💰" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: theme.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontWeight: 900, fontSize: 24, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="⛽" text="Nenhum abastecimento registrado." />
        ) : (
          <Table
            headers={["Data", "Máquina", "Operador", "Tipo", "Litros", "Preço/L", "Total", "Hodômetro", "Ações"]}
            rows={items.map(a => (
              <tr key={a.id}>
                <Td>{a.data}</Td>
                <Td><strong>{a.maquina}</strong></Td>
                <Td>{a.operador || "—"}</Td>
                <Td>{a.tipo || "Diesel"}</Td>
                <Td><strong style={{ color: theme.accent }}>{a.litros} L</strong></Td>
                <Td>R$ {parseFloat(a.precoLitro || 0).toFixed(2)}</Td>
                <Td>R$ {((parseFloat(a.litros) || 0) * (parseFloat(a.precoLitro) || 0)).toFixed(2)}</Td>
                <Td>{a.hodometro || "—"}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(a)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(a.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Abastecimento`} width={600}>
        <Row>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
          <Field label="Máquina">
            <Select value={form.maquina} onChange={e => fp("maquina", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.maquinas || []).map(m => <option key={m.id}>{m.nome} ({m.tipo})</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Operador">
            <Select value={form.operador} onChange={e => fp("operador", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.motoristas || []).map(m => <option key={m.id}>{m.nome}</option>)}
            </Select>
          </Field>
          <Field label="Tipo de Combustível">
            <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
              {["Diesel S10", "Diesel S500", "Gasolina Comum", "Gasolina Aditivada", "Etanol", "AdBlue"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Litros"><Input type="number" step="0.1" value={form.litros} onChange={e => fp("litros", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Preço por Litro (R$)"><Input type="number" step="0.01" value={form.precoLitro} onChange={e => fp("precoLitro", e.target.value)} placeholder="0.00" /></Field>
        </Row>
        <Row>
          <Field label="Hodômetro/Horímetro (opcional)"><Input value={form.hodometro} onChange={e => fp("hodometro", e.target.value)} placeholder="Ex: 12450 km" /></Field>
          <Field label="Posto/Bomba"><Input value={form.posto} onChange={e => fp("posto", e.target.value)} placeholder="Opcional" /></Field>
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

// ─── RELATÓRIO DE CONSUMO DE COMBUSTÍVEL ─────────────────────────────────────
function RelatorioCombustivel({ state }) {
  const abastecimentos = state.abastecimentos || [];
  const maquinas = state.maquinas || [];

  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [filtroMaquina, setFiltroMaquina] = useState("");

  const dadosFiltrados = abastecimentos.filter(a => {
    const matchMaq = filtroMaquina ? a.maquina === filtroMaquina : true;
    let matchData = true;
    if (periodoInicio && periodoFim) matchData = a.data >= periodoInicio && a.data <= periodoFim;
    else if (periodoInicio) matchData = a.data >= periodoInicio;
    else if (periodoFim) matchData = a.data <= periodoFim;
    return matchMaq && matchData;
  });

  const porMaquina = {};
  dadosFiltrados.forEach(a => {
    if (!porMaquina[a.maquina]) porMaquina[a.maquina] = { litros: 0, gasto: 0, abastecimentos: [] };
    porMaquina[a.maquina].litros += parseFloat(a.litros) || 0;
    porMaquina[a.maquina].gasto += (parseFloat(a.litros) || 0) * (parseFloat(a.precoLitro) || 0);
    porMaquina[a.maquina].abastecimentos.push(a);
  });

  const totalLitros = dadosFiltrados.reduce((sum, a) => sum + (parseFloat(a.litros) || 0), 0);
  const totalGasto = dadosFiltrados.reduce((sum, a) => sum + ((parseFloat(a.litros) || 0) * (parseFloat(a.precoLitro) || 0)), 0);

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório de Consumo</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}.header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:20px}.faz-nome{font-size:17px;font-weight:900}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
    <div class="header"><div><div class="faz-nome">${faz.nome || "Fazenda"}</div><div>Relatório de Consumo de Combustível</div></div><div>${new Date().toLocaleString("pt-BR")}</div></div>
    <table><thead><tr><th>Máquina</th><th>Litros</th><th>Gasto (R$)</th><th>Abastecimentos</th><th>Média (L/abast)</th></tr></thead><tbody>
    ${Object.entries(porMaquina).map(([nome, dados]) => `<tr><td><strong>${nome}</strong></td><td>${dados.litros.toFixed(0)} L</td><td>R$ ${dados.gasto.toFixed(2)}</td><td>${dados.abastecimentos.length}</td><td>${(dados.litros / dados.abastecimentos.length).toFixed(1)} L</td>`).join("")}
    </tbody><tfoot><tr class="tot"><td><strong>TOTAIS</strong></td><td><strong>${totalLitros.toFixed(0)} L</strong></td><td><strong>R$ ${totalGasto.toFixed(2)}</strong></td><td>${dadosFiltrados.length} abast.</td><td>${dadosFiltrados.length > 0 ? (totalLitros / dadosFiltrados.length).toFixed(1) : 0} L</td></tr></tfoot></table>
    <div class="footer">AgriGest · Relatório de Consumo</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📊 Relatório de Consumo de Combustível</h2>
        {dadosFiltrados.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Imprimir / PDF</Btn>}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>🔍 Filtros</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>🚜 Máquina</label><select value={filtroMaquina} onChange={e => setFiltroMaquina(e.target.value)} style={selectStyle}><option value="">Todas as máquinas</option>{maquinas.map(m => <option key={m.id}>{m.nome}</option>)}</select></div>
          <div><label style={labelStyle}>📅 Período — Início</label><input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} style={selectStyle} /></div>
          <div><label style={labelStyle}>📅 Período — Fim</label><input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} style={selectStyle} /></div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Litros", value: `${totalLitros.toFixed(0)} L`, color: theme.accent },
          { label: "Total Gasto", value: `R$ ${totalGasto.toFixed(2)}`, color: theme.gold },
          { label: "Média por Abastecimento", value: `${dadosFiltrados.length > 0 ? (totalLitros / dadosFiltrados.length).toFixed(1) : 0} L`, color: theme.info },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Resumo por Máquina</h3>
        {Object.entries(porMaquina).length === 0 ? (
          <EmptyState icon="📭" text="Nenhum dado encontrado para os filtros selecionados." />
        ) : (
          <Table
            headers={["Máquina", "Litros", "Gasto (R$)", "Abastecimentos", "Média (L/abast)"]}
            rows={Object.entries(porMaquina).map(([nome, dados]) => (
              <tr key={nome}>
                <Td><strong>{nome}</strong></Td>
                <Td><strong style={{ color: theme.accent }}>{dados.litros.toFixed(0)} L</strong></Td>
                <Td>R$ {dados.gasto.toFixed(2)}</Td>
                <Td>{dados.abastecimentos.length}</Td>
                <Td>{(dados.litros / dados.abastecimentos.length).toFixed(1)} L</Td>
              </tr>
            ))}
          />
        )}
      </Card>
    </div>
  );
}

// ─── PEÇAS (ALMOXARIFADO) ────────────────────────────────────────────────────
function Pecas({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.pecas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ unidade: "un", estoqueMinimo: 0 }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, pecas: s.pecas.filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, pecas: editing ? s.pecas.map(x => x.id === editing ? item : x) : [...(s.pecas || []), item] }));
    setOpen(false);
  };

  const gerarCodigoBarras = (codigo) => {
    if (!codigo) return "";
    return `*${codigo}*`;
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Nova Peça</Btn>}>🔧 Peças e Componentes</SectionTitle>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🔧" text="Nenhuma peça cadastrada." />
        ) : (
          <Table
            headers={["Código", "Descrição", "Categoria", "Localização", "Quantidade", "Est. Mínimo", "Unidade", "Ações"]}
            rows={items.map(p => {
              const qtd = parseFloat(p.quantidade) || 0;
              const min = parseFloat(p.estoqueMinimo) || 0;
              const status = qtd <= min ? (qtd === 0 ? "red" : "gold") : "green";
              return (
                <tr key={p.id}>
                  <Td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{p.codigo || "—"}</span></Td>
                  <Td><strong>{p.descricao || p.nome}</strong></Td>
                  <Td>{p.categoria || "—"}</Td>
                  <Td>{p.localizacao || "—"}</Td>
                  <Td><Badge color={status}>{qtd.toLocaleString()} {p.unidade}</Badge></Td>
                  <Td>{min > 0 ? `${min} ${p.unidade}` : "—"}</Td>
                  <Td>{p.unidade}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="secondary" onClick={() => openEdit(p)}>✏️</Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(p.id)}>🗑️</Btn>
                    </div>
                  </Td>
                </tr>
              );
            })}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Peça`} width={650}>
        <Row>
          <Field label="Código da Peça"><Input value={form.codigo} onChange={e => fp("codigo", e.target.value)} placeholder="Ex: FIL-001" /></Field>
          <Field label="Descrição / Nome"><Input value={form.descricao || form.nome} onChange={e => fp("descricao", e.target.value)} placeholder="Ex: Filtro de Óleo" required /></Field>
        </Row>
        <Row>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={e => fp("categoria", e.target.value)}>
              {["Filtro", "Correia", "Motor", "Transmissão", "Hidráulica", "Elétrica", "Pneu", "Ferramenta", "Outros"].map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Unidade">
            <Select value={form.unidade} onChange={e => fp("unidade", e.target.value)}>
              {["un", "kg", "L", "m", "par", "jogo"].map(u => <option key={u}>{u}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Quantidade Inicial"><Input type="number" step="0.01" value={form.quantidade} onChange={e => fp("quantidade", e.target.value)} placeholder="0" /></Field>
          <Field label="Estoque Mínimo"><Input type="number" step="0.01" value={form.estoqueMinimo} onChange={e => fp("estoqueMinimo", e.target.value)} placeholder="0" /></Field>
        </Row>
        <Row>
          <Field label="Localização (Prateleira/Estante)"><Input value={form.localizacao} onChange={e => fp("localizacao", e.target.value)} placeholder="Ex: A-12" /></Field>
          <Field label="Fornecedor"><Input value={form.fornecedor} onChange={e => fp("fornecedor", e.target.value)} placeholder="Opcional" /></Field>
        </Row>
        <Field label="Observações">
          <textarea value={form.obs || ""} onChange={e => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </Field>
        {form.codigo && (
          <div style={{ marginTop: 8, padding: 8, background: theme.surface, borderRadius: 6, textAlign: "center", fontFamily: "monospace", fontSize: 16 }}>
            🏷️ Código de Barras: {gerarCodigoBarras(form.codigo)}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar Peça</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── MOVIMENTAÇÃO DE PEÇAS ───────────────────────────────────────────────────
function MovimentacaoPecas({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.movimentacaoPecas || [];
  const pecas = state.pecas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ tipo: "Saída", data: new Date().toISOString().split("T")[0] }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, movimentacaoPecas: s.movimentacaoPecas.filter(x => x.id !== id) }));

  const save = () => {
    const peca = pecas.find(p => p.id === form.pecaId);
    if (peca) {
      const qtdMov = parseFloat(form.quantidade) || 0;
      const qtdAtual = parseFloat(peca.quantidade) || 0;
      if (form.tipo === "Saída" && qtdMov > qtdAtual) {
        alert(`Estoque insuficiente! Disponível: ${qtdAtual} ${peca.unidade}`);
        return;
      }
      const novaQtd = form.tipo === "Saída" ? qtdAtual - qtdMov : qtdAtual + qtdMov;
      setState(s => ({
        ...s,
        pecas: s.pecas.map(p => p.id === form.pecaId ? { ...p, quantidade: novaQtd } : p),
        movimentacaoPecas: editing
          ? s.movimentacaoPecas.map(x => x.id === editing ? { ...form, id: editing } : x)
          : [...s.movimentacaoPecas, { ...form, id: uid() }]
      }));
    }
    setOpen(false);
    setForm({});
  };

  const totalEntradas = items.filter(m => m.tipo === "Entrada").reduce((sum, m) => sum + (parseFloat(m.quantidade) || 0), 0);
  const totalSaidas = items.filter(m => m.tipo === "Saída").reduce((sum, m) => sum + (parseFloat(m.quantidade) || 0), 0);

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Movimentação de Peças</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}.header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
    <div class="header"><div><div class="faz-nome">${faz.nome || "Fazenda"}</div><div>Relatório de Movimentação de Peças</div></div><div>${new Date().toLocaleString("pt-BR")}</div></div>
    <table><thead><tr><th>Data</th><th>Peça</th><th>Tipo</th><th>Quantidade</th><th>Responsável</th><th>Destino/Origem</th><th>Motivo</th></tr></thead><tbody>
    ${items.map(m => {
      const peca = pecas.find(p => p.id === m.pecaId);
      return `<tr><td>${m.data}</td><td>${peca?.descricao || peca?.nome || m.pecaId}</td><td><strong>${m.tipo}</strong></td><td>${m.quantidade}</td><td>${m.responsavel || "—"}</td><td>${m.destino || m.origem || "—"}</td><td>${m.motivo || "—"}</td>`    }).join("")}
    </tbody><tfoot><tr class="tot"><td colspan="3"><strong>RESUMO</strong></td><td><strong>Entradas: ${totalEntradas}</strong></td><td><strong>Saídas: ${totalSaidas}</strong></td><td colspan="2"><strong>Saldo: ${(totalEntradas - totalSaidas).toFixed(0)}</strong></td></tr></tfoot></table>
    <div class="footer">AgriGest · Movimentação de Peças</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📦 Movimentação de Peças</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {items.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Relatório</Btn>}
          <Btn onClick={openNew}>+ Nova Movimentação</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Entradas", value: totalEntradas.toFixed(0), color: theme.accent, icon: "📥" },
          { label: "Total Saídas", value: totalSaidas.toFixed(0), color: theme.danger, icon: "📤" },
          { label: "Saldo em Estoque", value: (totalEntradas - totalSaidas).toFixed(0), color: theme.gold, icon: "📊" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 32, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="📦" text="Nenhuma movimentação registrada." />
        ) : (
          <Table
            headers={["Data", "Peça", "Tipo", "Quantidade", "Responsável", "Destino/Origem", "Motivo", "Ações"]}
            rows={items.map(m => {
              const peca = pecas.find(p => p.id === m.pecaId);
              return (
                <tr key={m.id}>
                  <Td>{m.data}</Td>
                  <Td><strong>{peca?.descricao || peca?.nome || m.pecaId}</strong></Td>
                  <Td><Badge color={m.tipo === "Entrada" ? "green" : "red"}>{m.tipo}</Badge></Td>
                  <Td><strong style={{ color: m.tipo === "Entrada" ? theme.accent : theme.danger }}>{m.quantidade}</strong></Td>
                  <Td>{m.responsavel || "—"}</Td>
                  <Td>{m.destino || m.origem || "—"}</Td>
                  <Td>{m.motivo || "—"}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="secondary" onClick={() => openEdit(m)}>✏️</Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(m.id)}>🗑️</Btn>
                    </div>
                  </Td>
                </tr>
              );
            })}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Movimentação`} width={600}>
        <Row>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
          <Field label="Peça">
            <Select value={form.pecaId} onChange={e => fp("pecaId", e.target.value)}>
              <option value="">Selecione...</option>
              {pecas.map(p => {
                const qtd = parseFloat(p.quantidade) || 0;
                return <option key={p.id} value={p.id}>{p.codigo} - {p.descricao || p.nome} (Estoque: {qtd} {p.unidade})</option>;
              })}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Tipo de Movimentação">
            <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
              <option value="Entrada">📥 Entrada (Compra/Devolução)</option>
              <option value="Saída">📤 Saída (Retirada/Manutenção)</option>
            </Select>
          </Field>
          <Field label="Quantidade"><Input type="number" step="0.01" value={form.quantidade} onChange={e => fp("quantidade", e.target.value)} placeholder="0" /></Field>
        </Row>
        <Row>
          <Field label="Responsável"><Input value={form.responsavel} onChange={e => fp("responsavel", e.target.value)} placeholder="Quem retirou/recebeu" /></Field>
          <Field label="Destino / Origem"><Input value={form.destino || form.origem} onChange={e => fp("destino", e.target.value)} placeholder="Ex: Trator 5670 / Fornecedor X" /></Field>
        </Row>
        <Field label="Motivo">
          <Select value={form.motivo} onChange={e => fp("motivo", e.target.value)}>
            <option value="">Selecione...</option>
            <option>Manutenção preventiva</option>
            <option>Manutenção corretiva</option>
            <option>Compra/Reposição</option>
            <option>Devolução</option>
            <option>Perda/Danificada</option>
          </Select>
        </Field>
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

// ─── ESTOQUE DE PEÇAS (CONSULTA) ─────────────────────────────────────────────
function EstoquePecas({ state }) {
  const pecas = state.pecas || [];
  const movimentacoes = state.movimentacaoPecas || [];

  const saldoPorPeca = {};
  movimentacoes.forEach(m => {
    if (!saldoPorPeca[m.pecaId]) saldoPorPeca[m.pecaId] = 0;
    const qtd = parseFloat(m.quantidade) || 0;
    if (m.tipo === "Entrada") saldoPorPeca[m.pecaId] += qtd;
    else saldoPorPeca[m.pecaId] -= qtd;
  });

  const pecasComSaldo = pecas.map(p => ({
    ...p,
    saldoCalculado: saldoPorPeca[p.id] || parseFloat(p.quantidade) || 0,
    estoqueMinimo: parseFloat(p.estoqueMinimo) || 0
  }));

  const pecasBaixo = pecasComSaldo.filter(p => p.saldoCalculado <= p.estoqueMinimo && p.estoqueMinimo > 0);
  const totalPecas = pecasComSaldo.reduce((sum, p) => sum + p.saldoCalculado, 0);

  return (
    <div>
      <SectionTitle>📊 Consulta de Estoque - Peças</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total de Peças", value: pecas.length, color: theme.info, icon: "🔧" },
          { label: "Itens em Estoque", value: totalPecas.toFixed(0), color: theme.accent, icon: "📦" },
          { label: "Peças com Estoque Baixo", value: pecasBaixo.length, color: theme.warning, icon: "⚠️" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 32, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {pecasComSaldo.length === 0 ? (
          <EmptyState icon="🔧" text="Nenhuma peça cadastrada." />
        ) : (
          <Table
            headers={["Código", "Descrição", "Categoria", "Localização", "Saldo Atual", "Est. Mínimo", "Status", "Última Movimentação"]}
            rows={pecasComSaldo.map(p => {
              const status = p.saldoCalculado <= p.estoqueMinimo ? (p.saldoCalculado === 0 ? "Zerado" : "Baixo") : "Normal";
              const corStatus = status === "Normal" ? "green" : (status === "Baixo" ? "gold" : "red");
              const ultMov = movimentacoes.filter(m => m.pecaId === p.id).sort((a, b) => b.data.localeCompare(a.data))[0];
              return (
                <tr key={p.id}>
                  <Td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{p.codigo || "—"}</span></Td>
                  <Td><strong>{p.descricao || p.nome}</strong></Td>
                  <Td>{p.categoria || "—"}</Td>
                  <Td>{p.localizacao || "—"}</Td>
                  <Td><strong style={{ color: theme.accent }}>{p.saldoCalculado.toLocaleString()} {p.unidade}</strong></Td>
                  <Td>{p.estoqueMinimo > 0 ? `${p.estoqueMinimo} ${p.unidade}` : "—"}</Td>
                  <Td><Badge color={corStatus}>{status}</Badge></Td>
                  <Td>{ultMov ? `${ultMov.data} (${ultMov.tipo})` : "—"}</Td>
                </tr>
              );
            })}
          />
        )}
      </Card>

      {pecasBaixo.length > 0 && (
        <Card style={{ marginTop: 20, borderColor: `${theme.warning}44`, background: `${theme.warning}0a` }}>
          <div style={{ fontWeight: 700, color: theme.warning, marginBottom: 12 }}>⚠️ PEÇAS COM ESTOQUE BAIXO</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {pecasBaixo.map(p => (
              <Badge key={p.id} color="red">{p.codigo} - {p.descricao || p.nome}: {p.saldoCalculado}/{p.estoqueMinimo} {p.unidade}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── FICHAS DE APLICAÇÃO (DEFENSIVOS/INSUMOS) ─────────────────────────────────
function FichasAplicacao({ state, setState }) {
  const [open, setOpen]               = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewOpen, setViewOpen]       = useState(false);
  const [form, setForm]               = useState({});
  const [itensForm, setItensForm]     = useState([]);
  const [editing, setEditing]         = useState(null);
  const [viewItem, setViewItem]       = useState(null);
  const items          = state.fichasAplicacao || [];
  const insumos        = state.insumos || [];
  const estoqueInsumos = state.estoqueInsumos || [];
  const talhoes        = state.talhoes || [];

  const getSaldoInsumo = (insumoId) => {
    const e = estoqueInsumos.find(e => e.insumoId === insumoId);
    return e ? parseFloat(e.qtd) || 0 : 0;
  };

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => {
    setForm({ data: new Date().toISOString().split("T")[0], status: "Planejada", tipo: "Defensivo" });
    setItensForm([]); setEditing(null); setOpen(true);
  };

  const openEdit = (ficha) => {
    setForm({ ...ficha }); setItensForm(ficha.itens || []);
    setEditing(ficha.id); setOpen(true);
  };

  const openView = (ficha) => { setViewItem(ficha); setViewOpen(true); };

  const del = (id) => {
    if (window.confirm("Excluir esta ficha? Isso não reverterá a baixa no estoque."))
      setState(s => ({ ...s, fichasAplicacao: s.fichasAplicacao.filter(x => x.id !== id) }));
  };

  const addItem = () => {
    if (!form.insumoId || !form.quantidade || parseFloat(form.quantidade) <= 0) {
      alert("Selecione um insumo e informe a quantidade!"); return;
    }
    const insumo = insumos.find(i => i.id === form.insumoId);
    const saldo  = getSaldoInsumo(form.insumoId);
    if (parseFloat(form.quantidade) > saldo) {
      alert(`Estoque insuficiente! Disponível: ${saldo} ${insumo?.unidade || "un"}`); return;
    }
    setItensForm(prev => [...prev, {
      id: uid(), insumoId: form.insumoId, insumoNome: insumo?.nome,
      quantidade: parseFloat(form.quantidade), unidade: insumo?.unidade,
      dosagem: form.dosagem || "", observacao: form.itemObs || ""
    }]);
    setForm(f => ({ ...f, insumoId: "", quantidade: "", dosagem: "", itemObs: "" }));
  };

  const removeItem = (itemId) => setItensForm(prev => prev.filter(i => i.id !== itemId));

  // ── Abre prévia após validar ──────────────────────────────────────────────
  const handleAbrirPrevia = () => {
    if (!form.talhao && !form.cultura) { alert("Informe o talhão ou cultura!"); return; }
    if (itensForm.length === 0) { alert("Adicione pelo menos um produto!"); return; }
    for (const item of itensForm) {
      const saldo = getSaldoInsumo(item.insumoId);
      if (item.quantidade > saldo) {
        const ins = insumos.find(i => i.id === item.insumoId);
        alert(`Estoque insuficiente para ${ins?.nome || item.insumoNome}. Disponível: ${saldo} ${item.unidade}`);
        return;
      }
    }
    const fichaPreview = {
      ...form,
      id: editing || uid(),
      numero: editing ? form.numero : `APL-${padNum(items.length + 1)}`,
      itens: itensForm,
      dataAplicacao: form.data,
      dataCriacao: new Date().toISOString(),
      status: "Executada"
    };
    setViewItem(fichaPreview);
    setPreviewOpen(true);
  };

  // ── Confirma salvar após revisar na prévia ────────────────────────────────
  const confirmarSalvar = () => {
    const ficha = viewItem;
    const novosEstoques = [...estoqueInsumos];
    for (const item of ficha.itens) {
      const idx = novosEstoques.findIndex(e => e.insumoId === item.insumoId);
      if (idx >= 0) {
        novosEstoques[idx] = {
          ...novosEstoques[idx],
          qtd: (parseFloat(novosEstoques[idx].qtd) - item.quantidade).toFixed(2)
        };
      }
    }
    setState(s => ({
      ...s,
      fichasAplicacao: editing
        ? s.fichasAplicacao.map(x => x.id === editing ? ficha : x)
        : [...(s.fichasAplicacao || []), ficha],
      estoqueInsumos: novosEstoques
    }));
    setPreviewOpen(false);
    setOpen(false);
    setItensForm([]);
    setForm({});
    setViewItem(null);
  };

  // ── HTML para impressão ───────────────────────────────────────────────────
  const gerarHTML = (ficha) => {
    const faz = state.fazenda || {};
    const talhaoInfo = talhoes.find(t => t.nome === ficha.talhao);
    const areaTotal  = parseFloat(talhaoInfo?.area) || 0;
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Ficha de Aplicação - ${ficha.numero}</title>
  <style>
    @page { size: A4 portrait; margin: 1.2cm 1.4cm; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Segoe UI',Arial,sans-serif; font-size:11px; color:#1e293b; background:#fff; padding:20px; }
    .cab { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #16a34a; padding-bottom:12px; margin-bottom:16px; gap:12px; }
    .cab-l { display:flex; align-items:center; gap:12px; }
    .logo { width:52px; height:52px; object-fit:contain; border-radius:8px; }
    .logo-ph { width:52px; height:52px; background:#f0fdf4; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:26px; border:1px solid #bbf7d0; }
    .faz-nome { font-size:15px; font-weight:900; color:#0f172a; }
    .faz-sub  { font-size:9px; color:#475569; margin-top:2px; line-height:1.5; }
    .cab-r { text-align:right; }
    .badge { background:#166534; color:#fff; font-size:8px; font-weight:800; letter-spacing:1.5px; padding:4px 12px; border-radius:20px; text-transform:uppercase; }
    .num { font-size:24px; font-weight:900; font-family:monospace; color:#0f172a; margin-top:5px; }
    .dt  { font-size:9px; color:#64748b; margin-top:2px; }
    .sec { font-size:8.5px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:#166534; background:#f0fdf4; border-left:4px solid #16a34a; padding:4px 10px; margin:14px 0 8px; border-radius:0 4px 4px 0; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:8px; }
    .ii { display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-size:10px; }
    .ii:nth-child(even) { border-right:none; }
    .il { font-weight:700; color:#475569; font-size:9px; }
    .iv { color:#0f172a; font-weight:500; }
    .iv.g { color:#16a34a; font-weight:700; }
    table { width:100%; border-collapse:collapse; margin-bottom:8px; }
    th { background:#1e293b; color:#fff; padding:6px 10px; font-size:8.5px; text-transform:uppercase; letter-spacing:1px; font-weight:700; text-align:left; }
    td { padding:6px 10px; border:1px solid #e2e8f0; font-size:10px; }
    tr:nth-child(even) td { background:#f8fafc; }
    tfoot td { background:#f0fdf4; font-weight:700; border-top:2px solid #16a34a; }
    .obs { background:#fefce8; border:1px solid #fde68a; border-left:3px solid #f59e0b; border-radius:4px; padding:6px 10px; font-size:9px; color:#78350f; margin:8px 0; }
    .assinaturas { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:22px; }
    .ass { text-align:center; }
    .asl { border-top:1.5px solid #0f172a; padding-top:5px; margin-bottom:3px; }
    .asn { font-size:9px; font-weight:700; color:#334155; }
    .asc { font-size:8px; color:#94a3b8; margin-top:1px; }
    .footer { margin-top:16px; font-size:7.5px; color:#94a3b8; text-align:center; border-top:1px solid #f1f5f9; padding-top:6px; }
    @media print { body { padding:0; } }
  </style>
</head>
<body>
  <div class="cab">
    <div class="cab-l">
      ${faz.logo ? `<img src="${faz.logo}" class="logo"/>` : '<div class="logo-ph">🌾</div>'}
      <div>
        <div class="faz-nome">${faz.nome || "FAZENDA"}</div>
        <div class="faz-sub">Produtor: <strong>${faz.produtor || "—"}</strong></div>
        <div class="faz-sub">CNPJ/CPF: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div>
        <div class="faz-sub">${faz.endereco || ""} ${faz.numero || ""}, ${faz.cidade || ""}/${faz.estado || ""}</div>
      </div>
    </div>
    <div class="cab-r">
      <span class="badge">Ficha de Aplicação</span>
      <div class="num">${ficha.numero}</div>
      <div class="dt">Emitido em ${new Date().toLocaleString("pt-BR")}</div>
    </div>
  </div>

  <div class="sec">INFORMAÇÕES GERAIS</div>
  <div class="info-grid">
    <div class="ii"><span class="il">📅 Data</span><span class="iv">${ficha.data || "—"}</span></div>
    <div class="ii"><span class="il">👤 Responsável</span><span class="iv">${ficha.responsavel || "—"}</span></div>
    <div class="ii"><span class="il">🗺️ Talhão</span><span class="iv g">${ficha.talhao || "—"}</span></div>
    <div class="ii"><span class="il">🌾 Cultura</span><span class="iv">${ficha.cultura || "—"}</span></div>
    <div class="ii"><span class="il">🧪 Tipo</span><span class="iv">${ficha.tipo || "—"}</span></div>
    <div class="ii"><span class="il">🌤️ Clima</span><span class="iv">${ficha.clima || "—"}</span></div>
    ${areaTotal > 0 ? `<div class="ii"><span class="il">📐 Área</span><span class="iv g">${areaTotal.toFixed(2)} ha</span></div><div class="ii"><span class="il">📦 Produtos</span><span class="iv">${ficha.itens.length} item(ns)</span></div>` : ""}
  </div>

  <div class="sec">PRODUTOS APLICADOS</div>
  <table>
    <thead><tr><th>Produto</th><th>Quantidade</th><th>Unidade</th><th>Dosagem</th><th>Observação</th></tr></thead>
    <tbody>
      ${ficha.itens.map(item => `
      <tr>
        <td><strong>${item.insumoNome || "—"}</strong></td>
        <td style="text-align:center">${item.quantidade.toLocaleString("pt-BR")}</td>
        <td style="text-align:center">${item.unidade || "—"}</td>
        <td>${item.dosagem || "—"}</td>
        <td>${item.observacao || "—"}</td>
      </tr>`).join("")}
    </tbody>
    <tfoot>
      <tr><td colspan="4" style="text-align:right;font-size:9px;color:#475569">TOTAL DE ITENS</td>
      <td style="text-align:center;font-size:13px;color:#16a34a">${ficha.itens.length}</td></tr>
    </tfoot>
  </table>

  ${ficha.observacoes ? `<div class="obs"><strong>📝 Observações:</strong> ${ficha.observacoes}</div>` : ""}

  <div class="assinaturas">
    <div class="ass"><div class="asl"></div><div class="asn">Aplicador</div><div class="asc">Nome / Assinatura</div></div>
    <div class="ass"><div class="asl"></div><div class="asn">Responsável Técnico</div><div class="asc">Nome / CREA ou CRBio</div></div>
    <div class="ass"><div class="asl"></div><div class="asn">Engenheiro Agrônomo</div><div class="asc">Nome / CREA</div></div>
  </div>

  <div class="footer">AgriGest · Sistema de Gestão do Agronegócio · ${new Date().toLocaleString("pt-BR")}</div>
</body>
</html>`;
  };

  const imprimirFicha = (ficha) => {
    const win = window.open("", "_blank");
    win.document.write(gerarHTML(ficha));
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const imprimirLista = () => {
    if (items.length === 0) { alert("Não há fichas para imprimir."); return; }
    const faz = state.fazenda || {};
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Lista de Fichas</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:24px;font-size:11px}
    .h{text-align:center;border-bottom:2px solid #16a34a;padding-bottom:12px;margin-bottom:18px}
    table{width:100%;border-collapse:collapse}th{background:#1e293b;color:#fff;padding:8px 10px;font-size:9px;text-transform:uppercase;text-align:left}
    td{padding:6px 10px;border:1px solid #dee2e6}tr:nth-child(even)td{background:#f8fafc}
    .f{margin-top:20px;text-align:center;font-size:8px;color:#aaa;border-top:1px solid #eee;padding-top:8px}</style>
    </head><body>
    <div class="h"><div style="font-size:18px;font-weight:900">${faz.nome || "FAZENDA"}</div>
    <div>Fichas de Aplicação · ${new Date().toLocaleString("pt-BR")}</div></div>
    <table><thead><tr><th>Nº</th><th>Data</th><th>Talhão</th><th>Cultura</th><th>Tipo</th><th>Produtos</th><th>Responsável</th></tr></thead>
    <tbody>${items.map(f => `<tr>
      <td style="font-family:monospace;font-weight:700">${f.numero}</td>
      <td>${f.data}</td><td>${f.talhao||"—"}</td><td>${f.cultura||"—"}</td>
      <td>${f.tipo||"—"}</td><td>${f.itens?.length||0}</td><td>${f.responsavel||"—"}</td>
    </tr>`).join("")}</tbody></table>
    <div class="f">AgriGest · ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  // ── Componente de Prévia inline ───────────────────────────────────────────
  const PreviewFicha = ({ ficha }) => {
    const faz = state.fazenda || {};
    const talhaoInfo = talhoes.find(t => t.nome === ficha.talhao);
    const areaTotal  = parseFloat(talhaoInfo?.area) || 0;
    const sec = (label) => (
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, color: "#166534", background: "#f0fdf4", borderLeft: "3px solid #16a34a", padding: "4px 10px", margin: "12px 0 8px", borderRadius: "0 4px 4px 0" }}>
        {label}
      </div>
    );
    return (
      <div style={{ background: "#fff", color: "#1e293b", fontFamily: "system-ui, sans-serif", fontSize: 12 }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #16a34a", paddingBottom: 12, marginBottom: 14, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {faz.logo
              ? <img src={faz.logo} style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8 }} alt="logo" />
              : <div style={{ width: 48, height: 48, background: "#f0fdf4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "1px solid #bbf7d0" }}>🌾</div>
            }
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>{faz.nome || "FAZENDA"}</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>Produtor: {faz.produtor || "—"}</div>
              <div style={{ fontSize: 10, color: "#475569" }}>CNPJ/CPF: {faz.cpfCnpj || "—"} | IE: {faz.ie || "—"}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ background: "#166534", color: "#fff", fontSize: 8, fontWeight: 800, letterSpacing: 1.5, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase" }}>Ficha de Aplicação</span>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color: "#0f172a", marginTop: 4 }}>{ficha.numero}</div>
          </div>
        </div>

        {/* Info Grid */}
        {sec("Informações Gerais")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          {[
            ["📅 Data",        ficha.data || "—"],
            ["👤 Responsável", ficha.responsavel || "—"],
            ["🗺️ Talhão",      ficha.talhao || "—"],
            ["🌾 Cultura",     ficha.cultura || "—"],
            ["🧪 Tipo",        ficha.tipo || "—"],
            ["🌤️ Clima",       ficha.clima || "—"],
            ...(areaTotal > 0 ? [["📐 Área", areaTotal.toFixed(2) + " ha"], ["📦 Produtos", ficha.itens.length + " item(ns)"]] : []),
          ].map(([label, value], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderBottom: "1px solid #e2e8f0", borderRight: i % 2 === 0 ? "1px solid #e2e8f0" : "none", fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: "#475569", fontSize: 10 }}>{label}</span>
              <span style={{ color: "#0f172a" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Produtos */}
        {sec("Produtos Aplicados")}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
          <thead>
            <tr style={{ background: "#1e293b" }}>
              {["Produto", "Quantidade", "Unidade", "Dosagem", "Observação"].map(h => (
                <th key={h} style={{ padding: "6px 10px", color: "#fff", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ficha.itens.map((item, i) => (
              <tr key={item.id || i} style={{ background: i % 2 === 1 ? "#f8fafc" : "#fff", borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "6px 10px", fontWeight: 600 }}>{item.insumoNome}</td>
                <td style={{ padding: "6px 10px", textAlign: "center" }}>{item.quantidade.toLocaleString("pt-BR")}</td>
                <td style={{ padding: "6px 10px", textAlign: "center" }}>{item.unidade || "—"}</td>
                <td style={{ padding: "6px 10px" }}>{item.dosagem || "—"}</td>
                <td style={{ padding: "6px 10px" }}>{item.observacao || "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0fdf4", borderTop: "2px solid #16a34a" }}>
              <td colSpan={4} style={{ padding: "6px 10px", fontWeight: 700, textAlign: "right", fontSize: 10, color: "#475569" }}>TOTAL DE ITENS</td>
              <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 900, color: "#16a34a", fontSize: 13 }}>{ficha.itens.length}</td>
            </tr>
          </tfoot>
        </table>

        {ficha.observacoes && (
          <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderLeft: "3px solid #f59e0b", borderRadius: 4, padding: "6px 10px", fontSize: 11, color: "#78350f", marginBottom: 10 }}>
            <strong>📝 Observações:</strong> {ficha.observacoes}
          </div>
        )}

        {/* Assinaturas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 20 }}>
          {[["Aplicador", "Nome / Assinatura"], ["Responsável Técnico", "Nome / CREA ou CRBio"], ["Engenheiro Agrônomo", "Nome / CREA"]].map(([nome, cargo]) => (
            <div key={nome} style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: 6, marginBottom: 3 }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: "#334155" }}>{nome}</div>
              <div style={{ fontSize: 9, color: "#94a3b8" }}>{cargo}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* TOPO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🧪 Fichas de Aplicação</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {items.length > 0 && <Btn variant="info" onClick={imprimirLista}>🖨️ Imprimir Lista</Btn>}
          <Btn onClick={openNew}>+ Nova Ficha</Btn>
        </div>
      </div>

      <Card style={{ marginBottom: 20, background: `${theme.info}0a`, borderColor: `${theme.info}33` }}>
        <p style={{ color: theme.muted, fontSize: 13 }}>
          📋 As fichas registram a utilização de insumos no campo. Ao confirmar, o sistema dará <strong>baixa automática no estoque</strong>.
        </p>
      </Card>

      {/* LISTAGEM */}
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🧪" text="Nenhuma ficha de aplicação registrada." />
        ) : (
          <Table
            headers={["Nº Ficha", "Data", "Talhão", "Cultura", "Produtos", "Responsável", "Ações"]}
            rows={items.map(f => (
              <tr key={f.id}>
                <Td><span style={{ fontFamily: "monospace", color: theme.info, fontWeight: 700 }}>{f.numero}</span></Td>
                <Td>{f.data}</Td>
                <Td>{f.talhao || "—"}</Td>
                <Td>{f.cultura || "—"}</Td>
                <Td><Badge color="blue">{f.itens?.length || 0} produto(s)</Badge></Td>
                <Td>{f.responsavel || "—"}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Btn size="sm" variant="info"      onClick={() => openView(f)}>👁️ Ver</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(f)}>✏️</Btn>
                    <Btn size="sm" variant="gold"      onClick={() => imprimirFicha(f)}>🖨️</Btn>
                    <Btn size="sm" variant="gold"      onClick={() => imprimirFicha(f)}>📄 PDF</Btn>
                    <Btn size="sm" variant="danger"    onClick={() => del(f.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      {/* ── MODAL: FORMULÁRIO ── */}
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Ficha de Aplicação`} width={750}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: theme.gold, marginBottom: 14, fontSize: 13 }}>📍 Dados da Aplicação</div>
          <Row cols={2}>
            <Field label="Data da Aplicação"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
            <Field label="Responsável Técnico"><Input value={form.responsavel} onChange={e => fp("responsavel", e.target.value)} placeholder="Nome do responsável" /></Field>
          </Row>
          <Row cols={2}>
            <Field label="Talhão">
              <Select value={form.talhao} onChange={e => {
                fp("talhao", e.target.value);
                const talh = talhoes.find(t => t.nome === e.target.value);
                if (talh?.grao) fp("cultura", talh.grao);
              }}>
                <option value="">Selecione o talhão...</option>
                {talhoes.map(t => <option key={t.id} value={t.nome}>{t.nome}{t.area ? ` (${t.area} ha)` : ""}</option>)}
              </Select>
            </Field>
            <Field label="Cultura">
              <Select value={form.cultura} onChange={e => fp("cultura", e.target.value)}>
                <option value="">Selecione...</option>
                {(state.fazenda?.graos || graosOpcoes).map(g => <option key={g}>{g}</option>)}
              </Select>
            </Field>
          </Row>
          <Row cols={2}>
            <Field label="Tipo de Aplicação">
              <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
                <option value="Defensivo">🧪 Defensivo</option>
                <option value="Fertilizante">🌱 Fertilizante / Adubo</option>
                <option value="Corretivo">⚖️ Corretivo</option>
                <option value="Semente">🌾 Semente</option>
              </Select>
            </Field>
            <Field label="Condições Climáticas">
              <Select value={form.clima} onChange={e => fp("clima", e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Ensolarado - Sem vento">☀️ Ensolarado - Sem vento</option>
                <option value="Nublado - Sem vento">☁️ Nublado - Sem vento</option>
                <option value="Chuva prevista">🌧️ Chuva prevista</option>
                <option value="Ventoso">💨 Ventoso</option>
              </Select>
            </Field>
          </Row>
        </div>

        <div style={{ marginBottom: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
          <div style={{ fontWeight: 700, color: theme.accent, marginBottom: 14, fontSize: 13 }}>🧪 Produtos Utilizados</div>
          {itensForm.length > 0 && (
            <div style={{ marginBottom: 16, background: theme.surface, borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: theme.bg }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11 }}>Produto</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11 }}>Quantidade</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11 }}>Dosagem</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensForm.map(item => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: "8px 12px" }}><strong>{item.insumoNome}</strong></td>
                      <td style={{ padding: "8px 12px" }}>{item.quantidade} {item.unidade}</td>
                      <td style={{ padding: "8px 12px" }}>{item.dosagem || "—"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <Btn size="sm" variant="danger" onClick={() => removeItem(item.id)}>✕</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ background: theme.bg, borderRadius: 8, padding: 12, border: `1px solid ${theme.border}` }}>
            <Row cols={3}>
              <Field label="Produto">
                <Select value={form.insumoId} onChange={e => fp("insumoId", e.target.value)}>
                  <option value="">Selecione...</option>
                  {insumos.map(i => {
                    const saldo = getSaldoInsumo(i.id);
                    return <option key={i.id} value={i.id}>{i.nome} (Est: {saldo} {i.unidade})</option>;
                  })}
                </Select>
              </Field>
              <Field label="Quantidade">
                <Input type="number" step="0.01" value={form.quantidade} onChange={e => fp("quantidade", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Dosagem (opcional)">
                <Input value={form.dosagem} onChange={e => fp("dosagem", e.target.value)} placeholder="Ex: 2 L/ha" />
              </Field>
            </Row>
            <Field label="Observação do item (opcional)">
              <Input value={form.itemObs} onChange={e => fp("itemObs", e.target.value)} placeholder="Ex: Aplicado nas bordas" />
            </Field>
            <div style={{ marginTop: 10 }}>
              <Btn variant="secondary" onClick={addItem}>+ Adicionar Produto</Btn>
            </div>
          </div>
        </div>

        <Field label="Observações Gerais">
          <textarea value={form.observacoes || ""} onChange={e => fp("observacoes", e.target.value)} rows={2}
            style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            placeholder="Observações sobre a aplicação..." />
        </Field>

        <div style={{ marginTop: 14, padding: 12, background: `${theme.warning}0a`, borderRadius: 8, border: `1px solid ${theme.warning}44` }}>
          <p style={{ fontSize: 12, color: theme.warning }}>
            ⚠️ Ao confirmar, os produtos serão <strong>baixados automaticamente do estoque</strong>. Revise a ficha antes de salvar.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn variant="info" onClick={handleAbrirPrevia}>👁️ Visualizar e Salvar</Btn>
        </div>
      </Modal>

      {/* ── MODAL: PRÉVIA ── */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Prévia da Ficha de Aplicação" width={820}>
        {viewItem && (
          <div>
            <div style={{ background: `${theme.accent}0f`, border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.accentLight }}>✅ Ficha pronta para salvar</div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>Revise os dados. Você pode imprimir antes de confirmar.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="info" onClick={() => imprimirFicha(viewItem)}>🖨️ Imprimir</Btn>
                <Btn variant="gold" onClick={() => imprimirFicha(viewItem)}>📄 Salvar PDF</Btn>
                <Btn onClick={confirmarSalvar}>💾 Confirmar e Salvar</Btn>
              </div>
            </div>
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, background: "#fff" }}>
              <PreviewFicha ficha={viewItem} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${theme.border}` }}>
              <Btn variant="secondary" onClick={() => setPreviewOpen(false)}>← Voltar e Editar</Btn>
              <Btn variant="info" onClick={() => imprimirFicha(viewItem)}>🖨️ Imprimir</Btn>
              <Btn variant="gold" onClick={() => imprimirFicha(viewItem)}>📄 Salvar PDF</Btn>
              <Btn onClick={confirmarSalvar}>💾 Confirmar e Salvar</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL: VER FICHA SALVA ── */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Ficha — ${viewItem?.numero || ""}`} width={820}>
        {viewItem && (
          <div>
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, background: "#fff", marginBottom: 16 }}>
              <PreviewFicha ficha={viewItem} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="info"      onClick={() => imprimirFicha(viewItem)}>🖨️ Imprimir</Btn>
              <Btn variant="gold"      onClick={() => imprimirFicha(viewItem)}>📄 Salvar PDF</Btn>
              <Btn variant="secondary" onClick={() => setViewOpen(false)}>Fechar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


// ─── RELATÓRIO DE CARREGAMENTOS (POR CLIENTE/CONTRATO) ───────────────────────
function RelatorioCarregamentos({ state }) {
  const romaneiosSaida = state.romaneiosSaida || [];
  const clientes = state.clientes || [];
  const contratos = state.contratos || [];

  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");

  const dadosFiltrados = romaneiosSaida.filter(r => {
    const matchCliente = filtroCliente ? r.cliente === filtroCliente : true;
    const matchContrato = filtroContrato ? r.contrato === filtroContrato : true;
    let matchData = true;
    if (periodoInicio && periodoFim) matchData = r.data >= periodoInicio && r.data <= periodoFim;
    else if (periodoInicio) matchData = r.data >= periodoInicio;
    else if (periodoFim) matchData = r.data <= periodoFim;
    return matchCliente && matchContrato && matchData;
  });

  const porCliente = {};
  dadosFiltrados.forEach(r => {
    if (!porCliente[r.cliente]) porCliente[r.cliente] = { kg: 0, sc: 0, valor: 0, cargas: [] };
    const kg = parseFloat(r.pesoFinal) || 0;
    const sc = kg / 60;
    porCliente[r.cliente].kg += kg;
    porCliente[r.cliente].sc += sc;
    porCliente[r.cliente].cargas.push(r);
  });

  const totalKg = dadosFiltrados.reduce((sum, r) => sum + (parseFloat(r.pesoFinal) || 0), 0);
  const totalSc = totalKg / 60;

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório de Carregamentos</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}.header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:20px}.faz-nome{font-size:17px;font-weight:900}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
    <div class="header"><div><div class="faz-nome">${faz.nome || "Fazenda"}</div><div>Relatório de Carregamentos</div></div><div>${new Date().toLocaleString("pt-BR")}</div></div>
    <tr><thead><tr><th>Cliente</th><th>Total (kg)</th><th>Sacas (60kg)</th><th>Cargas</th></tr></thead><tbody>
    ${Object.entries(porCliente).map(([nome, dados]) => `<tr><td><strong>${nome}</strong></td><td>${dados.kg.toLocaleString()} kg</td><td>${Math.round(dados.sc).toLocaleString()} sc</td><td>${dados.cargas.length}</td>`).join("")}
    </tbody><tfoot><tr class="tot"><td><strong>TOTAIS</strong></td><td><strong>${totalKg.toLocaleString()} kg</strong></td><td><strong>${Math.round(totalSc).toLocaleString()} sc</strong></td><td><strong>${dadosFiltrados.length} cargas</strong></td></tr></tfoot>
    </table>
    <div class="footer">AgriGest · Relatório de Carregamentos</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📦 Relatório de Carregamentos</h2>
        {dadosFiltrados.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Imprimir / PDF</Btn>}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>🔍 Filtros</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>👥 Cliente</label><select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} style={selectStyle}><option value="">Todos os clientes</option>{clientes.map(c => <option key={c.id}>{c.nome}</option>)}</select></div>
          <div><label style={labelStyle}>📋 Contrato</label><select value={filtroContrato} onChange={e => setFiltroContrato(e.target.value)} style={selectStyle}><option value="">Todos os contratos</option>{contratos.map(c => <option key={c.id}>{c.numero}</option>)}</select></div>
          <div><label style={labelStyle}>📅 Período — Início</label><input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} style={selectStyle} /></div>
          <div><label style={labelStyle}>📅 Período — Fim</label><input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} style={selectStyle} /></div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Carregamentos", value: dadosFiltrados.length, color: theme.info },
          { label: "Total Toneladas", value: `${(totalKg / 1000).toFixed(2)} t`, color: theme.accent },
          { label: "Total de Sacos", value: `${Math.round(totalSc).toLocaleString()} sc`, color: theme.gold },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {Object.entries(porCliente).length === 0 ? (
          <EmptyState icon="📭" text="Nenhum carregamento encontrado para os filtros selecionados." />
        ) : (
          <Table
            headers={["Cliente", "Total (kg)", "Sacas (60kg)", "Cargas", "Contratos"]}
            rows={Object.entries(porCliente).map(([nome, dados]) => {
              const contratosUnicos = [...new Set(dados.cargas.map(c => c.contrato).filter(Boolean))];
              return (
                <tr key={nome}>
                  <Td><strong>{nome}</strong></Td>
                  <Td>{dados.kg.toLocaleString()} kg</Td>
                  <Td><strong style={{ color: theme.accent }}>{Math.round(dados.sc).toLocaleString()} sc</strong></Td>
                  <Td>{dados.cargas.length}</Td>
                  <Td>{contratosUnicos.join(", ") || "—"}</Td>
                </tr>
              );
            })}
          />
        )}
      </Card>
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

  // Função para gerar HTML do relatório
  const gerarHTMLRelatorio = () => {
    const faz = state.fazenda || {};
    const periodoLabel = dataFiltro ? `Data: ${dataFiltro}` : "Todos os dias";
    
    let html = `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8"/>
      <title>Relatório Diário de Colheita - ${dataFiltro}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;font-size:12px;color:#111;background:#fff}
        .container{max-width:1200px;margin:0 auto}
        .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2ecc71;padding-bottom:14px;margin-bottom:20px}
        .faz-nome{font-size:18px;font-weight:900;color:#2c3e50}
        .faz-sub{font-size:10px;color:#7f8c8d;margin-top:2px}
        .logo-img{width:56px;height:56px;object-fit:contain;border-radius:8px}
        .periodo-badge{background:#2ecc71;color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;display:inline-block}
        .resumo-cards{display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap}
        .resumo-card{flex:1;min-width:150px;background:#f8f9fa;border-radius:12px;padding:16px;text-align:center;border:1px solid #e9ecef}
        .resumo-card .valor{font-size:28px;font-weight:900;color:#2ecc71}
        .resumo-card .label{font-size:11px;color:#6c757d;margin-top:5px;text-transform:uppercase;letter-spacing:1px}
        h2{font-size:14px;margin:20px 0 12px;font-weight:800;border-left:4px solid #2ecc71;padding-left:12px;color:#2c3e50}
        table{width:100%;border-collapse:collapse;margin-bottom:16px}
        th{background:#2ecc71;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
        td{padding:8px 12px;border:1px solid #dee2e6;font-size:12px}
        tr:nth-child(even){background:#f8f9fa}
        .tot td{font-weight:700;background:#e8f5e9}
        .grand-total{background:#d4edda;font-weight:900;border-top:2px solid #2ecc71}
        .footer{margin-top:28px;font-size:9px;color:#adb5bd;text-align:center;border-top:1px solid #e9ecef;padding-top:12px}
        @media print{
          body{padding:0;margin:0}
          .no-print{display:none}
          th{background:#ddd;color:#000}
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="display:flex;align-items:center;gap:15px">
            ${faz.logo ? `<img src="${faz.logo}" class="logo-img"/>` : '<div style="width:56px;height:56px;background:#2ecc71;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px">🌾</div>'}
            <div>
              <div class="faz-nome">${faz.nome || "FAZENDA"}</div>
              <div class="faz-sub">Produtor: ${faz.produtor || "—"} | ${faz.cidade || ""} ${faz.estado ? `- ${faz.estado}` : ""}</div>
              <div class="faz-sub">CNPJ/CPF: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div class="periodo-badge">RELATÓRIO DIÁRIO</div>
            <div style="font-size:20px;font-weight:800;margin-top:8px">${dataFiltro}</div>
            <div style="color:#6c757d;font-size:10px;margin-top:4px">Gerado: ${new Date().toLocaleString("pt-BR")}</div>
          </div>
        </div>
        
        <div class="resumo-cards">
          <div class="resumo-card"><div class="valor">${talhaoEntries.length}</div><div class="label">Talhões Colhidos</div></div>
          <div class="resumo-card"><div class="valor">${totalCargasDia}</div><div class="label">Cargas no Dia</div></div>
          <div class="resumo-card"><div class="valor">${Math.round(totalSacasDia).toLocaleString()}</div><div class="label">Sacas Colhidas (60kg)</div></div>
          <div class="resumo-card"><div class="valor">${(totalKgDia / 1000).toFixed(1)}</div><div class="label">Toneladas</div></div>
        </div>
        
        ${talhaoEntries.map(([nome, dados]) => {
          const sacasTalhao = dados.totalKg / SC_KG;
          const info = talhoes.find(t => t.nome === nome);
          const areaTotal = (info?.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0);
          const produtividade = areaTotal > 0 ? (sacasTalhao / areaTotal).toFixed(1) : null;
          
          return `
          <h2>🗺️ ${nome}</h2>
          <table>
            <thead>
              <tr><th>Nº Romaneio</th><th>Grão</th><th>Placa</th><th>Motorista</th><th>Peso Final (kg)</th><th>Sacas (60kg)</th></tr>
            </thead>
            <tbody>
              ${dados.cargas.map(r => `
                <tr>
                  <td style="font-family:monospace">${r.numero}</td>
                  <td>${r.grao || "—"}</td>
                  <td>${r.placa || "—"}</td>
                  <td>${r.motorista || "—"}</td>
                  <td style="text-align:right">${(parseFloat(r.pesoFinal) || 0).toLocaleString()} kg</td>
                  <td style="text-align:center">${Math.round((parseFloat(r.pesoFinal) || 0) / SC_KG)} sc</td>
                </tr>
              `).join("")}
            </tbody>
            <tfoot>
              <tr class="tot">
                <td colspan="3"><strong>TOTAL DO TALHÃO</strong></td>
                <td><strong>${dados.cargas.length} carga(s)</strong></td>
                <td style="text-align:right"><strong>${dados.totalKg.toLocaleString()} kg</strong></td>
                <td style="text-align:center"><strong>${Math.round(sacasTalhao).toLocaleString()} sc</strong> ${produtividade ? `(≈ ${produtividade} sc/ha)` : ""}</td>
              </tr>
            </tfoot>
          </table>
        `;
        }).join("")}
        
        ${talhaoEntries.length > 0 ? `
        <table style="margin-top:20px">
          <tfoot>
            <tr class="grand-total">
              <td colspan="3"><strong>▶ TOTAL GERAL DO DIA</strong></td>
              <td><strong>${talhaoEntries.length} talhão(ões)</strong></td>
              <td style="text-align:right"><strong>${totalKgDia.toLocaleString()} kg</strong></td>
              <td style="text-align:center"><strong>${Math.round(totalSacasDia).toLocaleString()} sacas</strong></td>
            </tr>
          </tfoot>
        </table>
        ` : ""}
        
        <div class="footer">
          AgriGest - Sistema de Gestão do Agronegócio<br/>
          Relatório gerado eletronicamente em ${new Date().toLocaleString("pt-BR")}
        </div>
      </div>
    </body>
    </html>`;
    
    return html;
  };

  const imprimir = () => {
    if (talhaoEntries.length === 0) {
      alert(`Nenhum recebimento registrado em ${dataFiltro}.`);
      return;
    }
    const win = window.open("", "_blank");
    win.document.write(gerarHTMLRelatorio());
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const salvarPDF = () => {
    if (talhaoEntries.length === 0) {
      alert(`Nenhum recebimento registrado em ${dataFiltro}.`);
      return;
    }
    const win = window.open("", "_blank");
    win.document.write(gerarHTMLRelatorio());
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => win.close(), 1000);
    }, 500);
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📅 Relatório Diário de Colheita</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {talhaoEntries.length > 0 && (
            <>
              <Btn variant="info" onClick={imprimir}>🖨️ Imprimir</Btn>
              <Btn variant="gold" onClick={salvarPDF}>📄 Salvar PDF</Btn>
            </>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>🔍 Filtros</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>📅 Data</label>
            <input 
              type="date" 
              value={dataFiltro} 
              onChange={e => setDataFiltro(e.target.value)} 
              style={selectStyle} 
            />
          </div>
          <div>
            <label style={labelStyle}>🗺️ Talhão</label>
            <select 
              value={filtroTalhao} 
              onChange={e => setFiltroTalhao(e.target.value)} 
              style={selectStyle}
            >
              <option value="">Todos os talhões</option>
              {talhoesLista.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Cards de resumo */}
      {talhaoEntries.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Talhões Colhidos", value: talhaoEntries.length, color: theme.gold, icon: "🗺️" },
            { label: "Cargas no Dia", value: totalCargasDia, color: theme.info, icon: "🚜" },
            { label: "Sacas Colhidas", value: Math.round(totalSacasDia).toLocaleString(), color: theme.accent, icon: "🌾", suffix: " sc" },
            { label: "Toneladas", value: (totalKgDia / 1000).toFixed(1), color: theme.accentLight, icon: "⚖️", suffix: " t" },
          ].map((s, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: theme.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}<span style={{ fontSize: 14, fontWeight: 400 }}>{s.suffix || ""}</span></div>
                </div>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabela de detalhes por talhão */}
      {talhaoEntries.length === 0 ? (
        <Card>
          <EmptyState 
            icon="📅" 
            text={dataFiltro ? `Nenhum recebimento registrado em ${dataFiltro}.` : "Selecione uma data para ver o relatório."} 
          />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {talhaoEntries.map(([nome, dados]) => {
            const sacasTalhao = dados.totalKg / SC_KG;
            const info = talhoes.find(t => t.nome === nome);
            const areaTotal = (info?.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0);
            const produtividade = areaTotal > 0 ? (sacasTalhao / areaTotal).toFixed(1) : null;
            
            return (
              <Card key={nome} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ 
                  padding: "14px 20px", 
                  background: `${theme.accent}0a`, 
                  borderBottom: `1px solid ${theme.border}`, 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  flexWrap: "wrap", 
                  gap: 10 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      background: `${theme.accent}22`, 
                      borderRadius: 10, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: 20 
                    }}>🗺️</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{nome}</div>
                      <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
                        {areaTotal > 0 && <span>Área: <strong>{areaTotal.toFixed(1)} ha</strong> · </span>}
                        {(info?.culturas || []).map(c => c.grao).join(", ")}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Cargas</div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: theme.info }}>{dados.cargas.length}</div>
                    </div>
                    <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Sacas</div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: theme.accent }}>{Math.round(sacasTalhao).toLocaleString()}</div>
                    </div>
                    {produtividade && (
                      <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Produtividade</div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: theme.gold }}>{produtividade} sc/ha</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme.surface }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: theme.muted }}>Nº Romaneio</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: theme.muted }}>Grão</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: theme.muted }}>Placa</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: theme.muted }}>Motorista</th>
                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: theme.muted }}>Peso Final (kg)</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: theme.muted }}>Sacas (60kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.cargas.map((r, idx) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}18`, background: idx % 2 === 0 ? "transparent" : `${theme.surface}66` }}>
                          <td style={{ padding: "10px 16px", fontFamily: "monospace", color: theme.info, fontWeight: 700 }}>{r.numero}</td>
                          <td style={{ padding: "10px 16px" }}>🌾 {r.grao}</td>
                          <td style={{ padding: "10px 16px" }}>{r.placa || "—"}</td>
                          <td style={{ padding: "10px 16px" }}>{r.motorista || "—"}</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>{(parseFloat(r.pesoFinal) || 0).toLocaleString()} kg</td>
                          <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700, color: theme.accent }}>{Math.round((parseFloat(r.pesoFinal) || 0) / SC_KG)} sc</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: `${theme.accent}0a`, borderTop: `1px solid ${theme.border}` }}>
                        <td style={{ padding: "10px 16px", fontWeight: 700, color: theme.muted }} colSpan="3">TOTAL DO TALHÃO NO DIA</td>
                        <td style={{ padding: "10px 16px", fontWeight: 700, color: theme.info }}>{dados.cargas.length} carga(s)</td>
                        <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700 }}>{dados.totalKg.toLocaleString()} kg</td>
                        <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 900, color: theme.accent }}>{Math.round(sacasTalhao).toLocaleString()} sc</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            );
          })}
          
          {/* Total Geral */}
          <Card style={{ background: `${theme.accent}0a`, borderColor: `${theme.accent}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>▶ TOTAL GERAL DO DIA</span>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Talhões</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: theme.gold }}>{talhaoEntries.length}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Cargas</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: theme.info }}>{totalCargasDia}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Sacas</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: theme.accent }}>{Math.round(totalSacasDia).toLocaleString()} sc</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Toneladas</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: theme.accentLight }}>{(totalKgDia / 1000).toFixed(1)} t</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
// ─── VENDA DE MILHO EM BAGS (ROMANEIO DE VENDA) ─────────────────────────────
function VendaMilhoBags({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const items = state.vendasMilho || [];
  
  // Dados auxiliares
  const clientes = state.clientes || [];
  const caminhoes = state.caminhoes || [];
  const motoristas = state.motoristas || [];
  const transportadoras = state.transportadoras || [];
  
  // Configuração PIX da fazenda
  const [configPix, setConfigPix] = useState(state.configPixVenda || {
    chave: "",
    tipo: "CPF",
    nomeTitular: "",
    cidade: "",
    instrucoes: "Após o pagamento, envie o comprovante para o WhatsApp da fazenda."
  });

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const openNew = () => { 
    setForm({ 
      data: new Date().toISOString().split("T")[0],
      status: "Pendente",
      formaPagamento: "PIX"
    }); 
    setEditing(null); 
    setOpen(true); 
  };
  
  const openEdit = (venda) => { 
    setForm({ ...venda }); 
    setEditing(venda.id); 
    setOpen(true); 
  };
  
  const openView = (venda) => {
    setViewItem(venda);
    setViewOpen(true);
  };

  const del = (id) => {
    if (window.confirm("Excluir esta venda? Isso não irá reverter a baixa no estoque.")) {
      setState(s => ({ ...s, vendasMilho: s.vendasMilho.filter(x => x.id !== id) }));
    }
  };

  // Calcular valores baseado nas sacas
  const calcularPorSacas = () => {
    const qtdSacas = parseFloat(form.quantidadeSacas) || 0;
    const precoSaca = parseFloat(form.precoSaca) || 0;
    const valorTotal = qtdSacas * precoSaca;
    const pesoTotalKg = qtdSacas * 60; // 1 saca = 60kg
    return { valorTotal, pesoTotalKg, qtdSacas, precoSaca };
  };

  // Calcular valores baseado na pesagem
  const calcularPorPesagem = () => {
    const pesoBruto = parseFloat(form.pesoBruto) || 0;
    const pesoTara = parseFloat(form.pesoTara) || 0;
    const pesoLiquido = Math.max(0, pesoBruto - pesoTara);
    const qtdSacasCalc = pesoLiquido / 60;
    const precoSaca = parseFloat(form.precoSaca) || 0;
    const valorTotal = qtdSacasCalc * precoSaca;
    return { pesoLiquido, qtdSacasCalc, valorTotal, precoSaca, pesoBruto, pesoTara };
  };

  // Determinar qual método de cálculo está sendo usado
  const isUsandoPesagem = () => {
    return (form.pesoBruto && form.pesoBruto > 0) || (form.pesoTara && form.pesoTara > 0);
  };

  // Obter valores atuais
  const getValoresAtuais = () => {
    if (isUsandoPesagem()) {
      const { pesoLiquido, qtdSacasCalc, valorTotal, precoSaca, pesoBruto, pesoTara } = calcularPorPesagem();
      return { 
        quantidadeSacas: qtdSacasCalc, 
        valorTotal, 
        pesoTotalKg: pesoLiquido,
        precoSaca,
        pesoBruto,
        pesoTara,
        pesoLiquido
      };
    } else {
      const { qtdSacas, valorTotal, pesoTotalKg, precoSaca } = calcularPorSacas();
      return { 
        quantidadeSacas: qtdSacas, 
        valorTotal, 
        pesoTotalKg,
        precoSaca,
        pesoBruto: 0,
        pesoTara: 0,
        pesoLiquido: pesoTotalKg
      };
    }
  };

  // Verificar estoque de milho
  const getEstoqueMilho = () => {
    const entradas = state.romaneiosEntrada?.filter(r => r.grao === "Milho") || [];
    const saidas = state.romaneiosSaida?.filter(r => r.grao === "Milho") || [];
    const vendas = state.vendasMilho || [];
    
    const totalEntrada = entradas.reduce((sum, r) => sum + (parseFloat(r.pesoFinal) || 0), 0);
    const totalSaida = saidas.reduce((sum, r) => sum + (parseFloat(r.pesoFinal) || 0), 0);
    const totalVendas = vendas.reduce((sum, v) => sum + (v.pesoTotalKg || 0), 0);
    
    const saldoKg = totalEntrada - totalSaida - totalVendas;
    const saldoSacas = saldoKg / 60;
    
    return { saldoKg, saldoSacas: Math.max(0, saldoSacas) };
  };

  const valores = getValoresAtuais();
  const { saldoSacas } = getEstoqueMilho();
  const { quantidadeSacas, valorTotal, pesoTotalKg, precoSaca, pesoBruto, pesoTara, pesoLiquido } = valores;

  // Abrir pré-visualização antes de salvar
  const handleVisualizarAntesSalvar = () => {
    if (!form.cliente) {
      alert("Selecione o cliente!");
      return;
    }
    if (!form.transportadora && !form.motorista && !form.placa) {
      alert("Preencha pelo menos transportadora, motorista ou placa!");
      return;
    }
    
    const qtdAtual = quantidadeSacas;
    if (qtdAtual <= 0) {
      alert("Informe a quantidade de sacas ou realize a pesagem!");
      return;
    }
    if (qtdAtual > saldoSacas) {
      alert(`Estoque insuficiente! Disponível: ${Math.floor(saldoSacas)} sacas`);
      return;
    }
    
    const vendaPreview = {
      ...form,
      numero: editing ? form.numero : `VENDA-${padNum((items.length + 1))}`,
      quantidadeSacas: qtdAtual,
      valorTotal: valorTotal,
      pesoTotalKg: pesoTotalKg,
      precoSaca: precoSaca,
      pesoBruto: pesoBruto,
      pesoTara: pesoTara,
      pesoLiquido: pesoLiquido,
      dataCriacao: new Date().toISOString(),
      id: "preview_" + Date.now()
    };
    setPreviewData(vendaPreview);
    setPreviewOpen(true);
  };

  // Confirmar e salvar após pré-visualização
  const confirmarSalvar = () => {
    const venda = {
      ...previewData,
      id: editing || uid(),
      status: form.status || "Confirmada"
    };
    delete venda.id;
    
    const vendaFinal = { ...venda, id: editing || uid() };
    
    setState(s => ({ 
      ...s, 
      vendasMilho: editing ? s.vendasMilho.map(x => x.id === editing ? vendaFinal : x) : [...(s.vendasMilho || []), vendaFinal],
      configPixVenda: configPix
    }));
    
    setPreviewOpen(false);
    setOpen(false);
    setForm({});
    setPreviewData(null);
  };

  // Função para gerar HTML do romaneio de venda
  const gerarHTMLRomaneio = (venda) => {
    const faz = state.fazenda || {};
    const chavePix = configPix.chave;
    const tipoChave = configPix.tipo === "CPF" ? "CPF" : configPix.tipo === "CNPJ" ? "CNPJ" : configPix.tipo === "Email" ? "E-mail" : "Telefone";
    const isPreview = venda.id?.toString().startsWith("preview");
    
    return `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8"/>
      <title>Romaneio de Venda - ${venda.numero}</title>
      <style>
        @page { size: A4 portrait; margin: 1.2cm 1.4cm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; padding: 20px; }
        .container { max-width: 1100px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d4a843; padding-bottom: 12px; margin-bottom: 16px; gap: 12px; }
        .cab-l { display: flex; align-items: center; gap: 12px; }
        .logo { width: 52px; height: 52px; object-fit: contain; border-radius: 8px; }
        .logo-ph { width: 52px; height: 52px; background: #fef3c7; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 26px; border: 1px solid #fcd34d; }
        .faz-nome { font-size: 15px; font-weight: 900; color: #0f172a; }
        .faz-sub { font-size: 9px; color: #475569; margin-top: 2px; line-height: 1.5; }
        .cab-r { text-align: right; }
        .badge { background: #d4a843; color: #0f172a; font-size: 8px; font-weight: 800; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
        .badge-preview { background: #f59e0b; }
        .num { font-size: 24px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 5px; }
        .dt { font-size: 9px; color: #64748b; margin-top: 2px; }
        .sec { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #92400e; background: #fef3c7; border-left: 4px solid #d4a843; padding: 4px 10px; margin: 14px 0 8px; border-radius: 0 4px 4px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 8px; }
        .ii { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-size: 10px; }
        .ii:nth-child(even) { border-right: none; }
        .il { font-weight: 700; color: #475569; font-size: 9px; }
        .iv { color: #0f172a; font-weight: 500; }
        .iv.g { color: #d4a843; font-weight: 700; }
        .valor-destaque { font-size: 18px; font-weight: 900; color: #d4a843; }
        .pix-box { background: #f0f9ff; border: 2px solid #d4a843; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; }
        .pix-title { font-size: 14px; font-weight: 800; color: #d4a843; margin-bottom: 10px; }
        .pix-chave { font-family: monospace; font-size: 16px; font-weight: 700; background: #fff; padding: 8px 16px; border-radius: 8px; display: inline-block; letter-spacing: 1px; }
        .qrcode-placeholder { width: 120px; height: 120px; background: #fff; border: 1px solid #ddd; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 10px auto; font-size: 40px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        th { background: #1e293b; color: #fff; padding: 6px 10px; font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; text-align: left; }
        td { padding: 6px 10px; border: 1px solid #e2e8f0; font-size: 10px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .total-row { background: #fef3c7; font-weight: 700; }
        .pesagem-box { display: flex; align-items: center; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 8px 0; background: #f8fafc; }
        .peso-item { flex: 1; text-align: center; padding: 8px 5px; border-right: 1px solid #e2e8f0; }
        .peso-item:last-child { border-right: none; }
        .peso-item.destaque { background: #fef3c7; }
        .peso-sep { font-size: 14px; font-weight: 900; color: #94a3b8; padding: 0 6px; flex-shrink: 0; }
        .peso-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 4px; }
        .peso-val { font-size: 14px; font-weight: 900; color: #1e293b; }
        .peso-val.green { color: #16a34a; }
        .assinaturas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 22px; }
        .ass { text-align: center; }
        .asl { border-top: 1.5px solid #0f172a; padding-top: 5px; margin-bottom: 3px; }
        .asn { font-size: 9px; font-weight: 700; color: #334155; }
        .footer { margin-top: 16px; font-size: 7.5px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 6px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="cab-l">
            ${faz.logo ? `<img src="${faz.logo}" class="logo"/>` : '<div class="logo-ph">🌾</div>'}
            <div>
              <div class="faz-nome">${faz.nome || "FAZENDA"}</div>
              <div class="faz-sub">Produtor: <strong>${faz.produtor || "—"}</strong></div>
              <div class="faz-sub">CNPJ/CPF: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div>
              <div class="faz-sub">${faz.endereco || ""} ${faz.numero || ""}, ${faz.cidade || ""}/${faz.estado || ""}</div>
            </div>
          </div>
          <div class="cab-r">
            <span class="badge ${isPreview ? 'badge-preview' : ''}">${isPreview ? "PRÉ-VISUALIZAÇÃO" : "ROMANEIO DE VENDA"}</span>
            <div class="num">${venda.numero}</div>
            <div class="dt">Emitido em ${new Date().toLocaleString("pt-BR")}</div>
          </div>
        </div>

        <div class="sec">📋 INFORMAÇÕES DA VENDA</div>
        <div class="info-grid">
          <div class="ii"><span class="il">📅 Data da Venda</span><span class="iv">${venda.data || "—"}</span></div>
          <div class="ii"><span class="il">👤 Cliente</span><span class="iv g">${venda.cliente || "—"}</span></div>
          <div class="ii"><span class="il">🚛 Transportadora</span><span class="iv">${venda.transportadora || "—"}</span></div>
          <div class="ii"><span class="il">🚜 Motorista</span><span class="iv">${venda.motorista || "—"}</span></div>
          <div class="ii"><span class="il">🚛 Placa do Caminhão</span><span class="iv">${venda.placa || "—"}</span></div>
          <div class="ii"><span class="il">💳 Forma de Pagamento</span><span class="iv">${venda.formaPagamento || "PIX"}</span></div>
        </div>

        <div class="sec">⚖️ PESAGEM</div>
        <div class="pesagem-box">
          <div class="peso-item"><div class="peso-lbl">PESO BRUTO</div><div class="peso-val">${(venda.pesoBruto || 0).toLocaleString("pt-BR")} <span style="font-size:9px">kg</span></div></div>
          <div class="peso-sep">−</div>
          <div class="peso-item"><div class="peso-lbl">TARA</div><div class="peso-val">${(venda.pesoTara || 0).toLocaleString("pt-BR")} <span style="font-size:9px">kg</span></div></div>
          <div class="peso-sep">=</div>
          <div class="peso-item destaque"><div class="peso-lbl">PESO LÍQUIDO</div><div class="peso-val green">${(venda.pesoLiquido || venda.pesoTotalKg || 0).toLocaleString("pt-BR")} <span style="font-size:9px">kg</span></div></div>
        </div>

        <div class="sec">🌾 PRODUTO</div>
        <table>
          <thead><tr><th>Produto</th><th>Quantidade (sacas)</th><th>Peso Total (kg)</th><th>Valor Unitário</th><th>Valor Total</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>🌽 Milho em Bag</strong></td>
              <td style="text-align:center">${(venda.quantidadeSacas || 0).toLocaleString()} sc</td>
              <td style="text-align:center">${(venda.pesoTotalKg || 0).toLocaleString()} kg</td>
              <td style="text-align:center">R$ ${(venda.precoSaca || 0).toFixed(2)}/sc</td>
              <td style="text-align:center; font-weight:700; color:#d4a843">R$ ${(venda.valorTotal || 0).toLocaleString("pt-BR", {minimumFractionDigits:2})}</td>
            </tr>
          </tbody>
        </table>

        <div class="sec">💰 INFORMAÇÕES DE PAGAMENTO</div>
        <div class="pix-box">
          <div class="pix-title">💳 PAGAMENTO VIA PIX</div>
          <div class="qrcode-placeholder">📱 QR Code</div>
          <div><strong>Chave PIX (${tipoChave}):</strong></div>
          <div class="pix-chave">${chavePix || "____________________"}</div>
          <div style="margin-top: 12px; font-size: 10px; color: #475569">
            <strong>Nome do Titular:</strong> ${configPix.nomeTitular || "—"}<br/>
            <strong>Cidade:</strong> ${configPix.cidade || "—"}
          </div>
          <div style="margin-top: 8px; font-size: 9px; color: #92400e; background: #fef3c7; padding: 6px; border-radius: 6px">
            ⚠️ ${configPix.instrucoes || "Após o pagamento, envie o comprovante para o WhatsApp da fazenda."}
          </div>
        </div>

        ${venda.observacoes ? `<div class="obs" style="background:#fefce8;border:1px solid #fde68a;border-left:3px solid #f59e0b;border-radius:4px;padding:6px 10px;font-size:9px;color:#78350f;margin:8px 0"><strong>📝 Observações:</strong> ${venda.observacoes}</div>` : ""}

        <div class="assinaturas">
          <div class="ass"><div class="asl"></div><div class="asn">Comprador</div><div class="asc">Nome / Assinatura</div></div>
          <div class="ass"><div class="asl"></div><div class="asn">Vendedor</div><div class="asc">Fazenda / Representante</div></div>
          <div class="ass"><div class="asl"></div><div class="asn">Motorista</div><div class="asc">Nome / Assinatura</div></div>
        </div>

        <div class="footer">
          AgriGest - Sistema de Gestão do Agronegócio<br/>
          ${isPreview ? "* Este documento é uma pré-visualização. Confirme os dados antes de salvar." : "Este documento é um comprovante de venda. Após o pagamento, o produto será liberado para retirada."}
        </div>
      </div>
    </body>
    </html>`;
  };

  // Funções de impressão
  const imprimirRomaneio = (venda) => {
    const win = window.open("", "_blank");
    win.document.write(gerarHTMLRomaneio(venda));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const salvarPDF = (venda) => {
    const win = window.open("", "_blank");
    win.document.write(gerarHTMLRomaneio(venda));
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => win.close(), 1000);
    }, 500);
  };

  const imprimirLista = () => {
    if (items.length === 0) {
      alert("Não há vendas registradas.");
      return;
    }
    const faz = state.fazenda || {};
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"/><title>Lista de Vendas de Milho</title>
    <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;font-size:12px}
    .header{text-align:center;border-bottom:2px solid #d4a843;padding-bottom:12px;margin-bottom:20px}
    .faz-nome{font-size:20px;font-weight:900}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#d4a843;color:#0f172a;padding:10px;text-align:left}
    td{padding:8px 10px;border:1px solid #dee2e6}
    .footer{margin-top:24px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:12px}
    </style></head>
    <body>
      <div class="header">
        <div class="faz-nome">${faz.nome || "FAZENDA"}</div>
        <div>Relatório de Vendas de Milho em Bags</div>
        <div>Gerado em: ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      <table><thead><tr><th>Nº Venda</th><th>Data</th><th>Cliente</th><th>Sacas</th><th>Peso (kg)</th><th>Valor Total</th><th>Status</th></tr></thead>
      <tbody>${items.map(v => `<tr>
        <td style="font-family:monospace">${v.numero}</td>
        <td>${v.data}</td>
        <td>${v.cliente}</td>
        <td>${v.quantidadeSacas} sc</td>
        <td>${(v.pesoTotalKg || 0).toLocaleString()} kg</td>
        <td>R$ ${(v.valorTotal || 0).toFixed(2)}</td>
        <td>${v.status || "Confirmada"}</td>
      80`).join("")}</tbody>
    </table>
      <div class="footer">AgriGest · Relatório de Vendas</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  // Configurar PIX
  const [pixModalOpen, setPixModalOpen] = useState(false);
  
  const salvarConfigPix = () => {
    setState(s => ({ ...s, configPixVenda: configPix }));
    setPixModalOpen(false);
    alert("Configuração PIX salva com sucesso!");
  };

  // Limpar campos de pesagem
  const limparPesagem = () => {
    fp("pesoBruto", "");
    fp("pesoTara", "");
  };

  // Limpar campos de sacas
  const limparSacas = () => {
    fp("quantidadeSacas", "");
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🌽 Venda de Milho em Bags</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="info" onClick={() => setPixModalOpen(true)}>⚙️ Configurar PIX</Btn>
          {items.length > 0 && <Btn variant="info" onClick={imprimirLista}>🖨️ Imprimir Lista</Btn>}
          <Btn onClick={openNew}>+ Nova Venda</Btn>
        </div>
      </div>

      {/* Card de Estoque */}
      <Card style={{ marginBottom: 20, background: `${theme.accent}0a`, borderColor: `${theme.accent}44` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <span style={{ fontSize: 20 }}>📦</span>
            <span style={{ fontWeight: 700, marginLeft: 8 }}>Estoque Disponível de Milho:</span>
          </div>
          <div>
            <Badge color="gold" style={{ fontSize: 16, padding: "8px 16px" }}>
              {Math.floor(saldoSacas).toLocaleString()} sacas ({Math.floor(saldoSacas * 60).toLocaleString()} kg)
            </Badge>
          </div>
        </div>
      </Card>

      {/* Listagem de Vendas */}
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🌽" text="Nenhuma venda de milho registrada." />
        ) : (
          <Table
            headers={["Nº Venda", "Data", "Cliente", "Sacas", "Peso (kg)", "Valor Total", "Status", "Ações"]}
            rows={items.map(v => (
              <tr key={v.id}>
                <Td><span style={{ fontFamily: "monospace", color: theme.gold, fontWeight: 700 }}>{v.numero}</span></Td>
                <Td>{v.data}</Td>
                <Td><strong>{v.cliente}</strong></Td>
                <Td>{v.quantidadeSacas} sc</Td>
                <Td>{(v.pesoTotalKg || 0).toLocaleString()} kg</Td>
                <Td><strong style={{ color: theme.gold }}>R$ {(v.valorTotal || 0).toLocaleString("pt-BR", {minimumFractionDigits:2})}</strong></Td>
                <Td><Badge color={v.status === "Confirmada" ? "green" : "gold"}>{v.status || "Confirmada"}</Badge></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Btn size="sm" variant="info" onClick={() => openView(v)}>👁️ Ver</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(v)}>✏️</Btn>
                    <Btn size="sm" variant="gold" onClick={() => imprimirRomaneio(v)}>🖨️</Btn>
                    <Btn size="sm" variant="gold" onClick={() => salvarPDF(v)}>📄 PDF</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(v.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      {/* MODAL: Nova Venda */}
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Venda de Milho`} width={750}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: theme.gold, marginBottom: 14, fontSize: 13 }}>📋 Dados da Venda</div>
          <Row cols={2}>
            <Field label="Data da Venda"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
            <Field label="Cliente">
              <Select value={form.cliente} onChange={e => fp("cliente", e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id}>{c.nome}</option>)}
              </Select>
            </Field>
          </Row>
          <Row cols={2}>
            <Field label="Transportadora">
              <Select value={form.transportadora} onChange={e => fp("transportadora", e.target.value)}>
                <option value="">Selecione...</option>
                {transportadoras.map(t => <option key={t.id}>{t.nome}</option>)}
              </Select>
            </Field>
            <Field label="Motorista">
              <Select value={form.motorista} onChange={e => fp("motorista", e.target.value)}>
                <option value="">Selecione...</option>
                {motoristas.map(m => <option key={m.id}>{m.nome}</option>)}
              </Select>
            </Field>
          </Row>
          <Row cols={2}>
            <Field label="Placa do Caminhão">
              <Select value={form.placa} onChange={e => fp("placa", e.target.value)}>
                <option value="">Selecione...</option>
                {caminhoes.map(c => <option key={c.id}>{c.placa}-{c.uf}</option>)}
              </Select>
            </Field>
            <Field label="Forma de Pagamento">
              <Select value={form.formaPagamento} onChange={e => fp("formaPagamento", e.target.value)}>
                <option value="PIX">💳 PIX</option>
                <option value="Boleto">📄 Boleto Bancário</option>
                <option value="Transferência">🏦 Transferência Bancária</option>
                <option value="Dinheiro">💰 Dinheiro</option>
              </Select>
            </Field>
          </Row>
        </div>

        {/* Seção de Pesagem */}
        <div style={{ marginBottom: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
          <div style={{ fontWeight: 700, color: theme.accent, marginBottom: 14, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚖️ Pesagem (opcional - preencha ou use quantidade em sacas)</span>
            <Btn size="sm" variant="secondary" onClick={limparPesagem}>Limpar Pesagem</Btn>
          </div>
          <Row cols={3}>
            <Field label="Peso Bruto (kg)">
              <Input 
                type="number" 
                step="1" 
                value={form.pesoBruto} 
                onChange={e => {
                  fp("pesoBruto", e.target.value);
                  if (e.target.value && form.pesoTara) {
                    const liquido = parseFloat(e.target.value) - parseFloat(form.pesoTara || 0);
                    if (liquido > 0) {
                      const sacasCalc = liquido / 60;
                      fp("quantidadeSacas", Math.round(sacasCalc * 10) / 10);
                    }
                  }
                }} 
                placeholder="0" 
              />
            </Field>
            <Field label="Tara (kg)">
              <Input 
                type="number" 
                step="1" 
                value={form.pesoTara} 
                onChange={e => {
                  fp("pesoTara", e.target.value);
                  if (form.pesoBruto && e.target.value) {
                    const liquido = parseFloat(form.pesoBruto) - parseFloat(e.target.value);
                    if (liquido > 0) {
                      const sacasCalc = liquido / 60;
                      fp("quantidadeSacas", Math.round(sacasCalc * 10) / 10);
                    }
                  }
                }} 
                placeholder="0" 
              />
            </Field>
            <Field label="Peso Líquido (kg)">
              <Input 
                value={pesoLiquido > 0 ? pesoLiquido.toLocaleString() + " kg" : "—"} 
                readOnly 
                highlight={pesoLiquido > 0 ? theme.accent : theme.muted}
              />
            </Field>
          </Row>
        </div>

        {/* Seção do Produto */}
        <div style={{ marginBottom: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
          <div style={{ fontWeight: 700, color: theme.accent, marginBottom: 14, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🌾 Quantidade e Valor</span>
            <Btn size="sm" variant="secondary" onClick={limparSacas}>Limpar Quantidade</Btn>
          </div>
          <Row cols={3}>
            <Field label="Quantidade (sacas de 60kg)">
              <Input 
                type="number" 
                step="1" 
                value={form.quantidadeSacas} 
                onChange={e => {
                  fp("quantidadeSacas", e.target.value);
                  const qtd = parseFloat(e.target.value) || 0;
                  if (qtd > saldoSacas) {
                    alert(`Estoque insuficiente! Disponível: ${Math.floor(saldoSacas)} sacas`);
                  }
                }} 
                placeholder="0" 
              />
            </Field>
            <Field label="Preço por Saca (R$)">
              <Input type="number" step="0.01" value={form.precoSaca} onChange={e => fp("precoSaca", e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Valor Total">
              <Input value={`R$ ${valorTotal.toFixed(2)}`} readOnly highlight={theme.gold} />
            </Field>
          </Row>
          <div style={{ marginTop: 8, padding: 8, background: `${theme.accent}0a`, borderRadius: 6 }}>
            <span style={{ fontSize: 11, color: theme.muted }}>📦 Estoque disponível: </span>
            <strong style={{ color: quantidadeSacas <= saldoSacas ? theme.accent : theme.danger }}>
              {Math.floor(saldoSacas)} sacas
            </strong>
            {quantidadeSacas > 0 && (
              <span style={{ fontSize: 11, marginLeft: 16 }}>
                📊 Peso total: <strong>{pesoTotalKg.toLocaleString()} kg</strong>
              </span>
            )}
          </div>
        </div>

        <Field label="Observações">
          <textarea value={form.observacoes || ""} onChange={e => fp("observacoes", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} placeholder="Observações sobre a venda, entrega, etc..." />
        </Field>

        <div style={{ marginTop: 16, padding: 12, background: `${theme.warning}0a`, borderRadius: 8, border: `1px solid ${theme.warning}44` }}>
          <div style={{ fontSize: 12, color: theme.warning, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span>
            <span>Ao salvar esta venda, a quantidade será <strong>baixada automaticamente do estoque</strong> de milho.</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn variant="info" onClick={handleVisualizarAntesSalvar}>👁️ Visualizar e Continuar</Btn>
        </div>
      </Modal>

      {/* MODAL: PRÉ-VISUALIZAÇÃO ANTES DE SALVAR */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Pré-visualização do Romaneio de Venda" width={820}>
        {previewData && (
          <div>
            <div style={{ background: `${theme.accent}0f`, border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.accentLight }}>✅ Revise os dados antes de salvar</div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>Você pode imprimir ou salvar como PDF antes de confirmar.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="info" onClick={() => imprimirRomaneio(previewData)}>🖨️ Imprimir</Btn>
                <Btn variant="gold" onClick={() => salvarPDF(previewData)}>📄 Salvar PDF</Btn>
              </div>
            </div>
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, background: "#fff", maxHeight: "60vh", overflowY: "auto" }}>
              <div dangerouslySetInnerHTML={{ __html: gerarHTMLRomaneio(previewData) }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${theme.border}` }}>
              <Btn variant="secondary" onClick={() => setPreviewOpen(false)}>← Voltar e Editar</Btn>
              <Btn variant="info" onClick={() => imprimirRomaneio(previewData)}>🖨️ Imprimir</Btn>
              <Btn variant="gold" onClick={() => salvarPDF(previewData)}>📄 Salvar PDF</Btn>
              <Btn onClick={confirmarSalvar}>✅ Confirmar e Salvar</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Visualizar Venda Salva */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Romaneio de Venda - ${viewItem?.numero || ""}`} width={820}>
        {viewItem && (
          <div>
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, background: "#fff", maxHeight: "65vh", overflowY: "auto" }}>
              <div dangerouslySetInnerHTML={{ __html: gerarHTMLRomaneio(viewItem) }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <Btn variant="info" onClick={() => imprimirRomaneio(viewItem)}>🖨️ Imprimir</Btn>
              <Btn variant="gold" onClick={() => salvarPDF(viewItem)}>📄 Salvar PDF</Btn>
              <Btn variant="secondary" onClick={() => setViewOpen(false)}>Fechar</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Configuração PIX */}
      <Modal open={pixModalOpen} onClose={() => setPixModalOpen(false)} title="Configuração da Chave PIX" width={500}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: theme.muted, fontSize: 13, marginBottom: 16 }}>
            Configure a chave PIX que será exibida nos romaneios de venda para pagamento.
          </p>
          <Field label="Tipo da Chave PIX">
            <Select value={configPix.tipo} onChange={e => setConfigPix(p => ({ ...p, tipo: e.target.value }))}>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="Email">E-mail</option>
              <option value="Telefone">Telefone (WhatsApp)</option>
              <option value="Aleatorio">Chave Aleatória</option>
            </Select>
          </Field>
          <Field label="Chave PIX">
            <Input 
              value={configPix.chave} 
              onChange={e => setConfigPix(p => ({ ...p, chave: e.target.value }))} 
              placeholder="Digite a chave PIX" 
            />
          </Field>
          <Field label="Nome do Titular">
            <Input 
              value={configPix.nomeTitular} 
              onChange={e => setConfigPix(p => ({ ...p, nomeTitular: e.target.value }))} 
              placeholder="Nome completo do titular da conta" 
            />
          </Field>
          <Field label="Cidade">
            <Input 
              value={configPix.cidade} 
              onChange={e => setConfigPix(p => ({ ...p, cidade: e.target.value }))} 
              placeholder="Cidade do titular" 
            />
          </Field>
          <Field label="Instruções adicionais">
            <textarea 
              value={configPix.instrucoes} 
              onChange={e => setConfigPix(p => ({ ...p, instrucoes: e.target.value }))} 
              rows={2}
              style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }}
              placeholder="Ex: Após o pagamento, envie o comprovante para o WhatsApp (XX) XXXXX-XXXX"
            />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setPixModalOpen(false)}>Cancelar</Btn>
          <Btn onClick={salvarConfigPix}>💾 Salvar Configuração</Btn>
        </div>
      </Modal>
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
  // Verifica se o usuário tem acesso ao módulo ativo
  const temAcesso = (pageId) => {
    if (usuarioLogado?.role === "admin") return true;
    const modulos = usuarioLogado?.modulos || [];
    // Admin pages are already filtered in nav
    if (["usuarios", "lixeira"].includes(pageId)) return false;
    return modulos.includes(pageId);
  };

  const page = () => {
    if (!temAcesso(active)) {
      return (
        <div style={{ textAlign: "center", padding: "60px 20px", color: theme.muted }}>
          <div style={{ fontSize: 54, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: theme.text, fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Acesso Restrito</h2>
          <p style={{ fontSize: 14 }}>Você não tem permissão para acessar este módulo.</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>Entre em contato com o administrador para solicitar acesso.</p>
        </div>
      );
    }
    if (crudPages[active]) return <CrudPage key={active} {...crudPages[active]} state={state} setState={ss} />;
    switch (active) {
      case "dashboard": return <Dashboard state={state} setActive={setActive} />;
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
      case "relatorioCarregamentos": return <RelatorioCarregamentos state={state} />;
      case "lixeira": return <Lixeira state={state} setState={ss} />;
      case "maquinas": return <Maquinas state={state} setState={ss} />;
      case "abastecimento": return <Abastecimento state={state} setState={ss} />;
      case "relatorioCombustivel": return <RelatorioCombustivel state={state} />;
      case "pecas": return <Pecas state={state} setState={ss} />;
      case "movimentacaoPecas": return <MovimentacaoPecas state={state} setState={ss} />;
      case "estoquePecas": return <EstoquePecas state={state} />;
      case "fichasAplicacao": return <FichasAplicacao state={state} setState={ss} />;
      case "vendaMilho": return <VendaMilhoBags state={state} setState={ss} />;
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
        <div style={{ maxWidth: 1200 }}>{page()}</div>
      </main>
    </div>
  );
}