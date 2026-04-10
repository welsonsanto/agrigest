import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── THEME ──────────────────────────────────────────────────────────────────
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

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
};

const graosOpcoes = ["Soja", "Milho", "Sorgo", "Milheto", "Gergelim"];
const safrasOpcoes = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];
const padNum = (n: number) => String(n).padStart(5, "0");

// ─── RESPONSIVE HOOK ────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── CÁLCULOS ───────────────────────────────────────────────────────────────
function calcDescUmidade(umidade: any, umRef: any, umDesc: any, umDescPesado: any) {
  const v = parseFloat(umidade) || 0;
  const r = parseFloat(umRef) || 0;
  const pN = parseFloat(umDesc) || 0;
  const pP = parseFloat(umDescPesado) || 0;
  if (v <= r) return { desconto: "0.00", faixa: "normal" };
  if (v < 20) return { desconto: ((v - r) * pN).toFixed(2), faixa: "normal" };
  return { desconto: ((v - r) * pP).toFixed(2), faixa: "pesada" };
}

function calcDesc(val: any, ref: any, pct: any) {
  const v = parseFloat(val) || 0, r = parseFloat(ref) || 0, p = parseFloat(pct) || 0;
  return v > r ? ((v - r) * p).toFixed(2) : "0.00";
}

// ─── COMPONENTES BASE (RESPONSIVOS) ─────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }: any) => {
  const variants: any = {
    primary: { background: theme.accent, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: theme.text, border: `1px solid ${theme.border}` },
    danger: { background: `${theme.danger}22`, color: theme.danger, border: `1px solid ${theme.danger}44` },
    gold: { background: `${theme.gold}22`, color: theme.gold, border: `1px solid ${theme.gold}44` },
    info: { background: `${theme.info}22`, color: theme.info, border: `1px solid ${theme.info}44` },
  };
  const sizes: any = {
    sm: { padding: "6px 14px", fontSize: 12 },
    md: { padding: "10px 18px", fontSize: 13 },
    lg: { padding: "14px 26px", fontSize: 15 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size],
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", fontWeight: 600, transition: "all .2s",
      opacity: disabled ? .5 : 1, whiteSpace: "nowrap" as const, minHeight: 44, ...style,
    }}>{children}</button>
  );
};

const Card = ({ children, style = {} }: any) => (
  <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, ...style }}>
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children, width = 600, footer }: any) => {
  const isMobile = useIsMobile();
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 16 }} onClick={onClose}>
      <div style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: isMobile ? "16px 16px 0 0" : 16,
        width: "100%", maxWidth: isMobile ? "100%" : width,
        maxHeight: isMobile ? "90vh" : "85vh",
        display: "flex", flexDirection: "column" as const,
      }} onClick={(e: any) => e.stopPropagation()}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: theme.card, zIndex: 1, borderRadius: isMobile ? "16px 16px 0 0" : "16px 16px 0 0" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 22, lineHeight: 1, minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: 16, overflowY: "auto" as const, flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme.border}`, flexShrink: 0, background: theme.card, borderRadius: isMobile ? 0 : "0 0 16px 16px" }}>{footer}</div>}
      </div>
    </div>
  );
};

const Field = ({ label, children, style = {} }: any) => (
  <div style={{ marginBottom: 14, ...style }}>
    <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" as const }}>{label}</div>
    {children}
  </div>
);

const Input = ({ value, onChange, onKeyDown, placeholder, type = "text", readOnly = false, highlight, step }: any) => (
  <input
    type={type} step={step} value={value || ""} onChange={onChange} onKeyDown={onKeyDown}
    placeholder={placeholder} readOnly={readOnly}
    style={{
      width: "100%", background: readOnly ? theme.surface : theme.bg,
      border: `1px solid ${theme.border}`, color: highlight || theme.text,
      padding: "10px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 14,
      outline: "none", boxSizing: "border-box" as const, minHeight: 44,
    }}
  />
);

const Select = ({ value, onChange, children }: any) => (
  <select value={value || ""} onChange={onChange} style={{
    width: "100%", background: theme.bg, border: `1px solid ${theme.border}`,
    color: theme.text, padding: "10px 12px", borderRadius: 8,
    fontFamily: "inherit", fontSize: 14, outline: "none", minHeight: 44,
  }}>
    {children}
  </select>
);

const Row = ({ children, cols = 2 }: any) => {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${cols},1fr)`, gap: 12, marginBottom: 4 }}>
      {children}
    </div>
  );
};

const SectionTitle = ({ children, action }: any) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap" as const, gap: 10 }}>
    <h2 style={{ fontWeight: 800, fontSize: 18, color: theme.text, margin: 0 }}>{children}</h2>
    {action}
  </div>
);

const EmptyState = ({ icon, text }: any) => (
  <div style={{ textAlign: "center" as const, padding: "40px 16px", color: theme.muted }}>
    <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
    <p style={{ fontSize: 13 }}>{text}</p>
  </div>
);

const Badge = ({ children, color = "green" }: any) => {
  const colors: any = {
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

const Table = ({ headers, rows }: any) => (
  <div style={{ overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as any, margin: "0 -16px", padding: "0 16px" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 500 }}>
      <thead>
        <tr>
          {headers.map((h: string) => (
            <th key={h} style={{
              textAlign: "left" as const, padding: "10px 12px", fontSize: 11, letterSpacing: 1,
              textTransform: "uppercase" as const, color: theme.muted, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" as const
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

const Td = ({ children }: any) => (
  <td style={{ padding: "10px 12px", borderBottom: `1px solid ${theme.border}18`, fontSize: 13 }}>
    {children}
  </td>
);

// ─── LOADING SPINNER ────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${theme.border}`, borderTop: `3px solid ${theme.accent}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, position: "relative", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 65% 40%, ${theme.accent}1a 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, ${theme.gold}12 0%, transparent 50%)` }} />
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${theme.accent},${theme.gold})`, borderRadius: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 14, boxShadow: `0 0 40px ${theme.accent}44` }}>🌾</div>
          <h1 style={{ fontWeight: 900, fontSize: 28, color: theme.text, letterSpacing: -1, margin: 0 }}>AgriGest</h1>
          <p style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>Sistema de Gestão do Agronegócio</p>
        </div>
        <Card>
          <p style={{ color: theme.muted, fontSize: 14, textAlign: "center" as const, marginBottom: 16 }}>
            Faça login para acessar o sistema. Seus dados ficam sincronizados em todas as máquinas.
          </p>
          <a href={getLoginUrl()} style={{ display: "block", textDecoration: "none" }}>
            <Btn style={{ width: "100%", padding: 14 }} size="lg">
              Entrar no Sistema
            </Btn>
          </a>
        </Card>
      </div>
    </div>
  );
}

// ─── NAVEGAÇÃO ──────────────────────────────────────────────────────────────
const navGroups = () => [
  {
    title: "GRÃOS", icon: "🌾",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "📊" },
      { id: "fazenda", label: "Fazenda", icon: "🏡" },
      { id: "graos", label: "Grãos em Produção", icon: "🌾" },
      { id: "talhoes", label: "Talhões", icon: "🗺️" },
      { id: "produtividade", label: "Produtividade", icon: "📈" },
      { id: "classificacao", label: "Classificação", icon: "⚙️" },
      { id: "contratos", label: "Contratos", icon: "📋" },
      { id: "romaneiosEntrada", label: "Recebimento", icon: "📥" },
      { id: "romaneiosSaida", label: "Expedição", icon: "📤" },
      { id: "expedicao", label: "Agendamentos", icon: "🚚" },
      { id: "relatorioMotoristas", label: "Rel. Motoristas", icon: "📊" },
      { id: "relatoriosDiarios", label: "Rel. Diário", icon: "📅" },
    ]
  },
  {
    title: "INSUMOS", icon: "🧪",
    items: [
      { id: "insumos", label: "Cadastro", icon: "🧪" },
      { id: "estoque", label: "Estoque", icon: "📦" },
      { id: "recebimentoInsumos", label: "Recebimento", icon: "📥" },
    ]
  },
  {
    title: "CADASTROS", icon: "📋",
    items: [
      { id: "clientes", label: "Clientes", icon: "👥" },
      { id: "transportadoras", label: "Transportadoras", icon: "🚛" },
      { id: "fornecedores", label: "Fornecedores", icon: "🏭" },
      { id: "caminhoes", label: "Caminhões", icon: "🚜" },
      { id: "motoristas", label: "Motoristas", icon: "👷" },
    ]
  },
];

// ─── SIDEBAR RESPONSIVA ─────────────────────────────────────────────────────
function Sidebar({ active, setActive, fazenda, usuario, open, onClose }: any) {
  const isMobile = useIsMobile();
  const groups = navGroups();

  const content = (
    <div style={{
      width: isMobile ? "85vw" : 240, maxWidth: 300, background: theme.surface,
      borderRight: `1px solid ${theme.border}`, height: "100%",
      display: "flex", flexDirection: "column" as const, overflowY: "auto" as const, flexShrink: 0,
    }}>
      <div style={{ padding: "14px 12px", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${theme.accent},${theme.gold})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🌾</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: theme.text }}>AgriGest</div>
            <div style={{ fontSize: 10, color: theme.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{fazenda?.nome || "Sem fazenda"}</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: theme.gold, marginTop: 8, textAlign: "center" as const }}>
          👤 {usuario?.name || "Usuário"}
        </div>
      </div>
      <nav style={{ flex: 1, padding: "10px 6px" }}>
        {groups.map((group: any, idx: number) => (
          <div key={idx} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const, color: theme.gold, marginBottom: 6, paddingLeft: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{group.icon}</span><span>{group.title}</span>
            </div>
            {group.items.map((item: any) => (
              <button key={item.id} onClick={() => { setActive(item.id); if (isMobile) onClose(); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 7,
                background: active === item.id ? `${theme.accent}22` : "transparent",
                border: active === item.id ? `1px solid ${theme.accent}44` : "1px solid transparent",
                color: active === item.id ? theme.accentLight : theme.muted,
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                fontWeight: active === item.id ? 600 : 400, textAlign: "left" as const, transition: "all .15s", marginBottom: 2,
                minHeight: 40,
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

  if (isMobile) {
    if (!open) return null;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 999 }}>
        <div style={{ position: "absolute", inset: 0, background: "#000a" }} onClick={onClose} />
        <div style={{ position: "relative", height: "100%", animation: "slideIn .2s ease-out" }}>
          {content}
        </div>
        <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
      </div>
    );
  }

  return content;
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────
function Dashboard({ fazenda, setActive, counts }: any) {
  const isMobile = useIsMobile();
  const stats = [
    { label: "Contratos Ativos", value: counts.contratosAtivos, icon: "📋", color: theme.accent, link: "contratos" },
    { label: "Romaneios Entrada", value: counts.romaneiosEntrada, icon: "📥", color: theme.info, link: "romaneiosEntrada" },
    { label: "Romaneios Saída", value: counts.romaneiosSaida, icon: "📤", color: theme.gold, link: "romaneiosSaida" },
    { label: "Estoque (un)", value: counts.estoque, icon: "📦", color: theme.warning, link: "estoque" },
    { label: "Clientes", value: counts.clientes, icon: "👥", color: theme.accentLight, link: "clientes" },
    { label: "Motoristas", value: counts.motoristas, icon: "👷", color: theme.muted, link: "motoristas" },
  ];
  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>
      {fazenda ? (
        <div onClick={() => setActive("fazenda")} style={{ cursor: "pointer", marginBottom: 16 }}>
          <Card style={{ background: `linear-gradient(135deg,${theme.accent}14,${theme.gold}0a)`, borderColor: `${theme.accent}44` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, background: `${theme.accent}2a`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🏡</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: theme.text }}>{fazenda.nome}</div>
                <div style={{ color: theme.muted, fontSize: 12, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{fazenda.produtor} · {fazenda.cidade}/{fazenda.estado}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" as const }}>
                  {(fazenda.graos || []).map((g: string) => <Badge key={g} color="green">{g}</Badge>)}
                </div>
              </div>
              <div style={{ color: theme.muted, fontSize: 16, opacity: 0.5 }}>→</div>
            </div>
          </Card>
        </div>
      ) : (
        <div onClick={() => setActive("fazenda")} style={{ cursor: "pointer", marginBottom: 16 }}>
          <Card style={{ borderColor: `${theme.gold}44`, background: `${theme.gold}0a` }}>
            <p style={{ color: theme.gold, fontSize: 13, margin: 0 }}>⚠️ Nenhuma fazenda cadastrada. <strong style={{ textDecoration: "underline" }}>Clique aqui para cadastrar</strong>.</p>
          </Card>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 10 }}>
        {stats.map(s => (
          <div key={s.label} onClick={() => setActive(s.link)} style={{ cursor: "pointer" }}>
            <Card style={{ borderLeft: `3px solid ${s.color}`, padding: isMobile ? 12 : 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: theme.muted, fontSize: 9, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, color: s.color }}>{s.value}</div>
                </div>
                <span style={{ fontSize: isMobile ? 18 : 24 }}>{s.icon}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: s.color, opacity: 0.7, fontWeight: 600 }}>Acessar →</div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAZENDA ────────────────────────────────────────────────────────────────
function Fazenda({ fazenda, onRefresh }: { fazenda: any; onRefresh: () => void }) {
  const [form, setForm] = useState(fazenda || { nome: "", produtor: "", cpfCnpj: "", ie: "", cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "", graos: [] as string[], logoUrl: null });
  const [saved, setSaved] = useState(false);
  const upsertMut = trpc.fazenda.upsert.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); onRefresh(); toast.success("Fazenda salva!"); },
    onError: (e: any) => toast.error("Erro ao salvar: " + e.message),
  });
  useEffect(() => { if (fazenda) setForm(fazenda); }, [fazenda]);
  const fp = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleGrao = (g: string) => fp("graos", (form.graos || []).includes(g) ? form.graos.filter((x: string) => x !== g) : [...(form.graos || []), g]);
  const save = () => {
    const { id, createdAt, updatedAt, ...data } = form;
    upsertMut.mutate(data);
  };
  return (
    <div>
      <SectionTitle>🏡 Cadastro da Fazenda</SectionTitle>
      <Card>
        <Row><Field label="Nome da Fazenda"><Input value={form.nome} onChange={(e: any) => fp("nome", e.target.value)} placeholder="Ex: Fazenda São João" /></Field><Field label="Nome do Produtor"><Input value={form.produtor} onChange={(e: any) => fp("produtor", e.target.value)} /></Field></Row>
        <Row><Field label="CPF / CNPJ"><Input value={form.cpfCnpj} onChange={(e: any) => fp("cpfCnpj", e.target.value)} /></Field><Field label="Inscrição Estadual"><Input value={form.ie} onChange={(e: any) => fp("ie", e.target.value)} /></Field></Row>
        <Row><Field label="CEP"><Input value={form.cep} onChange={(e: any) => fp("cep", e.target.value)} /></Field><Field label="Endereço"><Input value={form.endereco} onChange={(e: any) => fp("endereco", e.target.value)} /></Field></Row>
        <Row cols={3}><Field label="Número"><Input value={form.numero} onChange={(e: any) => fp("numero", e.target.value)} /></Field><Field label="Cidade"><Input value={form.cidade} onChange={(e: any) => fp("cidade", e.target.value)} /></Field><Field label="UF"><Input value={form.estado} onChange={(e: any) => fp("estado", e.target.value)} /></Field></Row>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" as const }}>Grãos Produzidos</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {graosOpcoes.map(g => (
              <button key={g} onClick={() => toggleGrao(g)} style={{
                padding: "8px 16px", borderRadius: 20, cursor: "pointer",
                border: (form.graos || []).includes(g) ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                background: (form.graos || []).includes(g) ? `${theme.accent}28` : "transparent",
                color: (form.graos || []).includes(g) ? theme.accentLight : theme.muted,
                fontFamily: "inherit", fontSize: 12, fontWeight: 600, minHeight: 40,
              }}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Btn onClick={save} disabled={upsertMut.isPending}>💾 {upsertMut.isPending ? "Salvando..." : "Salvar Fazenda"}</Btn>
          {saved && <span style={{ color: theme.accent, fontSize: 13 }}>✓ Salvo!</span>}
        </div>
      </Card>
    </div>
  );
}

// ─── CLASSIFICAÇÃO ──────────────────────────────────────────────────────────
function Classificacao({ fazenda, classificacaoParams, onRefresh }: any) {
  const available = fazenda?.graos || graosOpcoes;
  const [grao, setGrao] = useState(available[0]);
  const [params, setParams] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const upsertMut = trpc.classificacao.upsert.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); onRefresh(); toast.success("Parâmetros salvos!"); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
  useEffect(() => {
    setParams(classificacaoParams?.[grao] || { umRef: "", umDesc: "", umDescPesado: "", impRef: "", impDesc: "", avRef: "", avDesc: "" });
  }, [grao, classificacaoParams]);
  const fp = (k: string, v: any) => setParams((p: any) => ({ ...p, [k]: v }));
  const save = () => upsertMut.mutate({ grao, umRef: params.umRef, umDesc: params.umDesc, umDescPesado: params.umDescPesado, impRef: params.impRef, impDesc: params.impDesc, avRef: params.avRef, avDesc: params.avDesc });
  const blockStyle = { border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden" as const, marginBottom: 14 };
  const blockHeader = (icon: string, title: string, sub: string | null, color: string) => (
    <div style={{ padding: "10px 14px", background: `${color}0f`, borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div><div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>{sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{sub}</div>}</div>
    </div>
  );
  return (
    <div>
      <SectionTitle>⚙️ Parâmetros de Classificação</SectionTitle>
      <Card style={{ marginBottom: 14 }}>
        <p style={{ color: theme.muted, fontSize: 13, marginBottom: 14 }}>Configure as tolerâncias por grão.</p>
        <Field label="Grão"><Select value={grao} onChange={(e: any) => setGrao(e.target.value)}>{available.map((g: string) => <option key={g}>{g}</option>)}</Select></Field>
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 16, color: theme.gold, marginBottom: 18 }}>Parâmetros para: {grao}</div>
        <div style={blockStyle}>{blockHeader("💧", "Umidade — Faixa Normal", "Aplicada quando umidade < 20%", theme.info)}<div style={{ padding: 14, background: theme.bg }}><Row cols={2}><Field label="Tolerância máxima (%)"><Input type="number" step="0.01" value={params.umRef} onChange={(e: any) => fp("umRef", e.target.value)} /></Field><Field label="Desconto por ponto (%)"><Input type="number" step="0.01" value={params.umDesc} onChange={(e: any) => fp("umDesc", e.target.value)} /></Field></Row></div></div>
        <div style={blockStyle}>{blockHeader("🌊", "Umidade — Faixa Pesada", "Aplicada quando umidade >= 20%", theme.danger)}<div style={{ padding: 14, background: `${theme.danger}06` }}><Field label="Desconto por ponto (%)"><Input type="number" step="0.01" value={params.umDescPesado} onChange={(e: any) => fp("umDescPesado", e.target.value)} /></Field></div></div>
        <div style={blockStyle}>{blockHeader("🪨", "Impureza", null, theme.warning)}<div style={{ padding: 14, background: theme.bg }}><Row cols={2}><Field label="Tolerância (%)"><Input type="number" step="0.01" value={params.impRef} onChange={(e: any) => fp("impRef", e.target.value)} /></Field><Field label="Desconto por ponto (%)"><Input type="number" step="0.01" value={params.impDesc} onChange={(e: any) => fp("impDesc", e.target.value)} /></Field></Row></div></div>
        <div style={blockStyle}>{blockHeader("🔴", "Avariado", null, theme.danger)}<div style={{ padding: 14, background: theme.bg }}><Row cols={2}><Field label="Tolerância (%)"><Input type="number" step="0.01" value={params.avRef} onChange={(e: any) => fp("avRef", e.target.value)} /></Field><Field label="Desconto por ponto (%)"><Input type="number" step="0.01" value={params.avDesc} onChange={(e: any) => fp("avDesc", e.target.value)} /></Field></Row></div></div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}><Btn onClick={save} disabled={upsertMut.isPending}>💾 {upsertMut.isPending ? "Salvando..." : "Salvar Parâmetros"}</Btn>{saved && <span style={{ color: theme.accent, fontSize: 13 }}>✓ Salvo!</span>}</div>
      </Card>
    </div>
  );
}

// ─── CRUD GENÉRICO ──────────────────────────────────────────────────────────
function CrudPage({ title, icon, fields, routerKey, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const listQuery = (trpc as any)[routerKey].list.useQuery();
  const createMut = (trpc as any)[routerKey].create.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success(`${title} salvo!`); setOpen(false); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMut = (trpc as any)[routerKey].update.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success(`${title} atualizado!`); setOpen(false); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const removeMut = (trpc as any)[routerKey].remove.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success(`${title} excluído!`); }, onError: (e: any) => toast.error("Erro: " + e.message) });

  const items = (listQuery.data || []).filter((i: any) => Object.values(i).some((v: any) => String(v || "").toLowerCase().includes(search.toLowerCase())));
  const tableFields = fields.filter((f: any) => f.table);

  const openNew = () => { setForm({}); setEditing(null); setOpen(true); };
  const openEdit = (i: any) => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = (id: number) => { if (window.confirm(`Excluir ${title.toLowerCase()}?`)) removeMut.mutate({ id }); };
  const save = () => {
    const { id, createdAt, updatedAt, ...data } = form;
    if (editing) updateMut.mutate({ id: editing, data });
    else createMut.mutate({ data });
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo</Btn>}>{icon} {title}s</SectionTitle>
      <Card>
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder={`Buscar ${title.toLowerCase()}...`} />
        <div style={{ marginTop: 14 }}>
          {listQuery.isLoading ? <Spinner /> : items.length === 0 ? <EmptyState icon={icon} text={`Nenhum ${title.toLowerCase()} cadastrado.`} /> : (
            <Table headers={[...tableFields.map((f: any) => f.label), "Ações"]} rows={items.map((item: any) => (
              <tr key={item.id}>
                {tableFields.map((f: any) => <Td key={f.key}>{item[f.key] || "—"}</Td>)}
                <Td><div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="secondary" onClick={() => openEdit(item)}>✏️</Btn><Btn size="sm" variant="danger" onClick={() => del(item.id)}>🗑️</Btn></div></Td>
              </tr>
            ))} />
          )}
        </div>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} ${title}`}>
        {fields.map((f: any) => (
          <Field key={f.key} label={f.label}>
            {f.type === "select" ? (
              <Select value={form[f.key]} onChange={(e: any) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}><option value="">Selecione...</option>{f.options.map((o: string) => <option key={o}>{o}</option>)}</Select>
            ) : (
              <Input type={f.type || "text"} value={form[f.key]} onChange={(e: any) => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder || ""} />
            )}
          </Field>
        ))}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save} disabled={createMut.isPending || updateMut.isPending}>💾 {(createMut.isPending || updateMut.isPending) ? "Salvando..." : "Salvar"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── TALHÕES ────────────────────────────────────────────────────────────────
function Talhoes({ fazenda, romaneiosEntrada, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [talhaoNome, setTalhaoNome] = useState("");
  const [culturas, setCulturas] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  const listQuery = trpc.talhoes.list.useQuery();
  const createMut = trpc.talhoes.create.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); setSaved(true); setTimeout(() => { setSaved(false); setOpen(false); }, 1200); toast.success("Talhão salvo!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMut = trpc.talhoes.update.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); setSaved(true); setTimeout(() => { setSaved(false); setOpen(false); }, 1200); toast.success("Talhão atualizado!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const removeMut = trpc.talhoes.remove.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Talhão excluído!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });

  const talhoes = listQuery.data || [];
  const graosDisponiveis = fazenda?.graos || graosOpcoes;
  const uid = () => Math.random().toString(36).slice(2, 9);

  const openNew = () => { setTalhaoNome(""); setCulturas([{ id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]); setEditing(null); setOpen(true); setSaved(false); };
  const openEdit = (t: any) => {
    setTalhaoNome(t.nome);
    setCulturas(t.culturas?.length > 0 ? t.culturas.map((c: any) => ({ ...c, id: c.id || uid() })) : [{ id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]);
    setEditing(t.id); setOpen(false); setSaved(false); setTimeout(() => setOpen(true), 10);
  };
  const addCultura = () => setCulturas(prev => [...prev, { id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]);
  const removeCultura = (cid: string) => setCulturas(prev => prev.filter(c => c.id !== cid));
  const updateCultura = (cid: string, field: string, value: any) => setCulturas(prev => prev.map(c => c.id === cid ? { ...c, [field]: value } : c));
  const save = () => {
    if (!talhaoNome.trim()) { alert("Informe o nome."); return; }
    const culturasData = culturas.map(c => ({ grao: c.grao, area: String(parseFloat(c.area) || 0), obs: c.obs || "" }));
    if (editing) updateMut.mutate({ id: editing, nome: talhaoNome.trim(), culturas: culturasData });
    else createMut.mutate({ nome: talhaoNome.trim(), culturas: culturasData });
  };
  const del = (id: number) => { if (window.confirm("Excluir?")) removeMut.mutate({ id }); };
  const SC_KG = 60;
  const areaTotalTalhao = (t: any) => (t.culturas || []).reduce((a: number, c: any) => a + (parseFloat(c.area) || 0), 0).toFixed(2);

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Talhão</Btn>}>🗺️ Talhões</SectionTitle>
      <Card>
        {listQuery.isLoading ? <Spinner /> : talhoes.length === 0 ? <EmptyState icon="🗺️" text="Nenhum talhão." /> : (
          <div>{talhoes.map((t: any) => (
            <div key={t.id} style={{ marginBottom: 14, border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: `${theme.accent}0a`, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 8 }}>
                <div><span style={{ fontWeight: 800, fontSize: 15 }}>🗺️ {t.nome}</span><span style={{ color: theme.muted, fontSize: 11, marginLeft: 10 }}>Área: <strong style={{ color: theme.accent }}>{areaTotalTalhao(t)} ha</strong></span></div>
                <div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="secondary" onClick={() => openEdit(t)}>✏️</Btn><Btn size="sm" variant="danger" onClick={() => del(t.id)}>🗑️</Btn></div>
              </div>
              <div style={{ overflowX: "auto" as const }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 400 }}>
                  <thead><tr style={{ background: theme.surface }}>{["Cultura", "Área (ha)", "Sacas", "Média"].map(h => <th key={h} style={{ textAlign: "left" as const, padding: "8px 12px", fontSize: 11, color: theme.muted, borderBottom: `1px solid ${theme.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>{(t.culturas || []).map((c: any) => {
                    const areaC = parseFloat(c.area) || 0;
                    const totalKgC = (romaneiosEntrada || []).filter((r: any) => r.talhao === t.nome && r.grao === c.grao).reduce((a: number, r: any) => a + (parseFloat(r.pesoFinal) || 0), 0);
                    const sacasC = totalKgC > 0 ? Math.round(totalKgC / SC_KG) : null;
                    const mediaC = areaC > 0 && totalKgC > 0 ? (totalKgC / SC_KG / areaC).toFixed(1) : null;
                    return (<tr key={c.id} style={{ borderBottom: `1px solid ${theme.border}18` }}><td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>🌾 {c.grao}</td><td style={{ padding: "8px 12px", fontSize: 13 }}>{c.area} ha</td><td style={{ padding: "8px 12px", fontSize: 13 }}>{sacasC !== null ? <span style={{ fontWeight: 700, color: theme.info }}>{sacasC.toLocaleString()} sc</span> : "—"}</td><td style={{ padding: "8px 12px", fontSize: 13 }}>{mediaC ? <span style={{ fontWeight: 700, color: theme.accent }}>{mediaC} sc/ha</span> : "—"}</td></tr>);
                  })}</tbody>
                </table>
              </div>
            </div>
          ))}</div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Talhão`} width={700}>
        <Field label="Nome do Talhão"><Input value={talhaoNome} onChange={(e: any) => setTalhaoNome(e.target.value)} placeholder="Ex: Talhão A" /></Field>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase" as const }}>Culturas</div>
          {culturas.map((c, idx) => (
            <div key={c.id} style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontWeight: 600, fontSize: 13 }}>Cultura {idx + 1}</span>{culturas.length > 1 && <Btn size="sm" variant="danger" onClick={() => removeCultura(c.id)}>✕</Btn>}</div>
              <Row cols={2}><Field label="Grão"><Select value={c.grao} onChange={(e: any) => updateCultura(c.id, "grao", e.target.value)}>{graosDisponiveis.map((g: string) => <option key={g}>{g}</option>)}</Select></Field><Field label="Área (ha)"><Input type="number" value={c.area} onChange={(e: any) => updateCultura(c.id, "area", e.target.value)} /></Field></Row>
              <Field label="Observações"><Input value={c.obs} onChange={(e: any) => updateCultura(c.id, "obs", e.target.value)} placeholder="Opcional" /></Field>
            </div>
          ))}
          <Btn variant="secondary" onClick={addCultura}>+ Adicionar Cultura</Btn>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>{saved ? <span style={{ color: theme.accent, fontWeight: 700, padding: "10px 18px" }}>✓ Salvo!</span> : <Btn onClick={save} disabled={createMut.isPending || updateMut.isPending}>💾 {(createMut.isPending || updateMut.isPending) ? "Salvando..." : "Salvar"}</Btn>}</div>
      </Modal>
    </div>
  );
}

// ─── CONTRATOS ──────────────────────────────────────────────────────────────
function Contratos({ clientes, fazenda, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const listQuery = trpc.contratos.list.useQuery();
  const createMut = trpc.contratos.create.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Contrato salvo!"); setOpen(false); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMut = trpc.contratos.update.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Contrato atualizado!"); setOpen(false); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const removeMut = trpc.contratos.remove.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Contrato excluído!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const contratos = listQuery.data || [];
  const fp = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ status: "Ativo" }); setEditing(null); setOpen(true); };
  const openEdit = (c: any) => { setForm({ ...c }); setEditing(c.id); setOpen(true); };
  const del = (id: number) => { if (window.confirm("Excluir contrato?")) removeMut.mutate({ id }); };
  const save = () => {
    const { id, createdAt, updatedAt, numero, ...data } = form;
    if (editing) updateMut.mutate({ id: editing, data });
    else createMut.mutate({ data });
  };
  const statusColor: any = { Ativo: "green", Encerrado: "red", Pendente: "gold" };
  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo</Btn>}>📋 Contratos</SectionTitle>
      <Card>
        {listQuery.isLoading ? <Spinner /> : contratos.length === 0 ? <EmptyState icon="📋" text="Nenhum contrato." /> : (
          <Table headers={["Nº", "Cliente", "Grão", "Qtd", "Preço", "Status", "Ações"]} rows={contratos.map((c: any) => (
            <tr key={c.id}>
              <Td><span style={{ fontFamily: "monospace", color: theme.info }}>{c.numero}</span></Td>
              <Td>{c.cliente}</Td><Td>{c.grao}</Td><Td>{c.quantidade} sc</Td>
              <Td>R$ {c.preco}</Td>
              <Td><Badge color={statusColor[c.status] || "gold"}>{c.status}</Badge></Td>
              <Td><div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="secondary" onClick={() => openEdit(c)}>✏️</Btn><Btn size="sm" variant="danger" onClick={() => del(c.id)}>🗑️</Btn></div></Td>
            </tr>
          ))} />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Contrato`}>
        <Row><Field label="Cliente"><Select value={form.cliente} onChange={(e: any) => fp("cliente", e.target.value)}><option value="">Selecione...</option>{(clientes || []).map((c: any) => <option key={c.id}>{c.nome}</option>)}</Select></Field><Field label="Grão"><Select value={form.grao} onChange={(e: any) => fp("grao", e.target.value)}><option value="">Selecione...</option>{(fazenda?.graos || graosOpcoes).map((g: string) => <option key={g}>{g}</option>)}</Select></Field></Row>
        <Row><Field label="Quantidade (sc)"><Input type="number" value={form.quantidade} onChange={(e: any) => fp("quantidade", e.target.value)} /></Field><Field label="Preço/Saca (R$)"><Input type="number" value={form.preco} onChange={(e: any) => fp("preco", e.target.value)} /></Field></Row>
        <Row><Field label="Vencimento"><Input type="date" value={form.vencimento} onChange={(e: any) => fp("vencimento", e.target.value)} /></Field><Field label="Status"><Select value={form.status} onChange={(e: any) => fp("status", e.target.value)}>{["Ativo", "Pendente", "Encerrado"].map(s => <option key={s}>{s}</option>)}</Select></Field></Row>
        <Field label="Observações"><textarea value={form.obs || ""} onChange={(e: any) => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "10px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const }} /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn><Btn onClick={save} disabled={createMut.isPending || updateMut.isPending}>💾 Salvar</Btn></div>
      </Modal>
    </div>
  );
}

// ─── ROMANEIOS (ENTRADA E SAÍDA) ────────────────────────────────────────────
function RomaneiosEntrada({ fazenda, classificacaoParams, talhoes, caminhoes, motoristas, transportadoras, onRefresh }: any) {
  return <RomaneiosGeneric tipo="Entrada" fazenda={fazenda} classificacaoParams={classificacaoParams} talhoes={talhoes} caminhoes={caminhoes} motoristas={motoristas} transportadoras={transportadoras} clientes={[]} contratos={[]} onRefresh={onRefresh} />;
}
function RomaneiosSaida({ fazenda, classificacaoParams, clientes, contratos, caminhoes, motoristas, transportadoras, onRefresh }: any) {
  return <RomaneiosGeneric tipo="Saída" fazenda={fazenda} classificacaoParams={classificacaoParams} talhoes={[]} caminhoes={caminhoes} motoristas={motoristas} transportadoras={transportadoras} clientes={clientes} contratos={contratos} onRefresh={onRefresh} />;
}

function RomaneiosGeneric({ tipo, fazenda, classificacaoParams, talhoes, caminhoes, motoristas, transportadoras, clientes, contratos, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [romForm, setRomForm] = useState<any>(null);
  const isEntrada = tipo === "Entrada";
  const routerKey = isEntrada ? "romaneiosEntrada" : "romaneiosSaida";
  const grao0 = fazenda?.graos?.[0] || "Soja";

  const listQuery = (trpc as any)[routerKey].list.useQuery();
  const createMut = (trpc as any)[routerKey].create.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Romaneio salvo!"); setOpen(false); setRomForm(null); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMut = (trpc as any)[routerKey].update.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Romaneio atualizado!"); setOpen(false); setRomForm(null); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const removeMut = (trpc as any)[routerKey].remove.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Movido para lixeira!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });

  const items = listQuery.data || [];

  const del = (id: number) => {
    if (window.confirm("Mover para a lixeira?")) removeMut.mutate({ id });
  };

  const openModal = (item: any) => {
    if (item) {
      setEditItem(item);
      setRomForm({ ...item });
    } else {
      setEditItem(null);
      let baseFields: any = { tipo, data: new Date().toISOString().split("T")[0], grao: grao0, placa: "", motorista: "", transportadora: "", pesoBruto: "", pesoTara: "", umidade: "", impureza: "", avariado: "", obs: "", talhao: "", safra: safrasOpcoes[0] };
      if (!isEntrada) { baseFields.cliente = ""; baseFields.contrato = ""; }
      setRomForm(baseFields);
    }
    setOpen(true);
  };

  const fp = (k: string, v: any) => setRomForm((f: any) => (f ? { ...f, [k]: v } : f));

  const p = classificacaoParams?.[romForm?.grao] || {};
  const liq = romForm ? Math.max(0, (parseFloat(romForm.pesoBruto) || 0) - (parseFloat(romForm.pesoTara) || 0)) : 0;
  const umidadeResult = romForm ? calcDescUmidade(romForm.umidade, p.umRef, p.umDesc, p.umDescPesado) : { desconto: "0.00", faixa: "" };
  const dUm = umidadeResult.desconto;
  const dImp = romForm ? calcDesc(romForm.impureza, p.impRef, p.impDesc) : "0.00";
  const dAv = romForm ? calcDesc(romForm.avariado, p.avRef, p.avDesc) : "0.00";
  const totalDesc = (parseFloat(dUm) + parseFloat(dImp) + parseFloat(dAv)).toFixed(2);
  const pesoFinal = romForm ? Math.max(0, liq * (1 - parseFloat(totalDesc) / 100)).toFixed(0) : "0";

  const saveRom = () => {
    if (!romForm) return;
    const data = {
      ...romForm,
      liq: String(liq),
      pesoFinal: String(pesoFinal),
      dUm, dImp, dAv,
      totalDesc,
      faixaUmidade: umidadeResult.faixa,
    };
    delete data.id; delete data.createdAt; delete data.updatedAt; delete data.numero; delete data.deletedAt;
    if (editItem) updateMut.mutate({ id: editItem.id, data });
    else createMut.mutate({ data });
  };

  const romFooter = open ? (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" as const }}>
      <Btn variant="secondary" onClick={() => { setOpen(false); setRomForm(null); }}>Cancelar</Btn>
      <Btn onClick={saveRom} disabled={createMut.isPending || updateMut.isPending}>💾 {(createMut.isPending || updateMut.isPending) ? "Salvando..." : "Salvar"}</Btn>
    </div>
  ) : null;

  return (
    <div>
      <SectionTitle action={<Btn onClick={() => openModal(null)}>+ Novo</Btn>}>{tipo === "Entrada" ? "📥 Recebimento" : "📤 Expedição"} de Grãos</SectionTitle>
      <Card>
        {listQuery.isLoading ? <Spinner /> : items.length === 0 ? <EmptyState icon={tipo === "Entrada" ? "📥" : "📤"} text="Nenhum romaneio." /> : (
          <Table headers={["Nº", "Data", "Grão", "Placa", "Motorista", "Peso Final", "Ações"]} rows={items.map((r: any) => (
            <tr key={r.id}>
              <Td><span style={{ fontFamily: "monospace", color: theme.info }}>{r.numero}</span></Td>
              <Td>{r.data}</Td><Td>{r.grao}</Td><Td>{r.placa}</Td><Td>{r.motorista}</Td>
              <Td><strong>{parseInt(r.pesoFinal || "0").toLocaleString()} kg</strong></Td>
              <Td><div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="secondary" onClick={() => openModal(r)}>✏️</Btn><Btn size="sm" variant="danger" onClick={() => del(r.id)}>🗑️</Btn></div></Td>
            </tr>
          ))} />
        )}
      </Card>
      <Modal open={open} onClose={() => { setOpen(false); setRomForm(null); }} title={`${editItem ? "Editar" : "Novo"} Romaneio de ${tipo}`} width={700} footer={romFooter}>
        {open && romForm && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: theme.gold }}>Nº {romForm.numero || "Novo"}</span>
              <Badge color={tipo === "Entrada" ? "blue" : "gold"}>{tipo}</Badge>
            </div>
            <Row><Field label="Data"><Input type="date" value={romForm.data} onChange={(e: any) => fp("data", e.target.value)} /></Field><Field label="Grão"><Select value={romForm.grao} onChange={(e: any) => fp("grao", e.target.value)}>{(fazenda?.graos || graosOpcoes).map((g: string) => <option key={g}>{g}</option>)}</Select></Field></Row>
            <Row><Field label="Safra"><Select value={romForm.safra} onChange={(e: any) => fp("safra", e.target.value)}>{safrasOpcoes.map(s => <option key={s}>{s}</option>)}</Select></Field>{isEntrada && <Field label="Talhão"><Select value={romForm.talhao} onChange={(e: any) => fp("talhao", e.target.value)}><option value="">Selecione...</option>{(talhoes || []).map((t: any) => <option key={t.id}>{t.nome}</option>)}</Select></Field>}</Row>
            {!isEntrada && <Row><Field label="Cliente"><Select value={romForm.cliente} onChange={(e: any) => fp("cliente", e.target.value)}><option value="">Selecione...</option>{(clientes || []).map((c: any) => <option key={c.id}>{c.nome}</option>)}</Select></Field><Field label="Contrato"><Select value={romForm.contrato} onChange={(e: any) => fp("contrato", e.target.value)}><option value="">Selecione...</option>{(contratos || []).map((c: any) => <option key={c.id}>{c.numero}</option>)}</Select></Field></Row>}
            <Row><Field label="Placa"><Select value={romForm.placa} onChange={(e: any) => fp("placa", e.target.value)}><option value="">Selecione...</option>{(caminhoes || []).map((c: any) => <option key={c.id}>{c.placa}</option>)}</Select></Field><Field label="Motorista"><Select value={romForm.motorista} onChange={(e: any) => fp("motorista", e.target.value)}><option value="">Selecione...</option>{(motoristas || []).map((m: any) => <option key={m.id}>{m.nome}</option>)}</Select></Field></Row>
            <Field label="Transportadora"><Select value={romForm.transportadora} onChange={(e: any) => fp("transportadora", e.target.value)}><option value="">Selecione...</option>{(transportadoras || []).map((t: any) => <option key={t.id}>{t.nome}</option>)}</Select></Field>
            <Row><Field label="Peso Bruto (kg)"><Input type="number" value={romForm.pesoBruto} onChange={(e: any) => fp("pesoBruto", e.target.value)} /></Field><Field label="Peso Tara (kg)"><Input type="number" value={romForm.pesoTara} onChange={(e: any) => fp("pesoTara", e.target.value)} /></Field></Row>
            <Card style={{ marginBottom: 14, padding: 12, background: theme.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: theme.muted, fontSize: 12 }}>Peso Líquido</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: theme.accent }}>{liq.toLocaleString()} kg</span>
              </div>
            </Card>
            <Row cols={3}><Field label="Umidade (%)"><Input type="number" step="0.01" value={romForm.umidade} onChange={(e: any) => fp("umidade", e.target.value)} /></Field><Field label="Impureza (%)"><Input type="number" step="0.01" value={romForm.impureza} onChange={(e: any) => fp("impureza", e.target.value)} /></Field><Field label="Avariado (%)"><Input type="number" step="0.01" value={romForm.avariado} onChange={(e: any) => fp("avariado", e.target.value)} /></Field></Row>
            <Card style={{ marginBottom: 14, padding: 12, background: `${theme.danger}08`, borderColor: `${theme.danger}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}><span style={{ color: theme.muted }}>Desc. Umidade</span><span style={{ color: theme.danger }}>{dUm}%</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}><span style={{ color: theme.muted }}>Desc. Impureza</span><span style={{ color: theme.danger }}>{dImp}%</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}><span style={{ color: theme.muted }}>Desc. Avariado</span><span style={{ color: theme.danger }}>{dAv}%</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}><span>Total Desconto</span><span style={{ color: theme.danger }}>{totalDesc}%</span></div>
            </Card>
            <Card style={{ marginBottom: 14, padding: 14, background: `${theme.accent}0a`, borderColor: `${theme.accent}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>PESO FINAL</span>
                <span style={{ fontWeight: 900, fontSize: 28, color: theme.accent }}>{parseInt(pesoFinal).toLocaleString()} kg</span>
              </div>
            </Card>
            <Field label="Observações"><textarea value={romForm.obs || ""} onChange={(e: any) => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "10px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const }} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── EXPEDIÇÃO / AGENDAMENTOS ───────────────────────────────────────────────
function Expedicao({ clientes, fazenda, contratos, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const listQuery = trpc.expedicoes.list.useQuery();
  const createMut = trpc.expedicoes.create.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Agendamento salvo!"); setOpen(false); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const updateMut = trpc.expedicoes.update.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Agendamento atualizado!"); setOpen(false); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const removeMut = trpc.expedicoes.remove.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Agendamento excluído!"); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const items = listQuery.data || [];
  const fp = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ status: "Pendente" }); setEditing(null); setOpen(true); };
  const openEdit = (i: any) => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = (id: number) => { if (window.confirm("Excluir?")) removeMut.mutate({ id }); };
  const save = () => {
    const { id, createdAt, updatedAt, numero, ...data } = form;
    if (editing) updateMut.mutate({ id: editing, data });
    else createMut.mutate({ data });
  };
  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo</Btn>}>🚚 Agendamentos</SectionTitle>
      <Card>
        {listQuery.isLoading ? <Spinner /> : items.length === 0 ? <EmptyState icon="🚚" text="Nenhum agendamento." /> : (
          <Table headers={["Nº", "Data", "Contrato", "Cliente", "Status", "Ações"]} rows={items.map((i: any) => (
            <tr key={i.id}>
              <Td><span style={{ fontFamily: "monospace", color: theme.info }}>{i.numero}</span></Td>
              <Td>{i.data}</Td><Td>{i.contrato}</Td><Td>{i.cliente}</Td>
              <Td><Badge color={i.status === "Concluída" ? "green" : "gold"}>{i.status}</Badge></Td>
              <Td><div style={{ display: "flex", gap: 6 }}><Btn size="sm" variant="secondary" onClick={() => openEdit(i)}>✏️</Btn><Btn size="sm" variant="danger" onClick={() => del(i.id)}>🗑️</Btn></div></Td>
            </tr>
          ))} />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Agendamento">
        <Row><Field label="Data"><Input type="date" value={form.data} onChange={(e: any) => fp("data", e.target.value)} /></Field><Field label="Contrato"><Select value={form.contrato} onChange={(e: any) => fp("contrato", e.target.value)}><option value="">Selecione...</option>{(contratos || []).map((c: any) => <option key={c.id}>{c.numero}</option>)}</Select></Field></Row>
        <Row><Field label="Cliente"><Select value={form.cliente} onChange={(e: any) => fp("cliente", e.target.value)}><option value="">Selecione...</option>{(clientes || []).map((c: any) => <option key={c.id}>{c.nome}</option>)}</Select></Field><Field label="Grão"><Select value={form.grao} onChange={(e: any) => fp("grao", e.target.value)}><option value="">Selecione...</option>{(fazenda?.graos || graosOpcoes).map((g: string) => <option key={g}>{g}</option>)}</Select></Field></Row>
        <Field label="Status"><Select value={form.status} onChange={(e: any) => fp("status", e.target.value)}>{["Pendente","Em trânsito","Concluída"].map(s => <option key={s}>{s}</option>)}</Select></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn><Btn onClick={save} disabled={createMut.isPending || updateMut.isPending}>💾 Salvar</Btn></div>
      </Modal>
    </div>
  );
}

// ─── ESTOQUE ────────────────────────────────────────────────────────────────
function Estoque({ insumos, onRefresh }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const listQuery = trpc.estoque.list.useQuery();
  const movMut = trpc.estoque.movimentar.useMutation({ onSuccess: () => { listQuery.refetch(); onRefresh?.(); toast.success("Movimentação registrada!"); setOpen(false); setForm({}); }, onError: (e: any) => toast.error("Erro: " + e.message) });
  const estoque = listQuery.data || [];
  const addMov = () => {
    const ins = (insumos || []).find((i: any) => String(i.id) === String(form.insumoId));
    if (!ins) { toast.error("Selecione um insumo."); return; }
    movMut.mutate({
      insumoId: Number(form.insumoId),
      insumoNome: ins.nome,
      tipo: form.tipo || "Entrada",
      qtd: parseFloat(form.qtd) || 0,
      unidade: ins.unidade || "",
    });
  };
  return (
    <div>
      <SectionTitle action={<Btn onClick={() => { setForm({}); setOpen(true); }}>+ Movimentar</Btn>}>📦 Estoque</SectionTitle>
      <Card>
        {listQuery.isLoading ? <Spinner /> : estoque.length === 0 ? <EmptyState icon="📦" text="Nenhum insumo em estoque." /> : (
          <Table headers={["Insumo", "Qtd", "Unidade", "Status"]} rows={estoque.map((e: any) => {
            const qty = parseFloat(e.qtd);
            return (<tr key={e.id || e.insumoId}><Td>{e.insumoNome}</Td><Td><strong style={{ color: qty > 0 ? theme.accent : theme.danger }}>{e.qtd}</strong></Td><Td>{e.unidade}</Td><Td><Badge color={qty > 10 ? "green" : qty > 0 ? "gold" : "red"}>{qty > 10 ? "Normal" : qty > 0 ? "Baixo" : "Zerado"}</Badge></Td></tr>);
          })} />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Movimentação">
        <Field label="Insumo"><Select value={form.insumoId} onChange={(e: any) => setForm((f: any) => ({ ...f, insumoId: e.target.value }))}><option value="">Selecione...</option>{(insumos || []).map((i: any) => <option key={i.id} value={i.id}>{i.nome}</option>)}</Select></Field>
        <Row><Field label="Tipo"><Select value={form.tipo || "Entrada"} onChange={(e: any) => setForm((f: any) => ({ ...f, tipo: e.target.value }))}><option>Entrada</option><option>Saída</option></Select></Field><Field label="Quantidade"><Input type="number" value={form.qtd} onChange={(e: any) => setForm((f: any) => ({ ...f, qtd: e.target.value }))} /></Field></Row>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn><Btn onClick={addMov} disabled={movMut.isPending}>Registrar</Btn></div>
      </Modal>
    </div>
  );
}

// ─── GRÃOS ──────────────────────────────────────────────────────────────────
function Graos({ fazenda, romaneiosEntrada, romaneiosSaida }: any) {
  const isMobile = useIsMobile();
  const graos = fazenda?.graos || [];
  return (
    <div>
      <SectionTitle>🌾 Grãos em Produção</SectionTitle>
      {graos.length === 0 ? <Card><EmptyState icon="🌾" text="Cadastre a fazenda e selecione os grãos." /></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
          {graos.map((g: string) => {
            const ent = (romaneiosEntrada || []).filter((r: any) => r.grao === g).reduce((a: number, r: any) => a + (parseFloat(r.pesoFinal) || 0), 0);
            const sai = (romaneiosSaida || []).filter((r: any) => r.grao === g).reduce((a: number, r: any) => a + (parseFloat(r.pesoFinal) || 0), 0);
            const saldo = ent - sai;
            return (
              <Card key={g} style={{ borderTop: `3px solid ${theme.accent}` }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🌾</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>{g}</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.muted, fontSize: 12 }}>Entrada</span><span style={{ color: theme.info, fontWeight: 600 }}>{ent.toLocaleString()} kg</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.muted, fontSize: 12 }}>Saída</span><span style={{ color: theme.gold, fontWeight: 600 }}>{sai.toLocaleString()} kg</span></div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 6, display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.muted, fontSize: 12 }}>Saldo</span><span style={{ color: saldo >= 0 ? theme.accent : theme.danger, fontWeight: 800, fontSize: 16 }}>{saldo.toLocaleString()} kg</span></div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PRODUTIVIDADE ──────────────────────────────────────────────────────────
function Produtividade({ talhoes, romaneiosEntrada }: any) {
  const SC_KG = 60;
  if (!talhoes?.length || !romaneiosEntrada?.length) return (<div><SectionTitle>📈 Produtividade</SectionTitle><Card><EmptyState icon="📈" text="Cadastre talhões e romaneios para ver a produtividade." /></Card></div>);
  const prodData: any = {};
  romaneiosEntrada.forEach((rom: any) => {
    if (!rom.talhao) return;
    const talhaoInfo = talhoes.find((t: any) => t.nome === rom.talhao);
    if (!talhaoInfo) return;
    if (!prodData[rom.talhao]) { const area = (talhaoInfo.culturas || []).reduce((a: number, c: any) => a + (parseFloat(c.area) || 0), 0); prodData[rom.talhao] = { area, totalKg: 0 }; }
    prodData[rom.talhao].totalKg += parseFloat(rom.pesoFinal) || 0;
  });
  return (
    <div>
      <SectionTitle>📈 Produtividade</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {Object.entries(prodData).map(([nome, data]: any) => {
          const sacas = data.totalKg / SC_KG;
          const produtividade = data.area > 0 ? (sacas / data.area).toFixed(1) : "—";
          return (
            <Card key={nome} style={{ borderLeft: `3px solid ${theme.accent}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 8 }}>
                <div><div style={{ fontWeight: 800, fontSize: 16 }}>🗺️ {nome}</div><div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>Área: {data.area} ha · {data.totalKg.toLocaleString()} kg · {Math.round(sacas).toLocaleString()} sc</div></div>
                <div style={{ textAlign: "right" as const }}><div style={{ fontSize: 10, color: theme.muted }}>Produtividade</div><div style={{ fontSize: 22, fontWeight: 900, color: theme.accent }}>{produtividade} <span style={{ fontSize: 12 }}>sc/ha</span></div></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── RELATÓRIOS ─────────────────────────────────────────────────────────────
function RelatorioMotoristas({ romaneiosEntrada }: any) {
  const SC_KG = 60;
  const romaneios = romaneiosEntrada || [];
  const porMotorista: any = {};
  romaneios.forEach((r: any) => { const nome = r.motorista || "Sem nome"; if (!porMotorista[nome]) porMotorista[nome] = []; porMotorista[nome].push(r); });
  const dados = Object.entries(porMotorista).map(([nome, viagens]: any) => {
    const totalKg = viagens.reduce((a: number, r: any) => a + (parseFloat(r.pesoFinal) || 0), 0);
    return { nome, totalKg, totalViagens: viagens.length, totalSacas: totalKg / SC_KG };
  }).sort((a: any, b: any) => b.totalKg - a.totalKg);
  return (
    <div>
      <SectionTitle>📊 Relatório de Motoristas</SectionTitle>
      <Card>
        {dados.length === 0 ? <EmptyState icon="📊" text="Nenhum dado." /> : (
          <Table headers={["Motorista", "Viagens", "Toneladas", "Sacas"]} rows={dados.map((d: any) => (
            <tr key={d.nome}>
              <Td><strong>{d.nome}</strong></Td>
              <Td><Badge color="blue">{d.totalViagens}</Badge></Td>
              <Td style={{ color: theme.accent }}>{(d.totalKg / 1000).toFixed(3)} t</Td>
              <Td style={{ color: theme.gold }}>{Math.round(d.totalSacas).toLocaleString()} sc</Td>
            </tr>
          ))} />
        )}
      </Card>
    </div>
  );
}

function RelatoriosDiarios({ romaneiosEntrada, talhoes }: any) {
  const SC_KG = 60;
  const romaneios = romaneiosEntrada || [];
  const hoje = new Date().toISOString().split("T")[0];
  const [dataFiltro, setDataFiltro] = useState(hoje);
  const romaneiosFiltrados = romaneios.filter((r: any) => dataFiltro ? r.data === dataFiltro : true);
  const porTalhao: any = {};
  romaneiosFiltrados.forEach((r: any) => { if (!r.talhao) return; if (!porTalhao[r.talhao]) porTalhao[r.talhao] = { cargas: [], totalKg: 0 }; porTalhao[r.talhao].cargas.push(r); porTalhao[r.talhao].totalKg += parseFloat(r.pesoFinal) || 0; });
  const talhaoEntries = Object.entries(porTalhao);
  const totalKgDia = romaneiosFiltrados.reduce((a: number, r: any) => a + (parseFloat(r.pesoFinal) || 0), 0);
  const isMobile = useIsMobile();
  return (
    <div>
      <SectionTitle>📅 Relatório Diário</SectionTitle>
      <Card style={{ marginBottom: 16 }}>
        <Field label="Data"><input type="date" value={dataFiltro} onChange={(e: any) => setDataFiltro(e.target.value)} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "10px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 14, outline: "none", minHeight: 44 }} /></Field>
      </Card>
      {romaneiosFiltrados.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Talhões", value: talhaoEntries.length, color: theme.gold },
            { label: "Cargas", value: romaneiosFiltrados.length, color: theme.info },
            { label: "Sacas", value: Math.round(totalKgDia / SC_KG).toLocaleString(), color: theme.accent },
            { label: "Toneladas", value: (totalKgDia / 1000).toFixed(1) + " t", color: theme.accentLight },
          ].map((s, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 12 }}>
              <div style={{ color: theme.muted, fontSize: 9, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: s.color }}>{s.value}</div>
            </Card>
          ))}
        </div>
      )}
      {talhaoEntries.length === 0 ? <Card><EmptyState icon="📅" text={dataFiltro ? "Nenhum recebimento nesta data." : "Selecione uma data."} /></Card> : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {talhaoEntries.map(([nome, dados]: any) => (
            <Card key={nome} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", background: `${theme.accent}0a`, borderBottom: `1px solid ${theme.border}` }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>🗺️ {nome}</div>
                <div style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>{dados.cargas.length} carga(s) · {dados.totalKg.toLocaleString()} kg · {Math.round(dados.totalKg / SC_KG).toLocaleString()} sc</div>
              </div>
              <div style={{ overflowX: "auto" as const }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 400 }}>
                  <thead><tr style={{ background: theme.surface }}>{["Nº", "Grão", "Placa", "Peso", "Sacas"].map(h => <th key={h} style={{ textAlign: "left" as const, padding: "8px 12px", fontSize: 11, color: theme.muted, borderBottom: `1px solid ${theme.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>{dados.cargas.map((r: any) => (<tr key={r.id} style={{ borderBottom: `1px solid ${theme.border}18` }}><td style={{ padding: "8px 12px", fontFamily: "monospace", color: theme.info, fontSize: 12 }}>{r.numero}</td><td style={{ padding: "8px 12px", fontSize: 12 }}>{r.grao}</td><td style={{ padding: "8px 12px", fontSize: 12 }}>{r.placa || "—"}</td><td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>{(parseFloat(r.pesoFinal) || 0).toLocaleString()} kg</td><td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 700, color: theme.accent }}>{Math.round((parseFloat(r.pesoFinal) || 0) / SC_KG)} sc</td></tr>))}</tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP PRINCIPAL ──────────────────────────────────────────────────────────
export default function Home() {
  const isMobile = useIsMobile();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── DATA QUERIES ───────────────────────────────────────────────────────
  const fazendaQuery = trpc.fazenda.get.useQuery(undefined, { enabled: isAuthenticated });
  const clientesQuery = trpc.clientes.list.useQuery(undefined, { enabled: isAuthenticated });
  const transportadorasQuery = trpc.transportadoras.list.useQuery(undefined, { enabled: isAuthenticated });
  const fornecedoresQuery = trpc.fornecedores.list.useQuery(undefined, { enabled: isAuthenticated });
  const caminhoesQuery = trpc.caminhoes.list.useQuery(undefined, { enabled: isAuthenticated });
  const motoristasQuery = trpc.motoristas.list.useQuery(undefined, { enabled: isAuthenticated });
  const contratosQuery = trpc.contratos.list.useQuery(undefined, { enabled: isAuthenticated });
  const insumosQuery = trpc.insumos.list.useQuery(undefined, { enabled: isAuthenticated });
  const estoqueQuery = trpc.estoque.list.useQuery(undefined, { enabled: isAuthenticated });
  const romEntradaQuery = trpc.romaneiosEntrada.list.useQuery(undefined, { enabled: isAuthenticated });
  const romSaidaQuery = trpc.romaneiosSaida.list.useQuery(undefined, { enabled: isAuthenticated });
  const classificacaoQuery = trpc.classificacao.getAll.useQuery(undefined, { enabled: isAuthenticated });
  const talhoesQuery = trpc.talhoes.list.useQuery(undefined, { enabled: isAuthenticated });

  const utils = trpc.useUtils();

  const refreshAll = useCallback(() => {
    utils.fazenda.get.invalidate();
    utils.clientes.list.invalidate();
    utils.transportadoras.list.invalidate();
    utils.fornecedores.list.invalidate();
    utils.caminhoes.list.invalidate();
    utils.motoristas.list.invalidate();
    utils.contratos.list.invalidate();
    utils.insumos.list.invalidate();
    utils.estoque.list.invalidate();
    utils.romaneiosEntrada.list.invalidate();
    utils.romaneiosSaida.list.invalidate();
    utils.classificacao.getAll.invalidate();
    utils.talhoes.list.invalidate();
  }, [utils]);

  const fazenda = fazendaQuery.data || null;
  const clientes = clientesQuery.data || [];
  const transportadoras = transportadorasQuery.data || [];
  const motoristas = motoristasQuery.data || [];
  const caminhoes = caminhoesQuery.data || [];
  const contratos = contratosQuery.data || [];
  const insumos = insumosQuery.data || [];
  const romaneiosEntrada = romEntradaQuery.data || [];
  const romaneiosSaida = romSaidaQuery.data || [];
  const talhoesList = talhoesQuery.data || [];

  // classificacao params is already a map from the server
  const classificacaoParamsMap = useMemo(() => {
    return classificacaoQuery.data || {};
  }, [classificacaoQuery.data]);

  // Dashboard counts
  const counts = useMemo(() => ({
    contratosAtivos: (contratos || []).filter((c: any) => c.status === "Ativo").length,
    romaneiosEntrada: romaneiosEntrada.length,
    romaneiosSaida: romaneiosSaida.length,
    estoque: (estoqueQuery.data || []).reduce((a: number, i: any) => a + (parseFloat(i.qtd) || 0), 0).toFixed(0),
    clientes: clientes.length,
    motoristas: motoristas.length,
  }), [contratos, romaneiosEntrada, romaneiosSaida, estoqueQuery.data, clientes, motoristas]);

  // ─── AUTH CHECK ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, color: theme.text }}>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${theme.accent},${theme.gold})`, borderRadius: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 14, boxShadow: `0 0 40px ${theme.accent}44` }}>🌾</div>
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: "10px 0 6px" }}>AgriGest</h1>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  // ─── CRUD PAGES CONFIG ──────────────────────────────────────────────────
  const crudPages: any = {
    clientes: { title: "Cliente", icon: "👥", routerKey: "clientes", fields: [
      { key: "nome", label: "Nome / Razão Social", table: true }, { key: "cpfCnpj", label: "CPF / CNPJ", table: true },
      { key: "contato", label: "Telefone", table: true }, { key: "email", label: "E-mail", table: true },
      { key: "cidade", label: "Cidade", table: true }, { key: "estado", label: "UF", table: true },
    ]},
    transportadoras: { title: "Transportadora", icon: "🚛", routerKey: "transportadoras", fields: [
      { key: "nome", label: "Razão Social", table: true }, { key: "cnpj", label: "CNPJ", table: true },
      { key: "contato", label: "Contato", table: true }, { key: "cidade", label: "Cidade", table: true }, { key: "estado", label: "UF", table: true },
    ]},
    fornecedores: { title: "Fornecedor", icon: "🏭", routerKey: "fornecedores", fields: [
      { key: "nome", label: "Nome", table: true }, { key: "cnpj", label: "CNPJ", table: true },
      { key: "segmento", label: "Segmento", table: true }, { key: "contato", label: "Contato", table: true },
    ]},
    caminhoes: { title: "Caminhão", icon: "🚜", routerKey: "caminhoes", fields: [
      { key: "placa", label: "Placa", table: true }, { key: "uf", label: "UF", table: true },
    ]},
    motoristas: { title: "Motorista", icon: "👷", routerKey: "motoristas", fields: [
      { key: "nome", label: "Nome Completo", table: true }, { key: "cnh", label: "CNH", table: true },
    ]},
    insumos: { title: "Insumo", icon: "🧪", routerKey: "insumos", fields: [
      { key: "nome", label: "Nome", table: true },
      { key: "unidade", label: "Unidade", type: "select", options: ["kg","L","un","sc","t"], table: true },
      { key: "categoria", label: "Categoria", type: "select", options: ["Fertilizante","Defensivo","Semente","Combustível","Outros"], table: true },
      { key: "fornecedor", label: "Fornecedor", table: true },
    ]},
    recebimentoInsumos: { title: "Recebimento de Insumo", icon: "📥", routerKey: "recebimentoInsumos", fields: [
      { key: "produto", label: "Produto", table: true }, { key: "nf", label: "Nº NF", table: true },
      { key: "recebidoPor", label: "Recebido Por", table: true }, { key: "data", label: "Data", type: "date", table: true },
    ]},
  };

  const page = () => {
    if (crudPages[active]) return <CrudPage key={active} {...crudPages[active]} onRefresh={refreshAll} />;
    switch (active) {
      case "dashboard": return <Dashboard fazenda={fazenda} setActive={setActive} counts={counts} />;
      case "fazenda": return <Fazenda fazenda={fazenda} onRefresh={refreshAll} />;
      case "graos": return <Graos fazenda={fazenda} romaneiosEntrada={romaneiosEntrada} romaneiosSaida={romaneiosSaida} />;
      case "talhoes": return <Talhoes fazenda={fazenda} romaneiosEntrada={romaneiosEntrada} onRefresh={refreshAll} />;
      case "produtividade": return <Produtividade talhoes={talhoesList} romaneiosEntrada={romaneiosEntrada} />;
      case "classificacao": return <Classificacao fazenda={fazenda} classificacaoParams={classificacaoParamsMap} onRefresh={refreshAll} />;
      case "contratos": return <Contratos clientes={clientes} fazenda={fazenda} onRefresh={refreshAll} />;
      case "romaneiosEntrada": return <RomaneiosEntrada fazenda={fazenda} classificacaoParams={classificacaoParamsMap} talhoes={talhoesList} caminhoes={caminhoes} motoristas={motoristas} transportadoras={transportadoras} onRefresh={refreshAll} />;
      case "romaneiosSaida": return <RomaneiosSaida fazenda={fazenda} classificacaoParams={classificacaoParamsMap} clientes={clientes} contratos={contratos} caminhoes={caminhoes} motoristas={motoristas} transportadoras={transportadoras} onRefresh={refreshAll} />;
      case "expedicao": return <Expedicao clientes={clientes} fazenda={fazenda} contratos={contratos} onRefresh={refreshAll} />;
      case "estoque": return <Estoque insumos={insumos} onRefresh={refreshAll} />;
      case "recebimentoInsumos": return <CrudPage {...crudPages.recebimentoInsumos} onRefresh={refreshAll} />;
      case "relatorioMotoristas": return <RelatorioMotoristas romaneiosEntrada={romaneiosEntrada} />;
      case "relatoriosDiarios": return <RelatoriosDiarios romaneiosEntrada={romaneiosEntrada} talhoes={talhoesList} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100dvh", background: theme.bg, color: theme.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", overflow: "hidden" }}>
      {!isMobile && <Sidebar active={active} setActive={setActive} fazenda={fazenda} usuario={user} open={true} onClose={() => {}} />}
      {isMobile && <Sidebar active={active} setActive={setActive} fazenda={fazenda} usuario={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden" }}>
        <header style={{
          padding: isMobile ? "10px 14px" : "10px 24px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: theme.surface, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{
                background: "none", border: `1px solid ${theme.border}`, color: theme.text,
                padding: 8, borderRadius: 8, cursor: "pointer", fontSize: 18,
                minWidth: 40, minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center",
              }}>☰</button>
            )}
            {isMobile && <span style={{ fontWeight: 800, fontSize: 15, color: theme.accentLight }}>🌾 AgriGest</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, justifyContent: "flex-end" }}>
            {!isMobile && <span style={{ color: theme.muted, fontSize: 11 }}>☁️ Sincronizado</span>}
            <button onClick={() => logout()} style={{ background: `${theme.danger}18`, color: theme.danger, border: `1px solid ${theme.danger}33`, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600, minHeight: 36 }}>🚪 Sair</button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 24, WebkitOverflowScrolling: "touch" as any }}>
          <div style={{ maxWidth: 1000 }}>{page()}</div>
        </main>
      </div>
    </div>
  );
}
