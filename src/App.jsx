import { useState, useEffect, useCallback, useRef, Children } from "react";

// ─── HOOK RESPONSIVO ─────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

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
let _uidCounter = 0;
const uid = () => `${Date.now().toString(36)}_${(++_uidCounter).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

// ─── CABEÇALHO PADRÃO PARA RELATÓRIOS ────────────────────────────────────────
const gerarCabecalhoCSS = () => `
  .cabecalho-rel { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f172a; padding-bottom:8px; margin-bottom:14px; gap:12px; }
  .cab-esq { display:flex; align-items:center; gap:10px; }
  .cab-logo { width:48px; height:48px; object-fit:contain; border-radius:6px; }
  .cab-logo-ph { width:48px; height:48px; background:#f0fdf4; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:22px; border:1px solid #bbf7d0; }
  .cab-faz-nome { font-size:15px; font-weight:900; color:#0f172a; }
  .cab-faz-sub { font-size:9px; color:#475569; margin-top:1px; line-height:1.5; }
  .cab-dir { text-align:right; }
  .cab-badge { background:#166534; color:#fff; font-size:8px; font-weight:800; letter-spacing:1.5px; padding:3px 10px; border-radius:20px; text-transform:uppercase; display:inline-block; }
  .cab-subtitulo { font-size:11px; font-weight:700; color:#0f172a; margin-top:6px; }
  .cab-data { font-size:9px; color:#64748b; margin-top:3px; }
`;

const gerarCabecalhoHTML = (faz, titulo, subtitulo) => `
  <div class="cabecalho-rel">
    <div class="cab-esq">
      ${faz.logo ? '<img src="' + faz.logo + '" class="cab-logo" alt="logo"/>' : '<div class="cab-logo-ph">🌾</div>'}
      <div>
        <div class="cab-faz-nome">${faz.nome || "FAZENDA"}</div>
        <div class="cab-faz-sub">Produtor: <strong>${faz.produtor || "—"}</strong></div>
        <div class="cab-faz-sub">CNPJ/CPF: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div>
        <div class="cab-faz-sub">${faz.endereco || ""} ${faz.numero || ""}, ${faz.cidade || ""}/${faz.estado || ""}</div>
      </div>
    </div>
    <div class="cab-dir">
      <div class="cab-badge">${titulo}</div>
      ${subtitulo ? '<div class="cab-subtitulo">' + subtitulo + '</div>' : ''}
      <div class="cab-data">Gerado: ${new Date().toLocaleString("pt-BR")}</div>
    </div>
  </div>
`;

// ─── BACKUP ───────────────────────────────────────────────────────────────────
function BackupManager({ state, setState }) {
  const [importando, setImportando] = useState(false);
  const [preview, setPreview] = useState(null);

  const exportarBackupCompleto = () => {
    const dados = {
      versao: "1.0",
      exportadoEm: new Date().toISOString(),
      dados: state,
    };
    // Remove dados sensíveis de usuários fixos
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_agrigest_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Backup exportado com sucesso!");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.dados) {
          setPreview(parsed);
        } else {
          // Tenta interpretar como dados diretos (formato antigo)
          setPreview({ versao: "legado", exportadoEm: "desconhecido", dados: parsed });
        }
      } catch (err) {
        alert("❌ Arquivo inválido. Selecione um arquivo JSON de backup válido.");
      }
    };
    reader.readAsText(file);
  };

  const restaurarBackup = () => {
    if (!preview?.dados) return;
    if (!window.confirm("⚠️ ATENÇÃO: Restaurar este backup substituirá TODOS os dados atuais. Deseja continuar?")) return;
    // Mescla usuários fixos
    const fixos = USUARIOS_FIXOS.map(u => ({ ...u, modulos: u.modulos || [], isFixo: true }));
    const locais = (preview.dados.usuarios || []).filter(u => !fixos.some(f => f.login === u.login));
    const dadosRestaurados = { ...preview.dados, usuarios: [...fixos, ...locais] };
    setState(dadosRestaurados);
    setPreview(null);
    setImportando(false);
    alert("✅ Backup restaurado com sucesso! Os dados foram carregados.");
  };

  const countItems = (data) => {
    if (!data) return {};
    return {
      fazendas: (data.fazendas || []).length,
      safras: (data.safras || []).length,
      contratos: (data.contratos || []).length,
      romaneiosEntrada: (data.romaneiosEntrada || []).length,
      romaneiosSaida: (data.romaneiosSaida || []).length,
      maquinas: (data.maquinas || []).length,
      pecas: (data.pecas || []).length,
      clientes: (data.clientes || []).length,
      insumos: (data.insumos || []).length,
    };
  };

  const currentCounts = countItems(state);

  return (
    <div>
      <SectionTitle>💾 Backup do Sistema</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Exportar */}
        <Card style={{ borderLeft: `4px solid ${theme.accent}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, background: `${theme.accent}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📤</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>Exportar Backup</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Salve uma cópia completa dos dados</div>
            </div>
          </div>
          <div style={{ background: `${theme.surface}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Resumo dos dados atuais</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {Object.entries(currentCounts).map(([key, val]) => (
                <div key={key} style={{ fontSize: 12, color: theme.text, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: theme.muted }}>{key}:</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
          </div>
          <Btn onClick={exportarBackupCompleto} style={{ width: "100%" }}>📤 Exportar Backup Completo</Btn>
        </Card>

        {/* Restaurar */}
        <Card style={{ borderLeft: `4px solid ${theme.gold}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, background: `${theme.gold}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📥</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>Restaurar Backup</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Importe dados de um backup anterior</div>
            </div>
          </div>

          {!importando && !preview && (
            <div>
              <div style={{ background: `${theme.warning}0a`, border: `1px solid ${theme.warning}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: theme.warning, margin: 0 }}>⚠️ A restauração substituirá <strong>todos</strong> os dados atuais. Recomendamos exportar um backup antes de restaurar.</p>
              </div>
              <Btn variant="gold" onClick={() => setImportando(true)} style={{ width: "100%" }}>📥 Selecionar Arquivo de Backup</Btn>
            </div>
          )}

          {importando && !preview && (
            <div>
              <div style={{ border: `2px dashed ${theme.border}`, borderRadius: 12, padding: "30px 20px", textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
                <p style={{ fontSize: 13, color: theme.muted, marginBottom: 12 }}>Selecione o arquivo .json de backup</p>
                <input type="file" accept=".json" onChange={handleFileSelect} style={{ fontSize: 13, color: theme.text }} />
              </div>
              <Btn variant="secondary" onClick={() => setImportando(false)} style={{ width: "100%" }}>Cancelar</Btn>
            </div>
          )}

          {preview && (
            <div>
              <div style={{ background: `${theme.accent}0a`, border: `1px solid ${theme.accent}33`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentLight, marginBottom: 6 }}>✅ Arquivo carregado com sucesso</div>
                <div style={{ fontSize: 11, color: theme.muted }}>
                  Versão: {preview.versao || "—"} · Exportado em: {preview.exportadoEm ? new Date(preview.exportadoEm).toLocaleString("pt-BR") : "—"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 10 }}>
                  {Object.entries(countItems(preview.dados)).map(([key, val]) => (
                    <div key={key} style={{ fontSize: 11, color: theme.text, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: theme.muted }}>{key}:</span>
                      <strong>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="secondary" onClick={() => { setPreview(null); setImportando(false); }} style={{ flex: 1 }}>Cancelar</Btn>
                <Btn variant="gold" onClick={restaurarBackup} style={{ flex: 1 }}>✅ Restaurar Dados</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ImportarTalhoes({ state, setState }) {
  const [linhas, setLinhas] = useState([]);
  const [erros, setErros] = useState([]);
  const [arquivo, setArquivo] = useState("");
  const [textoColado, setTextoColado] = useState("");
  const [resultado, setResultado] = useState(null);
  const [modo, setModo] = useState("merge"); // merge | replace

  const COLUNAS = [
    { keys: ["talhao", "talhão", "nome", "nome do talhao", "nome do talhão"], campo: "nome", obrigatorio: true },
    { keys: ["cultura", "grao", "grão", "produto"], campo: "cultura", obrigatorio: true },
    { keys: ["anosafra", "ano safra", "safra"], campo: "safra", obrigatorio: false },
    { keys: ["ha", "area", "área", "hectares"], campo: "area", obrigatorio: true },
    { keys: ["obs", "observacao", "observação"], campo: "obs", obrigatorio: false },
  ];

  const norm = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const detectarSep = (linha) => {
    const c = (linha.match(/;/g) || []).length;
    const t = (linha.match(/\t/g) || []).length;
    const v = (linha.match(/,/g) || []).length;
    if (t >= c && t >= v) return "\t";
    if (c >= v) return ";";
    return ",";
  };

  const parseCSV = (texto) => {
    const linhasTxt = texto.split(/\r?\n/).filter(l => l.trim());
    if (linhasTxt.length < 2) return { header: [], rows: [] };
    const sep = detectarSep(linhasTxt[0]);
    const split = (linha) => {
      const out = []; let atual = ""; let dentroAspas = false;
      for (let i = 0; i < linha.length; i++) {
        const c = linha[i];
        if (c === '"') { dentroAspas = !dentroAspas; continue; }
        if (c === sep && !dentroAspas) { out.push(atual); atual = ""; continue; }
        atual += c;
      }
      out.push(atual);
      return out.map(s => s.trim());
    };
    const header = split(linhasTxt[0]).map(norm);
    const rows = linhasTxt.slice(1).map(l => split(l));
    return { header, rows };
  };

  const parseNum = (s) => {
    if (s === null || s === undefined || s === "") return 0;
    const v = String(s).replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
    return parseFloat(v) || 0;
  };

  const processar = (texto) => {
    setErros([]); setResultado(null);
    const { header, rows } = parseCSV(texto);
    if (header.length === 0) { setErros(["Não foi possível ler a planilha. Verifique o formato."]); setLinhas([]); return; }

    const mapa = {};
    COLUNAS.forEach(col => {
      const idx = header.findIndex(h => col.keys.includes(h));
      if (idx >= 0) mapa[col.campo] = idx;
    });

    const errosLocais = [];
    COLUNAS.filter(c => c.obrigatorio).forEach(c => {
      if (mapa[c.campo] === undefined) errosLocais.push(`Coluna obrigatória ausente: ${c.keys[0]}`);
    });
    if (errosLocais.length) { setErros(errosLocais); setLinhas([]); return; }

    const parsed = rows.map((r, i) => {
      const obj = { _linha: i + 2 };
      Object.entries(mapa).forEach(([campo, idx]) => { obj[campo] = (r[idx] || "").trim(); });
      obj.area = parseNum(obj.area);
      return obj;
    }).filter(o => o.nome && o.cultura);

    setLinhas(parsed);
  };

  const lerArquivo = (file) => {
    if (!file) return;
    setArquivo(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { const txt = e.target.result; setTextoColado(txt); processar(txt); };
    reader.readAsText(file, "UTF-8");
  };

  // Agrupa linhas por nome de talhão para gerar a estrutura { nome, culturas:[...] }
  const agrupados = () => {
    const map = {};
    linhas.forEach(l => {
      const key = l.nome.trim();
      if (!map[key]) map[key] = { nome: key, culturas: [] };
      map[key].culturas.push({
        id: uid(),
        grao: l.cultura,
        area: l.area,
        safra: l.safra || "",
        obs: l.obs || "",
      });
    });
    return Object.values(map);
  };

  const importar = () => {
    if (!linhas.length) { alert("Nada para importar."); return; }
    const novos = agrupados();
    const msg = modo === "replace"
      ? `SUBSTITUIR todos os talhões existentes por ${novos.length} novo(s)? Esta ação não pode ser desfeita.`
      : `Importar/mesclar ${novos.length} talhão(ões)? Talhões com mesmo nome terão as culturas adicionadas.`;
    if (!window.confirm(msg)) return;

    setState(s => {
      const atuais = s.talhoes || [];
      let resultado;
      if (modo === "replace") {
        resultado = novos.map(n => ({ id: uid(), ...n }));
      } else {
        const mapaAtual = {};
        atuais.forEach(t => { mapaAtual[t.nome] = { ...t, culturas: [...(t.culturas || [])] }; });
        novos.forEach(n => {
          if (mapaAtual[n.nome]) {
            mapaAtual[n.nome].culturas = [...mapaAtual[n.nome].culturas, ...n.culturas];
          } else {
            mapaAtual[n.nome] = { id: uid(), ...n };
          }
        });
        resultado = Object.values(mapaAtual);
      }
      return { ...s, talhoes: resultado };
    });

    setResultado({ qtd: novos.length, linhas: linhas.length });
    setLinhas([]); setTextoColado(""); setArquivo("");
  };

  const baixarModelo = () => {
    const csv = "talhao;cultura;ano safra;ha;obs\n" +
                "Talhão A;Soja;2024/2025;120,5;\n" +
                "Talhão A;Milho Safrinha;2024/2025;120,5;Após soja\n" +
                "Talhão B;Soja;2024/2025;85,0;\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modelo_talhoes.csv";
    a.click();
  };

  const preview = agrupados();

  return (
    <div>
      <SectionTitle>🗺️ Importar Talhões (Planilha)</SectionTitle>

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: theme.muted, marginBottom: 12 }}>
          Importe uma planilha com os talhões. Cada linha representa uma <strong>cultura</strong> de um talhão. Linhas com o mesmo nome de talhão são agrupadas automaticamente.
        </p>
        <div style={{ background: `${theme.info}11`, border: `1px solid ${theme.info}44`, padding: 12, borderRadius: 8, fontSize: 12, color: theme.text, marginBottom: 12 }}>
          <strong>Colunas aceitas:</strong> talhão, cultura, ano safra, ha, obs.
          <br /><strong>Obrigatórias:</strong> talhão, cultura, ha.
          <br />Separador: vírgula, ponto-e-vírgula ou tab. Use vírgula como decimal (ex: 120,5).
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          <Btn onClick={baixarModelo}>⬇️ Baixar Modelo CSV</Btn>
          <label style={{ display: "inline-block" }}>
            <input type="file" accept=".csv,.tsv,.txt" onChange={(e) => lerArquivo(e.target.files?.[0])} style={{ display: "none" }} />
            <span style={{ display: "inline-block", padding: "10px 16px", background: theme.accent, color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>📁 Selecionar Arquivo</span>
          </label>
          {arquivo && <span style={{ fontSize: 12, color: theme.muted, alignSelf: "center" }}>📎 {arquivo}</span>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
            <label style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
              <input type="radio" checked={modo === "merge"} onChange={() => setModo("merge")} /> Mesclar
            </label>
            <label style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
              <input type="radio" checked={modo === "replace"} onChange={() => setModo("replace")} /> Substituir tudo
            </label>
          </div>
        </div>

        <Field label="Ou cole os dados aqui (CSV/TSV)">
          <textarea
            rows={6}
            value={textoColado}
            onChange={(e) => setTextoColado(e.target.value)}
            placeholder={"talhao;cultura;ano safra;ha\nTalhão A;Soja;2024/2025;120,5\nTalhão A;Milho Safrinha;2024/2025;120,5"}
            style={{ fontFamily: "monospace", fontSize: 12, width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border || "#334155"}`, background: theme.cardBg || theme.bg, color: theme.text, minHeight: 120, resize: "vertical" }}
          />
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn onClick={() => processar(textoColado)} disabled={!textoColado.trim()}>🔍 Pré-visualizar</Btn>
          <Btn onClick={() => { setTextoColado(""); setLinhas([]); setErros([]); setArquivo(""); setResultado(null); }} variant="ghost">🧹 Limpar</Btn>
        </div>
      </Card>

      {erros.length > 0 && (
        <Card style={{ padding: 16, marginBottom: 16, background: `${theme.danger || "#dc2626"}11`, border: `1px solid ${theme.danger || "#dc2626"}55` }}>
          <strong style={{ color: theme.danger || "#dc2626" }}>⚠️ Erros encontrados:</strong>
          <ul style={{ margin: "8px 0 0 20px", fontSize: 13 }}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </Card>
      )}

      {resultado && (
        <Card style={{ padding: 16, marginBottom: 16, background: `${theme.accent}11`, border: `1px solid ${theme.accent}55` }}>
          ✅ <strong>{resultado.qtd}</strong> talhão(ões) processado(s) a partir de <strong>{resultado.linhas}</strong> linha(s) — modo <strong>{modo === "replace" ? "Substituir" : "Mesclar"}</strong>.
        </Card>
      )}

      {linhas.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <strong>👁️ Pré-visualização — {preview.length} talhão(ões), {linhas.length} cultura(s)</strong>
            <Btn onClick={importar}>✅ Importar {preview.length} Talhão(ões)</Btn>
          </div>
          <div style={{ overflowX: "auto" }}>
            <Table headers={["Talhão", "Culturas", "Área Total (ha)"]} rows={
              preview.slice(0, 80).map((t, i) => {
                const total = t.culturas.reduce((a, c) => a + (parseFloat(c.area) || 0), 0).toFixed(2);
                return (
                  <tr key={i}>
                    <Td><strong>{t.nome}</strong></Td>
                    <Td>{t.culturas.map(c => `${c.grao}${c.safra ? ` (${c.safra})` : ""} — ${c.area} ha`).join(" • ")}</Td>
                    <Td><strong style={{ color: theme.accent }}>{total}</strong></Td>
                  </tr>
                );
              })
            } />
            {preview.length > 80 && <p style={{ fontSize: 12, color: theme.muted, marginTop: 8 }}>Exibindo primeiros 80 de {preview.length}. Todos serão importados.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}


// ─── MÓDULOS DE ACESSO ───────────────────────────────────────────────────────
const modulosDisponiveis = [
  { grupo: "📊 DASHBOARD", modulos: [
    { id: "dashboard", label: "Dashboard" },
  ]},
  { grupo: "🌾 GRÃOS", modulos: [
    { id: "graosDept", label: "Grãos", submodulos: [
      { id: "graosDept.graos", label: "Grãos em Produção" },
      { id: "graosDept.talhoes", label: "Talhões" },
      { id: "graosDept.classificacao", label: "Classificação - Expedição" },
      { id: "graosDept.classificacaoRecepcao", label: "Classificação - Recepção" },
      { id: "graosDept.contratos", label: "Contratos" },
      { id: "graosDept.romaneiosEntrada", label: "Recebimento" },
      { id: "graosDept.romaneiosSaida", label: "Expedição" },
      
      { id: "graosDept.vendaMilho", label: "Venda de Milho" },
    ]},
  ]},
  { grupo: "📑 RELATÓRIOS", modulos: [
    { id: "relatoriosDept", label: "Relatórios", submodulos: [
      { id: "relatoriosDept.produtividade", label: "Produtividade" },
      { id: "relatoriosDept.relatorioMotoristas", label: "Rel. Motoristas" },
      { id: "relatoriosDept.relatoriosDiarios", label: "Rel. Diário de Colheita" },
      { id: "relatoriosDept.relatorioCarregamentos", label: "Rel. Carregamentos" },
      { id: "relatoriosDept.pluviometro", label: "Pluviômetro" },
      { id: "relatoriosDept.relPluviometria", label: "Rel. Pluviometria" },
    ]},
  ]},
  { grupo: "🧪 INSUMOS", modulos: [
    { id: "insumosDept", label: "Insumos", submodulos: [
      { id: "insumosDept.insumos", label: "Cadastro de Insumos" },
      { id: "insumosDept.estoque", label: "Estoque Insumos" },
      { id: "insumosDept.recebimentoInsumos", label: "Recebimento" },
      { id: "insumosDept.fichasAplicacao", label: "Fichas de Aplicação" },
    ]},
  ]},
  { grupo: "🚜 MÁQUINAS E EQUIPAMENTOS", modulos: [
    { id: "maquinasEquipamentos", label: "Máquinas e Equipamentos", submodulos: [
      { id: "maquinasEquipamentos.maquinas", label: "Máquinas" },
      { id: "maquinasEquipamentos.implementos", label: "Implementos" },
      { id: "maquinasEquipamentos.abastecimento", label: "Abastecimento" },
      { id: "maquinasEquipamentos.trocasOleo", label: "Trocas de Óleo" },
      { id: "maquinasEquipamentos.filtros", label: "Filtros" },
      { id: "maquinasEquipamentos.manutencoes", label: "Manutenções" },
      { id: "maquinasEquipamentos.relatorioCombustivel", label: "Rel. Consumo" },
    ]},
  ]},
  { grupo: "🔧 ALMOXARIFADO", modulos: [
    { id: "almoxarifado", label: "Almoxarifado", submodulos: [
      { id: "almoxarifado.pecas", label: "Peças" },
      { id: "almoxarifado.movimentacaoPecas", label: "Movimentação" },
      { id: "almoxarifado.historico", label: "Histórico" },
      { id: "almoxarifado.estoquePecas", label: "Estoque" },
      { id: "almoxarifado.consumo", label: "Consumo" },
      { id: "almoxarifado.etiquetas", label: "Etiquetas" },
      { id: "almoxarifado.inventario", label: "Inventário" },
      { id: "almoxarifado.graficos", label: "Gráficos" },
      { id: "almoxarifado.requisicoes", label: "Requisições" },
    ]},
  ]},
  { grupo: "💰 FINANÇAS", modulos: [
    { id: "financas", label: "Departamento Financeiro", submodulos: [
      { id: "financas.contasPagar", label: "Contas a Pagar" },
      { id: "financas.contasReceber", label: "Contas a Receber" },
      { id: "financas.despesasOp", label: "Despesas Operacionais" },
      { id: "financas.fluxoCaixa", label: "Fluxo de Caixa" },
      { id: "financas.dre", label: "DRE" },
    ]},
  ]},
  { grupo: "📋 CADASTROS", modulos: [
    { id: "cadastros", label: "Cadastros", submodulos: [
      { id: "cadastros.fazenda", label: "Fazenda" },
      { id: "cadastros.safras", label: "Ano Safra" },
      { id: "cadastros.clientes", label: "Clientes" },
      { id: "cadastros.transportadoras", label: "Transportadoras" },
      { id: "cadastros.fornecedores", label: "Fornecedores" },
      { id: "cadastros.caminhoes", label: "Caminhões" },
      { id: "cadastros.motoristas", label: "Motoristas" },
    ]},
  ]},
];

const todosModuloIds = modulosDisponiveis.flatMap(g => g.modulos.flatMap(m => [m.id, ...(m.submodulos || []).map(s => s.id)]));
// Helper: get all sub-module ids for a module
const getSubmoduloIds = (moduloId) => {
  for (const g of modulosDisponiveis) {
    for (const m of g.modulos) {
      if (m.id === moduloId && m.submodulos) return m.submodulos.map(s => s.id);
    }
  }
  return [];
};
// Submódulos restritos a admin (não aparecem para operadores nem mesmo se marcados nas permissões)
const SUBMODULOS_ADMIN_ONLY = new Set(["graosDept.expedicao"]);

// Helper: check if user has access to a sub-tab within a department
const temAcessoSubmodulo = (usuario, moduloId, abaId) => {
  const subKey = `${moduloId}.${abaId}`;
  if (SUBMODULOS_ADMIN_ONLY.has(subKey)) return usuario?.role === "admin";
  if (usuario?.role === "admin") return true;
  const modulos = usuario?.modulos || [];
  if (modulos.length === 0) return true;
  if (!modulos.includes(moduloId)) return false;
  // If user has the parent module but no sub-modules configured for it, allow all
  const subIds = getSubmoduloIds(moduloId);
  const userSubs = modulos.filter(m => subIds.includes(m));
  if (userSubs.length === 0) return true; // no sub restriction
  return modulos.includes(subKey);
};
const padNum = (n) => String(n).padStart(5, "0");

// ─── USUÁRIOS FIXOS ──────────────────────────────────────────────────────────
const USUARIOS_FIXOS = [
  { id: "1", nome: "Administrador", login: "admin", senha: "agro2024", role: "admin", modulos: [], isFixo: true }
];

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
    success: { background: `${theme.accent}22`, color: theme.accentLight, border: `1px solid ${theme.accent}44` },
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
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, width: "100%", maxWidth: Math.min(width, window.innerWidth - 24), maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: theme.card, zIndex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "16px" }}>{children}</div>
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

const Row = ({ children, cols = 2 }) => {
  const isMob = useIsMobile(640);
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : `repeat(${cols},1fr)`, gap: 12, marginBottom: 4 }}>
      {children}
    </div>
  );
};

// Responsive grid helper for stat cards, etc.
const ResponsiveGrid = ({ children, minWidth = 220, gap = 12, style = {} }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`, gap, ...style }}>
    {children}
  </div>
);

// Global responsive styles injected once
const ResponsiveStyles = () => (
  <style>{`
    @media (max-width: 768px) {
      .agri-tabs { flex-wrap: wrap !important; }
      .agri-tabs > button { flex: 1 1 auto !important; min-width: 120px !important; font-size: 11px !important; padding: 6px 8px !important; }
    }
    @media (max-width: 480px) {
      .agri-tabs > button { min-width: 90px !important; font-size: 10px !important; }
    }
  `}</style>
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
      if (!parsed.fazendas) {
        // Migra fazenda única para array de fazendas
        parsed.fazendas = parsed.fazenda ? [{ ...parsed.fazenda, id: parsed.fazenda.id || uid() }] : [];
      }
      if (!parsed.talhoes) parsed.talhoes = [];
      if (!parsed.maquinas) parsed.maquinas = [];
      if (!parsed.abastecimentos) parsed.abastecimentos = [];
      if (!parsed.pecas) parsed.pecas = [];
      if (!parsed.movimentacaoPecas) parsed.movimentacaoPecas = [];
      if (!parsed.inventarios) parsed.inventarios = [];
      if (!parsed.fichasAplicacao) parsed.fichasAplicacao = [];
       if (!parsed.vendasMilho) parsed.vendasMilho = [];
       if (!parsed.pluviometro) parsed.pluviometro = [];
      if (!parsed.contasPagar) parsed.contasPagar = [];
      if (!parsed.contasReceber) parsed.contasReceber = [];
      if (!parsed.despesasOperacionais) parsed.despesasOperacionais = [];
      if (!parsed.centrosCusto) parsed.centrosCusto = ["Grãos", "Insumos", "Frota", "Administrativo", "Comercial"];
      if (!parsed.categoriasFinanceiras) parsed.categoriasFinanceiras = [
        "Compra de Insumos", "Frete", "Manutenção", "Combustível", "Mão de Obra",
        "Impostos", "Serviços de Terceiros", "Despesas Bancárias", "Outros"
      ];
      if (!parsed.configPixVenda) parsed.configPixVenda = {
        chave: "",
        tipo: "CPF",
        nomeTitular: "",
        cidade: "",
        instrucoes: "Após o pagamento, envie o comprovante para o WhatsApp da fazenda."
      };
      // Mescla usuários fixos com usuários cadastrados localmente
      const fixos = USUARIOS_FIXOS.map(u => ({ ...u, modulos: u.modulos || [], isFixo: true }));
      const locais = (parsed.usuarios || []).filter(u => !fixos.some(f => f.login === u.login));
      parsed.usuarios = [...fixos, ...locais];
      return parsed;
    }
  } catch (e) {}
  return {
    fazenda: null, fazendas: [], clientes: [], transportadoras: [], fornecedores: [], caminhoes: [], motoristas: [],
    contratos: [], insumos: [], estoqueInsumos: [], recebimentoInsumos: [],
    romaneiosEntrada: [], romaneiosSaida: [], romaneiosEntradaLixeira: [], romaneiosSaidalixeira: [],
    expedicoes: [], classificacaoParams: {}, classificacaoRecepcaoParams: {}, romaneioCounter: 1, talhoes: [],
    maquinas: [],
    abastecimentos: [],
    pecas: [],
    movimentacaoPecas: [],
    inventarios: [],
    fichasAplicacao: [],
     vendasMilho: [],
     pluviometro: [],
    contasPagar: [],
    contasReceber: [],
    despesasOperacionais: [],
    centrosCusto: ["Grãos", "Insumos", "Frota", "Administrativo", "Comercial"],
    categoriasFinanceiras: ["Compra de Insumos", "Frete", "Manutenção", "Combustível", "Mão de Obra", "Impostos", "Serviços de Terceiros", "Despesas Bancárias", "Outros"],
    configPixVenda: {
      chave: "",
      tipo: "CPF",
      nomeTitular: "",
      cidade: "",
      instrucoes: "Após o pagamento, envie o comprovante para o WhatsApp da fazenda."
    },
    usuarios: USUARIOS_FIXOS.map(u => ({ ...u, isFixo: true }))
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
      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px", position: "relative", zIndex: 1 }}>
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

// ─── SELETOR DE FAZENDA E ANO SAFRA ──────────────────────────────────────────
function FazendaSelector({ fazendas, onSelect, onNovaFazenda }) {
  const [selectedFazenda, setSelectedFazenda] = useState("");
  const [anoSafra, setAnoSafra] = useState(safrasOpcoes[1] || "");

  const handleEntrar = () => {
    if (!selectedFazenda || !anoSafra) return;
    onSelect(selectedFazenda, anoSafra);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.bg, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 65% 40%, ${theme.accent}1a 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, ${theme.gold}12 0%, transparent 50%)` }} />
      <div style={{ width: "100%", maxWidth: 520, padding: "0 16px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 68, height: 68, background: `linear-gradient(135deg,${theme.accent},${theme.gold})`, borderRadius: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 34, marginBottom: 14, boxShadow: `0 0 40px ${theme.accent}44` }}>🌾</div>
          <h1 style={{ fontWeight: 900, fontSize: 28, color: theme.text, letterSpacing: -1, margin: 0 }}>Selecione a Fazenda</h1>
          <p style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>Escolha a fazenda e o ano safra para continuar</p>
        </div>
        <Card>
          {fazendas.length > 0 ? (
            <>
              <Field label="Fazenda">
                <Select value={selectedFazenda} onChange={e => setSelectedFazenda(e.target.value)}>
                  <option value="">-- Selecione uma fazenda --</option>
                  {fazendas.map(f => (
                    <option key={f.id} value={f.id}>{f.nome} {f.cidade ? `— ${f.cidade}/${f.estado}` : ""}</option>
                  ))}
                </Select>
              </Field>

              {selectedFazenda && (
                <div style={{ background: `${theme.accent}0a`, border: `1px solid ${theme.accent}33`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  {(() => {
                    const faz = fazendas.find(f => f.id === selectedFazenda);
                    if (!faz) return null;
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 50, height: 50, background: `${theme.accent}2a`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                          {faz.logo ? <img src={faz.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 24 }}>🏡</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>{faz.nome}</div>
                          <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{faz.produtor} · {faz.cidade}/{faz.estado}</div>
                          {faz.graos?.length > 0 && (
                            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                              {faz.graos.map(g => <Badge key={g} color="green">{g}</Badge>)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <Field label="Ano Safra">
                <Select value={anoSafra} onChange={e => setAnoSafra(e.target.value)}>
                  <option value="">-- Selecione o ano safra --</option>
                  {safrasOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>

              <Btn onClick={handleEntrar} disabled={!selectedFazenda || !anoSafra} style={{ width: "100%", marginTop: 8, padding: 13 }} size="lg">
                🌾 Entrar na Fazenda
              </Btn>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
              <p style={{ color: theme.muted, fontSize: 14, marginBottom: 16 }}>Nenhuma fazenda cadastrada ainda.</p>
              <Btn onClick={onNovaFazenda} style={{ padding: 13 }} size="lg">
                ➕ Cadastrar Primeira Fazenda
              </Btn>
            </div>
          )}

          {fazendas.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={onNovaFazenda} style={{ background: "none", border: "none", color: theme.info, cursor: "pointer", fontSize: 12, fontFamily: "inherit", textDecoration: "underline" }}>
                ➕ Cadastrar nova fazenda
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
const navGroups = (isAdmin, userModulos) => {
  const allGroups = [
    {
      title: "📊 DASHBOARD", icon: "📊",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
      ]
    },
    {
      title: "🌾 GRÃOS", icon: "🌾",
      items: [
        { id: "graosDept", label: "Grãos", icon: "🌾" },
      ]
    },
    {
      title: "📑 RELATÓRIOS", icon: "📑",
      items: [
        { id: "relatoriosDept", label: "Relatórios", icon: "📑" },
      ]
    },
    {
      title: "🧪 INSUMOS", icon: "🧪",
      items: [
        { id: "insumosDept", label: "Insumos", icon: "🧪" },
      ]
    },
    {
      title: "🚜 MÁQUINAS E EQUIP.", icon: "🚜",
      items: [
        { id: "maquinasEquipamentos", label: "Máquinas e Equipamentos", icon: "🚜" },
      ]
    },
    {
      title: "🔧 ALMOXARIFADO", icon: "🔧",
      items: [
        { id: "almoxarifado", label: "Almoxarifado", icon: "🔧" },
      ]
    },
    {
      title: "💰 FINANÇAS", icon: "💰",
      items: [
        { id: "financas", label: "Departamento Financeiro", icon: "💰" },
      ]
    },
    {
      title: "📋 CADASTROS", icon: "📋",
      items: [
        { id: "cadastros", label: "Cadastros", icon: "📋" },
      ]
    },
    ...(isAdmin ? [{
      title: "⚙️ ADMIN", icon: "⚙️",
      items: [
        { id: "expedicao", label: "Agendamentos", icon: "🚚" },
        { id: "usuarios", label: "Usuários", icon: "👥" },
        { id: "lixeira", label: "Lixeira", icon: "🗑️" },
        { id: "importarRecebimentos", label: "Importar Recebimentos", icon: "📊" },
        { id: "importarTalhoes", label: "Importar Talhões", icon: "🗺️" },
        { id: "backup", label: "Backup", icon: "💾" },
        { id: "update", label: "Update", icon: "🔄" },
      ]
    }] : [])
  ];

  if (isAdmin) return allGroups;

  const permitidos = userModulos || [];
  return allGroups
    .map(g => ({ ...g, items: g.items.filter(item => permitidos.includes(item.id)) }))
    .filter(g => g.items.length > 0);
};

function Sidebar({ active, setActive, fazenda, usuario, mobileOpen, onClose }) {
  const groups = navGroups(usuario?.role === "admin", usuario?.modulos);
  const isMobile = useIsMobile();

  const handleNav = (id) => {
    setActive(id);
    if (isMobile && onClose) onClose();
  };

  const sidebarContent = (
    <div style={{ width: isMobile ? "100%" : 240, background: theme.surface, borderRight: isMobile ? "none" : `1px solid ${theme.border}`, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
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
              <button key={item.id} onClick={() => handleNav(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 7,
                background: active === item.id ? `${theme.accent}22` : "transparent",
                border: active === item.id ? `1px solid ${theme.accent}44` : "1px solid transparent",
                color: active === item.id ? theme.accentLight : theme.muted,
                cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                fontWeight: active === item.id ? 600 : 400, textAlign: "left", transition: "all .15s", marginBottom: 2,
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 999 }} onClick={onClose} />
        )}
        <div style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 1000,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .25s ease",
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// Mapeamento de "page" (id usado em setActive) -> submodulo "deptId.subId"
// Também usado pelo Dashboard para navegar direto a uma sub-aba do departamento.
const getBaseAba = (ia, abas) => { if (!ia) return null; const id = ia.split("|")[0]; return abas.some(a => a.id === id) ? id : null; };

const PAGE_TO_SUBMODULO = {
  contratos: "graosDept.contratos",
  romaneiosEntrada: "graosDept.romaneiosEntrada",
  romaneiosSaida: "graosDept.romaneiosSaida",
  
  talhoes: "graosDept.talhoes",
  graos: "graosDept.graos",
  produtividade: "relatoriosDept.produtividade",
  fichasAplicacao: "insumosDept.fichasAplicacao",
  insumos: "insumosDept.insumos",
  estoque: "insumosDept.estoque",
  recebimentoInsumos: "insumosDept.recebimentoInsumos",
  maquinas: "maquinasEquipamentos.maquinas",
  abastecimento: "maquinasEquipamentos.abastecimento",
  pecas: "almoxarifado.pecas",
  estoquePecas: "almoxarifado.estoquePecas",
  contasPagar: "financas.contasPagar",
  contasReceber: "financas.contasReceber",
  despesasOp: "financas.despesasOp",
  fluxoCaixa: "financas.fluxoCaixa",
  dre: "financas.dre",
  clientes: "cadastros.clientes",
  motoristas: "cadastros.motoristas",
  transportadoras: "cadastros.transportadoras",
  fornecedores: "cadastros.fornecedores",
  caminhoes: "cadastros.caminhoes",
  relatorioMotoristas: "relatoriosDept.relatorioMotoristas",
  relatorioCarregamentos: "relatoriosDept.relatorioCarregamentos",
  fazenda: "cadastros.fazenda",
};

function podeVerPagina(usuario, page) {
  if (!usuario) return true;
  const subForPage = PAGE_TO_SUBMODULO[page];
  if (subForPage && SUBMODULOS_ADMIN_ONLY.has(subForPage)) return usuario.role === "admin";
  if (usuario.role === "admin") return true;
  const modulos = usuario.modulos || [];
  if (modulos.length === 0) return true;
  const sub = PAGE_TO_SUBMODULO[page];
  if (!sub) return true;
  // Se for um módulo "raiz" (sem ponto)
  if (!sub.includes(".")) return modulos.includes(sub);
  const [dept] = sub.split(".");
  if (!modulos.includes(dept)) return false;
  // Se usuário tem o departamento mas não escolheu submódulos específicos, libera
  const subIds = (modulosDisponiveis
    .flatMap(g => g.modulos)
    .find(m => m.id === dept)?.submodulos || []).map(s => s.id);
  const userSubs = modulos.filter(m => subIds.includes(m));
  if (userSubs.length === 0) return true;
  return modulos.includes(sub);
}

function Dashboard({ state, setActive, usuario, safraAtiva }) {
  const bySafra = (arr) => safraAtiva ? (arr || []).filter(r => r.safra === safraAtiva) : (arr || []);
  const romaneiosEntradaSafra = bySafra(state.romaneiosEntrada);
  const romaneiosSaidaSafra   = bySafra(state.romaneiosSaida);
  const contratosSafra        = bySafra(state.contratos);

  const totalCombustivel = (state.abastecimentos || []).reduce((sum, a) => sum + (parseFloat(a.litros) || 0), 0);
  const totalFichas      = (state.fichasAplicacao || []).length;
  const totalPecas       = (state.pecas || []).length;
  const estoqueTotal     = state.estoqueInsumos.reduce((a, i) => a + (parseFloat(i.qtd) || 0), 0);
  const saldoEstoquePecas = (state.estoquePecas || []).reduce((a, i) => a + (parseFloat(i.qtd) || 0), 0);
  
  const totalContasPagar = (state.contasPagar || []).filter(c => c.status === "Pendente").reduce((s, c) => s + (c.valor || 0), 0);
  const totalContasReceber = (state.contasReceber || []).filter(c => c.status === "Pendente").reduce((s, c) => s + (c.valor || 0), 0);

  const StatCard = ({ label, value, icon, color, page, sub }) => {
    if (page && !podeVerPagina(usuario, page)) return null;
    return (
    <div
      onClick={() => page && setActive(page)}
      style={{
        background: theme.card, border: `1px solid ${theme.border}`,
        borderLeft: `4px solid ${color}`, borderRadius: 10, padding: "14px 16px",
        cursor: page ? "pointer" : "default",
        transition: "all .18s",
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
  };

  const Group = ({ title, color, children }) => {
    const visibleChildren = Children.toArray(children).filter(Boolean);
    if (visibleChildren.length === 0) return null;
    return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color, borderBottom: `2px solid ${color}33`, paddingBottom: 6, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {visibleChildren}
      </div>
    </div>
    );
  };

  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>

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

      <Group title={`🌾 Grãos & Contratos${safraAtiva ? ` — Safra ${safraAtiva}` : ""}`} color={theme.accent}>
        <StatCard label="Contratos Ativos"    value={contratosSafra.filter(c => c.status === "Ativo").length} icon="📋" color={theme.accent}      page="contratos"        sub={safraAtiva ? `Safra ${safraAtiva}` : "Clique para gerenciar"} />
        <StatCard label="Recebimentos"        value={romaneiosEntradaSafra.length}  icon="📥" color={theme.info}        page="romaneiosEntrada"  sub={safraAtiva ? `Safra ${safraAtiva}` : "Romaneios de entrada"} />
        <StatCard label="Expedições"          value={romaneiosSaidaSafra.length}    icon="📤" color={theme.gold}        page="romaneiosSaida"    sub={safraAtiva ? `Safra ${safraAtiva}` : "Romaneios de saída"} />
      </Group>

      <Group title="📈 Produção & Talhões" color={theme.accentLight}>
        <StatCard label="Talhões Cadastrados" value={(state.talhoes || []).length}   icon="🗺️" color={theme.accentLight} page="talhoes"          sub="Áreas da fazenda" />
        <StatCard label="Grãos em Produção"   value={(state.fazenda?.graos || []).length} icon="🌾" color={theme.accent} page="graos"            sub="Culturas ativas" />
        <StatCard label="Produtividade"       value={(state.talhoes || []).length > 0 ? "Ver" : "—"} icon="📈" color={theme.info} page="produtividade" sub="sc/ha por talhão" />
        <StatCard label="Fichas de Aplicação" value={totalFichas}                    icon="🧪" color={theme.accent}      page="fichasAplicacao"  sub="Aplicações registradas" />
      </Group>

      <Group title="🧪 Insumos & Estoque" color={theme.warning}>
        <StatCard label="Insumos Cadastrados" value={(state.insumos || []).length}   icon="🧪" color={theme.warning}    page="insumos"          sub="Produtos registrados" />
        <StatCard label="Qtd em Estoque"      value={estoqueTotal.toFixed(0)}        icon="📦" color={theme.gold}       page="estoque"          sub="Unidades disponíveis" />
        <StatCard label="Recebimentos Insumo" value={(state.recebimentoInsumos || []).length} icon="📥" color={theme.info} page="recebimentoInsumos" sub="NFs lançadas" />
        <StatCard label="Fichas de Aplicação" value={totalFichas}                   icon="📋" color={theme.accent}      page="fichasAplicacao"  sub="Baixas no estoque" />
      </Group>

      <Group title="🚜 Frota & Manutenção" color={theme.info}>
        <StatCard label="Máquinas"            value={(state.maquinas || []).length}  icon="🚜" color={theme.info}       page="maquinas"         sub="Equipamentos cadastrados" />
        <StatCard label="Litros Abastecidos"  value={totalCombustivel.toFixed(0)}    icon="⛽" color={theme.warning}    page="abastecimento"    sub="Total de combustível" />
        <StatCard label="Peças Cadastradas"   value={totalPecas}                     icon="🔧" color={theme.muted}      page="pecas"            sub="Itens de manutenção" />
        <StatCard label="Estoque de Peças"    value={saldoEstoquePecas.toFixed(0)}   icon="📦" color={theme.gold}       page="estoquePecas"     sub="Unidades em estoque" />
      </Group>

      <Group title="💰 Finanças" color={theme.gold}>
        <StatCard label="Contas a Pagar"      value={`R$ ${totalContasPagar.toFixed(2)}`} icon="💰" color={theme.danger} page="contasPagar" sub="Pendentes" />
        <StatCard label="Contas a Receber"    value={`R$ ${totalContasReceber.toFixed(2)}`} icon="💵" color={theme.accent} page="contasReceber" sub="A receber" />
        <StatCard label="Despesas"            value={(state.despesasOperacionais || []).length} icon="📋" color={theme.warning} page="despesasOp" sub="Registros" />
        <StatCard label="Fluxo de Caixa"      value="Ver" icon="📊" color={theme.info} page="fluxoCaixa" sub="Extrato financeiro" />
      </Group>

      <Group title="📋 Cadastros & Relatórios" color={theme.gold}>
        <StatCard label="Clientes"            value={state.clientes.length}          icon="👥" color={theme.accentLight} page="clientes"        sub="Compradores cadastrados" />
        <StatCard label="Motoristas"          value={state.motoristas.length}        icon="👷" color={theme.muted}       page="motoristas"      sub="Condutores ativos" />
        <StatCard label="Rel. Motoristas"     value={romaneiosEntradaSafra.length} icon="📊" color={theme.info} page="relatorioMotoristas" sub={safraAtiva ? `Viagens — Safra ${safraAtiva}` : "Viagens e toneladas"} />
        <StatCard label="Rel. Carregamentos"  value={romaneiosSaidaSafra.length}  icon="📦" color={theme.gold}  page="relatorioCarregamentos" sub={safraAtiva ? `Carregamentos — Safra ${safraAtiva}` : "Expedições por cliente"} />
      </Group>
    </div>
  );
}

// ─── FAZENDA ──────────────────────────────────────────────────────────────────
function Fazenda({ state, setState }) {
  const fazendaAtual = state.fazenda || {};
  const [form, setForm] = useState({ ...{ nome: "", produtor: "", cpfCnpj: "", ie: "", cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "", graos: [], logo: null }, ...fazendaAtual });
  const [saved, setSaved] = useState(false);
  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleGrao = g => fp("graos", form.graos.includes(g) ? form.graos.filter(x => x !== g) : [...form.graos, g]);
  const handleLogo = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => fp("logo", ev.target.result); r.readAsDataURL(file);
  };
  const save = () => {
    const fazendaComId = { ...form, id: form.id || uid() };
    setState(s => {
      const fazendas = [...(s.fazendas || [])];
      const idx = fazendas.findIndex(f => f.id === fazendaComId.id);
      if (idx >= 0) fazendas[idx] = fazendaComId;
      else fazendas.push(fazendaComId);
      return { ...s, fazenda: fazendaComId, fazendas };
    });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };
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
function Classificacao({ state, setState, paramsKey = "classificacaoParams", title = "⚙️ Parâmetros de Classificação", subtitle = "Configure as tolerâncias por grão. Aplicadas automaticamente nos romaneios de expedição (saída).", contextLabel = "Expedição" }) {
  const available = state.fazenda?.graos || graosOpcoes;
  const [grao, setGrao] = useState(available[0]);
  const [params, setParams] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setParams(state[paramsKey]?.[grao] || {
      umRef: "", umDesc: "", umDescPesado: "",
      impRef: "", impDesc: "",
      avRef: "", avDesc: "",
    });
  }, [grao, state[paramsKey], paramsKey]);

  const fp = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const save = () => {
    setState(s => ({ ...s, [paramsKey]: { ...(s[paramsKey] || {}), [grao]: params } }));
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
      <SectionTitle>{title}</SectionTitle>
      <Card style={{ marginBottom: 14 }}>
        <p style={{ color: theme.muted, fontSize: 13, marginBottom: 14 }}>
          {subtitle} <strong style={{ color: theme.gold }}>(Contexto: {contextLabel})</strong>
        </p>
        <Field label="Grão">
          <Select value={grao} onChange={e => setGrao(e.target.value)}>
            {available.map(g => <option key={g}>{g}</option>)}
          </Select>
        </Field>
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 16, color: theme.gold, marginBottom: 18 }}>Parâmetros para: {grao} — {contextLabel}</div>

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
  const [filtroTipo, setFiltroTipo] = useState("todos"); // todos | fixo | temporario
  const [busca, setBusca] = useState("");

  const usuarios = state.usuarios || [];

  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroTipo === "fixo" && !u.isFixo) return false;
    if (filtroTipo === "temporario" && u.isFixo) return false;
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      if (!u.nome?.toLowerCase().includes(q) && !u.login?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalFixos = usuarios.filter(u => u.isFixo).length;
  const totalTemporarios = usuarios.filter(u => !u.isFixo).length;

  const openNew = () => {
    setForm({ role: "operador", nome: "", login: "", senha: "", modulos: [], tipo: "temporario" });
    setEditing(null);
    setConfirma("");
    setErroForm("");
    setShowSenha(false);
    setOpen(true);
  };

  const openEdit = u => {
    if (u.isFixo) { alert("Usuários fixos no código não podem ser editados pela interface."); return; }
    setForm({ ...u, senha: u.senha, tipo: u.tipo || "temporario" });
    setEditing(u.id);
    setConfirma(u.senha);
    setErroForm("");
    setShowSenha(false);
    setOpen(true);
  };

  const del = id => {
    const u = usuarios.find(x => x.id === id);
    if (u?.isFixo) { alert("Usuários fixos no código não podem ser excluídos."); return; }
    if (window.confirm("Excluir este usuário?"))
      setState(s => ({ ...s, usuarios: s.usuarios.filter(x => x.id !== id) }));
  };

  const save = () => {
    setErroForm("");
    if (!form.nome?.trim()) { setErroForm("Preencha o nome completo."); return; }
    if (!form.login?.trim()) { setErroForm("Preencha o login."); return; }
    if (!form.senha?.trim()) { setErroForm("Preencha a senha."); return; }
    if (form.senha.length < 4) { setErroForm("A senha deve ter pelo menos 4 caracteres."); return; }
    if (form.senha !== confirma) { setErroForm("As senhas não coincidem."); return; }

    const loginExiste = usuarios.some(u => u.login?.trim().toLowerCase() === form.login.trim().toLowerCase() && u.id !== editing);
    if (loginExiste) { setErroForm("Este login já está em uso por outro usuário."); return; }
    
    if (form.role !== "admin" && (!form.modulos || form.modulos.length === 0)) { 
      setErroForm("Selecione pelo menos um módulo de acesso para o operador."); 
      return; 
    }

    const item = { 
      ...form, 
      login: form.login.trim().toLowerCase(),
      nome: form.nome.trim(), 
      senha: form.senha.trim(),
      id: editing || uid(),
      modulos: form.role === "admin" ? [] : (form.modulos || []),
      tipo: form.tipo || "temporario",
      isFixo: false
    };
    
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

  const UserCard = ({ u }) => (
    <div style={{
      background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
      padding: 16, display: "flex", flexDirection: "column", gap: 12,
      transition: "all 0.2s", position: "relative",
      borderLeft: `3px solid ${u.isFixo ? theme.warning : u.tipo === "fixo" ? theme.accent : theme.success}`
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: u.role === "admin" ? `linear-gradient(135deg, ${theme.warning}, ${theme.gold})` : `linear-gradient(135deg, ${theme.accent}, ${theme.info})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "#fff",
            boxShadow: `0 2px 8px ${u.role === "admin" ? theme.warning : theme.accent}44`
          }}>
            {u.nome?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{u.nome}</div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: theme.muted, background: theme.bg, padding: "1px 6px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>@{u.login}</div>
          </div>
        </div>
        {!u.isFixo && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => openEdit(u)} style={{ background: `${theme.accent}18`, border: `1px solid ${theme.accent}33`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: theme.accent, fontSize: 13 }} title="Editar">✏️</button>
            <button onClick={() => del(u.id)} style={{ background: `${theme.danger}18`, border: `1px solid ${theme.danger}33`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: theme.danger, fontSize: 13 }} title="Excluir">🗑️</button>
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Badge color={u.role === "admin" ? "gold" : "blue"}>
          {u.role === "admin" ? "👑 Admin" : "👤 Operador"}
        </Badge>
        {u.isFixo ? (
          <Badge color="gold">🔒 Sistema</Badge>
        ) : u.tipo === "fixo" ? (
          <Badge color="blue">📌 Fixo</Badge>
        ) : (
          <Badge color="green">⏳ Temporário</Badge>
        )}
      </div>

      {/* Modules */}
      {u.role !== "admin" && (
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
          <div style={{ fontSize: 10, color: theme.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Módulos</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(u.modulos || []).length > 0 ? (
              (u.modulos || []).slice(0, 5).map(m => {
                const mod = modulosDisponiveis.flatMap(g => g.modulos).find(x => x.id === m);
                return <span key={m} style={{ fontSize: 9, background: `${theme.info}15`, color: theme.info, padding: "2px 6px", borderRadius: 4, border: `1px solid ${theme.info}22` }}>{mod?.label || m}</span>;
              })
            ) : (
              <span style={{ fontSize: 10, color: theme.danger }}>Nenhum módulo</span>
            )}
            {(u.modulos || []).length > 5 && <span style={{ fontSize: 9, color: theme.muted }}>+{(u.modulos || []).length - 5}</span>}
          </div>
        </div>
      )}
      {u.role === "admin" && (
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
          <span style={{ fontSize: 10, color: theme.accent, fontWeight: 600 }}>🌟 Acesso completo a todos os módulos</span>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Usuário</Btn>}>👥 Usuários do Sistema</SectionTitle>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total", value: usuarios.length, icon: "👥", color: theme.accent },
          { label: "Sistema", value: totalFixos, icon: "🔒", color: theme.warning },
          { label: "Fixos", value: usuarios.filter(u => !u.isFixo && u.tipo === "fixo").length, icon: "📌", color: theme.info },
          { label: "Temporários", value: totalTemporarios, icon: "⏳", color: theme.success },
        ].map((s, i) => (
          <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: theme.muted, fontWeight: 600, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info */}
      <Card style={{ marginBottom: 16, background: `${theme.info}0a`, borderColor: `${theme.info}33` }}>
        <p style={{ color: theme.muted, fontSize: 12, lineHeight: 1.5 }}>
          ℹ️ <strong style={{ color: theme.warning }}>Sistema</strong> = embutidos no projeto. <strong style={{ color: theme.info }}>Fixos</strong> = permanecem salvos no navegador. <strong style={{ color: theme.success }}>Temporários</strong> = podem ser removidos a qualquer momento.
        </p>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="🔍 Buscar por nome ou login..."
              style={{
                width: "100%", background: theme.bg, border: `1px solid ${theme.border}`,
                color: theme.text, padding: "8px 12px", borderRadius: 8,
                fontFamily: "inherit", fontSize: 12, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { k: "todos", l: "Todos", c: usuarios.length },
              { k: "fixo", l: "Fixos/Sistema", c: usuarios.filter(u => u.isFixo || u.tipo === "fixo").length },
              { k: "temporario", l: "Temporários", c: totalTemporarios },
            ].map(f => (
              <button key={f.k} onClick={() => setFiltroTipo(f.k)} style={{
                padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600,
                border: filtroTipo === f.k ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                background: filtroTipo === f.k ? `${theme.accent}22` : "transparent",
                color: filtroTipo === f.k ? theme.accentLight : theme.muted,
                fontFamily: "inherit"
              }}>
                {f.l} ({f.c})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* User Grid */}
      {usuariosFiltrados.length === 0 ? (
        <Card><EmptyState icon="👥" text="Nenhum usuário encontrado." /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {usuariosFiltrados.map(u => <UserCard key={u.id} u={u} />)}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "✏️ Editar" : "➕ Novo"} Usuário`}>
        {/* Personal Info Section */}
        <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>📋 Dados Pessoais</div>
          <Field label="Nome Completo">
            <Input value={form.nome} onChange={e => fp("nome", e.target.value)} placeholder="Ex: João da Silva" />
          </Field>
          <Field label="Login">
            <Input value={form.login} onChange={e => fp("login", e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="Ex: joao.silva" />
          </Field>
        </div>

        {/* Security Section */}
        <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>🔐 Segurança</div>
          <Row>
            {senhaInput("Senha", form.senha || "", e => fp("senha", e.target.value))}
            {senhaInput("Confirmar Senha", confirma, e => setConfirma(e.target.value))}
          </Row>
        </div>

        {/* Config Section */}
        <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>⚙️ Configurações</div>
          
          <Row>
            <Field label="Nível de Acesso">
              <Select value={form.role || "operador"} onChange={e => { fp("role", e.target.value); if (e.target.value === "admin") fp("modulos", []); }}>
                <option value="operador">👤 Operador</option>
                <option value="admin">👑 Administrador</option>
              </Select>
            </Field>
            <Field label="Tipo de Usuário">
              <Select value={form.tipo || "temporario"} onChange={e => fp("tipo", e.target.value)}>
                <option value="fixo">📌 Fixo (permanente)</option>
                <option value="temporario">⏳ Temporário (local)</option>
              </Select>
            </Field>
          </Row>

          <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, fontSize: 11, lineHeight: 1.5, color: theme.muted, background: `${form.tipo === "fixo" ? theme.info : theme.success}0a`, border: `1px solid ${form.tipo === "fixo" ? theme.info : theme.success}22` }}>
            {form.tipo === "fixo"
              ? "📌 Usuário fixo permanece salvo no sistema e não será removido automaticamente."
              : "⏳ Usuário temporário pode ser removido a qualquer momento pelo administrador."}
          </div>
        </div>

        {form.role !== "admin" && (
          <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>🔒 Módulos e Submódulos com Acesso</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => fp("modulos", [...todosModuloIds])} style={{ background: `${theme.accent}22`, color: theme.accentLight, border: `1px solid ${theme.accent}44`, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✅ Marcar Todos</button>
              <button onClick={() => fp("modulos", [])} style={{ background: `${theme.danger}18`, color: theme.danger, border: `1px solid ${theme.danger}44`, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>❌ Desmarcar Todos</button>
            </div>
            <div style={{ maxHeight: 350, overflowY: "auto" }}>
              {modulosDisponiveis.map(grupo => (
                <div key={grupo.grupo} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: theme.gold, marginBottom: 6 }}>{grupo.grupo}</div>
                  {grupo.modulos.map(mod => {
                    const checked = (form.modulos || []).includes(mod.id);
                    const subIds = (mod.submodulos || []).map(s => s.id);
                    const allSubsChecked = subIds.length > 0 && subIds.every(sid => (form.modulos || []).includes(sid));
                    return (
                      <div key={mod.id} style={{ marginBottom: 8 }}>
                        <button onClick={() => {
                          const cur = form.modulos || [];
                          if (checked) {
                            fp("modulos", cur.filter(m => m !== mod.id && !subIds.includes(m)));
                          } else {
                            fp("modulos", [...new Set([...cur, mod.id, ...subIds])]);
                          }
                        }} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", border: checked ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`, background: checked ? `${theme.accent}28` : "transparent", color: checked ? theme.accentLight : theme.muted, fontSize: 12, fontWeight: 700 }}>
                          {checked ? "✅" : "⬜"} {mod.label}
                        </button>
                        {checked && mod.submodulos && mod.submodulos.length > 0 && (
                          <div style={{ marginLeft: 20, marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                            <button onClick={() => {
                              const cur = form.modulos || [];
                              if (allSubsChecked) {
                                fp("modulos", cur.filter(m => !subIds.includes(m)));
                              } else {
                                fp("modulos", [...new Set([...cur, ...subIds])]);
                              }
                            }} style={{ padding: "3px 8px", borderRadius: 5, cursor: "pointer", border: `1px solid ${theme.border}`, background: allSubsChecked ? `${theme.info}18` : "transparent", color: theme.info, fontSize: 10, fontWeight: 600 }}>
                              {allSubsChecked ? "☑️ Todos" : "☐ Todos"}
                            </button>
                            {mod.submodulos.filter(sub => !sub.adminOnly).map(sub => {
                              const subChecked = (form.modulos || []).includes(sub.id);
                              return (
                                <button key={sub.id} onClick={() => {
                                  const cur = form.modulos || [];
                                  fp("modulos", subChecked ? cur.filter(m => m !== sub.id) : [...cur, sub.id]);
                                }} style={{
                                  padding: "3px 10px", borderRadius: 5, cursor: "pointer",
                                  border: subChecked ? `1px solid ${theme.accent}88` : `1px solid ${theme.border}`,
                                  background: subChecked ? `${theme.accent}15` : "transparent",
                                  color: subChecked ? theme.accentLight : theme.muted,
                                  fontSize: 10, fontWeight: 500
                                }}>
                                  {subChecked ? "✅" : "⬜"} {sub.label}
                                </button>
                              );
                            })}
                            {mod.submodulos.filter(sub => sub.adminOnly).map(sub => (
                              <span key={sub.id} title="Disponível apenas para administradores" style={{
                                padding: "3px 10px", borderRadius: 5,
                                border: `1px dashed ${theme.gold}66`,
                                background: `${theme.gold}10`,
                                color: theme.gold,
                                fontSize: 10, fontWeight: 600,
                                display: "inline-flex", alignItems: "center", gap: 4
                              }}>👑 {sub.label} (Admin)</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {erroForm && <div style={{ background: `${theme.danger}18`, border: `1px solid ${theme.danger}44`, borderRadius: 8, padding: 10, marginTop: 8, color: theme.danger, fontSize: 13 }}>⚠️ {erroForm}</div>}

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
function Contratos({ state, setState, safraAtiva }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const todosContratos = state.contratos || [];
  // Filtra por safra ativa (contratos sem safra aparecem só em "todas" / legado)
  const contratos = safraAtiva ? todosContratos.filter(c => c.safra === safraAtiva) : todosContratos;
  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ status: "Ativo", safra: safraAtiva || "" }); setEditing(null); setOpen(true); };
  const openEdit = c => { setForm({ ...c }); setEditing(c.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, contratos: s.contratos.filter(c => c.id !== id) }));
  const save = () => {
    const c = {
      ...form,
      safra: form.safra || safraAtiva || "",
      id: editing || uid(),
      numero: editing ? form.numero : `CT-${padNum(todosContratos.length + 1)}`,
    };
    setState(s => ({ ...s, contratos: editing ? s.contratos.map(x => x.id === editing ? c : x) : [...s.contratos, c] }));
    setOpen(false);
  };
  const statusColor = { Ativo: "green", Encerrado: "red", Pendente: "gold" };
  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Contrato</Btn>}>📋 Contratos</SectionTitle>
      {safraAtiva && (
        <div style={{ marginBottom: 12, padding: "8px 14px", background: `${theme.gold}12`, border: `1px solid ${theme.gold}33`, borderRadius: 8, fontSize: 12, color: theme.gold, fontWeight: 600 }}>
          🌾 Exibindo contratos da safra <strong>{safraAtiva}</strong> ({contratos.length} {contratos.length === 1 ? "contrato" : "contratos"})
        </div>
      )}
      <Card>
        {contratos.length === 0 ? <EmptyState icon="📋" text={safraAtiva ? `Nenhum contrato cadastrado para a safra ${safraAtiva}.` : "Nenhum contrato cadastrado."} /> : (
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
    setCulturas(t.culturas?.length > 0 ? t.culturas.map(c => ({ ...c, id: c.id || uid(), area: String(c.area ?? "") })) : [{ id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]);
    setEditing(t.id); setOpen(false); setSaved(false); setTimeout(() => setOpen(true), 10);
  };
  const addCultura = () => setCulturas(prev => [...prev, { id: uid(), grao: graosDisponiveis[0] || "Soja", area: "", obs: "" }]);
  const removeCultura = (cid) => setCulturas(prev => prev.filter(c => c.id !== cid));
  const updateCultura = useCallback((cid, field, value) => {
    setCulturas(prev => prev.map(c => c.id === cid ? { ...c, [field]: value } : c));
  }, []);
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

  const [filtroTalhoes, setFiltroTalhoes] = useState([]);
  const [filtroCultura, setFiltroCultura] = useState("");
  const [filtroSafra, setFiltroSafra] = useState("");
  const [buscaTalhao, setBuscaTalhao] = useState("");
  const [buscaTalhaoOpen, setBuscaTalhaoOpen] = useState(false);

  const talhoesLista = [...new Set(talhoes.map(t => t.nome))].sort();
  const culturasLista = [...new Set(talhoes.flatMap(t => (t.culturas || []).map(c => c.grao)).filter(Boolean))].sort();
  const safrasLista = [...new Set(talhoes.flatMap(t => (t.culturas || []).map(c => c.safra)).filter(Boolean))].sort();

  const talhoesFiltrados = talhoesLista.filter(t => t.toLowerCase().includes(buscaTalhao.toLowerCase()));

  const toggleTalhao = (nome) => {
    setFiltroTalhoes(prev => prev.includes(nome) ? prev.filter(t => t !== nome) : [...prev, nome]);
  };
  const selecionarTodos = () => setFiltroTalhoes(talhoesLista);
  const limparTalhoes = () => setFiltroTalhoes([]);

  const produtividadePorTalhao = {};

  romaneiosEntrada.forEach(rom => {
    if (!rom.talhao) return;
    const talhaoInfo = talhoes.find(t => t.nome === rom.talhao);
    if (!talhaoInfo) return;
    if (filtroTalhoes.length > 0 && !filtroTalhoes.includes(rom.talhao)) return;
    if (filtroCultura && rom.grao !== filtroCultura) return;
    if (filtroSafra) {
      const cultInfo = (talhaoInfo.culturas || []).find(c => c.grao === rom.grao);
      if (!cultInfo || cultInfo.safra !== filtroSafra) return;
    }

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

  const imprimirRelatorio = (modo) => {
    const fazendaNome = (state.fazenda && state.fazenda.nome) || "Fazenda";
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const horaAtual = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const filtrosAtivos = [];
    if (filtroTalhoes.length > 0) filtrosAtivos.push(`Talhões: ${filtroTalhoes.join(", ")}`);
    else filtrosAtivos.push("Talhões: Todos");
    if (filtroCultura) filtrosAtivos.push(`Cultura: ${filtroCultura}`);
    if (filtroSafra) filtrosAtivos.push(`Safra: ${filtroSafra}`);

    let totalGeralKg = 0, totalGeralSc = 0, totalGeralArea = 0;
    const porCultura = {};
    Object.values(produtividadePorTalhao).forEach(d => {
      totalGeralKg += d.totalKg;
      totalGeralSc += d.totalSacas;
      totalGeralArea += d.area;
      Object.entries(d.porGrao).forEach(([g, info]) => {
        if (!porCultura[g]) porCultura[g] = { area: 0, kg: 0, sacas: 0 };
        porCultura[g].area += parseFloat(info.areaCultura) || 0;
        porCultura[g].kg += info.kg;
        porCultura[g].sacas += info.sacas;
      });
    });
    const linhasCultura = Object.entries(porCultura).map(([g, v]) => {
      const media = v.area > 0 ? (v.sacas / v.area).toFixed(1) : "0.0";
      return `
        <tr>
          <td><strong>${g}</strong></td>
          <td style="text-align:right">${v.area.toLocaleString("pt-BR")}</td>
          <td style="text-align:right">${Math.round(v.kg).toLocaleString("pt-BR")}</td>
          <td style="text-align:right">${Math.round(v.sacas).toLocaleString("pt-BR")}</td>
          <td style="text-align:right;color:#16a34a;font-weight:800;font-family:monospace">${media}</td>
        </tr>`;
    }).join("");

    const linhasTalhoes = Object.entries(produtividadePorTalhao).map(([nome, d]) => {
      const linhasGrao = Object.entries(d.porGrao).map(([g, info]) => `
        <tr>
          <td>${g}</td>
          <td style="text-align:right">${(info.areaCultura || 0).toLocaleString("pt-BR")}</td>
          <td style="text-align:right">${Math.round(info.kg).toLocaleString("pt-BR")}</td>
          <td style="text-align:right">${Math.round(info.sacas).toLocaleString("pt-BR")}</td>
          <td style="text-align:right"><strong>${info.produtividade}</strong></td>
        </tr>
      `).join("");
      return `
        <div class="talhao">
          <div class="talhao-header">
            <div>
              <div class="talhao-nome">🗺️ ${nome}</div>
              <div class="talhao-meta">Área: <b>${d.area} ha</b> · Total: <b>${Math.round(d.totalKg).toLocaleString("pt-BR")} kg</b> (${Math.round(d.totalSacas).toLocaleString("pt-BR")} sc)</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Grão</th><th>Área (ha)</th><th>Total (kg)</th><th>Total (sc)</th><th>Prod. (sc/ha)</th></tr></thead>
            <tbody>${linhasGrao}</tbody>
          </table>
        </div>
      `;
    }).join("");

    const faz = state.fazenda || {};
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Produtividade por Talhão — ${fazendaNome}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @page { size: A4 portrait; margin: 0.8cm 1cm; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #f1f5f9; padding: 12px; font-size: 10px; color: #1e293b; }
        .page { max-width: 190mm; margin: 0 auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; box-shadow: 0 1px 3px rgba(0,0,0,.07); }
        .via-label { text-align:center; font-size:7.5px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#166534; background:#dcfce7; border:1px solid #86efac; border-radius:20px; padding:3px 14px; display:inline-block; margin-bottom:8px; }
        .cabecalho { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f172a; padding-bottom:8px; margin-bottom:10px; gap:10px; }
        .cab-esquerda { display:flex; align-items:center; gap:10px; }
        .logo { width:42px; height:42px; object-fit:contain; border-radius:5px; }
        .logo-placeholder { width:42px; height:42px; background:#f0fdf4; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:22px; border:1px solid #bbf7d0; }
        .faz-nome { font-size:12px; font-weight:900; color:#0f172a; }
        .faz-sub { font-size:8px; color:#475569; margin-top:1px; line-height:1.4; }
        .cab-direita { text-align:right; flex-shrink:0; }
        .tipo-badge { font-size:7px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:3px 10px; border-radius:20px; display:inline-block; margin-bottom:4px; background:#dcfce7; color:#166534; border:1px solid #86efac; }
        .doc-titulo { font-size:14px; font-weight:900; color:#0f172a; line-height:1; margin-top:2px; }
        .doc-data { font-size:8px; color:#64748b; margin-top:3px; }
        .sec-title { font-size:7px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#166534; background:#f0fdf4; border-left:3px solid #16a34a; padding:4px 8px; margin:8px 0 6px; border-radius:0 3px 3px 0; }
        .filtros { background:#f8fafc; border:1px solid #e2e8f0; border-radius:5px; padding:6px 10px; font-size:8.5px; color:#334155; margin-bottom:6px; }
        .filtros b { color:#0f172a; }
        .resumo { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:8px; }
        .resumo .card { background:#fff; border:1px solid #e2e8f0; border-radius:5px; padding:7px 8px; text-align:center; }
        .resumo .card .label { font-size:6.5px; color:#64748b; text-transform:uppercase; letter-spacing:1px; font-weight:700; }
        .resumo .card .valor { font-size:13px; font-weight:900; color:#16a34a; margin-top:3px; font-family:monospace; }
        .talhao { border:1px solid #e2e8f0; border-radius:5px; margin-bottom:8px; overflow:hidden; page-break-inside:avoid; }
        .talhao-header { background:#f8fafc; padding:6px 10px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; }
        .talhao-nome { font-weight:800; font-size:10px; color:#0f172a; }
        .talhao-meta { font-size:8px; color:#64748b; margin-top:2px; }
        .prod-badge { font-size:14px; font-weight:900; color:#16a34a; font-family:monospace; }
        .prod-badge span { font-size:8px; color:#64748b; font-weight:600; font-family:'Inter',sans-serif; }
        table { width:100%; border-collapse:collapse; font-size:8.5px; }
        thead th { background:#1e293b; color:#fff; padding:4px 8px; text-align:left; text-transform:uppercase; font-size:6.5px; letter-spacing:1px; font-weight:700; }
        tbody td { padding:4px 8px; border:1px solid #e2e8f0; font-size:8px; color:#1e293b; }
        tbody tr:nth-child(even) td { background:#f8fafc; }
        .via-footer { text-align:center; font-size:6px; color:#94a3b8; margin-top:8px; border-top:1px solid #f1f5f9; padding-top:5px; }
        @media print { body { background:#fff; padding:0; } .page { max-width:100%; box-shadow:none; border:none; padding:0; } }
      </style></head><body>
      <div class="page">
        <div class="via-label">RELATÓRIO DE PRODUTIVIDADE</div>
        <div class="cabecalho">
          <div class="cab-esquerda">
            ${faz.logo ? `<img src="${faz.logo}" class="logo" alt="logo"/>` : `<div class="logo-placeholder">🌾</div>`}
            <div>
              <div class="faz-nome">${faz.nome || "FAZENDA"}</div>
              <div class="faz-sub">Produtor: <strong>${faz.produtor || "—"}</strong></div>
              <div class="faz-sub">CNPJ/CPF: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div>
              <div class="faz-sub">${faz.endereco || ""} ${faz.numero || ""}, ${faz.cidade || ""}/${faz.estado || ""}</div>
            </div>
          </div>
          <div class="cab-direita">
            <div class="tipo-badge">PRODUTIVIDADE</div>
            <div class="doc-titulo">📈 POR TALHÃO</div>
            <div class="doc-data">${dataAtual} · ${horaAtual}</div>
          </div>
        </div>

        <div class="sec-title">FILTROS APLICADOS</div>
        <div class="filtros">${filtrosAtivos.join(" &nbsp;·&nbsp; ")}</div>

        <div class="sec-title">RESUMO GERAL</div>
        <div class="resumo">
          <div class="card"><div class="label">Talhões</div><div class="valor">${Object.keys(produtividadePorTalhao).length}</div></div>
          <div class="card"><div class="label">Culturas</div><div class="valor">${Object.keys(porCultura).length}</div></div>
          <div class="card"><div class="label">Área Total</div><div class="valor">${totalGeralArea.toLocaleString("pt-BR")} <span style="font-size:8px;color:#64748b;font-family:Inter">ha</span></div></div>
          <div class="card"><div class="label">Total Sacas</div><div class="valor">${Math.round(totalGeralSc).toLocaleString("pt-BR")}</div></div>
        </div>

        <div class="sec-title">DETALHAMENTO POR TALHÃO <span style="font-weight:600;color:#64748b;text-transform:none;letter-spacing:0;font-size:6.5px">(média individual de cada talhão)</span></div>
        ${linhasTalhoes || '<p style="text-align:center;color:#94a3b8;padding:30px">Nenhum dado para exibir.</p>'}

        <div class="sec-title">MÉDIA GERAL POR CULTURA <span style="font-weight:600;color:#64748b;text-transform:none;letter-spacing:0;font-size:6.5px">(soma das áreas e sacas de todos os talhões)</span></div>
        <table>
          <thead><tr><th>Cultura</th><th style="text-align:right">Área Total (ha)</th><th style="text-align:right">Total (kg)</th><th style="text-align:right">Total (sc)</th><th style="text-align:right">Média (sc/ha)</th></tr></thead>
          <tbody>${linhasCultura || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:14px">Sem dados</td></tr>'}</tbody>
        </table>

        <div class="via-footer">AgriGest · Produtividade por Talhão · Emitido em ${new Date().toLocaleString("pt-BR")}</div>
      </div>
      </body></html>`;

    if (modo === "pdf") {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (w) {
        w.onload = () => { setTimeout(() => { w.print(); }, 300); };
      }
    } else {
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.print(); }, 300);
      }
    }
  };

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
      <Card style={{ marginBottom: 20, padding: 0, overflow: "hidden", border: `1px solid ${theme.border}` }}>
        {/* Cabeçalho */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${theme.border}`, background: theme.surface, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${theme.accent}15`, border: `1px solid ${theme.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔍</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, letterSpacing: ".2px" }}>Filtros do Relatório</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 3, textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600 }}>Refine os dados exibidos abaixo</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, padding: "6px 12px", background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 11, color: theme.muted, fontWeight: 600 }}>
              <span style={{ color: theme.accent, fontWeight: 800 }}>{filtroTalhoes.length || talhoesLista.length}</span>
              <span>de</span>
              <span style={{ fontWeight: 700 }}>{talhoesLista.length}</span>
              <span>talhões</span>
            </div>
            <button onClick={() => { limparTalhoes(); setFiltroCultura(""); setFiltroSafra(""); setBuscaTalhao(""); }} style={{ background: "transparent", color: theme.muted, border: `1px solid ${theme.border}`, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>↻</span> Limpar tudo
            </button>
            <button onClick={() => imprimirRelatorio("imprimir")} style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🖨️</span> Imprimir
            </button>
            <button onClick={() => imprimirRelatorio("pdf")} style={{ background: theme.accent, color: "#fff", border: `1px solid ${theme.accent}`, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: `0 2px 8px ${theme.accent}40` }}>
              <span style={{ fontSize: 14 }}>📄</span> Salvar PDF
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <label style={labelStyle}>Talhão {filtroTalhoes.length > 0 && <span style={{ color: theme.accent, marginLeft: 4, fontWeight: 800 }}>· {filtroTalhoes.length}</span>}</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: .6, pointerEvents: "none" }}>🔎</span>
                <input
                  value={buscaTalhao}
                  onChange={e => setBuscaTalhao(e.target.value)}
                  onFocus={() => setBuscaTalhaoOpen(true)}
                  onBlur={() => setTimeout(() => setBuscaTalhaoOpen(false), 200)}
                  placeholder="Buscar talhão..."
                  style={{ ...selectStyle, paddingLeft: 36, paddingRight: 36 }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: theme.muted, opacity: .7, pointerEvents: "none" }}>▾</span>
              </div>
              {buscaTalhaoOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, maxHeight: 280, overflowY: "auto", zIndex: 30, boxShadow: "0 12px 32px rgba(0,0,0,.35)" }}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); filtroTalhoes.length === talhoesLista.length ? limparTalhoes() : selecionarTodos(); }}
                    style={{ width: "100%", textAlign: "left", padding: "11px 14px", background: filtroTalhoes.length === talhoesLista.length ? `${theme.accent}14` : "transparent", border: "none", borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${theme.accent}`, background: filtroTalhoes.length === talhoesLista.length ? theme.accent : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
                      {filtroTalhoes.length === talhoesLista.length && "✓"}
                    </span>
                    Selecionar todos os talhões
                    <span style={{ marginLeft: "auto", fontSize: 11, color: theme.muted, fontWeight: 600 }}>{talhoesLista.length}</span>
                  </button>
                  {talhoesFiltrados.length === 0 && (
                    <div style={{ color: theme.muted, fontSize: 12, padding: 14, textAlign: "center" }}>Nenhum talhão encontrado</div>
                  )}
                  {talhoesFiltrados.map(t => {
                    const ativo = filtroTalhoes.includes(t);
                    return (
                      <button
                        key={t}
                        onMouseDown={(e) => { e.preventDefault(); toggleTalhao(t); }}
                        style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: ativo ? `${theme.accent}10` : "transparent", border: "none", color: theme.text, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <span style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${ativo ? theme.accent : theme.border}`, background: ativo ? theme.accent : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
                          {ativo && "✓"}
                        </span>
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Cultura</label>
              <select value={filtroCultura} onChange={e => setFiltroCultura(e.target.value)} style={selectStyle}>
                <option value="">Todas as culturas</option>
                {culturasLista.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Safra</label>
              <select value={filtroSafra} onChange={e => setFiltroSafra(e.target.value)} style={selectStyle}>
                <option value="">Todas as safras</option>
                {safrasLista.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Chips de selecionados */}
          {(filtroTalhoes.length > 0 || filtroCultura || filtroSafra) && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px dashed ${theme.border}` }}>
              <div style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 10 }}>Filtros ativos</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {filtroCultura && (
                  <span style={{ background: `${theme.info}18`, color: theme.info, border: `1px solid ${theme.info}40`, padding: "5px 10px 5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    🌾 {filtroCultura}
                    <button onClick={() => setFiltroCultura("")} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, opacity: .7 }}>×</button>
                  </span>
                )}
                {filtroSafra && (
                  <span style={{ background: `${theme.warning}18`, color: theme.warning, border: `1px solid ${theme.warning}40`, padding: "5px 10px 5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    📅 {filtroSafra}
                    <button onClick={() => setFiltroSafra("")} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, opacity: .7 }}>×</button>
                  </span>
                )}
                {filtroTalhoes.map(t => (
                  <span key={t} style={{ background: `${theme.accent}18`, color: theme.accent, border: `1px solid ${theme.accent}40`, padding: "5px 10px 5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    🗺️ {t}
                    <button onClick={() => toggleTalhao(t)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, opacity: .7 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
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
function RomaneiosEntrada({ state, setState, safraAtiva }) {
  return <RomaneiosGeneric state={state} setState={setState} tipo="Entrada" safraAtiva={safraAtiva} />;
}

// ─── ROMANEIOS DE SAÍDA ───────────────────────────────────────────────────────
function RomaneiosSaida({ state, setState, safraAtiva }) {
  return <RomaneiosGeneric state={state} setState={setState} tipo="Saída" safraAtiva={safraAtiva} />;
}

// ─── ROMANEIOS GENÉRICO ──────────────────────────────────────────────────────
function RomaneiosGeneric({ state, setState, tipo, safraAtiva }) {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtroGrao, setFiltroGrao] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");
  const key = tipo === "Entrada" ? "romaneiosEntrada" : "romaneiosSaida";
  const lixeiraKey = tipo === "Entrada" ? "romaneiosEntradaLixeira" : "romaneiosSaidalixeira";
  const allItems = state[key] || [];
  const semSafra = allItems.filter(r => !r.safra);
  const itemsBase = safraAtiva ? allItems.filter(r => r.safra === safraAtiva) : allItems;
  const isEntradaList = tipo === "Entrada";
  const items = itemsBase.filter(r =>
    (!filtroGrao || r.grao === filtroGrao) &&
    (isEntradaList || !filtroCliente || r.cliente === filtroCliente) &&
    (isEntradaList || !filtroContrato || r.contrato === filtroContrato)
  );
  const graosDisponiveis = state.fazenda?.graos || Array.from(new Set(allItems.map(r => r.grao).filter(Boolean)));
  const clientesDisponiveis = Array.from(new Set(itemsBase.map(r => r.cliente).filter(Boolean)));
  const contratosDisponiveis = Array.from(new Set(itemsBase.filter(r => !filtroCliente || r.cliente === filtroCliente).map(r => r.contrato).filter(Boolean)));
  const paramsFiltro = filtroGrao ? (isEntradaList ? state.classificacaoRecepcaoParams : state.classificacaoParams)?.[filtroGrao] || {} : null;

  const atribuirSafraAtiva = () => {
    if (!safraAtiva) return;
    if (!window.confirm(`Atribuir ${semSafra.length} registro(s) sem safra à safra ${safraAtiva}?`)) return;
    setState(s => ({
      ...s,
      [key]: (s[key] || []).map(r => r.safra ? r : { ...r, safra: safraAtiva })
    }));
  };

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
      safra: safraAtiva || safrasOpcoes[0],
    };

    if (!isEntrada) {
      baseFields.cliente = "";
      baseFields.contrato = "";
    }

    const [form, setForm] = useState(item || baseFields);
    const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const paramsSource = isEntrada ? state.classificacaoRecepcaoParams : state.classificacaoParams;
    const p = paramsSource?.[form.grao] || {};
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
            <div style={{ fontWeight: 700, color: theme.gold, fontSize: 13 }}>
              ⚖️ Classificação <span style={{ color: theme.muted, fontWeight: 500, fontSize: 11 }}>· Grão: <strong style={{ color: theme.accent }}>{form.grao || "—"}</strong></span>
            </div>
            <Badge color={isEntrada ? "blue" : "gold"}>
              {isEntrada ? "📥 Tabela: Recepção" : "📤 Tabela: Expedição"}
            </Badge>
          </div>
          {Object.keys(p).length === 0 && (
            <div style={{ background: `${theme.danger}15`, border: `1px solid ${theme.danger}55`, color: theme.danger, padding: "8px 12px", borderRadius: 8, fontSize: 11, marginBottom: 12 }}>
              ⚠️ Não há parâmetros de classificação cadastrados para <strong>{form.grao}</strong> na tabela de <strong>{isEntrada ? "Recepção" : "Expedição"}</strong>. Cadastre em <em>Grãos → {isEntrada ? "Classificação - Recepção" : "Classificação"}</em>.
            </div>
          )}
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
      {safraAtiva && (
        <div style={{ marginBottom: 12, padding: "8px 14px", background: `${theme.gold}12`, border: `1px solid ${theme.gold}33`, borderRadius: 8, fontSize: 12, color: theme.gold, fontWeight: 600 }}>
          🌾 Exibindo registros da safra <strong>{safraAtiva}</strong> ({items.length} {items.length === 1 ? "registro" : "registros"})
        </div>
      )}
      {safraAtiva && semSafra.length > 0 && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: "#f59e0b22", border: "1px solid #f59e0b66", borderRadius: 8, fontSize: 12, color: "#f59e0b", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span>⚠️ Existem {semSafra.length} registro(s) antigo(s) sem safra atribuída — não aparecem em nenhum filtro de safra.</span>
          <Btn onClick={atribuirSafraAtiva}>Atribuir à safra {safraAtiva}</Btn>
        </div>
      )}
      {graosDisponiveis.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>🔎 Filtrar por grão</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Select value={filtroGrao} onChange={e => setFiltroGrao(e.target.value)}>
                <option value="">Todos os grãos ({itemsBase.length})</option>
                {graosDisponiveis.map(g => {
                  const qtd = itemsBase.filter(r => r.grao === g).length;
                  return <option key={g} value={g}>{g} ({qtd})</option>;
                })}
              </Select>
            </div>
            {filtroGrao && (
              <Btn size="sm" variant="secondary" onClick={() => setFiltroGrao("")}>✖ Limpar</Btn>
            )}
          </div>
          {!isEntradaList && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>👤 Cliente</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Select value={filtroCliente} onChange={e => { setFiltroCliente(e.target.value); setFiltroContrato(""); }}>
                    <option value="">Todos os clientes ({clientesDisponiveis.length})</option>
                    {clientesDisponiveis.map(c => {
                      const qtd = itemsBase.filter(r => r.cliente === c).length;
                      return <option key={c} value={c}>{c} ({qtd})</option>;
                    })}
                  </Select>
                  {filtroCliente && <Btn size="sm" variant="secondary" onClick={() => { setFiltroCliente(""); setFiltroContrato(""); }}>✖</Btn>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>📄 Contrato</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Select value={filtroContrato} onChange={e => setFiltroContrato(e.target.value)}>
                    <option value="">Todos os contratos ({contratosDisponiveis.length})</option>
                    {contratosDisponiveis.map(c => {
                      const qtd = itemsBase.filter(r => r.contrato === c && (!filtroCliente || r.cliente === filtroCliente)).length;
                      return <option key={c} value={c}>{c} ({qtd})</option>;
                    })}
                  </Select>
                  {filtroContrato && <Btn size="sm" variant="secondary" onClick={() => setFiltroContrato("")}>✖</Btn>}
                </div>
              </div>
            </div>
          )}
          {filtroGrao && (
            <div style={{ marginTop: 12, padding: 12, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                <strong style={{ color: theme.gold, fontSize: 12 }}>⚖️ Parâmetros de Classificação - {isEntradaList ? "Recepção" : "Expedição"} · {filtroGrao}</strong>
                <Badge color={isEntradaList ? "blue" : "gold"}>{isEntradaList ? "📥 Tabela: Recepção" : "📤 Tabela: Expedição"}</Badge>
              </div>
              {Object.keys(paramsFiltro).length === 0 ? (
                <div style={{ color: theme.danger, fontSize: 11 }}>⚠️ Nenhum parâmetro cadastrado para <strong>{filtroGrao}</strong> em Classificação - {isEntradaList ? "Recepção" : "Expedição"}.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
                  <div style={{ padding: 8, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>Umidade Ref.</div>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{paramsFiltro.umRef ?? "—"}%</div>
                    <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>Desconto: {paramsFiltro.umDesc ?? "—"}% · Pesado: {paramsFiltro.umDescPesado ?? "—"}%</div>
                  </div>
                  <div style={{ padding: 8, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>Impureza Ref.</div>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{paramsFiltro.impRef ?? "—"}%</div>
                    <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>Desconto: {paramsFiltro.impDesc ?? "—"}%</div>
                  </div>
                  <div style={{ padding: 8, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>Avariado Ref.</div>
                    <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{paramsFiltro.avRef ?? "—"}%</div>
                    <div style={{ fontSize: 10, color: theme.muted, marginTop: 2 }}>Desconto: {paramsFiltro.avDesc ?? "—"}%</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="📄" text={safraAtiva ? `Nenhum ${tipo === "Entrada" ? "recebimento" : "expedição"} registrado para a safra ${safraAtiva}.` : `Nenhum ${tipo === "Entrada" ? "recebimento" : "expedição"} de grãos registrado.`} />
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
const EXPEDICAO_CAMPOS_OBRIGATORIOS = ["data", "contrato", "cliente", "grao", "romaneio"];
const EXPEDICAO_CAMPOS_LABELS = {
  data: "Data",
  contrato: "Contrato",
  cliente: "Cliente",
  grao: "Grão",
  romaneio: "Romaneio",
  status: "Status",
  pesoBruto: "Peso Bruto",
  pesoTara: "Peso Tara",
  pesoLiquido: "Peso Líquido",
  umidade: "Umidade (%)",
  impureza: "Impureza (%)",
  avariado: "Avariado (%)",
};

const EXPEDICAO_CAMPOS_NUMERICOS = ["pesoBruto", "pesoTara", "pesoLiquido", "umidade", "impureza", "avariado"];

// Normaliza chaves do cabeçalho da planilha (case/acento-insensitive) para os nomes internos
const _normHeader = (h) =>
  String(h || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const EXPEDICAO_HEADER_ALIASES = {
  data: "data",
  contrato: "contrato",
  "nº contrato": "contrato",
  "n contrato": "contrato",
  cliente: "cliente",
  grao: "grao",
  "grão": "grao",
  romaneio: "romaneio",
  "romaneio de saida": "romaneio",
  "romaneio de saída": "romaneio",
  status: "status",
  "peso bruto": "pesoBruto",
  "pesobruto": "pesoBruto",
  "peso tara": "pesoTara",
  "pesotara": "pesoTara",
  "tara": "pesoTara",
  "peso liquido": "pesoLiquido",
  "peso líquido": "pesoLiquido",
  "pesoliquido": "pesoLiquido",
  "liquido": "pesoLiquido",
  "umidade": "umidade",
  "umidade (%)": "umidade",
  "impureza": "impureza",
  "impureza (%)": "impureza",
  "impurezas": "impureza",
  "avariado": "avariado",
  "avariados": "avariado",
  "avariado (%)": "avariado",
};

// Converte número de planilha aceitando vírgula decimal e símbolos como "%"/"kg"
const _excelNumber = (v) => {
  if (v == null || v === "") return "";
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d,.\-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (s === "" || s === "-" || s === ".") return "";
  const n = Number(s);
  return isNaN(n) ? "" : n;
};

// Converte uma data textual ("dd/mm/aaaa", "yyyy-mm-dd"...) para "YYYY-MM-DD"
const _excelDateToISO = (v) => {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // dd/mm/yyyy
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    let [, d, m, y] = br;
    if (y.length === 2) y = "20" + y;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
};

// ─── PARSER CSV NATIVO ───────────────────────────────────────────────────────
// Suporta separador "," ou ";" (auto-detectado), aspas duplas com escape ("")
// e quebras de linha CRLF/LF. Retorna array de objetos com cabeçalho da 1ª linha.
const parseCSV = (text) => {
  // Remove BOM
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  // Auto-detecta separador analisando a 1ª linha (fora de aspas)
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  let inQ = false, semi = 0, comma = 0;
  for (let i = 0; i < firstLine.length; i++) {
    const c = firstLine[i];
    if (c === '"') inQ = !inQ;
    else if (!inQ && c === ";") semi++;
    else if (!inQ && c === ",") comma++;
  }
  const sep = semi > comma ? ";" : ",";

  const rows = [];
  let cur = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { q = false; }
      } else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === sep) { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* ignore, será tratado pelo \n seguinte */ }
      else field += c;
    }
  }
  // Último campo/linha (se arquivo não termina com \n)
  if (field !== "" || cur.length > 0) { cur.push(field); rows.push(cur); }
  // Remove linhas totalmente vazias
  const clean = rows.filter(r => r.some(v => String(v).trim() !== ""));
  if (clean.length === 0) return [];
  const headers = clean[0].map(h => String(h).trim());
  return clean.slice(1).map(r => {
    const o = {};
    headers.forEach((h, idx) => { o[h] = r[idx] != null ? r[idx] : ""; });
    return o;
  });
};

// Gera string CSV (separador ";", compatível com Excel BR) a partir de matriz
const toCSV = (rows, sep = ";") => {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[";\n,\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map(r => r.map(esc).join(sep)).join("\r\n");
};

const baixarArquivoTexto = (nome, conteudo, mime = "text/csv;charset=utf-8") => {
  // Prefixo BOM para Excel reconhecer UTF-8 corretamente
  const blob = new Blob(["\uFEFF" + conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function Expedicao({ state, setState, safraAtiva }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [importResult, setImportResult] = useState(null); // { ok, errors, total }
  const fileInputRef = useRef(null);
  const allItems = state.expedicoes || [];
  const items = safraAtiva ? allItems.filter(x => x.safra === safraAtiva) : allItems;
  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ status: "Pendente", safra: safraAtiva || "" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, expedicoes: s.expedicoes.filter(x => x.id !== id) }));
  const save = () => {
    const item = {
      ...form,
      safra: form.safra || safraAtiva || "",
      id: editing || uid(),
      numero: editing ? form.numero : `EXP-${padNum(allItems.length + 1)}`,
    };
    setState(s => ({ ...s, expedicoes: editing ? s.expedicoes.map(x => x.id === editing ? item : x) : [...(s.expedicoes || []), item] }));
    setOpen(false);
  };

  // ─── IMPORTAÇÃO POR PLANILHA (CSV) ───────────────────────────────────────
  const baixarTemplate = () => {
    const headers = [
      "Data", "Contrato", "Cliente", "Grão", "Romaneio", "Status",
      "Peso Bruto", "Peso Tara", "Peso Líquido", "Umidade (%)", "Impureza (%)", "Avariado (%)",
    ];
    const exemplo = [
      ["2025-04-18", "CT-00001", "Cliente Exemplo Ltda", "Soja", "1", "Pendente", 30000, 15000, 15000, "13,5", "1,2", "0,8"],
      ["18/04/2025", "CT-00002", "Outro Cliente", "Milho", "2", "Em trânsito", 28500, 14200, 14300, "14,0", "1,5", "1,0"],
    ];
    const csv = toCSV([headers, ...exemplo], ";");
    baixarArquivoTexto("modelo-expedicoes.csv", csv);
  };

  const onSelecionarArquivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nome = (file.name || "").toLowerCase();
    if (!nome.endsWith(".csv") && !nome.endsWith(".txt")) {
      setImportResult({ ok: 0, errors: [{ linha: "-", motivo: "Formato não suportado. Envie um arquivo .csv (no Excel: Arquivo → Salvar Como → CSV)." }], total: 0 });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target.result || "");
        const rows = parseCSV(text);
        processarLinhas(rows);
      } catch (err) {
        setImportResult({ ok: 0, errors: [{ linha: "-", motivo: "Falha ao ler arquivo: " + (err?.message || err) }], total: 0 });
      }
    };
    reader.readAsText(file, "UTF-8");
    // Reseta para permitir reimportar o mesmo arquivo
    e.target.value = "";
  };

  const processarLinhas = (rows) => {
    if (!rows || rows.length === 0) {
      setImportResult({ ok: 0, errors: [{ linha: "-", motivo: "Arquivo sem linhas de dados." }], total: 0 });
      return;
    }
    const errors = [];
    const novos = [];
    let counter = items.length + novos.length;

    rows.forEach((raw, idx) => {
      const linhaNum = idx + 2; // +1 cabeçalho, +1 base 1
      // Normaliza chaves
      const reg = {};
      Object.entries(raw).forEach(([k, v]) => {
        const interno = EXPEDICAO_HEADER_ALIASES[_normHeader(k)];
        if (interno) reg[interno] = v;
      });

      // Converte data
      if (reg.data) reg.data = _excelDateToISO(reg.data);

      // Status default
      if (!reg.status || !["Pendente", "Em trânsito", "Concluída"].includes(String(reg.status).trim())) {
        reg.status = "Pendente";
      } else {
        reg.status = String(reg.status).trim();
      }

      // Trim strings
      ["contrato", "cliente", "grao", "romaneio"].forEach(k => {
        if (reg[k] != null) reg[k] = String(reg[k]).trim();
      });

      // Converte campos numéricos
      EXPEDICAO_CAMPOS_NUMERICOS.forEach(k => {
        reg[k] = _excelNumber(reg[k]);
      });

      // Calcula peso líquido se ausente mas houver bruto e tara
      if (reg.pesoLiquido === "" && reg.pesoBruto !== "" && reg.pesoTara !== "") {
        reg.pesoLiquido = Number(reg.pesoBruto) - Number(reg.pesoTara);
      }

      // Valida obrigatórios
      const faltando = EXPEDICAO_CAMPOS_OBRIGATORIOS.filter(c => !reg[c] || String(reg[c]).trim() === "");
      if (faltando.length > 0) {
        errors.push({
          linha: linhaNum,
          motivo: "Campos obrigatórios ausentes: " + faltando.map(f => EXPEDICAO_CAMPOS_LABELS[f]).join(", "),
        });
        return;
      }

      counter += 1;
      novos.push({
        id: uid(),
        numero: `EXP-${padNum(counter)}`,
        data: reg.data,
        contrato: reg.contrato,
        cliente: reg.cliente,
        grao: reg.grao,
        romaneio: reg.romaneio,
        status: reg.status,
        pesoBruto: reg.pesoBruto,
        pesoTara: reg.pesoTara,
        pesoLiquido: reg.pesoLiquido,
        umidade: reg.umidade,
        impureza: reg.impureza,
        avariado: reg.avariado,
        safra: safraAtiva || "",
      });
    });

    if (novos.length > 0) {
      setState(s => ({ ...s, expedicoes: [...(s.expedicoes || []), ...novos] }));
    }
    setImportResult({ ok: novos.length, errors, total: rows.length });
  };

  return (
    <div>
      <SectionTitle action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="secondary" onClick={baixarTemplate} title="Baixar modelo de CSV">📄 Modelo CSV</Btn>
          <Btn variant="secondary" onClick={() => fileInputRef.current?.click()} title="Importar arquivo .csv (no Excel: Arquivo → Salvar Como → CSV)">📥 Importar CSV</Btn>
          <Btn onClick={openNew}>+ Nova Expedição</Btn>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,.txt"
            style={{ display: "none" }}
            onChange={onSelecionarArquivo}
          />
        </div>
      }>🚚 Agendamentos</SectionTitle>
      {safraAtiva && (
        <div style={{ marginBottom: 12, padding: "8px 14px", background: `${theme.gold}12`, border: `1px solid ${theme.gold}33`, borderRadius: 8, fontSize: 12, color: theme.gold, fontWeight: 600 }}>
          🌾 Exibindo agendamentos da safra <strong>{safraAtiva}</strong> ({items.length} {items.length === 1 ? "agendamento" : "agendamentos"})
        </div>
      )}
      <Card>
        {items.length === 0 ? <EmptyState icon="🚚" text={safraAtiva ? `Nenhum agendamento registrado para a safra ${safraAtiva}.` : "Nenhum agendamento registrado."} /> : (
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
        <Row>
          <Field label="Peso Bruto (kg)">
            <Input type="number" step="0.01" value={form.pesoBruto ?? ""} onChange={e => {
              const pb = e.target.value;
              setForm(f => {
                const next = { ...f, pesoBruto: pb };
                const nb = parseFloat(pb);
                const nt = parseFloat(f.pesoTara);
                if (!isNaN(nb) && !isNaN(nt)) next.pesoLiquido = (nb - nt).toFixed(2);
                return next;
              });
            }} />
          </Field>
          <Field label="Peso Tara (kg)">
            <Input type="number" step="0.01" value={form.pesoTara ?? ""} onChange={e => {
              const pt = e.target.value;
              setForm(f => {
                const next = { ...f, pesoTara: pt };
                const nb = parseFloat(f.pesoBruto);
                const nt = parseFloat(pt);
                if (!isNaN(nb) && !isNaN(nt)) next.pesoLiquido = (nb - nt).toFixed(2);
                return next;
              });
            }} />
          </Field>
          <Field label="Peso Líquido (kg)">
            <Input type="number" step="0.01" value={form.pesoLiquido ?? ""} onChange={e => fp("pesoLiquido", e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field label="Umidade (%)">
            <Input type="number" step="0.01" value={form.umidade ?? ""} onChange={e => fp("umidade", e.target.value)} />
          </Field>
          <Field label="Impureza (%)">
            <Input type="number" step="0.01" value={form.impureza ?? ""} onChange={e => fp("impureza", e.target.value)} />
          </Field>
          <Field label="Avariado (%)">
            <Input type="number" step="0.01" value={form.avariado ?? ""} onChange={e => fp("avariado", e.target.value)} />
          </Field>
        </Row>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>

      <Modal open={!!importResult} onClose={() => setImportResult(null)} title="Resultado da Importação" width={620}>
        {importResult && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, padding: "10px 14px", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: theme.muted }}>Linhas no arquivo</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.text }}>{importResult.total}</div>
              </div>
              <div style={{ background: theme.surface, border: `1px solid ${theme.accent}`, padding: "10px 14px", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: theme.muted }}>Importadas</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.accentLight }}>{importResult.ok}</div>
              </div>
              <div style={{ background: theme.surface, border: `1px solid ${theme.danger}`, padding: "10px 14px", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: theme.muted }}>Com erro</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.danger }}>{importResult.errors.length}</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: 280, overflowY: "auto", border: `1px solid ${theme.border}`, borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: theme.surface }}>
                      <th style={{ padding: 8, textAlign: "left", color: theme.muted, borderBottom: `1px solid ${theme.border}` }}>Linha</th>
                      <th style={{ padding: 8, textAlign: "left", color: theme.muted, borderBottom: `1px solid ${theme.border}` }}>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.errors.map((er, i) => (
                      <tr key={i}>
                        <td style={{ padding: 8, color: theme.text, borderBottom: `1px solid ${theme.border}` }}>{er.linha}</td>
                        <td style={{ padding: 8, color: theme.danger, borderBottom: `1px solid ${theme.border}` }}>{er.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 12, color: theme.muted, lineHeight: 1.6 }}>
              <div><strong>Obrigatórios:</strong> Data, Contrato, Cliente, Grão, Romaneio.</div>
              <div><strong>Opcionais:</strong> Status (default "Pendente"), Peso Bruto, Peso Tara, Peso Líquido, Umidade (%), Impureza (%), Avariado (%).</div>
              <div style={{ marginTop: 4, fontStyle: "italic" }}>Se Peso Líquido vier vazio, será calculado automaticamente como Bruto − Tara.</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <Btn onClick={() => setImportResult(null)}>OK</Btn>
            </div>
          </div>
        )}
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
    if (!form.insumoId) {
      alert("Selecione um insumo!");
      return;
    }
    if (!form.qtd || parseFloat(form.qtd) <= 0) {
      alert("Informe uma quantidade válida!");
      return;
    }
    
    setState(s => {
      const est = [...(s.estoqueInsumos || [])];
      const ins = (s.insumos || []).find(i => i.id === form.insumoId);
      const idx = est.findIndex(e => e.insumoId === form.insumoId);
      const delta = form.tipo === "Saída" ? -(parseFloat(form.qtd) || 0) : (parseFloat(form.qtd) || 0);
      
      if (idx >= 0) {
        const novaQtd = (parseFloat(est[idx].qtd) || 0) + delta;
        if (form.tipo === "Saída" && novaQtd < 0) {
          alert(`Estoque insuficiente! Disponível: ${est[idx].qtd} ${est[idx].unidade}`);
          return s;
        }
        est[idx] = { ...est[idx], qtd: novaQtd.toFixed(2) };
      } else {
        if (form.tipo === "Saída") {
          alert("Estoque zerado ou insumo não encontrado!");
          return s;
        }
        est.push({ 
          insumoId: form.insumoId, 
          insumoNome: ins?.nome, 
          qtd: delta.toFixed(2), 
          unidade: ins?.unidade 
        });
      }
      return { ...s, estoqueInsumos: est };
    });
    setOpen(false);
    setForm({});
  };
  
  return (
    <div>
      <SectionTitle action={<Btn onClick={() => { setForm({}); setOpen(true); }}>+ Movimentar</Btn>}>
        📦 Estoque de Insumos
      </SectionTitle>
      <Card>
        {estoque.length === 0 ? (
          <EmptyState icon="📦" text="Nenhum insumo em estoque." />
        ) : (
          <Table 
            headers={["Insumo", "Quantidade", "Unidade", "Status"]} 
            rows={estoque.map(e => {
              const qty = parseFloat(e.qtd);
              return (
                <tr key={e.insumoId}>
                  <Td>{e.insumoNome}</Td>
                  <Td><strong style={{ color: qty > 0 ? theme.accent : theme.danger }}>{e.qtd}</strong></Td>
                  <Td>{e.unidade}</Td>
                  <Td>
                    <Badge color={qty > 10 ? "green" : qty > 0 ? "gold" : "red"}>
                      {qty > 10 ? "Normal" : qty > 0 ? "Baixo" : "Zerado"}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Movimentação de Estoque">
        <Field label="Insumo">
          <Select value={form.insumoId} onChange={e => setForm(f => ({ ...f, insumoId: e.target.value }))}>
            <option value="">Selecione...</option>
            {(state.insumos || []).map(i => (
              <option key={i.id} value={i.id}>{i.nome}</option>
            ))}
          </Select>
        </Field>
        <Row>
          <Field label="Tipo">
            <Select value={form.tipo || "Entrada"} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="Entrada">📥 Entrada</option>
              <option value="Saída">📤 Saída</option>
            </Select>
          </Field>
          <Field label="Quantidade">
            <Input 
              type="number" 
              step="0.01" 
              value={form.qtd || ""} 
              onChange={e => setForm(f => ({ ...f, qtd: e.target.value }))} 
              placeholder="0.00"
            />
          </Field>
        </Row>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={addMov}>Registrar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── GRÃOS ────────────────────────────────────────────────────────────────────
function Graos({ state, safraAtiva }) {
  const SC_KG = 60;
  const graos = state.fazenda?.graos || [];
  const filtraSafra = (arr) => safraAtiva ? arr.filter(r => r.safra === safraAtiva) : arr;
  return (
    <div>
      <SectionTitle>🌾 Grãos em Produção</SectionTitle>
      {safraAtiva && (
        <div style={{ marginBottom: 12, padding: "8px 14px", background: `${theme.gold}12`, border: `1px solid ${theme.gold}33`, borderRadius: 8, fontSize: 12, color: theme.gold, fontWeight: 600 }}>
          🌾 Volumes calculados a partir dos romaneios da safra <strong>{safraAtiva}</strong>
        </div>
      )}
      {graos.length === 0 ? (
        <Card><EmptyState icon="🌾" text="Cadastre a fazenda e selecione os grãos produzidos." /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {graos.map(g => {
            const ent = filtraSafra(state.romaneiosEntrada || []).filter(r => r.grao === g).reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
            const sai = filtraSafra(state.romaneiosSaida || []).filter(r => r.grao === g).reduce((a, r) => a + (parseFloat(r.pesoFinal) || 0), 0);
            const volume = ent - sai;
            const sacas = volume / SC_KG;
            return (
              <Card key={g} style={{ borderTop: `3px solid ${theme.accent}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🌾</div>
                <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 14 }}>{g}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.muted, fontSize: 12 }}>Entrada</span>
                    <span style={{ color: theme.info, fontWeight: 600 }}>{ent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.muted, fontSize: 12 }}>Saída</span>
                    <span style={{ color: theme.gold, fontWeight: 600 }}>{sai.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: theme.muted, fontSize: 12 }}>Volume (com descontos)</span>
                    <span style={{ color: volume >= 0 ? theme.accent : theme.danger, fontWeight: 800, fontSize: 17 }}>{volume.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: theme.muted, fontSize: 12 }}>Em sacas</span>
                    <span style={{ color: theme.info, fontWeight: 600 }}>{sacas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} sc</span>
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
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:8px}</style></head><body>
    ${gerarCabecalhoHTML(faz, "RELATÓRIO DE ABASTECIMENTO", "")}
    <table><thead><tr><th>Data</th><th>Máquina</th><th>Operador</th><th>Tipo</th><th>Litros</th><th>Preço/L</th><th>Total</th><th>Hodômetro</th></tr></thead><tbody>
    ${items.map(a => `<tr><td style="white-space:nowrap">${a.data}</td><td style="white-space:nowrap">${a.maquina}${a.tipo ? ` (${a.tipo})` : ""}</td><td style="white-space:nowrap">${a.operador || "—"}</td><td style="text-align:center">${a.tipo || "Diesel"}</td><td style="text-align:center"><strong>${a.litros} L</strong></td><td style="text-align:center">R$ ${parseFloat(a.precoLitro || 0).toFixed(2)}</td><td style="text-align:center">R$ ${((parseFloat(a.litros) || 0) * (parseFloat(a.precoLitro) || 0)).toFixed(2)}</td><td style="text-align:center">${a.hodometro || "—"}</td>`).join("")}
    </tbody><tfoot><tr class="tot"><td colspan="4"><strong>TOTAIS</strong></td><td style="text-align:center"><strong>${totalLitros.toFixed(0)} L</strong></td><td style="text-align:center"><strong>R$ ${totalGastos.toFixed(2)}</strong></td><td style="text-align:center"><strong>${items.length} abast.</strong></td><td style="text-align:center"><strong>${items.length > 0 ? (totalLitros / items.length).toFixed(1) : 0} L/abast</strong></td></tr></tfoot>
    </table>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
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
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
    ${gerarCabecalhoHTML(faz, "RELATÓRIO DE CONSUMO", "Consumo de Combustível")}
    <table><thead><tr><th>Máquina</th><th>Litros</th><th>Gasto (R$)</th><th>Abastecimentos</th><th>Média (L/abast)</th></tr></thead><tbody>
    ${Object.entries(porMaquina).map(([nome, dados]) => `<tr><td style="font-weight:700">${nome}</td><td style="text-align:center"><strong>${dados.litros.toFixed(0)} L</strong></td><td style="text-align:center">R$ ${dados.gasto.toFixed(2)}</td><td style="text-align:center">${dados.abastecimentos.length}</td><td style="text-align:center">${(dados.litros / dados.abastecimentos.length).toFixed(1)} L</td>`).join("")}
    </tbody><tfoot><tr class="tot"><td><strong>TOTAIS</strong></td><td style="text-align:center"><strong>${totalLitros.toFixed(0)} L</strong></td><td style="text-align:center"><strong>R$ ${totalGasto.toFixed(2)}</strong></td><td style="text-align:center"><strong>${dadosFiltrados.length} abast.</strong></td><td style="text-align:center"><strong>${dadosFiltrados.length > 0 ? (totalLitros / dadosFiltrados.length).toFixed(1) : 0} L</strong></td></tr></tfoot>
    </table>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
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

// ─── PEÇAS (ALMOXARIFADO) — MELHORADO ────────────────────────────────────────
function Pecas({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const items = state.pecas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ unidade: "un", estoqueMinimo: 0, codigo: `PEC-${padNum((items.length || 0) + 1)}`, fornecedores: [] }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i, fornecedores: i.fornecedores || [] }); setEditing(i.id); setOpen(true); };
  const del = id => { if (window.confirm("Excluir esta peça?")) setState(s => ({ ...s, pecas: s.pecas.filter(x => x.id !== id) })); };
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, pecas: editing ? s.pecas.map(x => x.id === editing ? item : x) : [...(s.pecas || []), item] }));
    setOpen(false);
  };

  const subcategorias = {
    "Filtro": ["Óleo", "Ar", "Combustível", "Hidráulico", "Cabine"],
    "Correia": ["Dentada", "V", "Poly-V", "Alternador"],
    "Rolamento": ["Esfera", "Rolos", "Agulha", "Cônico"],
    "Motor": ["Pistão", "Biela", "Junta", "Válvula", "Bomba de Água"],
    "Transmissão": ["Engrenagem", "Sincronizador", "Disco de Embreagem", "Eixo"],
    "Hidráulica": ["Cilindro", "Bomba", "Válvula", "Mangueira", "Vedação"],
    "Elétrica": ["Alternador", "Motor de Partida", "Relé", "Fusível", "Chicote"],
    "Pneu": ["Dianteiro", "Traseiro", "Implemento"],
    "Lubrificante": ["Óleo Motor", "Óleo Hidráulico", "Graxa", "Fluido de Arrefecimento"],
    "Ferramenta": ["Manual", "Elétrica", "Pneumática", "Especial"],
    "Parafuso/Porca": ["Métrico", "Polegada", "Allen", "Auto-Atarraxante"],
    "Vedação": ["O-Ring", "Retentor", "Junta", "Gaxeta"],
    "Mangueira": ["Pressão", "Sucção", "Combustível", "Ar"],
    "Outros": ["Diversos"]
  };

  const categorias = [...new Set(items.map(p => p.categoria).filter(Boolean))];
  const subcatsFiltro = filtroCategoria ? (subcategorias[filtroCategoria] || []) : [];
  const filtrados = items.filter(p => {
    const txt = `${p.codigo} ${p.descricao} ${p.nome} ${p.categoria} ${p.subcategoria} ${p.localizacao}`.toLowerCase();
    if (busca && !txt.includes(busca.toLowerCase())) return false;
    if (filtroCategoria && p.categoria !== filtroCategoria) return false;
    if (filtroSubcategoria && p.subcategoria !== filtroSubcategoria) return false;
    const qtd = parseFloat(p.quantidade) || 0, min = parseFloat(p.estoqueMinimo) || 0;
    if (filtroStatus === "baixo") return min > 0 && qtd <= min && qtd > 0;
    if (filtroStatus === "zerado") return qtd === 0;
    if (filtroStatus === "normal") return qtd > min || min === 0;
    return true;
  });

  const totalItens = items.length;
  const totalUnidades = items.reduce((s, p) => s + (parseFloat(p.quantidade) || 0), 0);
  const pecasBaixo = items.filter(p => { const q = parseFloat(p.quantidade) || 0, m = parseFloat(p.estoqueMinimo) || 0; return m > 0 && q <= m; });
  const valorTotal = items.reduce((s, p) => s + ((parseFloat(p.quantidade) || 0) * (parseFloat(p.precoUnitario) || 0)), 0);

  // Preço médio
  const precoMedio = totalItens > 0 ? valorTotal / Math.max(totalUnidades, 1) : 0;

  // Fornecedor form
  const [fornecedorInput, setFornecedorInput] = useState("");
  const addFornecedor = () => {
    if (!fornecedorInput.trim()) return;
    setForm(f => ({ ...f, fornecedores: [...(f.fornecedores || []), { nome: fornecedorInput.trim(), id: uid() }] }));
    setFornecedorInput("");
  };
  const remFornecedor = (fid) => setForm(f => ({ ...f, fornecedores: (f.fornecedores || []).filter(x => x.id !== fid) }));

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Nova Peça</Btn>}>🔧 Peças e Componentes</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Cadastradas", value: totalItens, color: theme.info, icon: "🔧" },
          { label: "Em Estoque", value: totalUnidades.toFixed(0), color: theme.accent, icon: "📦" },
          { label: "Estoque Baixo", value: pecasBaixo.length, color: theme.warning, icon: "⚠️" },
          { label: "Valor Estoque", value: `R$ ${valorTotal.toFixed(2)}`, color: theme.gold, icon: "💰" },
          { label: "Preço Médio", value: `R$ ${precoMedio.toFixed(2)}`, color: theme.info, icon: "📊" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: theme.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontWeight: 900, fontSize: 18, color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 4 }}>🔍 Buscar</label>
            <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Código, descrição, localização..." />
          </div>
          <div>
            <label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 4 }}>Categoria</label>
            <Select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setFiltroSubcategoria(""); }}>
              <option value="">Todas</option>
              {Object.keys(subcategorias).map(c => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 4 }}>Subcategoria</label>
            <Select value={filtroSubcategoria} onChange={e => setFiltroSubcategoria(e.target.value)} disabled={!filtroCategoria}>
              <option value="">Todas</option>
              {subcatsFiltro.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 4 }}>Status</label>
            <Select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="normal">✅ Normal</option>
              <option value="baixo">⚠️ Baixo</option>
              <option value="zerado">🚫 Zerado</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {filtrados.length === 0 ? (
          <EmptyState icon="🔧" text={busca || filtroCategoria || filtroStatus ? "Nenhuma peça encontrada." : "Nenhuma peça cadastrada."} />
        ) : (
          <Table
            headers={["Código", "Descrição", "Cat./Sub.", "Local", "Qtd", "Mín.", "Preço Un.", "Fornecedores", "Status", "Ações"]}
            rows={filtrados.map(p => {
              const qtd = parseFloat(p.quantidade) || 0, min = parseFloat(p.estoqueMinimo) || 0;
              const status = qtd === 0 ? "Zerado" : (min > 0 && qtd <= min ? "Baixo" : "OK");
              const cor = status === "OK" ? "green" : (status === "Baixo" ? "gold" : "red");
              return (
                <tr key={p.id} style={status !== "OK" ? { background: status === "Zerado" ? `${theme.danger}08` : `${theme.warning}08` } : {}}>
                  <Td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{p.codigo || "—"}</span></Td>
                  <Td><strong>{p.descricao || p.nome}</strong>{p.aplicacao ? <><br/><span style={{ fontSize: 10, color: theme.muted }}>📌 {p.aplicacao}</span></> : null}</Td>
                  <Td>{p.categoria || "—"}{p.subcategoria ? <><br/><span style={{ fontSize: 10, color: theme.muted }}>{p.subcategoria}</span></> : null}</Td>
                  <Td>{p.localizacao || "—"}</Td>
                  <Td><Badge color={cor}>{qtd.toLocaleString()} {p.unidade}</Badge></Td>
                  <Td>{min > 0 ? `${min} ${p.unidade}` : "—"}</Td>
                  <Td>{parseFloat(p.precoUnitario) > 0 ? `R$ ${parseFloat(p.precoUnitario).toFixed(2)}` : "—"}</Td>
                  <Td>{(p.fornecedores || []).length > 0 ? (p.fornecedores || []).map(f => f.nome).join(", ") : p.fornecedor || "—"}</Td>
                  <Td><Badge color={cor}>{status}</Badge></Td>
                  <Td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn size="sm" variant="secondary" onClick={() => openEdit(p)}>✏️</Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(p.id)}>🗑️</Btn>
                    </div>
                  </Td>
                </tr>
              );
            })}
          />
        )}
        {filtrados.length > 0 && <div style={{ color: theme.muted, fontSize: 11, marginTop: 8, textAlign: "right" }}>{filtrados.length} de {items.length} peças</div>}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Peça`} width={700}>
        <Row>
          <Field label="Código"><Input value={form.codigo} onChange={e => fp("codigo", e.target.value)} placeholder="PEC-00001" /></Field>
          <Field label="Descrição"><Input value={form.descricao || form.nome} onChange={e => fp("descricao", e.target.value)} placeholder="Ex: Filtro de Óleo" required /></Field>
        </Row>
        <Row>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={e => { fp("categoria", e.target.value); fp("subcategoria", ""); }}>
              <option value="">Selecione...</option>
              {Object.keys(subcategorias).map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Subcategoria">
            <Select value={form.subcategoria} onChange={e => fp("subcategoria", e.target.value)} disabled={!form.categoria}>
              <option value="">Selecione...</option>
              {(subcategorias[form.categoria] || []).map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Unidade">
            <Select value={form.unidade} onChange={e => fp("unidade", e.target.value)}>
              {["un", "kg", "L", "m", "par", "jogo", "cx", "pct"].map(u => <option key={u}>{u}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Quantidade"><Input type="number" step="0.01" value={form.quantidade} onChange={e => fp("quantidade", e.target.value)} placeholder="0" /></Field>
          <Field label="Estoque Mínimo"><Input type="number" step="0.01" value={form.estoqueMinimo} onChange={e => fp("estoqueMinimo", e.target.value)} placeholder="0" /></Field>
        </Row>
        <Row>
          <Field label="Preço Unitário (R$)"><Input type="number" step="0.01" value={form.precoUnitario} onChange={e => fp("precoUnitario", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Localização"><Input value={form.localizacao} onChange={e => fp("localizacao", e.target.value)} placeholder="Ex: A-12 / Galpão 2" /></Field>
        </Row>
        <Row>
          <Field label="Aplicação / Máquina"><Input value={form.aplicacao} onChange={e => fp("aplicacao", e.target.value)} placeholder="Ex: Trator JD 5075E" /></Field>
        </Row>
        <Field label="Fornecedores">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <Input value={fornecedorInput} onChange={e => setFornecedorInput(e.target.value)} placeholder="Nome do fornecedor" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFornecedor())} />
            <Btn size="sm" onClick={addFornecedor}>+ Add</Btn>
          </div>
          {(form.fornecedores || []).length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(form.fornecedores || []).map(f => (
                <span key={f.id} style={{ background: `${theme.info}22`, color: theme.info, padding: "3px 10px", borderRadius: 12, fontSize: 12, display: "flex", alignItems: "center", gap: 6, border: `1px solid ${theme.info}33` }}>
                  {f.nome} <span style={{ cursor: "pointer", fontWeight: 700 }} onClick={() => remFornecedor(f.id)}>✕</span>
                </span>
              ))}
            </div>
          )}
        </Field>
        <Field label="Observações">
          <textarea value={form.obs || ""} onChange={e => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── MOVIMENTAÇÃO DE PEÇAS (MELHORADO) ───────────────────────────────────────
function MovimentacaoPecas({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const items = state.movimentacaoPecas || [];
  const pecas = state.pecas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = (tipo) => { setForm({ tipo: tipo || "Saída", data: new Date().toISOString().split("T")[0] }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => { if (window.confirm("Excluir?")) setState(s => ({ ...s, movimentacaoPecas: s.movimentacaoPecas.filter(x => x.id !== id) })); };

  const save = () => {
    const peca = pecas.find(p => p.id === form.pecaId);
    if (!peca) { alert("Selecione uma peça!"); return; }
    if (!form.quantidade || parseFloat(form.quantidade) <= 0) { alert("Informe a quantidade!"); return; }
    const qtdMov = parseFloat(form.quantidade) || 0;
    const qtdAtual = parseFloat(peca.quantidade) || 0;
    if (form.tipo === "Saída" && qtdMov > qtdAtual) {
      alert(`Estoque insuficiente! Disponível: ${qtdAtual} ${peca.unidade}`);
      return;
    }
    const novaQtd = form.tipo === "Saída" ? qtdAtual - qtdMov : qtdAtual + qtdMov;
    // Atualiza preço médio na entrada
    let pecaAtualizada = { ...peca, quantidade: novaQtd };
    if (form.tipo === "Entrada" && parseFloat(form.custoUnitario) > 0) {
      const custoAnterior = (parseFloat(peca.precoUnitario) || 0) * qtdAtual;
      const custoNovo = parseFloat(form.custoUnitario) * qtdMov;
      pecaAtualizada.precoUnitario = ((custoAnterior + custoNovo) / novaQtd).toFixed(2);
    }
    setState(s => ({
      ...s,
      pecas: s.pecas.map(p => p.id === form.pecaId ? pecaAtualizada : p),
      movimentacaoPecas: editing
        ? s.movimentacaoPecas.map(x => x.id === editing ? { ...form, id: editing } : x)
        : [...s.movimentacaoPecas, { ...form, id: uid() }]
    }));
    setOpen(false); setForm({});
  };

  const filtrados = items.filter(m => {
    const peca = pecas.find(p => p.id === m.pecaId);
    const txt = `${peca?.codigo || ""} ${peca?.descricao || ""} ${m.responsavel || ""} ${m.destino || ""}`.toLowerCase();
    if (busca && !txt.includes(busca.toLowerCase())) return false;
    if (filtroTipo && m.tipo !== filtroTipo) return false;
    if (periodoInicio && m.data < periodoInicio) return false;
    if (periodoFim && m.data > periodoFim) return false;
    return true;
  });

  const totalEntradas = filtrados.filter(m => m.tipo === "Entrada").reduce((sum, m) => sum + (parseFloat(m.quantidade) || 0), 0);
  const totalSaidas = filtrados.filter(m => m.tipo === "Saída").reduce((sum, m) => sum + (parseFloat(m.quantidade) || 0), 0);
  const custoTotal = filtrados.reduce((sum, m) => sum + ((parseFloat(m.quantidade) || 0) * (parseFloat(m.custoUnitario) || 0)), 0);

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Movimentação de Peças</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
    ${gerarCabecalhoHTML(faz, "MOVIMENTAÇÃO DE PEÇAS", "")}
    <table><thead><tr><th>Data</th><th>Peça</th><th>Tipo</th><th>Qtd</th><th>Custo Un.</th><th>Responsável</th><th>Destino</th><th>Motivo</th></tr></thead><tbody>
    ${filtrados.map(m => { const peca = pecas.find(p => p.id === m.pecaId); return `<tr><td>${formatDate(m.data)}</td><td>${peca?.descricao || "—"}</td><td>${m.tipo}</td><td style="text-align:center"><strong>${m.quantidade}</strong></td><td>R$ ${(parseFloat(m.custoUnitario) || 0).toFixed(2)}</td><td>${m.responsavel || "—"}</td><td>${m.destino || "—"}</td><td>${m.motivo || "—"}</td></tr>`; }).join("")}
    </tbody><tfoot><tr class="tot"><td colspan="2"><strong>TOTAIS</strong></td><td></td><td style="text-align:center">E:${totalEntradas} S:${totalSaidas}</td><td>R$ ${custoTotal.toFixed(2)}</td><td colspan="3">Saldo: ${(totalEntradas - totalSaidas).toFixed(0)}</td></tr></tfoot></table>
    <div class="footer">AgriGest · Movimentação de Peças</div></body></html>`);
    win.document.close(); setTimeout(() => win.print(), 400);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📦 Movimentação de Peças</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {filtrados.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Relatório</Btn>}
          <Btn variant="success" onClick={() => openNew("Entrada")}>📥 Entrada</Btn>
          <Btn variant="danger" onClick={() => openNew("Saída")}>📤 Saída</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Entradas", value: totalEntradas.toFixed(0), color: theme.accent, icon: "📥" },
          { label: "Saídas", value: totalSaidas.toFixed(0), color: theme.danger, icon: "📤" },
          { label: "Saldo", value: (totalEntradas - totalSaidas).toFixed(0), color: theme.gold, icon: "📊" },
          { label: "Custo Total", value: `R$ ${custoTotal.toFixed(2)}`, color: theme.info, icon: "💰" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 24, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>🔍 Buscar</label><Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Peça, responsável..." /></div>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Tipo</label><Select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}><option value="">Todos</option><option value="Entrada">📥 Entrada</option><option value="Saída">📤 Saída</option><option value="Transferência">🔄 Transferência</option></Select></div>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>De</label><Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} /></div>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Até</label><Input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} /></div>
        </div>
      </Card>

      <Card>
        {filtrados.length === 0 ? (
          <EmptyState icon="📦" text="Nenhuma movimentação encontrada." />
        ) : (
          <Table
            headers={["Data", "Peça", "Tipo", "Qtd", "Custo Un.", "Responsável", "Destino", "Motivo", "Ações"]}
            rows={filtrados.map(m => {
              const peca = pecas.find(p => p.id === m.pecaId);
              return (
                <tr key={m.id}>
                  <Td>{formatDate(m.data)}</Td>
                  <Td><strong>{peca?.descricao || peca?.nome || "—"}</strong><br/><span style={{ fontSize: 10, color: theme.muted }}>{peca?.codigo || ""}</span></Td>
                  <Td><Badge color={m.tipo === "Entrada" ? "green" : m.tipo === "Transferência" ? "blue" : "red"}>{m.tipo === "Entrada" ? "📥" : m.tipo === "Transferência" ? "🔄" : "📤"} {m.tipo}</Badge></Td>
                  <Td><strong style={{ color: m.tipo === "Entrada" ? theme.accent : theme.danger }}>{m.quantidade}</strong></Td>
                  <Td>{parseFloat(m.custoUnitario) > 0 ? `R$ ${parseFloat(m.custoUnitario).toFixed(2)}` : "—"}</Td>
                  <Td>{m.responsavel || "—"}</Td>
                  <Td>{m.destino || m.origem || "—"}</Td>
                  <Td>{m.motivo || "—"}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 4 }}>
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

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Movimentação — ${form.tipo || "Saída"}`} width={600}>
        <Row>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
          <Field label="Peça">
            <Select value={form.pecaId} onChange={e => fp("pecaId", e.target.value)}>
              <option value="">Selecione...</option>
              {pecas.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descricao || p.nome} (Est: {parseFloat(p.quantidade) || 0} {p.unidade})</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
              <option value="Entrada">📥 Entrada</option>
              <option value="Saída">📤 Saída</option>
              <option value="Transferência">🔄 Transferência</option>
            </Select>
          </Field>
          <Field label="Quantidade"><Input type="number" step="0.01" value={form.quantidade} onChange={e => fp("quantidade", e.target.value)} placeholder="0" /></Field>
        </Row>
        <Row>
          <Field label="Custo Unitário (R$)"><Input type="number" step="0.01" value={form.custoUnitario} onChange={e => fp("custoUnitario", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Responsável"><Input value={form.responsavel} onChange={e => fp("responsavel", e.target.value)} placeholder="Quem retirou/recebeu" /></Field>
        </Row>
        <Row>
          <Field label="Destino / Origem"><Input value={form.destino || form.origem} onChange={e => fp("destino", e.target.value)} placeholder="Ex: Trator 5670" /></Field>
          {form.tipo === "Transferência" && <Field label="Almoxarifado Destino"><Input value={form.almoxarifadoDestino} onChange={e => fp("almoxarifadoDestino", e.target.value)} placeholder="Ex: Galpão 2" /></Field>}
        </Row>
        <Row>
          <Field label="Motivo">
            <Select value={form.motivo} onChange={e => fp("motivo", e.target.value)}>
              <option value="">Selecione...</option>
              <option>Manutenção preventiva</option>
              <option>Manutenção corretiva</option>
              <option>Compra/Reposição</option>
              <option>Devolução</option>
              <option>Transferência</option>
              <option>Perda/Danificada</option>
              <option>Inventário (ajuste)</option>
            </Select>
          </Field>
          <Field label="Nº NF / Requisição"><Input value={form.nfRequisicao} onChange={e => fp("nfRequisicao", e.target.value)} placeholder="Opcional" /></Field>
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

// ─── HISTÓRICO DE MOVIMENTAÇÕES ──────────────────────────────────────────────
function HistoricoMovimentacoes({ state }) {
  const pecas = state.pecas || [];
  const movs = (state.movimentacaoPecas || []).slice().sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroPeca, setFiltroPeca] = useState("");

  const filtrados = movs.filter(m => {
    if (filtroPeca && m.pecaId !== filtroPeca) return false;
    if (filtroMes && m.data && !m.data.startsWith(filtroMes)) return false;
    return true;
  });

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 16 }}>📜 Histórico de Movimentações</h2>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Peça</label>
            <Select value={filtroPeca} onChange={e => setFiltroPeca(e.target.value)}><option value="">Todas</option>{pecas.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descricao || p.nome}</option>)}</Select>
          </div>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Mês (YYYY-MM)</label>
            <Input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)} />
          </div>
        </div>
      </Card>
      <Card>
        {filtrados.length === 0 ? <EmptyState icon="📜" text="Nenhuma movimentação no período." /> : (
          <div style={{ maxHeight: 500, overflow: "auto" }}>
            {filtrados.map(m => {
              const peca = pecas.find(p => p.id === m.pecaId);
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderBottom: `1px solid ${theme.border}`, background: m.tipo === "Entrada" ? `${theme.accent}06` : m.tipo === "Transferência" ? `${theme.info}06` : `${theme.danger}06` }}>
                  <span style={{ fontSize: 24 }}>{m.tipo === "Entrada" ? "📥" : m.tipo === "Transferência" ? "🔄" : "📤"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{peca?.descricao || peca?.nome || "—"} <span style={{ color: theme.muted, fontWeight: 400, fontSize: 11 }}>({peca?.codigo})</span></div>
                    <div style={{ fontSize: 11, color: theme.muted }}>{m.motivo || "—"} • {m.responsavel || "—"} → {m.destino || "—"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: m.tipo === "Entrada" ? theme.accent : theme.danger }}>{m.tipo === "Entrada" ? "+" : "-"}{m.quantidade}</div>
                    <div style={{ fontSize: 10, color: theme.muted }}>{formatDate(m.data)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ color: theme.muted, fontSize: 11, marginTop: 8, textAlign: "right" }}>{filtrados.length} movimentações</div>
      </Card>
    </div>
  );
}

// ─── ESTOQUE DE PEÇAS (CONSULTA MELHORADA) ───────────────────────────────────
function EstoquePecas({ state }) {
  const pecas = state.pecas || [];
  const movimentacoes = state.movimentacaoPecas || [];
  const [busca, setBusca] = useState("");

  const pecasComSaldo = pecas.map(p => {
    const qtd = parseFloat(p.quantidade) || 0, min = parseFloat(p.estoqueMinimo) || 0, preco = parseFloat(p.precoUnitario) || 0;
    const movsP = movimentacoes.filter(m => m.pecaId === p.id);
    const ultMov = movsP.sort((a, b) => (b.data || "").localeCompare(a.data || ""))[0];
    return { ...p, saldoCalculado: qtd, estoqueMinimo: min, precoUnitario: preco, ultimaMovimentacao: ultMov };
  });

  const filtrados = pecasComSaldo.filter(p => {
    if (!busca) return true;
    return `${p.codigo} ${p.descricao} ${p.nome} ${p.categoria} ${p.localizacao}`.toLowerCase().includes(busca.toLowerCase());
  });

  const pecasBaixo = filtrados.filter(p => p.estoqueMinimo > 0 && p.saldoCalculado <= p.estoqueMinimo);
  const totalPecas = filtrados.reduce((s, p) => s + p.saldoCalculado, 0);
  const valorTotal = filtrados.reduce((s, p) => s + (p.saldoCalculado * p.precoUnitario), 0);
  const precoMedioGeral = totalPecas > 0 ? valorTotal / totalPecas : 0;

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Estoque de Peças</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:11px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#f3f4f6;padding:6px 8px;text-align:left;border:1px solid #ddd;font-size:10px}td{padding:6px 8px;border:1px solid #ddd}.low{background:#fef3c7}.zero{background:#fee2e2}.footer{margin-top:20px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
    ${gerarCabecalhoHTML(faz, "ESTOQUE DO ALMOXARIFADO", filtrados.length + " itens | R$ " + valorTotal.toFixed(2))}
    <table><thead><tr><th>Código</th><th>Descrição</th><th>Cat.</th><th>Local</th><th>Qtd</th><th>Mín.</th><th>Preço Méd.</th><th>Valor</th><th>Status</th></tr></thead><tbody>
    ${filtrados.map(p => { const st = p.saldoCalculado === 0 ? "ZERADO" : (p.estoqueMinimo > 0 && p.saldoCalculado <= p.estoqueMinimo ? "BAIXO" : "OK"); return `<tr class="${st === "ZERADO" ? "zero" : st === "BAIXO" ? "low" : ""}"><td style="font-family:monospace;font-weight:700">${p.codigo || "—"}</td><td><strong>${p.descricao || p.nome || "—"}</strong></td><td>${p.categoria || "—"}</td><td>${p.localizacao || "—"}</td><td style="text-align:center"><strong>${p.saldoCalculado}</strong> ${p.unidade}</td><td style="text-align:center">${p.estoqueMinimo || "—"}</td><td style="text-align:right">R$ ${p.precoUnitario.toFixed(2)}</td><td style="text-align:right"><strong>R$ ${(p.saldoCalculado * p.precoUnitario).toFixed(2)}</strong></td><td style="text-align:center;font-weight:700;color:${st === "OK" ? "#16a34a" : st === "BAIXO" ? "#d97706" : "#dc2626"}">${st}</td></tr>`; }).join("")}
    </tbody></table>
    ${pecasBaixo.length > 0 ? `<div style="margin-top:14px;padding:10px;border:2px solid #d97706;border-radius:6px"><strong>⚠️ ${pecasBaixo.length} ITENS CRÍTICOS</strong><br/>${pecasBaixo.map(p => `• ${p.codigo} — ${p.descricao || p.nome}: ${p.saldoCalculado}/${p.estoqueMinimo} ${p.unidade}`).join("<br/>")}</div>` : ""}
    <div class="footer">AgriGest · Estoque Almoxarifado · Preço Médio: R$ ${precoMedioGeral.toFixed(2)}</div></body></html>`);
    win.document.close(); setTimeout(() => win.print(), 400);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📊 Consulta de Estoque</h2>
        <Btn variant="info" onClick={imprimir}>🖨️ Imprimir Estoque</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Itens", value: filtrados.length, color: theme.info, icon: "🔧" },
          { label: "Em Estoque", value: totalPecas.toFixed(0), color: theme.accent, icon: "📦" },
          { label: "Valor Total", value: `R$ ${valorTotal.toFixed(2)}`, color: theme.gold, icon: "💰" },
          { label: "Preço Médio", value: `R$ ${precoMedioGeral.toFixed(2)}`, color: theme.info, icon: "📈" },
          { label: "Críticos", value: pecasBaixo.length, color: pecasBaixo.length > 0 ? theme.danger : theme.accent, icon: pecasBaixo.length > 0 ? "🚨" : "✅" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: theme.muted, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 18, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar por código, descrição, categoria ou localização..." />
      </Card>

      <Card>
        {filtrados.length === 0 ? <EmptyState icon="🔧" text="Nenhuma peça encontrada." /> : (
          <Table
            headers={["Código", "Descrição", "Cat./Sub.", "Local", "Qtd", "Mín.", "Preço Méd.", "Valor", "Status", "Últ. Mov."]}
            rows={filtrados.map(p => {
              const st = p.saldoCalculado === 0 ? "Zerado" : (p.estoqueMinimo > 0 && p.saldoCalculado <= p.estoqueMinimo ? "Baixo" : "OK");
              const cor = st === "OK" ? "green" : (st === "Baixo" ? "gold" : "red");
              return (
                <tr key={p.id} style={st !== "OK" ? { background: st === "Zerado" ? `${theme.danger}08` : `${theme.warning}08` } : {}}>
                  <Td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{p.codigo || "—"}</span></Td>
                  <Td><strong>{p.descricao || p.nome}</strong>{p.aplicacao ? <><br/><span style={{ fontSize: 10, color: theme.muted }}>📌 {p.aplicacao}</span></> : null}</Td>
                  <Td>{p.categoria || "—"}{p.subcategoria ? <><br/><span style={{ fontSize: 10, color: theme.muted }}>{p.subcategoria}</span></> : null}</Td>
                  <Td>{p.localizacao || "—"}</Td>
                  <Td><strong style={{ color: cor === "green" ? theme.accent : (cor === "gold" ? theme.warning : theme.danger) }}>{p.saldoCalculado.toLocaleString()} {p.unidade}</strong></Td>
                  <Td>{p.estoqueMinimo > 0 ? `${p.estoqueMinimo} ${p.unidade}` : "—"}</Td>
                  <Td>{p.precoUnitario > 0 ? `R$ ${p.precoUnitario.toFixed(2)}` : "—"}</Td>
                  <Td>{p.precoUnitario > 0 ? <strong style={{ color: theme.gold }}>R$ {(p.saldoCalculado * p.precoUnitario).toFixed(2)}</strong> : "—"}</Td>
                  <Td><Badge color={cor}>{st}</Badge></Td>
                  <Td style={{ fontSize: 11 }}>{p.ultimaMovimentacao ? `${formatDate(p.ultimaMovimentacao.data)} (${p.ultimaMovimentacao.tipo})` : "—"}</Td>
                </tr>
              );
            })}
          />
        )}
      </Card>

      {pecasBaixo.length > 0 && (
        <Card style={{ marginTop: 20, borderColor: `${theme.danger}44`, background: `${theme.danger}0a` }}>
          <div style={{ fontWeight: 700, color: theme.danger, marginBottom: 12 }}>🚨 ALERTA — {pecasBaixo.length} ITENS CRÍTICOS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 8 }}>
            {pecasBaixo.map(p => (
              <div key={p.id} style={{ padding: 10, background: `${theme.danger}10`, borderRadius: 8, border: `1px solid ${theme.danger}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.codigo} — {p.descricao || p.nome}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{p.categoria} | {p.localizacao || "S/local"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, color: theme.danger, fontSize: 16 }}>{p.saldoCalculado} {p.unidade}</div>
                  <div style={{ fontSize: 10, color: theme.muted }}>Mín: {p.estoqueMinimo}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── RELATÓRIO DE CONSUMO POR PERÍODO ────────────────────────────────────────
function RelatorioConsumo({ state }) {
  const pecas = state.pecas || [];
  const movs = state.movimentacaoPecas || [];
  const [periodoInicio, setPeriodoInicio] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0]; });
  const [periodoFim, setPeriodoFim] = useState(() => new Date().toISOString().split("T")[0]);

  const movsPerido = movs.filter(m => m.data >= periodoInicio && m.data <= periodoFim);
  const consumoPorPeca = {};
  movsPerido.filter(m => m.tipo === "Saída").forEach(m => {
    if (!consumoPorPeca[m.pecaId]) consumoPorPeca[m.pecaId] = { qtd: 0, custo: 0, count: 0 };
    consumoPorPeca[m.pecaId].qtd += parseFloat(m.quantidade) || 0;
    consumoPorPeca[m.pecaId].custo += (parseFloat(m.quantidade) || 0) * (parseFloat(m.custoUnitario) || 0);
    consumoPorPeca[m.pecaId].count++;
  });

  const ranking = Object.entries(consumoPorPeca).map(([pecaId, dados]) => {
    const peca = pecas.find(p => p.id === pecaId);
    return { pecaId, peca, ...dados };
  }).sort((a, b) => b.qtd - a.qtd);

  const totalConsumo = ranking.reduce((s, r) => s + r.qtd, 0);
  const totalCusto = ranking.reduce((s, r) => s + r.custo, 0);

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório de Consumo</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#f3f4f6;padding:6px 8px;text-align:left;border:1px solid #ddd}td{padding:6px 8px;border:1px solid #ddd}.footer{margin-top:20px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
    ${gerarCabecalhoHTML(faz, "RELATÓRIO DE CONSUMO", formatDate(periodoInicio) + " a " + formatDate(periodoFim))}
    <table><thead><tr><th>#</th><th>Código</th><th>Peça</th><th>Categoria</th><th>Qtd Saída</th><th>Nº Mov.</th><th>Custo Total</th></tr></thead><tbody>
    ${ranking.map((r, i) => `<tr><td>${i + 1}</td><td style="font-family:monospace">${r.peca?.codigo || "—"}</td><td><strong>${r.peca?.descricao || r.peca?.nome || "—"}</strong></td><td>${r.peca?.categoria || "—"}</td><td style="text-align:center"><strong>${r.qtd}</strong></td><td style="text-align:center">${r.count}</td><td style="text-align:right">R$ ${r.custo.toFixed(2)}</td></tr>`).join("")}
    </tbody></table>
    <div style="margin-top:12px;font-weight:700">Total Consumo: ${totalConsumo} unidades | Custo Total: R$ ${totalCusto.toFixed(2)}</div>
    <div class="footer">AgriGest · Relatório de Consumo</div></body></html>`);
    win.document.close(); setTimeout(() => win.print(), 400);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📋 Relatório de Consumo</h2>
        {ranking.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Imprimir</Btn>}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12, alignItems: "end" }}>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>De</label><Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} /></div>
          <div><label style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Até</label><Input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} /></div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Itens Consumidos", value: ranking.length, color: theme.info, icon: "🔧" },
          { label: "Total Saídas", value: totalConsumo.toFixed(0), color: theme.danger, icon: "📤" },
          { label: "Custo Total", value: `R$ ${totalCusto.toFixed(2)}`, color: theme.gold, icon: "💰" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>
      <Card>
        {ranking.length === 0 ? <EmptyState icon="📋" text="Nenhum consumo no período." /> : (
          <Table headers={["#", "Código", "Peça", "Cat.", "Qtd Saída", "Nº Mov.", "Custo Total"]} rows={ranking.map((r, i) => (
            <tr key={r.pecaId}>
              <Td>{i + 1}</Td>
              <Td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{r.peca?.codigo || "—"}</span></Td>
              <Td><strong>{r.peca?.descricao || r.peca?.nome || "—"}</strong></Td>
              <Td>{r.peca?.categoria || "—"}</Td>
              <Td><strong style={{ color: theme.danger }}>{r.qtd}</strong></Td>
              <Td>{r.count}</Td>
              <Td><strong style={{ color: theme.gold }}>R$ {r.custo.toFixed(2)}</strong></Td>
            </tr>
          ))} />
        )}
      </Card>
    </div>
  );
}

// ─── ETIQUETAS PARA IMPRESSÃO ────────────────────────────────────────────────
function EtiquetasPecas({ state }) {
  const pecas = state.pecas || [];
  const [selecionadas, setSelecionadas] = useState([]);
  const [busca, setBusca] = useState("");

  const filtradas = pecas.filter(p => {
    if (!busca) return true;
    return `${p.codigo} ${p.descricao} ${p.nome} ${p.categoria}`.toLowerCase().includes(busca.toLowerCase());
  });

  const toggle = (id) => setSelecionadas(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelecionadas(s => s.length === filtradas.length ? [] : filtradas.map(p => p.id));

  const imprimirEtiquetas = () => {
    const sel = pecas.filter(p => selecionadas.includes(p.id));
    if (sel.length === 0) { alert("Selecione ao menos uma peça!"); return; }
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Etiquetas</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:10px}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .etiq{border:2px solid #000;border-radius:6px;padding:10px;text-align:center;page-break-inside:avoid}
    .cod{font-family:monospace;font-size:18px;font-weight:900;letter-spacing:2px;margin:6px 0}
    .desc{font-size:11px;font-weight:700;margin-bottom:4px}
    .info{font-size:9px;color:#666}
    .barcode{font-family:'Libre Barcode 39',monospace;font-size:36px;line-height:1}
    @media print{body{padding:0}.grid{gap:4px}}
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
    </head><body><div class="grid">
    ${sel.map(p => `<div class="etiq">
      <div class="barcode">*${(p.codigo || "000").replace(/[^A-Z0-9-]/gi, "")}*</div>
      <div class="cod">${p.codigo || "—"}</div>
      <div class="desc">${p.descricao || p.nome || "—"}</div>
      <div class="info">${p.categoria || ""} ${p.subcategoria ? `/ ${p.subcategoria}` : ""} | ${p.localizacao || "S/L"}</div>
      <div class="info">Est: ${parseFloat(p.quantidade) || 0} ${p.unidade} | R$ ${(parseFloat(p.precoUnitario) || 0).toFixed(2)}</div>
    </div>`).join("")}
    </div></body></html>`);
    win.document.close(); setTimeout(() => win.print(), 600);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🏷️ Etiquetas para Impressão</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={toggleAll}>{selecionadas.length === filtradas.length ? "Desmarcar Todas" : "Selecionar Todas"}</Btn>
          <Btn onClick={imprimirEtiquetas} disabled={selecionadas.length === 0}>🖨️ Imprimir ({selecionadas.length})</Btn>
        </div>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar peça..." />
      </Card>
      <Card>
        {filtradas.length === 0 ? <EmptyState icon="🏷️" text="Nenhuma peça encontrada." /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
            {filtradas.map(p => {
              const sel = selecionadas.includes(p.id);
              return (
                <div key={p.id} onClick={() => toggle(p.id)} style={{ cursor: "pointer", border: `2px solid ${sel ? theme.accent : theme.border}`, borderRadius: 8, padding: 12, background: sel ? `${theme.accent}15` : theme.card, transition: "all .2s", textAlign: "center" }}>
                  <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16, marginBottom: 4 }}>{p.codigo || "—"}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{p.descricao || p.nome}</div>
                  <div style={{ fontSize: 10, color: theme.muted }}>{p.categoria} | {p.localizacao || "S/L"}</div>
                  <div style={{ fontSize: 10, color: theme.muted }}>Est: {parseFloat(p.quantidade) || 0} {p.unidade}</div>
                  {sel && <div style={{ marginTop: 6, color: theme.accent, fontWeight: 700, fontSize: 11 }}>✓ Selecionada</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── INVENTÁRIO / CONTAGEM DE ESTOQUE ────────────────────────────────────────
function InventarioEstoque({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.inventarios || [];
  const pecas = state.pecas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => {
    const itens = pecas.map(p => ({ pecaId: p.id, estoqueAtual: parseFloat(p.quantidade) || 0, contagem: "", divergencia: 0 }));
    setForm({ data: new Date().toISOString().split("T")[0], responsavel: "", status: "Em Andamento", itens, obs: "" });
    setEditing(null); setOpen(true);
  };

  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, inventarios: editing ? (s.inventarios || []).map(x => x.id === editing ? item : x) : [...(s.inventarios || []), item] }));
    setOpen(false);
  };

  const aplicarAjustes = (inv) => {
    if (!window.confirm("Aplicar ajustes ao estoque? As quantidades serão atualizadas conforme a contagem.")) return;
    setState(s => {
      const novasPecas = [...s.pecas];
      (inv.itens || []).forEach(it => {
        if (it.contagem !== "" && it.contagem !== undefined) {
          const idx = novasPecas.findIndex(p => p.id === it.pecaId);
          if (idx >= 0) novasPecas[idx] = { ...novasPecas[idx], quantidade: parseFloat(it.contagem) || 0 };
        }
      });
      const novasMovs = [...(s.movimentacaoPecas || [])];
      (inv.itens || []).forEach(it => {
        const diff = (parseFloat(it.contagem) || 0) - it.estoqueAtual;
        if (diff !== 0 && it.contagem !== "" && it.contagem !== undefined) {
          novasMovs.push({ id: uid(), pecaId: it.pecaId, tipo: diff > 0 ? "Entrada" : "Saída", quantidade: Math.abs(diff).toString(), data: inv.data, motivo: "Inventário (ajuste)", responsavel: inv.responsavel, destino: "Ajuste inventário" });
        }
      });
      const novsInvs = (s.inventarios || []).map(x => x.id === inv.id ? { ...x, status: "Concluído" } : x);
      return { ...s, pecas: novasPecas, movimentacaoPecas: novasMovs, inventarios: novsInvs };
    });
  };

  const updateContagem = (pecaId, val) => {
    setForm(f => ({
      ...f,
      itens: (f.itens || []).map(it => it.pecaId === pecaId ? { ...it, contagem: val, divergencia: (parseFloat(val) || 0) - it.estoqueAtual } : it)
    }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📝 Inventário / Contagem</h2>
        <Btn onClick={openNew}>+ Novo Inventário</Btn>
      </div>
      <Card style={{ marginBottom: 20 }}>
        {items.length === 0 ? <EmptyState icon="📝" text="Nenhum inventário realizado." /> : (
          <Table headers={["Data", "Responsável", "Itens", "Divergências", "Status", "Ações"]} rows={items.map(inv => {
            const divs = (inv.itens || []).filter(it => it.contagem !== "" && it.contagem !== undefined && it.divergencia !== 0);
            return (
              <tr key={inv.id}>
                <Td>{formatDate(inv.data)}</Td>
                <Td>{inv.responsavel || "—"}</Td>
                <Td>{(inv.itens || []).length}</Td>
                <Td><Badge color={divs.length > 0 ? "red" : "green"}>{divs.length}</Badge></Td>
                <Td><Badge color={inv.status === "Concluído" ? "green" : "gold"}>{inv.status}</Badge></Td>
                <Td>
                  <div style={{ display: "flex", gap: 4 }}>
                    {inv.status !== "Concluído" && <Btn size="sm" variant="success" onClick={() => aplicarAjustes(inv)}>✅ Aplicar</Btn>}
                    <Btn size="sm" variant="secondary" onClick={() => { setForm({ ...inv }); setEditing(inv.id); setOpen(true); }}>✏️</Btn>
                  </div>
                </Td>
              </tr>
            );
          })} />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Inventário`} width={800}>
        <Row>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
          <Field label="Responsável"><Input value={form.responsavel} onChange={e => fp("responsavel", e.target.value)} placeholder="Nome do responsável" /></Field>
        </Row>
        {(form.itens || []).length > 0 && (
          <div style={{ maxHeight: 400, overflow: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr>
                <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: `1px solid ${theme.border}`, color: theme.muted, fontSize: 10 }}>Peça</th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: `1px solid ${theme.border}`, color: theme.muted, fontSize: 10 }}>Est. Atual</th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: `1px solid ${theme.border}`, color: theme.muted, fontSize: 10 }}>Contagem</th>
                <th style={{ textAlign: "center", padding: "6px 8px", borderBottom: `1px solid ${theme.border}`, color: theme.muted, fontSize: 10 }}>Diferença</th>
              </tr></thead>
              <tbody>
                {(form.itens || []).map(it => {
                  const peca = pecas.find(p => p.id === it.pecaId);
                  const diff = it.contagem !== "" && it.contagem !== undefined ? (parseFloat(it.contagem) || 0) - it.estoqueAtual : null;
                  return (
                    <tr key={it.pecaId} style={diff !== null && diff !== 0 ? { background: `${diff > 0 ? theme.accent : theme.danger}10` } : {}}>
                      <td style={{ padding: "6px 8px", borderBottom: `1px solid ${theme.border}` }}><strong>{peca?.codigo}</strong> — {peca?.descricao || peca?.nome}</td>
                      <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: `1px solid ${theme.border}` }}>{it.estoqueAtual} {peca?.unidade}</td>
                      <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: `1px solid ${theme.border}` }}>
                        <input type="number" step="0.01" value={it.contagem} onChange={e => updateContagem(it.pecaId, e.target.value)}
                          style={{ width: 80, textAlign: "center", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: 4, padding: "4px 8px", fontFamily: "inherit" }} />
                      </td>
                      <td style={{ textAlign: "center", padding: "6px 8px", borderBottom: `1px solid ${theme.border}`, fontWeight: 700, color: diff === null ? theme.muted : diff === 0 ? theme.accent : diff > 0 ? theme.accent : theme.danger }}>
                        {diff === null ? "—" : diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

// ─── GRÁFICOS DE MOVIMENTAÇÃO ────────────────────────────────────────────────
function GraficosMovimentacao({ state }) {
  const pecas = state.pecas || [];
  const movs = state.movimentacaoPecas || [];

  // Agrupar por mês
  const porMes = {};
  movs.forEach(m => {
    const mes = m.data ? m.data.substring(0, 7) : "S/data";
    if (!porMes[mes]) porMes[mes] = { entradas: 0, saidas: 0, custoE: 0, custoS: 0 };
    const qtd = parseFloat(m.quantidade) || 0;
    const custo = qtd * (parseFloat(m.custoUnitario) || 0);
    if (m.tipo === "Entrada") { porMes[mes].entradas += qtd; porMes[mes].custoE += custo; }
    else { porMes[mes].saidas += qtd; porMes[mes].custoS += custo; }
  });
  const meses = Object.keys(porMes).sort();

  // Consumo por categoria
  const porCat = {};
  movs.filter(m => m.tipo === "Saída").forEach(m => {
    const peca = pecas.find(p => p.id === m.pecaId);
    const cat = peca?.categoria || "Outros";
    porCat[cat] = (porCat[cat] || 0) + (parseFloat(m.quantidade) || 0);
  });
  const catEntries = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries.length > 0 ? catEntries[0][1] : 1;

  // Top 10 peças mais consumidas
  const consumoPeca = {};
  movs.filter(m => m.tipo === "Saída").forEach(m => {
    consumoPeca[m.pecaId] = (consumoPeca[m.pecaId] || 0) + (parseFloat(m.quantidade) || 0);
  });
  const top10 = Object.entries(consumoPeca).map(([id, qtd]) => ({ peca: pecas.find(p => p.id === id), qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 10);
  const maxTop = top10.length > 0 ? top10[0].qtd : 1;

  const barColors = [theme.accent, theme.info, theme.gold, theme.danger, "#9b59b6", "#e67e22", "#1abc9c", "#e74c3c", "#3498db", "#2ecc71"];

  return (
    <div>
      <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 20 }}>📈 Gráficos de Movimentação</h2>

      {meses.length === 0 ? <Card><EmptyState icon="📈" text="Sem dados de movimentação para gerar gráficos." /></Card> : (
        <>
          <Card style={{ marginBottom: 20, padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>📊 Entradas vs Saídas por Mês</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200, borderBottom: `1px solid ${theme.border}`, paddingBottom: 8 }}>
              {meses.map(mes => {
                const d = porMes[mes];
                const maxVal = Math.max(...meses.map(m => Math.max(porMes[m].entradas, porMes[m].saidas)), 1);
                return (
                  <div key={mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 160 }}>
                      <div style={{ width: 18, height: `${(d.entradas / maxVal) * 150}px`, background: theme.accent, borderRadius: "4px 4px 0 0", minHeight: 2 }} title={`Entradas: ${d.entradas}`} />
                      <div style={{ width: 18, height: `${(d.saidas / maxVal) * 150}px`, background: theme.danger, borderRadius: "4px 4px 0 0", minHeight: 2 }} title={`Saídas: ${d.saidas}`} />
                    </div>
                    <div style={{ fontSize: 9, color: theme.muted, textAlign: "center" }}>{mes.substring(5)}/{mes.substring(2, 4)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
              <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: theme.accent, display: "inline-block" }} /> Entradas</span>
              <span style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: theme.danger, display: "inline-block" }} /> Saídas</span>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20, marginBottom: 20 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>📦 Consumo por Categoria</div>
              {catEntries.map(([cat, qtd], i) => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span>{cat}</span><strong>{qtd}</strong>
                  </div>
                  <div style={{ height: 14, background: `${theme.border}44`, borderRadius: 7, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(qtd / maxCat) * 100}%`, background: barColors[i % barColors.length], borderRadius: 7, transition: "width .5s" }} />
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>🏆 Top 10 — Mais Consumidas</div>
              {top10.map((item, i) => (
                <div key={item.peca?.id || i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span>{item.peca?.codigo} — {item.peca?.descricao || item.peca?.nome || "—"}</span><strong>{item.qtd}</strong>
                  </div>
                  <div style={{ height: 14, background: `${theme.border}44`, borderRadius: 7, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(item.qtd / maxTop) * 100}%`, background: barColors[i % barColors.length], borderRadius: 7, transition: "width .5s" }} />
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── REQUISIÇÕES DE COMPRA (ALMOXARIFADO) ────────────────────────────────────
function RequisicoesCompra({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.requisicoesCompra || [];
  const pecas = state.pecas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ data: new Date().toISOString().split("T")[0], status: "Pendente", prioridade: "Normal", numero: `REQ-${padNum((items.length || 0) + 1)}` }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => { if (window.confirm("Excluir?")) setState(s => ({ ...s, requisicoesCompra: (s.requisicoesCompra || []).filter(x => x.id !== id) })); };
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, requisicoesCompra: editing ? (s.requisicoesCompra || []).map(x => x.id === editing ? item : x) : [...(s.requisicoesCompra || []), item] }));
    setOpen(false);
  };

  const gerarAutomatica = () => {
    const pecasBaixo = pecas.filter(p => { const q = parseFloat(p.quantidade) || 0, m = parseFloat(p.estoqueMinimo) || 0; return m > 0 && q <= m; });
    if (pecasBaixo.length === 0) { alert("Nenhuma peça com estoque baixo!"); return; }
    const desc = pecasBaixo.map(p => `• ${p.codigo} — ${p.descricao || p.nome}: Atual ${parseFloat(p.quantidade) || 0} / Mín ${p.estoqueMinimo} ${p.unidade}`).join("\n");
    setForm({ data: new Date().toISOString().split("T")[0], status: "Pendente", prioridade: "Urgente", numero: `REQ-${padNum((items.length || 0) + 1)}`, descricao: `REPOSIÇÃO AUTO (${pecasBaixo.length} itens):\n${desc}`, solicitante: "Sistema" });
    setEditing(null); setOpen(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📝 Requisições de Compra</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="gold" onClick={gerarAutomatica}>⚡ Gerar Automática</Btn>
          <Btn onClick={openNew}>+ Nova Requisição</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Pendentes", value: items.filter(r => r.status === "Pendente").length, color: theme.warning, icon: "⏳" },
          { label: "Aprovadas", value: items.filter(r => r.status === "Aprovada").length, color: theme.accent, icon: "✅" },
          { label: "Total", value: items.length, color: theme.info, icon: "📝" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 24, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {items.length === 0 ? <EmptyState icon="📝" text="Nenhuma requisição." /> : (
          <Table
            headers={["Nº", "Data", "Descrição", "Solicitante", "Prioridade", "Status", "Ações"]}
            rows={items.map(r => (
              <tr key={r.id}>
                <Td><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{r.numero || "—"}</span></Td>
                <Td>{formatDate(r.data)}</Td>
                <Td style={{ maxWidth: 300 }}><div style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{(r.descricao || "—").substring(0, 100)}{(r.descricao || "").length > 100 ? "..." : ""}</div></Td>
                <Td>{r.solicitante || "—"}</Td>
                <Td><Badge color={r.prioridade === "Urgente" ? "red" : r.prioridade === "Alta" ? "gold" : "blue"}>{r.prioridade || "Normal"}</Badge></Td>
                <Td><Badge color={r.status === "Aprovada" ? "green" : r.status === "Concluída" ? "blue" : r.status === "Cancelada" ? "red" : "gold"}>{r.status || "Pendente"}</Badge></Td>
                <Td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(r.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Requisição`} width={600}>
        <Row>
          <Field label="Número"><Input value={form.numero} onChange={e => fp("numero", e.target.value)} placeholder="REQ-00001" /></Field>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Solicitante"><Input value={form.solicitante} onChange={e => fp("solicitante", e.target.value)} placeholder="Quem solicitou" /></Field>
          <Field label="Prioridade">
            <Select value={form.prioridade} onChange={e => fp("prioridade", e.target.value)}>
              {["Baixa", "Normal", "Alta", "Urgente"].map(p => <option key={p}>{p}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Status">
          <Select value={form.status} onChange={e => fp("status", e.target.value)}>
            {["Pendente", "Aprovada", "Em Compra", "Concluída", "Cancelada"].map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Descrição / Itens">
          <textarea value={form.descricao || ""} onChange={e => fp("descricao", e.target.value)} rows={5} placeholder="Descreva as peças, quantidades e urgência..." style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        </Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── FICHAS DE APLICAÇÃO (DEFENSIVOS/INSUMOS) ─────────────────────────────────
function FichasAplicacao({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState({});
  const [itensForm, setItensForm] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const items = state.fichasAplicacao || [];
  const insumos = state.insumos || [];
  const estoqueInsumos = state.estoqueInsumos || [];
  const talhoes = state.talhoes || [];

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
    const saldo = getSaldoInsumo(form.insumoId);
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
    const areaTotal = parseFloat(talhaoInfo?.area) || 0;
    const isPreview = !ficha.id || ficha.id.toString().startsWith("preview");
    
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
        .badge-preview { background:#f59e0b; }
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
          <span class="badge ${isPreview ? 'badge-preview' : ''}">${isPreview ? "PRÉ-VISUALIZAÇÃO" : "FICHA DE APLICAÇÃO"}</span>
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
          <td style="text-align:center;font-size:13px;color:#16a34a">${ficha.itens.length}</td>
        </tr>
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
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const imprimirLista = () => {
    if (items.length === 0) { alert("Não há fichas para imprimir."); return; }
    const faz = state.fazenda || {};
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Lista de Fichas</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:24px;font-size:11px}
    ${gerarCabecalhoCSS()}
    table{width:100%;border-collapse:collapse}th{background:#1e293b;color:#fff;padding:8px 10px;font-size:9px;text-transform:uppercase;text-align:left}
    td{padding:6px 10px;border:1px solid #dee2e6}tr:nth-child(even)td{background:#f8fafc}
    .f{margin-top:20px;text-align:center;font-size:8px;color:#aaa;border-top:1px solid #eee;padding-top:8px}</style>
    </head><body>
    ${gerarCabecalhoHTML(faz, "FICHAS DE APLICAÇÃO", "")}
    <table><thead><tr><th>Nº</th><th>Data</th><th>Talhão</th><th>Cultura</th><th>Tipo</th><th>Produtos</th><th>Responsável</th></tr></thead>
    <tbody>${items.map(f => `<tr>
      <td style="font-family:monospace;font-weight:700">${f.numero}</td>
      <td>${f.data}</td>
      <td>${f.talhao||"—"}</td>
      <td>${f.cultura||"—"}</td>
      <td>${f.tipo||"—"}</td>
      <td>${f.itens?.length||0}</td>
      <td>${f.responsavel||"—"}</td>
    </tr>`).join("")}</tbody></table>
    <div class="f">AgriGest · ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const PreviewFicha = ({ ficha }) => {
    const faz = state.fazenda || {};
    const talhaoInfo = talhoes.find(t => t.nome === ficha.talhao);
    const areaTotal = parseFloat(talhaoInfo?.area) || 0;
    const sec = (label) => (
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, color: "#166534", background: "#f0fdf4", borderLeft: "3px solid #16a34a", padding: "4px 10px", margin: "12px 0 8px", borderRadius: "0 4px 4px 0" }}>
        {label}
      </div>
    );
    return (
      <div style={{ background: "#fff", color: "#1e293b", fontFamily: "system-ui, sans-serif", fontSize: 12 }}>
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

        {sec("Informações Gerais")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginTop: 20 }}>
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
                    <Btn size="sm" variant="info" onClick={() => openView(f)}>👁️ Ver</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(f)}>✏️</Btn>
                    <Btn size="sm" variant="gold" onClick={() => imprimirFicha(f)}>🖨️</Btn>
                    <Btn size="sm" variant="gold" onClick={() => imprimirFicha(f)}>📄 PDF</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(f.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

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
                if (talh?.culturas?.[0]) fp("cultura", talh.culturas[0].grao);
              }}>
                <option value="">Selecione o talhão...</option>
                {talhoes.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
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

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Ficha — ${viewItem?.numero || ""}`} width={820}>
        {viewItem && (
          <div>
            <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, background: "#fff", marginBottom: 16 }}>
              <PreviewFicha ficha={viewItem} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="info" onClick={() => imprimirFicha(viewItem)}>🖨️ Imprimir</Btn>
              <Btn variant="gold" onClick={() => imprimirFicha(viewItem)}>📄 Salvar PDF</Btn>
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
    if (!porCliente[r.cliente]) porCliente[r.cliente] = { kg: 0, sc: 0, cargas: [] };
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
    let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Relatório de Carregamentos</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}
        ${gerarCabecalhoCSS()}
        table{width:100%;border-collapse:collapse;margin-bottom:14px}
        th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd}
        td{padding:7px 10px;border:1px solid #ddd}
        .tot td{font-weight:700;background:#f0fdf4}
        .footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center}
      </style>
    </head>
    <body>
      ${gerarCabecalhoHTML(faz, "RELATÓRIO DE CARREGAMENTOS", "")}
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Total (kg)</th>
            <th>Sacas (60kg)</th>
            <th>Cargas</th>
          </tr>
        </thead>
        <tbody>`;
    
    for (const [nome, dados] of Object.entries(porCliente)) {
      html += `
          <tr>
            <td><strong>${nome}</strong></td>
            <td style="text-align:right">${dados.kg.toLocaleString()} kg</td>
            <td style="text-align:center">${Math.round(dados.sc).toLocaleString()} sc</td>
            <td style="text-align:center">${dados.cargas.length}</td>
          </tr>`;
    }
    
    html += `
        </tbody>
        <tfoot>
          <tr class="tot">
            <td><strong>TOTAIS</strong></td>
            <td style="text-align:right"><strong>${totalKg.toLocaleString()} kg</strong></td>
            <td style="text-align:center"><strong>${Math.round(totalSc).toLocaleString()} sc</strong></td>
            <td style="text-align:center"><strong>${dadosFiltrados.length} cargas</strong></td>
          </tr>
        </tfoot>
      </table>
      <div class="footer">AgriGest · Relatório de Carregamentos</div>
    </body>
    </html>`;
    
    win.document.write(html);
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
          <div>
            <label style={labelStyle}>👥 Cliente</label>
            <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} style={selectStyle}>
              <option value="">Todos os clientes</option>
              {clientes.map(c => <option key={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>📋 Contrato</label>
            <select value={filtroContrato} onChange={e => setFiltroContrato(e.target.value)} style={selectStyle}>
              <option value="">Todos os contratos</option>
              {contratos.map(c => <option key={c.id}>{c.numero}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>📅 Período — Início</label>
            <input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} style={selectStyle} />
          </div>
          <div>
            <label style={labelStyle}>📅 Período — Fim</label>
            <input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} style={selectStyle} />
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
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

  const gerarHTMLRelatorio = () => {
    const faz = state.fazenda || {};
    return `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8"/>
      <title>Relatório Diário de Colheita - ${dataFiltro}</title>
       <style>
         *{box-sizing:border-box;margin:0;padding:0}
         body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;font-size:12px;color:#111;background:#fff}
         .container{max-width:1200px;margin:0 auto}
         ${gerarCabecalhoCSS()}
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
         @media print{body{padding:0;margin:0}}
       </style>
     </head>
     <body>
       <div class="container">


        
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
        `}).join("")}
        
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
          <div><label style={labelStyle}>📅 Data</label><input type="date" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} style={selectStyle} /></div>
          <div><label style={labelStyle}>🗺️ Talhão</label><select value={filtroTalhao} onChange={e => setFiltroTalhao(e.target.value)} style={selectStyle}><option value="">Todos os talhões</option>{talhoesLista.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
      </Card>

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

      {talhaoEntries.length === 0 ? (
        <Card><EmptyState icon="📅" text={dataFiltro ? `Nenhum recebimento registrado em ${dataFiltro}.` : "Selecione uma data para ver o relatório."} /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {talhaoEntries.map(([nome, dados]) => {
            const sacasTalhao = dados.totalKg / SC_KG;
            const info = talhoes.find(t => t.nome === nome);
            const areaTotal = (info?.culturas || []).reduce((a, c) => a + (parseFloat(c.area) || 0), 0);
            const produtividade = areaTotal > 0 ? (sacasTalhao / areaTotal).toFixed(1) : null;
            return (
              <Card key={nome} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", background: `${theme.accent}0a`, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: `${theme.accent}22`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🗺️</div>
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
          <Card style={{ background: `${theme.accent}0a`, borderColor: `${theme.accent}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>▶ TOTAL GERAL DO DIA</span>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Talhões</div><div style={{ fontWeight: 900, fontSize: 22, color: theme.gold }}>{talhaoEntries.length}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Cargas</div><div style={{ fontWeight: 900, fontSize: 22, color: theme.info }}>{totalCargasDia}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Sacas</div><div style={{ fontWeight: 900, fontSize: 22, color: theme.accent }}>{Math.round(totalSacasDia).toLocaleString()} sc</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", letterSpacing: 1 }}>Toneladas</div><div style={{ fontWeight: 900, fontSize: 22, color: theme.accentLight }}>{(totalKgDia / 1000).toFixed(1)} t</div></div>
              </div>
            </div>
          </Card>
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
     <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}h2{font-size:13px;margin:18px 0 8px;font-weight:800;border-left:4px solid #16a34a;padding-left:9px}table{width:100%;border-collapse:collapse;margin-bottom:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd;font-size:11px}.tot td{font-weight:700;background:#f0fdf4}.grand td{font-weight:900;background:#dcfce7;font-size:13px}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:8px}</style></head><body>
     ${gerarCabecalhoHTML(faz, "RELATÓRIO DE MOTORISTAS", periodoLabel)}
    ${dados.map(d => `
      <h2>👷 ${d.nome}</h2>
      <table>
        <tr><th>Data</th><th>Viagens no Dia</th><th>Toneladas no Dia</th><th>Sacos no Dia</th></tr>
        ${d.diasDetalhes.map(dd => `<tr><td style="white-space:nowrap">${dd.data}</td><td style="text-align:center">${dd.viagensDia}</td><td style="text-align:right">${dd.tonDia} t</td><td style="text-align:right">${dd.sacosDia} sc</td>`).join("")}
        <tr class="tot"><td>TOTAL</td><td style="text-align:center">${d.totalViagens} viagens</td><td style="text-align:right">${d.totalTon.toFixed(3)} t</td><td style="text-align:right">${Math.round(d.totalSacos).toLocaleString()} sc</td></tr>
        <tr class="tot"><td>MÉDIA/VIAGEM</td><td>—</td><td style="text-align:right">${d.mediaTon.toFixed(3)} t</td><td style="text-align:right">${d.mediaSacos.toFixed(1)} sc</td></tr>
      </table>
    `).join("")}
    <table><tr class="grand"><td>▶ TOTAIS GERAIS</td><td style="text-align:center">${grandTotalViagens} viagens</td><td style="text-align:right">${grandTotalTon.toFixed(3)} t</td><td style="text-align:right">${Math.round(grandTotalSacos).toLocaleString()} sc</td></tr>
    </table>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>👷 Motorista</label><select value={filtroMotorista} onChange={e => setFiltroMotorista(e.target.value)} style={selectStyle}><option value="">Todos os motoristas</option>{motoristasLista.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label style={labelStyle}>🚛 Transportadora</label><select value={filtroTransportadora} onChange={e => setFiltroTransportadora(e.target.value)} style={selectStyle}><option value="">Todas as transportadoras</option>{transportadorasLista.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div><label style={labelStyle}>📅 Data Exata</label><input type="date" value={filtroData} onChange={e => { setFiltroData(e.target.value); setPeriodoInicio(""); setPeriodoFim(""); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>📅 Período — Início</label><input type="date" value={periodoInicio} onChange={e => { setPeriodoInicio(e.target.value); setFiltroData(""); }} style={inputStyle} /></div>
          <div><label style={labelStyle}>📅 Período — Fim</label><input type="date" value={periodoFim} onChange={e => { setPeriodoFim(e.target.value); setFiltroData(""); }} style={inputStyle} /></div>
        </div>
        {temFiltro && (<div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}><button onClick={limpar} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.muted, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>✕ Limpar filtros</button></div>)}
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
                  <div><div style={{ fontWeight: 700, fontSize: 16 }}>{d.nome}</div><div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{d.totalViagens} viagens · {d.diasDetalhes.length} dia(s){d.transpMotorista.length > 0 && <span style={{ marginLeft: 10, color: theme.gold }}>🚛 {d.transpMotorista.join(", ")}</span>}</div></div>
                </div>
                <button onClick={() => toggleExpand(d.nome)} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.muted, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>{expandido[d.nome] ? "▲ Recolher" : "▼ Ver detalhes"}</button>
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
                    <thead><tr style={{ background: theme.surface }}>{["Data", "Viagens no Dia", "Toneladas no Dia", "Sacos no Dia"].map(h => <th key={h} style={{ textAlign: "left", padding: "9px 20px", fontSize: 11, color: theme.muted, borderBottom: `1px solid ${theme.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{d.diasDetalhes.map(dd => (<tr key={dd.data} style={{ borderBottom: `1px solid ${theme.border}18` }}><td style={{ padding: "10px 20px", fontSize: 13 }}>{dd.data}</td><td style={{ padding: "10px 20px", fontSize: 13 }}><span style={{ background: `${theme.info}22`, color: theme.info, border: `1px solid ${theme.info}44`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{dd.viagensDia} viagem(ns)</span></td><td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: theme.accent }}>{dd.tonDia} t</td><td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: theme.gold }}>{dd.sacosDia} sc</td></tr>))}</tbody>
                    <tfoot><tr style={{ background: `${theme.accent}0f`, borderTop: `1px solid ${theme.border}` }}><td style={{ padding: "10px 20px", fontSize: 12, fontWeight: 700, color: theme.muted }}>TOTAL</td><td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: theme.info }}>{d.totalViagens} viagens</td><td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: theme.accent }}>{d.totalTon.toFixed(3)} t</td><td style={{ padding: "10px 20px", fontSize: 13, fontWeight: 700, color: theme.gold }}>{Math.round(d.totalSacos).toLocaleString()} sc</td></tr></tfoot>
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
  
  const clientes = state.clientes || [];
  const caminhoes = state.caminhoes || [];
  const motoristas = state.motoristas || [];
  const transportadoras = state.transportadoras || [];
  
  const [configPix, setConfigPix] = useState(state.configPixVenda || {
    chave: "",
    tipo: "CPF",
    nomeTitular: "",
    cidade: "",
    instrucoes: "Após o pagamento, envie o comprovante para o WhatsApp da fazenda."
  });

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const openNew = () => { 
    setForm({ data: new Date().toISOString().split("T")[0], status: "Pendente", formaPagamento: "PIX" }); 
    setEditing(null); setOpen(true); 
  };
  const openEdit = (venda) => { setForm({ ...venda }); setEditing(venda.id); setOpen(true); };
  const openView = (venda) => { setViewItem(venda); setViewOpen(true); };
  const del = (id) => { if (window.confirm("Excluir esta venda? Não reverterá a baixa no estoque.")) setState(s => ({ ...s, vendasMilho: s.vendasMilho.filter(x => x.id !== id) })); };

  const calcularPorSacas = () => {
    const qtdSacas = parseFloat(form.quantidadeSacas) || 0;
    const precoSaca = parseFloat(form.precoSaca) || 0;
    return { valorTotal: qtdSacas * precoSaca, pesoTotalKg: qtdSacas * 60, qtdSacas, precoSaca };
  };
  const calcularPorPesagem = () => {
    const pesoBruto = parseFloat(form.pesoBruto) || 0;
    const pesoTara = parseFloat(form.pesoTara) || 0;
    const pesoLiquido = Math.max(0, pesoBruto - pesoTara);
    const qtdSacasCalc = pesoLiquido / 60;
    const precoSaca = parseFloat(form.precoSaca) || 0;
    return { pesoLiquido, qtdSacasCalc, valorTotal: qtdSacasCalc * precoSaca, precoSaca, pesoBruto, pesoTara };
  };
  const isUsandoPesagem = () => (form.pesoBruto && form.pesoBruto > 0) || (form.pesoTara && form.pesoTara > 0);
  const getValoresAtuais = () => {
    if (isUsandoPesagem()) {
      const { pesoLiquido, qtdSacasCalc, valorTotal, precoSaca, pesoBruto, pesoTara } = calcularPorPesagem();
      return { quantidadeSacas: qtdSacasCalc, valorTotal, pesoTotalKg: pesoLiquido, precoSaca, pesoBruto, pesoTara, pesoLiquido };
    } else {
      const { qtdSacas, valorTotal, pesoTotalKg, precoSaca } = calcularPorSacas();
      return { quantidadeSacas: qtdSacas, valorTotal, pesoTotalKg, precoSaca, pesoBruto: 0, pesoTara: 0, pesoLiquido: pesoTotalKg };
    }
  };
  const getEstoqueMilho = () => {
    const entradas = state.romaneiosEntrada?.filter(r => r.grao === "Milho") || [];
    const saidas = state.romaneiosSaida?.filter(r => r.grao === "Milho") || [];
    const vendas = state.vendasMilho || [];
    const totalEntrada = entradas.reduce((sum, r) => sum + (parseFloat(r.pesoFinal) || 0), 0);
    const totalSaida = saidas.reduce((sum, r) => sum + (parseFloat(r.pesoFinal) || 0), 0);
    const totalVendas = vendas.reduce((sum, v) => sum + (v.pesoTotalKg || 0), 0);
    const saldoKg = totalEntrada - totalSaida - totalVendas;
    return { saldoKg, saldoSacas: Math.max(0, saldoKg / 60) };
  };

  const valores = getValoresAtuais();
  const { saldoSacas } = getEstoqueMilho();
  const { quantidadeSacas, valorTotal, pesoTotalKg, precoSaca, pesoBruto, pesoTara, pesoLiquido } = valores;

  const handleVisualizarAntesSalvar = () => {
    if (!form.cliente) { alert("Selecione o cliente!"); return; }
    if (!form.transportadora && !form.motorista && !form.placa) { alert("Preencha pelo menos transportadora, motorista ou placa!"); return; }
    const qtdAtual = quantidadeSacas;
    if (qtdAtual <= 0) { alert("Informe a quantidade de sacas ou realize a pesagem!"); return; }
    if (qtdAtual > saldoSacas) { alert(`Estoque insuficiente! Disponível: ${Math.floor(saldoSacas)} sacas`); return; }
    const vendaPreview = { ...form, numero: editing ? form.numero : `VENDA-${padNum((items.length + 1))}`, quantidadeSacas: qtdAtual, valorTotal, pesoTotalKg, precoSaca, pesoBruto, pesoTara, pesoLiquido, dataCriacao: new Date().toISOString(), id: "preview_" + Date.now() };
    setPreviewData(vendaPreview);
    setPreviewOpen(true);
  };

  const confirmarSalvar = () => {
    const vendaFinal = { ...previewData, id: editing || uid(), status: form.status || "Confirmada" };
    setState(s => ({ ...s, vendasMilho: editing ? s.vendasMilho.map(x => x.id === editing ? vendaFinal : x) : [...(s.vendasMilho || []), vendaFinal], configPixVenda: configPix }));
    setPreviewOpen(false); setOpen(false); setForm({}); setPreviewData(null);
  };

  const gerarHTMLRomaneio = (venda) => {
    const faz = state.fazenda || {};
    const chavePix = configPix.chave;
    const tipoChave = configPix.tipo === "CPF" ? "CPF" : configPix.tipo === "CNPJ" ? "CNPJ" : configPix.tipo === "Email" ? "E-mail" : "Telefone";
    const isPreview = venda.id?.toString().startsWith("preview");
    return `<!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"/><title>Romaneio de Venda - ${venda.numero}</title>
    <style>@page{size:A4 portrait;margin:1.2cm 1.4cm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#1e293b;background:#fff;padding:20px}.container{max-width:1100px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #d4a843;padding-bottom:12px;margin-bottom:16px;gap:12px}.cab-l{display:flex;align-items:center;gap:12px}.logo{width:52px;height:52px;object-fit:contain;border-radius:8px}.logo-ph{width:52px;height:52px;background:#fef3c7;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:26px;border:1px solid #fcd34d}.faz-nome{font-size:15px;font-weight:900;color:#0f172a}.faz-sub{font-size:9px;color:#475569;margin-top:2px;line-height:1.5}.cab-r{text-align:right}.badge{background:#d4a843;color:#0f172a;font-size:8px;font-weight:800;letter-spacing:1.5px;padding:4px 12px;border-radius:20px;text-transform:uppercase}.badge-preview{background:#f59e0b}.num{font-size:24px;font-weight:900;font-family:monospace;color:#0f172a;margin-top:5px}.dt{font-size:9px;color:#64748b;margin-top:2px}.sec{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#92400e;background:#fef3c7;border-left:4px solid #d4a843;padding:4px 10px;margin:14px 0 8px;border-radius:0 4px 4px 0}.info-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:8px}.ii{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;font-size:10px}.ii:nth-child(even){border-right:none}.il{font-weight:700;color:#475569;font-size:9px}.iv{color:#0f172a;font-weight:500}.iv.g{color:#d4a843;font-weight:700}.pix-box{background:#f0f9ff;border:2px solid #d4a843;border-radius:12px;padding:16px;margin:16px 0;text-align:center}.pix-title{font-size:14px;font-weight:800;color:#d4a843;margin-bottom:10px}.pix-chave{font-family:monospace;font-size:16px;font-weight:700;background:#fff;padding:8px 16px;border-radius:8px;display:inline-block;letter-spacing:1px}.qrcode-placeholder{width:120px;height:120px;background:#fff;border:1px solid #ddd;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:10px auto;font-size:40px}table{width:100%;border-collapse:collapse;margin-bottom:8px}th{background:#1e293b;color:#fff;padding:6px 10px;font-size:8.5px;text-transform:uppercase;letter-spacing:1px;font-weight:700;text-align:left}td{padding:6px 10px;border:1px solid #e2e8f0;font-size:10px}tr:nth-child(even) td{background:#f8fafc}.pesagem-box{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:8px 0;background:#f8fafc}.peso-item{flex:1;text-align:center;padding:8px 5px;border-right:1px solid #e2e8f0}.peso-item:last-child{border-right:none}.peso-item.destaque{background:#fef3c7}.peso-sep{font-size:14px;font-weight:900;color:#94a3b8;padding:0 6px;flex-shrink:0}.peso-lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px}.peso-val{font-size:14px;font-weight:900;color:#1e293b}.peso-val.green{color:#16a34a}.assinaturas{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:22px}.ass{text-align:center}.asl{border-top:1.5px solid #0f172a;padding-top:5px;margin-bottom:3px}.asn{font-size:9px;font-weight:700;color:#334155}.footer{margin-top:16px;font-size:7.5px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;padding-top:6px}@media print{body{padding:0}}</style>
    </head>
    <body><div class="container"><div class="header"><div class="cab-l">${faz.logo ? `<img src="${faz.logo}" class="logo"/>` : '<div class="logo-ph">🌾</div>'}<div><div class="faz-nome">${faz.nome || "FAZENDA"}</div><div class="faz-sub">Produtor: <strong>${faz.produtor || "—"}</strong></div><div class="faz-sub">CNPJ/CPF: ${faz.cpfCnpj || "—"} | IE: ${faz.ie || "—"}</div><div class="faz-sub">${faz.endereco || ""} ${faz.numero || ""}, ${faz.cidade || ""}/${faz.estado || ""}</div></div></div><div class="cab-r"><span class="badge ${isPreview ? 'badge-preview' : ''}">${isPreview ? "PRÉ-VISUALIZAÇÃO" : "ROMANEIO DE VENDA"}</span><div class="num">${venda.numero}</div><div class="dt">Emitido em ${new Date().toLocaleString("pt-BR")}</div></div></div>
    <div class="sec">📋 INFORMAÇÕES DA VENDA</div><div class="info-grid"><div class="ii"><span class="il">📅 Data da Venda</span><span class="iv">${venda.data || "—"}</span></div><div class="ii"><span class="il">👤 Cliente</span><span class="iv g">${venda.cliente || "—"}</span></div><div class="ii"><span class="il">🚛 Transportadora</span><span class="iv">${venda.transportadora || "—"}</span></div><div class="ii"><span class="il">🚜 Motorista</span><span class="iv">${venda.motorista || "—"}</span></div><div class="ii"><span class="il">🚛 Placa do Caminhão</span><span class="iv">${venda.placa || "—"}</span></div><div class="ii"><span class="il">💳 Forma de Pagamento</span><span class="iv">${venda.formaPagamento || "PIX"}</span></div></div>
    <div class="sec">⚖️ PESAGEM</div><div class="pesagem-box"><div class="peso-item"><div class="peso-lbl">PESO BRUTO</div><div class="peso-val">${(venda.pesoBruto || 0).toLocaleString("pt-BR")} <span style="font-size:9px">kg</span></div></div><div class="peso-sep">−</div><div class="peso-item"><div class="peso-lbl">TARA</div><div class="peso-val">${(venda.pesoTara || 0).toLocaleString("pt-BR")} <span style="font-size:9px">kg</span></div></div><div class="peso-sep">=</div><div class="peso-item destaque"><div class="peso-lbl">PESO LÍQUIDO</div><div class="peso-val green">${(venda.pesoLiquido || venda.pesoTotalKg || 0).toLocaleString("pt-BR")} <span style="font-size:9px">kg</span></div></div></div>
    <div class="sec">🌾 PRODUTO</div><table><thead><tr><th>Produto</th><th>Quantidade (sacas)</th><th>Peso Total (kg)</th><th>Valor Unitário</th><th>Valor Total</th></tr></thead><tbody><tr><td style="font-weight:700">🌽 Milho em Bag</td><td style="text-align:center">${(venda.quantidadeSacas || 0).toLocaleString()} sc</td><td style="text-align:center">${(venda.pesoTotalKg || 0).toLocaleString()} kg</td><td style="text-align:center">R$ ${(venda.precoSaca || 0).toFixed(2)}/sc</td><td style="text-align:center;font-weight:700;color:#d4a843">R$ ${(venda.valorTotal || 0).toLocaleString("pt-BR", {minimumFractionDigits:2})}</td></tr></tbody>
    </table>
    <div class="sec">💰 INFORMAÇÕES DE PAGAMENTO</div><div class="pix-box"><div class="pix-title">💳 PAGAMENTO VIA PIX</div><div class="qrcode-placeholder">📱 QR Code</div><div><strong>Chave PIX (${tipoChave}):</strong></div><div class="pix-chave">${chavePix || "____________________"}</div><div style="margin-top:12px;font-size:10px;color:#475569"><strong>Nome do Titular:</strong> ${configPix.nomeTitular || "—"}<br/><strong>Cidade:</strong> ${configPix.cidade || "—"}</div><div style="margin-top:8px;font-size:9px;color:#92400e;background:#fef3c7;padding:6px;border-radius:6px">⚠️ ${configPix.instrucoes || "Após o pagamento, envie o comprovante para o WhatsApp da fazenda."}</div></div>
    ${venda.observacoes ? `<div class="obs" style="background:#fefce8;border:1px solid #fde68a;border-left:3px solid #f59e0b;border-radius:4px;padding:6px 10px;font-size:9px;color:#78350f;margin:8px 0"><strong>📝 Observações:</strong> ${venda.observacoes}</div>` : ""}
    <div class="assinaturas"><div class="ass"><div class="asl"></div><div class="asn">Comprador</div><div class="asc">Nome / Assinatura</div></div><div class="ass"><div class="asl"></div><div class="asn">Vendedor</div><div class="asc">Fazenda / Representante</div></div><div class="ass"><div class="asl"></div><div class="asn">Motorista</div><div class="asc">Nome / Assinatura</div></div></div>
    <div class="footer">AgriGest - Sistema de Gestão do Agronegócio<br/>${isPreview ? "* Este documento é uma pré-visualização. Confirme os dados antes de salvar." : "Este documento é um comprovante de venda. Após o pagamento, o produto será liberado para retirada."}</div>
    </div></body></html>`;
  };

  const imprimirRomaneio = (venda) => { const win = window.open("", "_blank"); win.document.write(gerarHTMLRomaneio(venda)); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); };
  const salvarPDF = (venda) => { const win = window.open("", "_blank"); win.document.write(gerarHTMLRomaneio(venda)); win.document.close(); win.focus(); setTimeout(() => { win.print(); setTimeout(() => win.close(), 1000); }, 500); };
  const imprimirLista = () => {
    if (items.length === 0) { alert("Não há vendas registradas."); return; }
    const faz = state.fazenda || {};
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Lista de Vendas de Milho</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;font-size:12px}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#d4a843;color:#0f172a;padding:10px;text-align:left}td{padding:8px 10px;border:1px solid #dee2e6}.footer{margin-top:24px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:12px}</style></head><body>${gerarCabecalhoHTML(faz, "VENDAS DE MILHO EM BAGS", "")}<table><thead><tr><th>Nº Venda</th><th>Data</th><th>Cliente</th><th>Sacas</th><th>Peso (kg)</th><th>Valor Total</th><th>Status</th></tr></thead><tbody>${items.map(v => `<tr><td style="font-family:monospace">${v.numero}</td><td style="white-space:nowrap">${v.data}</td><td style="white-space:nowrap">${v.cliente}</td><td style="text-align:center">${v.quantidadeSacas} sc</td><td style="text-align:center">${(v.pesoTotalKg || 0).toLocaleString()} kg</td><td style="text-align:center">R$ ${(v.valorTotal || 0).toFixed(2)}</td><td style="text-align:center">${v.status || "Confirmada"}</td></tr>`).join("")}</tbody></table><div class="footer">AgriGest · Relatório de Vendas</div></body></html>`);
    win.document.close(); win.focus(); setTimeout(() => win.print(), 500);
  };

  const [pixModalOpen, setPixModalOpen] = useState(false);
  const salvarConfigPix = () => { setState(s => ({ ...s, configPixVenda: configPix })); setPixModalOpen(false); alert("Configuração PIX salva com sucesso!"); };
  const limparPesagem = () => { fp("pesoBruto", ""); fp("pesoTara", ""); };
  const limparSacas = () => { fp("quantidadeSacas", ""); };
  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>🌽 Venda de Milho em Bags</h2>
        <div style={{ display: "flex", gap: 8 }}><Btn variant="info" onClick={() => setPixModalOpen(true)}>⚙️ Configurar PIX</Btn>{items.length > 0 && <Btn variant="info" onClick={imprimirLista}>🖨️ Imprimir Lista</Btn>}<Btn onClick={openNew}>+ Nova Venda</Btn></div>
      </div>
      <Card style={{ marginBottom: 20, background: `${theme.accent}0a`, borderColor: `${theme.accent}44` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}><div><span style={{ fontSize: 20 }}>📦</span><span style={{ fontWeight: 700, marginLeft: 8 }}>Estoque Disponível de Milho:</span></div><div><Badge color="gold" style={{ fontSize: 16, padding: "8px 16px" }}>{Math.floor(saldoSacas).toLocaleString()} sacas ({Math.floor(saldoSacas * 60).toLocaleString()} kg)</Badge></div></div>
      </Card>
      <Card>{items.length === 0 ? <EmptyState icon="🌽" text="Nenhuma venda de milho registrada." /> : <Table headers={["Nº Venda", "Data", "Cliente", "Sacas", "Peso (kg)", "Valor Total", "Status", "Ações"]} rows={items.map(v => (<tr key={v.id}><Td><span style={{ fontFamily: "monospace", color: theme.gold, fontWeight: 700 }}>{v.numero}</span></Td><Td>{v.data}</Td><Td><strong>{v.cliente}</strong></Td><Td>{v.quantidadeSacas} sc</Td><Td>{(v.pesoTotalKg || 0).toLocaleString()} kg</Td><Td><strong style={{ color: theme.gold }}>R$ {(v.valorTotal || 0).toLocaleString("pt-BR", {minimumFractionDigits:2})}</strong></Td><Td><Badge color={v.status === "Confirmada" ? "green" : "gold"}>{v.status || "Confirmada"}</Badge></Td><Td><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><Btn size="sm" variant="info" onClick={() => openView(v)}>👁️ Ver</Btn><Btn size="sm" variant="secondary" onClick={() => openEdit(v)}>✏️</Btn><Btn size="sm" variant="gold" onClick={() => imprimirRomaneio(v)}>🖨️</Btn><Btn size="sm" variant="gold" onClick={() => salvarPDF(v)}>📄 PDF</Btn><Btn size="sm" variant="danger" onClick={() => del(v.id)}>🗑️</Btn></div></Td></tr>))} />}</Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Venda de Milho`} width={750}>
        <div style={{ marginBottom: 20 }}><div style={{ fontWeight: 700, color: theme.gold, marginBottom: 14, fontSize: 13 }}>📋 Dados da Venda</div>
          <Row cols={2}><Field label="Data da Venda"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field><Field label="Cliente"><Select value={form.cliente} onChange={e => fp("cliente", e.target.value)}><option value="">Selecione...</option>{clientes.map(c => <option key={c.id}>{c.nome}</option>)}</Select></Field></Row>
          <Row cols={2}><Field label="Transportadora"><Select value={form.transportadora} onChange={e => fp("transportadora", e.target.value)}><option value="">Selecione...</option>{transportadoras.map(t => <option key={t.id}>{t.nome}</option>)}</Select></Field><Field label="Motorista"><Select value={form.motorista} onChange={e => fp("motorista", e.target.value)}><option value="">Selecione...</option>{motoristas.map(m => <option key={m.id}>{m.nome}</option>)}</Select></Field></Row>
          <Row cols={2}><Field label="Placa do Caminhão"><Select value={form.placa} onChange={e => fp("placa", e.target.value)}><option value="">Selecione...</option>{caminhoes.map(c => <option key={c.id}>{c.placa}-{c.uf}</option>)}</Select></Field><Field label="Forma de Pagamento"><Select value={form.formaPagamento} onChange={e => fp("formaPagamento", e.target.value)}><option value="PIX">💳 PIX</option><option value="Boleto">📄 Boleto Bancário</option><option value="Transferência">🏦 Transferência Bancária</option><option value="Dinheiro">💰 Dinheiro</option></Select></Field></Row>
        </div>
        <div style={{ marginBottom: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}><div style={{ fontWeight: 700, color: theme.accent, marginBottom: 14, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>⚖️ Pesagem (opcional - preencha ou use quantidade em sacas)</span><Btn size="sm" variant="secondary" onClick={limparPesagem}>Limpar Pesagem</Btn></div>
          <Row cols={3}><Field label="Peso Bruto (kg)"><Input type="number" step="1" value={form.pesoBruto} onChange={e => { fp("pesoBruto", e.target.value); if (e.target.value && form.pesoTara) { const liquido = parseFloat(e.target.value) - parseFloat(form.pesoTara || 0); if (liquido > 0) fp("quantidadeSacas", Math.round(liquido / 60 * 10) / 10); } }} placeholder="0" /></Field><Field label="Tara (kg)"><Input type="number" step="1" value={form.pesoTara} onChange={e => { fp("pesoTara", e.target.value); if (form.pesoBruto && e.target.value) { const liquido = parseFloat(form.pesoBruto) - parseFloat(e.target.value); if (liquido > 0) fp("quantidadeSacas", Math.round(liquido / 60 * 10) / 10); } }} placeholder="0" /></Field><Field label="Peso Líquido (kg)"><Input value={pesoLiquido > 0 ? pesoLiquido.toLocaleString() + " kg" : "—"} readOnly highlight={pesoLiquido > 0 ? theme.accent : theme.muted} /></Field></Row>
        </div>
        <div style={{ marginBottom: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}><div style={{ fontWeight: 700, color: theme.accent, marginBottom: 14, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>🌾 Quantidade e Valor</span><Btn size="sm" variant="secondary" onClick={limparSacas}>Limpar Quantidade</Btn></div>
          <Row cols={3}><Field label="Quantidade (sacas de 60kg)"><Input type="number" step="1" value={form.quantidadeSacas} onChange={e => { fp("quantidadeSacas", e.target.value); const qtd = parseFloat(e.target.value) || 0; if (qtd > saldoSacas) alert(`Estoque insuficiente! Disponível: ${Math.floor(saldoSacas)} sacas`); }} placeholder="0" /></Field><Field label="Preço por Saca (R$)"><Input type="number" step="0.01" value={form.precoSaca} onChange={e => fp("precoSaca", e.target.value)} placeholder="0.00" /></Field><Field label="Valor Total"><Input value={`R$ ${valorTotal.toFixed(2)}`} readOnly highlight={theme.gold} /></Field></Row>
          <div style={{ marginTop: 8, padding: 8, background: `${theme.accent}0a`, borderRadius: 6 }}><span style={{ fontSize: 11, color: theme.muted }}>📦 Estoque disponível: </span><strong style={{ color: quantidadeSacas <= saldoSacas ? theme.accent : theme.danger }}>{Math.floor(saldoSacas)} sacas</strong>{quantidadeSacas > 0 && <span style={{ fontSize: 11, marginLeft: 16 }}>📊 Peso total: <strong>{pesoTotalKg.toLocaleString()} kg</strong></span>}</div>
        </div>
        <Field label="Observações"><textarea value={form.observacoes || ""} onChange={e => fp("observacoes", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} placeholder="Observações sobre a venda, entrega, etc..." /></Field>
        <div style={{ marginTop: 16, padding: 12, background: `${theme.warning}0a`, borderRadius: 8, border: `1px solid ${theme.warning}44` }}><div style={{ fontSize: 12, color: theme.warning, display: "flex", alignItems: "center", gap: 8 }}><span>⚠️</span><span>Ao salvar esta venda, a quantidade será <strong>baixada automaticamente do estoque</strong> de milho.</span></div></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}><Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn><Btn variant="info" onClick={handleVisualizarAntesSalvar}>👁️ Visualizar e Continuar</Btn></div>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Pré-visualização do Romaneio de Venda" width={820}>
        {previewData && (<div><div style={{ background: `${theme.accent}0f`, border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}><div><div style={{ fontWeight: 700, fontSize: 14, color: theme.accentLight }}>✅ Revise os dados antes de salvar</div><div style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>Você pode imprimir ou salvar como PDF antes de confirmar.</div></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Btn variant="info" onClick={() => imprimirRomaneio(previewData)}>🖨️ Imprimir</Btn><Btn variant="gold" onClick={() => salvarPDF(previewData)}>📄 Salvar PDF</Btn></div></div><div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, background: "#fff", maxHeight: "60vh", overflowY: "auto" }}><div dangerouslySetInnerHTML={{ __html: gerarHTMLRomaneio(previewData) }} /></div><div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16, paddingTop: 14, borderTop: `1px solid ${theme.border}` }}><Btn variant="secondary" onClick={() => setPreviewOpen(false)}>← Voltar e Editar</Btn><Btn variant="info" onClick={() => imprimirRomaneio(previewData)}>🖨️ Imprimir</Btn><Btn variant="gold" onClick={() => salvarPDF(previewData)}>📄 Salvar PDF</Btn><Btn onClick={confirmarSalvar}>✅ Confirmar e Salvar</Btn></div></div>)}
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={`Romaneio de Venda - ${viewItem?.numero || ""}`} width={820}>
        {viewItem && (<div><div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: 20, background: "#fff", maxHeight: "65vh", overflowY: "auto" }}><div dangerouslySetInnerHTML={{ __html: gerarHTMLRomaneio(viewItem) }} /></div><div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}><Btn variant="info" onClick={() => imprimirRomaneio(viewItem)}>🖨️ Imprimir</Btn><Btn variant="gold" onClick={() => salvarPDF(viewItem)}>📄 Salvar PDF</Btn><Btn variant="secondary" onClick={() => setViewOpen(false)}>Fechar</Btn></div></div>)}
      </Modal>

      <Modal open={pixModalOpen} onClose={() => setPixModalOpen(false)} title="Configuração da Chave PIX" width={500}>
        <div style={{ marginBottom: 20 }}><p style={{ color: theme.muted, fontSize: 13, marginBottom: 16 }}>Configure a chave PIX que será exibida nos romaneios de venda para pagamento.</p>
          <Field label="Tipo da Chave PIX"><Select value={configPix.tipo} onChange={e => setConfigPix(p => ({ ...p, tipo: e.target.value }))}><option value="CPF">CPF</option><option value="CNPJ">CNPJ</option><option value="Email">E-mail</option><option value="Telefone">Telefone (WhatsApp)</option><option value="Aleatorio">Chave Aleatória</option></Select></Field>
          <Field label="Chave PIX"><Input value={configPix.chave} onChange={e => setConfigPix(p => ({ ...p, chave: e.target.value }))} placeholder="Digite a chave PIX" /></Field>
          <Field label="Nome do Titular"><Input value={configPix.nomeTitular} onChange={e => setConfigPix(p => ({ ...p, nomeTitular: e.target.value }))} placeholder="Nome completo do titular da conta" /></Field>
          <Field label="Cidade"><Input value={configPix.cidade} onChange={e => setConfigPix(p => ({ ...p, cidade: e.target.value }))} placeholder="Cidade do titular" /></Field>
          <Field label="Instruções adicionais"><textarea value={configPix.instrucoes} onChange={e => setConfigPix(p => ({ ...p, instrucoes: e.target.value }))} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} placeholder="Ex: Após o pagamento, envie o comprovante para o WhatsApp (XX) XXXXX-XXXX" /></Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><Btn variant="secondary" onClick={() => setPixModalOpen(false)}>Cancelar</Btn><Btn onClick={salvarConfigPix}>💾 Salvar Configuração</Btn></div>
      </Modal>
    </div>
  );
}

// ─── DEPARTAMENTO FINANCEIRO ──────────────────────────────────────────────────
function ContasPagar({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.contasPagar || [];
  const fornecedores = state.fornecedores || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ data: new Date().toISOString().split("T")[0], status: "Pendente" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, contasPagar: s.contasPagar.filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid(), valor: parseFloat(form.valor) || 0 };
    setState(s => ({ ...s, contasPagar: editing ? s.contasPagar.map(x => x.id === editing ? item : x) : [...(s.contasPagar || []), item] }));
    setOpen(false);
  };

  const totalPendente = items.filter(i => i.status === "Pendente").reduce((s, i) => s + (i.valor || 0), 0);
  const totalVencido = items.filter(i => i.status === "Pendente" && i.vencimento && i.vencimento < new Date().toISOString().split("T")[0]).reduce((s, i) => s + (i.valor || 0), 0);
  const totalPago = items.filter(i => i.status === "Pago").reduce((s, i) => s + (i.valor || 0), 0);

  const marcarPago = (id) => {
    setState(s => ({ ...s, contasPagar: s.contasPagar.map(x => x.id === id ? { ...x, status: "Pago", dataPagamento: new Date().toISOString().split("T")[0] } : x) }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>💰 Contas a Pagar</h2>
        <Btn onClick={openNew}>+ Nova Conta</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Pendente", value: `R$ ${totalPendente.toFixed(2)}`, color: theme.warning },
          { label: "Total Vencido", value: `R$ ${totalVencido.toFixed(2)}`, color: theme.danger },
          { label: "Total Pago", value: `R$ ${totalPago.toFixed(2)}`, color: theme.accent },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="💰" text="Nenhuma conta a pagar registrada." />
        ) : (
          <Table
            headers={["Descrição", "Fornecedor", "Valor (R$)", "Vencimento", "Categoria", "Status", "Ações"]}
            rows={items.map(i => (
              <tr key={i.id}>
                <Td><strong>{i.descricao}</strong></Td>
                <Td>{i.fornecedor || "—"}</Td>
                <Td><strong style={{ color: i.status === "Pago" ? theme.accent : theme.warning }}>R$ {(i.valor || 0).toFixed(2)}</strong></Td>
                <Td>{i.vencimento || "—"}</Td>
                <Td>{i.categoria || "—"}</Td>
                <Td><Badge color={i.status === "Pago" ? "green" : i.vencimento && i.vencimento < new Date().toISOString().split("T")[0] ? "red" : "gold"}>{i.status || "Pendente"}</Badge></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {i.status !== "Pago" && <Btn size="sm" variant="success" onClick={() => marcarPago(i.id)}>✅ Pagar</Btn>}
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(i)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(i.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Conta a Pagar`} width={600}>
        <Row cols={2}>
          <Field label="Descrição"><Input value={form.descricao} onChange={e => fp("descricao", e.target.value)} placeholder="Ex: Compra de Adubo" /></Field>
          <Field label="Fornecedor">
            <Select value={form.fornecedor} onChange={e => fp("fornecedor", e.target.value)}>
              <option value="">Selecione...</option>
              {fornecedores.map(f => <option key={f.id}>{f.nome}</option>)}
            </Select>
          </Field>
        </Row>
        <Row cols={2}>
          <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor} onChange={e => fp("valor", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Data de Vencimento"><Input type="date" value={form.vencimento} onChange={e => fp("vencimento", e.target.value)} /></Field>
        </Row>
        <Row cols={2}>
          <Field label="Categoria">
            <Select value={form.categoria} onChange={e => fp("categoria", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.categoriasFinanceiras || []).map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Centro de Custo">
            <Select value={form.centroCusto} onChange={e => fp("centroCusto", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.centrosCusto || []).map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Observações"><textarea value={form.obs || ""} onChange={e => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} placeholder="Observações..." /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

function ContasReceber({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.contasReceber || [];
  const clientes = state.clientes || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ data: new Date().toISOString().split("T")[0], status: "Pendente" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, contasReceber: s.contasReceber.filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid(), valor: parseFloat(form.valor) || 0 };
    setState(s => ({ ...s, contasReceber: editing ? s.contasReceber.map(x => x.id === editing ? item : x) : [...(s.contasReceber || []), item] }));
    setOpen(false);
  };

  const totalPendente = items.filter(i => i.status === "Pendente").reduce((s, i) => s + (i.valor || 0), 0);
  const totalVencido = items.filter(i => i.status === "Pendente" && i.vencimento && i.vencimento < new Date().toISOString().split("T")[0]).reduce((s, i) => s + (i.valor || 0), 0);
  const totalRecebido = items.filter(i => i.status === "Recebido").reduce((s, i) => s + (i.valor || 0), 0);

  const marcarRecebido = (id) => {
    setState(s => ({ ...s, contasReceber: s.contasReceber.map(x => x.id === id ? { ...x, status: "Recebido", dataRecebimento: new Date().toISOString().split("T")[0] } : x) }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>💵 Contas a Receber</h2>
        <Btn onClick={openNew}>+ Nova Conta</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Pendente", value: `R$ ${totalPendente.toFixed(2)}`, color: theme.warning },
          { label: "Total Vencido", value: `R$ ${totalVencido.toFixed(2)}`, color: theme.danger },
          { label: "Total Recebido", value: `R$ ${totalRecebido.toFixed(2)}`, color: theme.accent },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="💵" text="Nenhuma conta a receber registrada." />
        ) : (
          <Table
            headers={["Descrição", "Cliente", "Valor (R$)", "Vencimento", "Origem", "Status", "Ações"]}
            rows={items.map(i => (
              <tr key={i.id}>
                <Td><strong>{i.descricao}</strong></Td>
                <Td>{i.cliente || "—"}</Td>
                <Td><strong style={{ color: i.status === "Recebido" ? theme.accent : theme.warning }}>R$ {(i.valor || 0).toFixed(2)}</strong></Td>
                <Td>{i.vencimento || "—"}</Td>
                <Td>{i.origem === "VendaMilho" ? "🌽 Venda de Milho" : i.origem === "RomaneioSaida" ? "📤 Expedição" : "—"}</Td>
                <Td><Badge color={i.status === "Recebido" ? "green" : i.vencimento && i.vencimento < new Date().toISOString().split("T")[0] ? "red" : "gold"}>{i.status || "Pendente"}</Badge></Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {i.status !== "Recebido" && <Btn size="sm" variant="success" onClick={() => marcarRecebido(i.id)}>💰 Receber</Btn>}
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(i)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(i.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Conta a Receber`} width={600}>
        <Row cols={2}>
          <Field label="Descrição"><Input value={form.descricao} onChange={e => fp("descricao", e.target.value)} placeholder="Ex: Venda de Soja" /></Field>
          <Field label="Cliente">
            <Select value={form.cliente} onChange={e => fp("cliente", e.target.value)}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id}>{c.nome}</option>)}
            </Select>
          </Field>
        </Row>
        <Row cols={2}>
          <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor} onChange={e => fp("valor", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Data de Vencimento"><Input type="date" value={form.vencimento} onChange={e => fp("vencimento", e.target.value)} /></Field>
        </Row>
        <Row cols={2}>
          <Field label="Origem">
            <Select value={form.origem} onChange={e => fp("origem", e.target.value)}>
              <option value="">Selecione...</option>
              <option value="VendaMilho">🌽 Venda de Milho</option>
              <option value="RomaneioSaida">📤 Expedição de Grãos</option>
              <option value="Outros">📋 Outros</option>
            </Select>
          </Field>
          <Field label="Centro de Custo">
            <Select value={form.centroCusto} onChange={e => fp("centroCusto", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.centrosCusto || []).map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Observações"><textarea value={form.obs || ""} onChange={e => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} placeholder="Observações..." /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

function DespesasOperacionais({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.despesasOperacionais || [];
  const maquinas = state.maquinas || [];
  const motoristas = state.motoristas || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ data: new Date().toISOString().split("T")[0], tipo: "Combustível" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, despesasOperacionais: s.despesasOperacionais.filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid(), valor: parseFloat(form.valor) || 0 };
    setState(s => ({ ...s, despesasOperacionais: editing ? s.despesasOperacionais.map(x => x.id === editing ? item : x) : [...(s.despesasOperacionais || []), item] }));
    setOpen(false);
  };

  const totalDespesas = items.reduce((s, i) => s + (i.valor || 0), 0);
  const porTipo = {};
  items.forEach(i => { porTipo[i.tipo] = (porTipo[i.tipo] || 0) + (i.valor || 0); });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📋 Despesas Operacionais</h2>
        <Btn onClick={openNew}>+ Nova Despesa</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total de Despesas", value: `R$ ${totalDespesas.toFixed(2)}`, color: theme.danger },
          { label: "Combustível", value: `R$ ${(porTipo.Combustível || 0).toFixed(2)}`, color: theme.warning },
          { label: "Manutenção", value: `R$ ${(porTipo.Manutenção || 0).toFixed(2)}`, color: theme.info },
          { label: "Frete", value: `R$ ${(porTipo.Frete || 0).toFixed(2)}`, color: theme.accent },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 24, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="📋" text="Nenhuma despesa operacional registrada." />
        ) : (
          <Table
            headers={["Data", "Descrição", "Tipo", "Valor (R$)", "Máquina", "Motorista", "Ações"]}
            rows={items.map(i => (
              <tr key={i.id}>
                <Td>{i.data}</Td>
                <Td><strong>{i.descricao}</strong></Td>
                <Td>{i.tipo}</Td>
                <Td><strong style={{ color: theme.danger }}>R$ {(i.valor || 0).toFixed(2)}</strong></Td>
                <Td>{i.maquina || "—"}</Td>
                <Td>{i.motorista || "—"}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="secondary" onClick={() => openEdit(i)}>✏️</Btn>
                    <Btn size="sm" variant="danger" onClick={() => del(i.id)}>🗑️</Btn>
                  </div>
                </Td>
              </tr>
            ))}
          />
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Despesa Operacional`} width={600}>
        <Row cols={2}>
          <Field label="Data"><Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} /></Field>
          <Field label="Tipo de Despesa">
            <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
              {["Combustível", "Manutenção", "Frete", "Mão de Obra", "Outros"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Descrição"><Input value={form.descricao} onChange={e => fp("descricao", e.target.value)} placeholder="Ex: Troca de óleo" /></Field>
        <Row cols={2}>
          <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.valor} onChange={e => fp("valor", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Máquina">
            <Select value={form.maquina} onChange={e => fp("maquina", e.target.value)}>
              <option value="">Selecione...</option>
              {maquinas.map(m => <option key={m.id}>{m.nome}</option>)}
            </Select>
          </Field>
        </Row>
        <Row cols={2}>
          <Field label="Motorista">
            <Select value={form.motorista} onChange={e => fp("motorista", e.target.value)}>
              <option value="">Selecione...</option>
              {motoristas.map(m => <option key={m.id}>{m.nome}</option>)}
            </Select>
          </Field>
          <Field label="Centro de Custo">
            <Select value={form.centroCusto} onChange={e => fp("centroCusto", e.target.value)}>
              <option value="">Selecione...</option>
              {(state.centrosCusto || []).map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Observações"><textarea value={form.obs || ""} onChange={e => fp("obs", e.target.value)} rows={2} style={{ width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} placeholder="Observações..." /></Field>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>Cancelar</Btn>
          <Btn onClick={save}>💾 Salvar</Btn>
        </div>
      </Modal>
    </div>
  );
}

function FluxoCaixa({ state }) {
  const [periodoInicio, setPeriodoInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [periodoFim, setPeriodoFim] = useState(new Date().toISOString().split("T")[0]);

  const receitas = (state.contasReceber || []).filter(r => r.status === "Recebido" && r.dataRecebimento >= periodoInicio && r.dataRecebimento <= periodoFim).map(r => ({ data: r.dataRecebimento, descricao: r.descricao, valor: r.valor, tipo: "Receita" }));
  const vendasMilho = (state.vendasMilho || []).filter(v => v.status === "Confirmada" && v.data >= periodoInicio && v.data <= periodoFim).map(v => ({ data: v.data, descricao: `🌽 Venda de Milho - ${v.cliente}`, valor: v.valorTotal, tipo: "Receita" }));
  const despesas = (state.contasPagar || []).filter(d => d.status === "Pago" && d.dataPagamento >= periodoInicio && d.dataPagamento <= periodoFim).map(d => ({ data: d.dataPagamento, descricao: d.descricao, valor: d.valor, tipo: "Despesa" }));
  const despesasOp = (state.despesasOperacionais || []).filter(d => d.data >= periodoInicio && d.data <= periodoFim).map(d => ({ data: d.data, descricao: d.descricao, valor: d.valor, tipo: "Despesa" }));

  const todasMovimentacoes = [...receitas, ...vendasMilho, ...despesas, ...despesasOp].sort((a, b) => a.data.localeCompare(b.data));
  const totalReceitas = [...receitas, ...vendasMilho].reduce((s, r) => s + r.valor, 0);
  const totalDespesas = [...despesas, ...despesasOp].reduce((s, d) => s + d.valor, 0);
  const saldoPeriodo = totalReceitas - totalDespesas;

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Fluxo de Caixa</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#2ecc71;color:#fff;padding:10px;text-align:left}td{padding:8px 10px;border:1px solid #dee2e6}.receita{color:#2ecc71;font-weight:700}.despesa{color:#e74c3c;font-weight:700}.footer{margin-top:24px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:12px}</style></head>
    <body>${gerarCabecalhoHTML(faz, "FLUXO DE CAIXA", periodoInicio + " a " + periodoFim)}
    <table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor (R$)</th></tr></thead><tbody>
    ${todasMovimentacoes.map(m => `<tr><td style="white-space:nowrap">${m.data}</td><td>${m.descricao}</td><td class="${m.tipo === "Receita" ? "receita" : "despesa"}">${m.tipo}</td><td class="${m.tipo === "Receita" ? "receita" : "despesa"}">R$ ${m.valor.toFixed(2)}</td></tr>`).join("")}
    </tbody><tfoot><tr style="background:#f0fdf4"><td colspan="3"><strong>TOTAL RECEITAS</strong></td><td><strong>R$ ${totalReceitas.toFixed(2)}</strong></td></tr>
    <tr style="background:#fee2e2"><td colspan="3"><strong>TOTAL DESPESAS</strong></td><td><strong>R$ ${totalDespesas.toFixed(2)}</strong></td></tr>
    <tr style="background:#d4edda"><td colspan="3"><strong>SALDO DO PERÍODO</strong></td><td><strong style="color:${saldoPeriodo >= 0 ? '#2ecc71' : '#e74c3c'}">R$ ${saldoPeriodo.toFixed(2)}</strong></td></tr></tfoot>
    </table><div class="footer">AgriGest · Fluxo de Caixa</div></body></html>`);
    win.document.close(); setTimeout(() => win.print(), 500);
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📊 Fluxo de Caixa</h2>
        {todasMovimentacoes.length > 0 && <Btn variant="info" onClick={imprimir}>🖨️ Imprimir / PDF</Btn>}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>🔍 Período</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
          <div><label style={labelStyle}>Data Início</label><input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} style={selectStyle} /></div>
          <div><label style={labelStyle}>Data Fim</label><input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} style={selectStyle} /></div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total de Receitas", value: `R$ ${totalReceitas.toFixed(2)}`, color: theme.accent },
          { label: "Total de Despesas", value: `R$ ${totalDespesas.toFixed(2)}`, color: theme.danger },
          { label: "Saldo do Período", value: `R$ ${saldoPeriodo.toFixed(2)}`, color: saldoPeriodo >= 0 ? theme.accent : theme.danger },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        {todasMovimentacoes.length === 0 ? (
          <EmptyState icon="📊" text="Nenhuma movimentação financeira no período selecionado." />
        ) : (
          <Table
            headers={["Data", "Descrição", "Tipo", "Valor (R$)"]}
            rows={todasMovimentacoes.map(m => (
              <tr key={m.data + m.descricao}>
                <Td>{m.data}</Td>
                <Td>{m.descricao}</Td>
                <Td><Badge color={m.tipo === "Receita" ? "green" : "red"}>{m.tipo}</Badge></Td>
                <Td><strong style={{ color: m.tipo === "Receita" ? theme.accent : theme.danger }}>R$ {m.valor.toFixed(2)}</strong></Td>
              </tr>
            ))}
          />
        )}
      </Card>
    </div>
  );
}

function RelatorioFinanceiro({ state }) {
  const [ano, setAno] = useState(new Date().getFullYear().toString());

  const receitas = (state.contasReceber || []).filter(r => r.status === "Recebido");
  const despesasPagas = (state.contasPagar || []).filter(d => d.status === "Pago");
  const vendasMilho = (state.vendasMilho || []).filter(v => v.status === "Confirmada");
  const despesasOp = (state.despesasOperacionais || []);

  const receitasPorMes = {};
  const despesasPorMes = {};

  [...receitas, ...vendasMilho.map(v => ({ ...v, data: v.data, valor: v.valorTotal, tipo: "Receita" }))].forEach(r => {
    const data = r.data?.split("-");
    if (data && data[0] === ano) {
      const key = data[1];
      receitasPorMes[key] = (receitasPorMes[key] || 0) + r.valor;
    }
  });

  [...despesasPagas, ...despesasOp].forEach(d => {
    const data = d.data?.split("-") || d.dataPagamento?.split("-");
    if (data && data[0] === ano) {
      const key = data[1];
      despesasPorMes[key] = (despesasPorMes[key] || 0) + (d.valor || 0);
    }
  });

  const meses = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const totalReceitasAno = Object.values(receitasPorMes).reduce((s, v) => s + v, 0);
  const totalDespesasAno = Object.values(despesasPorMes).reduce((s, v) => s + v, 0);
  const lucroAno = totalReceitasAno - totalDespesasAno;

  const imprimir = () => {
    const win = window.open("", "_blank");
    const faz = state.fazenda || {};
     win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório Financeiro - ${ano}</title>
     <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#2ecc71;color:#fff;padding:10px;text-align:left}td{padding:8px 10px;border:1px solid #dee2e6}.receita{color:#2ecc71}.despesa{color:#e74c3c}.footer{margin-top:24px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:12px}</style></head>
     <body>${gerarCabecalhoHTML(faz, "DEMONSTRATIVO DE RESULTADOS (DRE)", ano)}
    <table><thead><tr><th>Mês</th><th>Receitas (R$)</th><th>Despesas (R$)</th><th>Resultado (R$)</th></tr></thead><tbody>
    ${meses.map((m, idx) => {
      const rec = receitasPorMes[m] || 0;
      const desp = despesasPorMes[m] || 0;
      const res = rec - desp;
      return `<tr><td style="font-weight:700">${nomesMeses[idx]}</td><td class="receita">R$ ${rec.toFixed(2)}</td><td class="despesa">R$ ${desp.toFixed(2)}</td><td style="color:${res >= 0 ? '#2ecc71' : '#e74c3c'};font-weight:700">R$ ${res.toFixed(2)}</td></tr>`;
    }).join("")}
    </tbody><tfoot><tr style="background:#f0fdf4"><td><strong>TOTAL</strong></td><td style="font-weight:700">R$ ${totalReceitasAno.toFixed(2)}</td>
      <td style="font-weight:700">R$ ${totalDespesasAno.toFixed(2)}</td>
      <td style="font-weight:700;color:${lucroAno >= 0 ? '#2ecc71' : '#e74c3c'}">R$ ${lucroAno.toFixed(2)}</td>
    </tr></tfoot>
    </table>
    <div class="footer">AgriGest · DRE Simplificada</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const selectStyle = { width: "100%", background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: "9px 12px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none" };
  const labelStyle = { fontSize: 11, color: theme.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", display: "block" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>📈 Demonstrativo de Resultados (DRE)</h2>
        <Btn variant="info" onClick={imprimir}>🖨️ Imprimir / PDF</Btn>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <div><label style={labelStyle}>Ano</label><select value={ano} onChange={e => setAno(e.target.value)} style={selectStyle}>
            <option value="2023">2023</option><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
          </select></div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Receitas", value: `R$ ${totalReceitasAno.toFixed(2)}`, color: theme.accent },
          { label: "Total Despesas", value: `R$ ${totalDespesasAno.toFixed(2)}`, color: theme.danger },
          { label: "Lucro/Prejuízo", value: `R$ ${lucroAno.toFixed(2)}`, color: lucroAno >= 0 ? theme.accent : theme.danger },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <Table
          headers={["Mês", "Receitas (R$)", "Despesas (R$)", "Resultado (R$)"]}
          rows={meses.map((m, idx) => {
            const rec = receitasPorMes[m] || 0;
            const desp = despesasPorMes[m] || 0;
            const res = rec - desp;
            return (
              <tr key={m}>
                <Td><strong>{nomesMeses[idx]}</strong></Td>
                <Td><strong style={{ color: theme.accent }}>R$ {rec.toFixed(2)}</strong></Td>
                <Td><strong style={{ color: theme.danger }}>R$ {desp.toFixed(2)}</strong></Td>
                <Td><strong style={{ color: res >= 0 ? theme.accent : theme.danger }}>R$ {res.toFixed(2)}</strong></Td>
              </tr>
            );
          })}
        />
        <div style={{ marginTop: 16, padding: 12, background: `${theme.accent}0a`, borderRadius: 8, textAlign: "center" }}>
          <strong>RESUMO DO ANO {ano}</strong><br/>
          Receitas: R$ {totalReceitasAno.toFixed(2)} | Despesas: R$ {totalDespesasAno.toFixed(2)} | Lucro: R$ {lucroAno.toFixed(2)}
        </div>
      </Card>
    </div>
  );
}

// ─── GRÃOS (DEPARTAMENTO COM ABAS) ──────────────────────────────────────────
function GraosDept({ state, setState, usuario, initialAba, safraAtiva }) {
  const allAbas = [
    { id: "graos", label: "🌾 Grãos em Produção", icon: "🌾" },
    { id: "talhoes", label: "🗺️ Talhões", icon: "🗺️" },
    { id: "classificacao", label: "⚙️ Classificação - Expedição", icon: "⚙️" },
    { id: "classificacaoRecepcao", label: "📥 Classificação - Recepção", icon: "📥" },
    { id: "contratos", label: "📋 Contratos", icon: "📋" },
    { id: "romaneiosEntrada", label: "📥 Recebimento", icon: "📥" },
    { id: "romaneiosSaida", label: "📤 Expedição", icon: "📤" },
    { id: "vendaMilho", label: "🌽 Venda de Milho", icon: "🌽" },
  ];
  const abas = allAbas.filter(a => temAcessoSubmodulo(usuario, "graosDept", a.id));
  const [aba, setAba] = useState(() => getBaseAba(initialAba, abas) || (abas[0]?.id || "graos"));
  useEffect(() => { if (initialAba) { const id = initialAba.split("|")[0]; if (abas.some(a => a.id === id)) setAba(id); } }, [initialAba]);

  const renderContent = () => {
    switch (aba) {
      case "graos": return <Graos state={state} safraAtiva={safraAtiva} />;
      case "talhoes": return <Talhoes state={state} setState={setState} />;
      case "classificacao": return <Classificacao state={state} setState={setState} paramsKey="classificacaoParams" title="⚙️ Parâmetros de Classificação - Expedição" subtitle="Configure as tolerâncias por grão. Aplicadas automaticamente nos romaneios de expedição (saída)." contextLabel="Expedição" />;
      case "classificacaoRecepcao": return <Classificacao state={state} setState={setState} paramsKey="classificacaoRecepcaoParams" title="📥 Parâmetros de Classificação - Recepção" subtitle="Configure as tolerâncias por grão para o recebimento. Aplicadas automaticamente nos romaneios de recebimento (entrada). Independentes da classificação de expedição." contextLabel="Recepção" />;
      case "contratos": return <Contratos state={state} setState={setState} safraAtiva={safraAtiva} />;
      case "romaneiosEntrada": return <RomaneiosEntrada state={state} setState={setState} safraAtiva={safraAtiva} />;
      case "romaneiosSaida": return <RomaneiosSaida state={state} setState={setState} safraAtiva={safraAtiva} />;
      
      case "vendaMilho": return <VendaMilhoBags state={state} setState={setState} />;
      default: return <Graos state={state} safraAtiva={safraAtiva} />;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", paddingBottom: 8 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            background: aba === a.id ? `${theme.accent}22` : "transparent",
            border: aba === a.id ? `1px solid ${theme.accent}44` : `1px solid ${theme.border}`,
            color: aba === a.id ? theme.accentLight : theme.muted,
            fontFamily: "inherit", fontSize: 13, fontWeight: aba === a.id ? 600 : 400,
            transition: "all .2s", display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

// ─── PLUVIÔMETRO ─────────────────────────────────────────────────────────────
function Pluviometro({ state, setState }) {
  const ss = (updates) => setState(prev => ({ ...prev, ...(typeof updates === "function" ? updates(prev) : updates) }));
  const registros = state.pluviometro || [];
  const talhoes = state.talhoes || [];
  const [modal, setModal] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const emptyForm = { data: new Date().toISOString().slice(0, 10), talhao: "", mm: "" };
  const [form, setForm] = useState({ ...emptyForm });
  const fp = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());

  const openNew = () => { setForm({ ...emptyForm }); setEditIdx(null); setModal(true); };
  const openEdit = (i) => { setForm({ ...registros[i] }); setEditIdx(i); setModal(true); };
  const salvar = () => {
    if (!form.data || !form.talhao || !form.mm) { alert("Preencha todos os campos."); return; }
    const updated = [...registros];
    if (editIdx !== null) { updated[editIdx] = { ...form }; }
    else { updated.push({ ...form, id: Date.now() }); }
    ss({ pluviometro: updated });
    setModal(false); setForm({ ...emptyForm }); setEditIdx(null);
  };
  const remover = (i) => { if (confirm("Remover registro?")) ss({ pluviometro: registros.filter((_, idx) => idx !== i) }); };

  const filtrados = registros.filter(r => r.data?.startsWith(filtroAno)).sort((a, b) => b.data?.localeCompare(a.data));

  // Totais por talhão
  const totaisPorTalhao = {};
  filtrados.forEach(r => {
    if (!totaisPorTalhao[r.talhao]) totaisPorTalhao[r.talhao] = 0;
    totaisPorTalhao[r.talhao] += parseFloat(r.mm) || 0;
  });
  const totalGeral = Object.values(totaisPorTalhao).reduce((s, v) => s + v, 0);

  // Anos disponíveis para comparativo
  const anosDisp = [...new Set(registros.map(r => r.data?.slice(0, 4)).filter(Boolean))].sort().reverse();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <SectionTitle>🌧️ Lançamento de Pluviômetro</SectionTitle>
        <Btn onClick={openNew}>+ Novo Registro</Btn>
      </div>

      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Field label="Filtrar por Ano" style={{ marginBottom: 0 }}>
            <Select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} style={{ minWidth: 120 }}>
              {(anosDisp.length > 0 ? anosDisp : [new Date().getFullYear().toString()]).map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
          </Field>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ background: `${theme.info}18`, border: `1px solid ${theme.info}44`, borderRadius: 8, padding: "8px 16px" }}>
              <span style={{ fontSize: 11, color: theme.muted }}>Total Geral {filtroAno}</span>
              <div style={{ fontWeight: 800, fontSize: 20, color: theme.info }}>{totalGeral.toFixed(1)} mm</div>
            </div>
            <div style={{ background: `${theme.accent}18`, border: `1px solid ${theme.accent}44`, borderRadius: 8, padding: "8px 16px" }}>
              <span style={{ fontSize: 11, color: theme.muted }}>Registros</span>
              <div style={{ fontWeight: 800, fontSize: 20, color: theme.accent }}>{filtrados.length}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumo por Talhão */}
      {Object.keys(totaisPorTalhao).length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: theme.text }}>📊 Total por Talhão — {filtroAno}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {Object.entries(totaisPorTalhao).sort((a, b) => b[1] - a[1]).map(([talhao, mm]) => (
              <div key={talhao} style={{ background: `${theme.info}0a`, border: `1px solid ${theme.info}33`, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{talhao}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: theme.info }}>{mm.toFixed(1)} mm</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: theme.muted }}>
          <p style={{ fontSize: 48, marginBottom: 8 }}>🌧️</p>
          <p>Nenhum registro de chuva em {filtroAno}.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                {["Data", "Talhão", "Chuva (mm)", "Ações"].map(h => (
                  <th key={h} style={{ padding: "10px 8px", textAlign: "left", color: theme.muted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r, i) => {
                const realIdx = registros.indexOf(r);
                return (
                  <tr key={r.id || i} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                    <Td>{formatDate(r.data)}</Td>
                    <Td><Badge color="blue">{r.talhao}</Badge></Td>
                    <Td><span style={{ fontWeight: 700, color: theme.info }}>{r.mm} mm</span></Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(realIdx)}>✏️</Btn>
                        <Btn size="sm" variant="ghost" onClick={() => remover(realIdx)} style={{ color: "#ef4444" }}>🗑️</Btn>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal open={modal} title={editIdx !== null ? "Editar Registro" : "Novo Registro de Chuva"} onClose={() => setModal(false)}>
          <Row>
            <Field label="Data *">
              <Input type="date" value={form.data} onChange={e => fp("data", e.target.value)} />
            </Field>
            <Field label="Talhão *">
              {talhoes.length > 0 ? (
                <Select value={form.talhao} onChange={e => fp("talhao", e.target.value)}>
                  <option value="">-- Selecione --</option>
                  {talhoes.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
                </Select>
              ) : (
                <Input value={form.talhao} onChange={e => fp("talhao", e.target.value)} placeholder="Digite o nome do talhão" />
              )}
            </Field>
          </Row>
          <Row>
            <Field label="Chuva (mm) *">
              <Input type="number" step="0.1" value={form.mm} onChange={e => fp("mm", e.target.value)} placeholder="Ex: 12.5" />
            </Field>
          </Row>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={salvar}>💾 Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── RELATÓRIO DE PLUVIOMETRIA ──────────────────────────────────────────────
function RelatorioPluviometria({ state }) {
  const registros = state.pluviometro || [];
  const talhoes = state.talhoes || [];
  const anosDisp = [...new Set(registros.map(r => r.data?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const [anoSel, setAnoSel] = useState(anosDisp[0] || new Date().getFullYear().toString());

  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Dados por talhão e mês para o ano selecionado
  const dadosPorTalhao = {};
  const dadosPorMes = {};
  registros.filter(r => r.data?.startsWith(anoSel)).forEach(r => {
    const mes = r.data?.slice(5, 7);
    const mm = parseFloat(r.mm) || 0;
    if (!dadosPorTalhao[r.talhao]) dadosPorTalhao[r.talhao] = {};
    dadosPorTalhao[r.talhao][mes] = (dadosPorTalhao[r.talhao][mes] || 0) + mm;
    dadosPorMes[mes] = (dadosPorMes[mes] || 0) + mm;
  });

  const totalAno = Object.values(dadosPorMes).reduce((s, v) => s + v, 0);
  const talhaoNames = Object.keys(dadosPorTalhao).sort();

  // Comparativo anual
  const comparativo = {};
  anosDisp.forEach(ano => {
    comparativo[ano] = {};
    registros.filter(r => r.data?.startsWith(ano)).forEach(r => {
      const mes = r.data?.slice(5, 7);
      comparativo[ano][mes] = (comparativo[ano][mes] || 0) + (parseFloat(r.mm) || 0);
    });
  });

  const maxMM = Math.max(1, ...Object.values(dadosPorMes));

  const imprimir = () => {
    const faz = state.fazenda || {};
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Relatório Pluviométrico - ${anoSel}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;font-size:12px;color:#111}${gerarCabecalhoCSS()}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#f3f4f6;padding:7px 10px;text-align:left;border:1px solid #ddd;font-size:10px}td{padding:7px 10px;border:1px solid #ddd}.tot td{font-weight:700;background:#f0fdf4}.footer{margin-top:28px;font-size:9px;color:#aaa;text-align:center;border-top:1px solid #eee;padding-top:8px}</style></head><body>
    ${gerarCabecalhoHTML(faz, "RELATÓRIO PLUVIOMÉTRICO", anoSel)}
    <h3 style="margin:16px 0 8px;font-size:13px">📊 Precipitação Mensal por Talhão (mm)</h3>
    <table><thead><tr><th>Talhão</th>${mesesNomes.map(m => `<th style="text-align:center">${m}</th>`).join("")}<th style="text-align:center;font-weight:900">Total</th></tr></thead><tbody>
    ${talhaoNames.map(t => {
      const total = Object.values(dadosPorTalhao[t]).reduce((s, v) => s + v, 0);
      return `<tr><td style="font-weight:700">${t}</td>${["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => `<td style="text-align:center">${(dadosPorTalhao[t][m] || 0).toFixed(1)}</td>`).join("")}<td style="text-align:center;font-weight:700">${total.toFixed(1)}</td></tr>`;
    }).join("")}
    <tr class="tot"><td><strong>TOTAL GERAL</strong></td>${["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => `<td style="text-align:center;font-weight:700">${(dadosPorMes[m] || 0).toFixed(1)}</td>`).join("")}<td style="text-align:center;font-weight:900;font-size:13px">${totalAno.toFixed(1)} mm</td></tr>
    </tbody></table>
    ${anosDisp.length > 1 ? `<h3 style="margin:24px 0 8px;font-size:13px">📈 Comparativo Anual (mm)</h3>
    <table><thead><tr><th>Ano</th>${mesesNomes.map(m => `<th style="text-align:center">${m}</th>`).join("")}<th style="text-align:center;font-weight:900">Total</th></tr></thead><tbody>
    ${anosDisp.map(ano => {
      const totalA = Object.values(comparativo[ano]).reduce((s, v) => s + v, 0);
      return `<tr><td style="font-weight:700">${ano}</td>${["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => `<td style="text-align:center">${(comparativo[ano][m] || 0).toFixed(1)}</td>`).join("")}<td style="text-align:center;font-weight:700">${totalA.toFixed(1)}</td></tr>`;
    }).join("")}
    </tbody></table>` : ""}
    <div class="footer">AgriGest · Relatório Pluviométrico · ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`);
    win.document.close(); setTimeout(() => win.print(), 400);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <SectionTitle>🌧️ Relatório Pluviométrico</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <Select value={anoSel} onChange={e => setAnoSel(e.target.value)} style={{ minWidth: 110 }}>
            {(anosDisp.length > 0 ? anosDisp : [new Date().getFullYear().toString()]).map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Btn variant="info" onClick={imprimir}>🖨️ Imprimir</Btn>
        </div>
      </div>

      {/* Resumo cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Card style={{ borderLeft: `3px solid ${theme.info}`, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 4 }}>Total {anoSel}</div>
          <div style={{ fontWeight: 900, fontSize: 28, color: theme.info }}>{totalAno.toFixed(1)} mm</div>
        </Card>
        <Card style={{ borderLeft: `3px solid ${theme.accent}`, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 4 }}>Talhões</div>
          <div style={{ fontWeight: 900, fontSize: 28, color: theme.accent }}>{talhaoNames.length}</div>
        </Card>
        <Card style={{ borderLeft: `3px solid ${theme.gold}`, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 4 }}>Média Mensal</div>
          <div style={{ fontWeight: 900, fontSize: 28, color: theme.gold }}>{(totalAno / 12).toFixed(1)} mm</div>
        </Card>
      </div>

      {/* Gráfico de barras simples */}
      <Card style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: theme.text }}>📊 Precipitação Mensal — {anoSel}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
          {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => {
            const val = dadosPorMes[m] || 0;
            const pct = maxMM > 0 ? (val / maxMM) * 100 : 0;
            return (
              <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>{val > 0 ? val.toFixed(0) : ""}</span>
                <div style={{ width: "100%", maxWidth: 36, height: `${Math.max(pct, 2)}%`, background: val > 0 ? `linear-gradient(to top, ${theme.info}, ${theme.info}88)` : `${theme.border}44`, borderRadius: "4px 4px 0 0", minHeight: 3, transition: "height .3s" }} />
                <span style={{ fontSize: 9, color: theme.muted }}>{mesesNomes[i]}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabela por Talhão */}
      {talhaoNames.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: theme.text }}>📋 Detalhamento por Talhão</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                  <th style={{ padding: "8px", textAlign: "left", color: theme.muted }}>Talhão</th>
                  {mesesNomes.map(m => <th key={m} style={{ padding: "8px 4px", textAlign: "center", color: theme.muted, fontSize: 10 }}>{m}</th>)}
                  <th style={{ padding: "8px", textAlign: "center", color: theme.text, fontWeight: 800 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {talhaoNames.map(t => {
                  const total = Object.values(dadosPorTalhao[t]).reduce((s, v) => s + v, 0);
                  return (
                    <tr key={t} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                      <td style={{ padding: "8px", fontWeight: 600 }}>{t}</td>
                      {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                        <td key={m} style={{ padding: "8px 4px", textAlign: "center", color: (dadosPorTalhao[t][m] || 0) > 0 ? theme.info : theme.muted, fontSize: 11 }}>
                          {(dadosPorTalhao[t][m] || 0).toFixed(1)}
                        </td>
                      ))}
                      <td style={{ padding: "8px", textAlign: "center", fontWeight: 800, color: theme.info }}>{total.toFixed(1)}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: `${theme.accent}0a`, borderTop: `2px solid ${theme.border}` }}>
                  <td style={{ padding: "8px", fontWeight: 800 }}>TOTAL</td>
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                    <td key={m} style={{ padding: "8px 4px", textAlign: "center", fontWeight: 700, fontSize: 11 }}>{(dadosPorMes[m] || 0).toFixed(1)}</td>
                  ))}
                  <td style={{ padding: "8px", textAlign: "center", fontWeight: 900, fontSize: 14, color: theme.info }}>{totalAno.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Comparativo Anual */}
      {anosDisp.length > 1 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: theme.text }}>📈 Comparativo Anual</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                  <th style={{ padding: "8px", textAlign: "left", color: theme.muted }}>Ano</th>
                  {mesesNomes.map(m => <th key={m} style={{ padding: "8px 4px", textAlign: "center", color: theme.muted, fontSize: 10 }}>{m}</th>)}
                  <th style={{ padding: "8px", textAlign: "center", color: theme.text, fontWeight: 800 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {anosDisp.map(ano => {
                  const totalA = Object.values(comparativo[ano]).reduce((s, v) => s + v, 0);
                  return (
                    <tr key={ano} style={{ borderBottom: `1px solid ${theme.border}22`, background: ano === anoSel ? `${theme.info}0a` : "transparent" }}>
                      <td style={{ padding: "8px", fontWeight: ano === anoSel ? 800 : 600 }}>{ano} {ano === anoSel ? "◄" : ""}</td>
                      {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                        <td key={m} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11 }}>{(comparativo[ano][m] || 0).toFixed(1)}</td>
                      ))}
                      <td style={{ padding: "8px", textAlign: "center", fontWeight: 800 }}>{totalA.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {registros.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: theme.muted }}>
          <p style={{ fontSize: 48, marginBottom: 8 }}>🌧️</p>
          <p>Nenhum dado pluviométrico registrado.</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>Registre os dados de chuva na aba "Pluviômetro" para gerar os relatórios.</p>
        </div>
      )}
    </div>
  );
}

// ─── RELATÓRIOS (DEPARTAMENTO COM ABAS) ─────────────────────────────────────
function RelatoriosDept({ state, setState, usuario, initialAba }) {
  const allAbas = [
    { id: "produtividade", label: "📈 Produtividade", icon: "📈" },
    { id: "relatorioMotoristas", label: "📊 Rel. Motoristas", icon: "📊" },
    { id: "relatoriosDiarios", label: "📅 Rel. Diário de Colheita", icon: "📅" },
    { id: "relatorioCarregamentos", label: "📦 Rel. Carregamentos", icon: "📦" },
    { id: "pluviometro", label: "🌧️ Pluviômetro", icon: "🌧️" },
    { id: "relPluviometria", label: "📊 Rel. Pluviometria", icon: "📊" },
  ];
  const abas = allAbas.filter(a => temAcessoSubmodulo(usuario, "relatoriosDept", a.id));
  const [aba, setAba] = useState(() => getBaseAba(initialAba, abas) || (abas[0]?.id || "produtividade"));
  useEffect(() => { if (initialAba) { const id = initialAba.split("|")[0]; if (abas.some(a => a.id === id)) setAba(id); } }, [initialAba]);

  const renderContent = () => {
    switch (aba) {
      case "produtividade": return <Produtividade state={state} />;
      case "relatorioMotoristas": return <RelatorioMotoristas state={state} />;
      case "relatoriosDiarios": return <RelatoriosDiarios state={state} />;
      case "relatorioCarregamentos": return <RelatorioCarregamentos state={state} />;
      case "pluviometro": return <Pluviometro state={state} setState={setState} />;
      case "relPluviometria": return <RelatorioPluviometria state={state} />;
      default: return <Produtividade state={state} />;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", paddingBottom: 8 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            background: aba === a.id ? `${theme.accent}22` : "transparent",
            border: aba === a.id ? `1px solid ${theme.accent}44` : `1px solid ${theme.border}`,
            color: aba === a.id ? theme.accentLight : theme.muted,
            fontFamily: "inherit", fontSize: 13, fontWeight: aba === a.id ? 600 : 400,
            transition: "all .2s", display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

// ─── INSUMOS (DEPARTAMENTO COM ABAS) ────────────────────────────────────────
function InsumosDept({ state, setState, usuario, initialAba }) {
  const allAbas = [
    { id: "insumos", label: "🧪 Cadastro de Insumos", icon: "🧪" },
    { id: "estoque", label: "📦 Estoque Insumos", icon: "📦" },
    { id: "recebimentoInsumos", label: "📥 Recebimento", icon: "📥" },
    { id: "fichasAplicacao", label: "📋 Fichas de Aplicação", icon: "📋" },
  ];
  const abas = allAbas.filter(a => temAcessoSubmodulo(usuario, "insumosDept", a.id));
  const [aba, setAba] = useState(() => getBaseAba(initialAba, abas) || (abas[0]?.id || "insumos"));
  useEffect(() => { if (initialAba) { const id = initialAba.split("|")[0]; if (abas.some(a => a.id === id)) setAba(id); } }, [initialAba]);

  const crudPages = {
    insumos: { title: "🧪 Cadastro de Insumos", stateKey: "insumos", fields: [
      { key: "nome", label: "Nome do Insumo" }, { key: "tipo", label: "Tipo", type: "select", options: ["Fertilizante","Herbicida","Inseticida","Fungicida","Adjuvante","Semente","Outro"] },
      { key: "unidade", label: "Unidade", type: "select", options: ["Litro","Kg","Saco","Unidade"] }, { key: "precoUnitario", label: "Preço Unitário (R$)", type: "number" }
    ]},
    recebimentoInsumos: { title: "📥 Recebimento de Insumos", stateKey: "recebimentoInsumos", fields: [
      { key: "data", label: "Data", type: "date" }, { key: "insumo", label: "Insumo" },
      { key: "quantidade", label: "Quantidade", type: "number" }, { key: "fornecedor", label: "Fornecedor" }, { key: "notaFiscal", label: "Nota Fiscal" }
    ]},
  };

  const renderContent = () => {
    switch (aba) {
      case "insumos": return <CrudPage {...crudPages.insumos} state={state} setState={setState} />;
      case "estoque": return <Estoque state={state} setState={setState} />;
      case "recebimentoInsumos": return <CrudPage {...crudPages.recebimentoInsumos} state={state} setState={setState} />;
      case "fichasAplicacao": return <FichasAplicacao state={state} setState={setState} />;
      default: return <CrudPage {...crudPages.insumos} state={state} setState={setState} />;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", paddingBottom: 8 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            background: aba === a.id ? `${theme.accent}22` : "transparent",
            border: aba === a.id ? `1px solid ${theme.accent}44` : `1px solid ${theme.border}`,
            color: aba === a.id ? theme.accentLight : theme.muted,
            fontFamily: "inherit", fontSize: 13, fontWeight: aba === a.id ? 600 : 400,
            transition: "all .2s", display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

function Financas({ state, setState, usuario, initialAba }) {
  const allAbas = [
    { id: "contasPagar", label: "💰 Contas a Pagar", icon: "💰" },
    { id: "contasReceber", label: "💵 Contas a Receber", icon: "💵" },
    { id: "despesasOp", label: "📋 Despesas Operacionais", icon: "📋" },
    { id: "fluxoCaixa", label: "📊 Fluxo de Caixa", icon: "📊" },
    { id: "dre", label: "📈 DRE", icon: "📈" },
  ];
  const abas = allAbas.filter(a => temAcessoSubmodulo(usuario, "financas", a.id));
  const [aba, setAba] = useState(() => getBaseAba(initialAba, abas) || (abas[0]?.id || "contasPagar"));
  useEffect(() => { if (initialAba) { const id = initialAba.split("|")[0]; if (abas.some(a => a.id === id)) setAba(id); } }, [initialAba]);

  const renderContent = () => {
    switch (aba) {
      case "contasPagar": return <ContasPagar state={state} setState={setState} />;
      case "contasReceber": return <ContasReceber state={state} setState={setState} />;
      case "despesasOp": return <DespesasOperacionais state={state} setState={setState} />;
      case "fluxoCaixa": return <FluxoCaixa state={state} />;
      case "dre": return <RelatorioFinanceiro state={state} />;
      default: return <ContasPagar state={state} setState={ss} />;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", paddingBottom: 8 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            background: aba === a.id ? `${theme.accent}22` : "transparent",
            border: aba === a.id ? `1px solid ${theme.accent}44` : `1px solid ${theme.border}`,
            color: aba === a.id ? theme.accentLight : theme.muted,
            fontFamily: "inherit", fontSize: 13, fontWeight: aba === a.id ? 600 : 400,
            transition: "all .2s", display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

// ─── TROCAS DE ÓLEO ──────────────────────────────────────────────────────────
function TrocasOleo({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.trocasOleo || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ data: new Date().toISOString().split("T")[0], tipoOleo: "Motor" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, trocasOleo: (s.trocasOleo || []).filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, trocasOleo: editing ? (s.trocasOleo || []).map(x => x.id === editing ? item : x) : [...(s.trocasOleo || []), item] }));
    setOpen(false);
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Nova Troca de Óleo</Btn>}>🛢️ Trocas de Óleo</SectionTitle>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🛢️" text="Nenhuma troca de óleo registrada." />
        ) : (
          <Table
            headers={["Data", "Máquina", "Tipo de Óleo", "Litros", "Marca/Produto", "Horímetro", "Próxima Troca", "Responsável", "Ações"]}
            rows={items.map(m => (
              <tr key={m.id}>
                <Td>{formatDate(m.data)}</Td>
                <Td><strong>{m.maquina || "—"}</strong></Td>
                <Td>{m.tipoOleo || "—"}</Td>
                <Td><strong style={{ color: theme.accent }}>{m.litros || "—"} L</strong></Td>
                <Td>{m.marcaProduto || "—"}</Td>
                <Td>{m.horimetro || "—"}</Td>
                <Td>{m.proximaTroca ? formatDate(m.proximaTroca) : "—"}</Td>
                <Td>{m.responsavel || "—"}</Td>
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
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Troca de Óleo`} width={600}>
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
          <Field label="Tipo de Óleo">
            <Select value={form.tipoOleo} onChange={e => fp("tipoOleo", e.target.value)}>
              {["Motor", "Hidráulico", "Transmissão", "Diferencial", "Outros"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Litros"><Input type="number" step="0.1" value={form.litros} onChange={e => fp("litros", e.target.value)} placeholder="0.00" /></Field>
        </Row>
        <Row>
          <Field label="Marca/Produto"><Input value={form.marcaProduto} onChange={e => fp("marcaProduto", e.target.value)} placeholder="Ex: Lubrax Top Turbo" /></Field>
          <Field label="Horímetro Atual"><Input value={form.horimetro} onChange={e => fp("horimetro", e.target.value)} placeholder="Ex: 5200 h" /></Field>
        </Row>
        <Row>
          <Field label="Próxima Troca (Data)"><Input type="date" value={form.proximaTroca} onChange={e => fp("proximaTroca", e.target.value)} /></Field>
          <Field label="Responsável"><Input value={form.responsavel} onChange={e => fp("responsavel", e.target.value)} placeholder="Nome do mecânico" /></Field>
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

// ─── FILTROS ─────────────────────────────────────────────────────────────────
function Filtros({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.filtros || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ data: new Date().toISOString().split("T")[0], tipoFiltro: "Óleo" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, filtros: (s.filtros || []).filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, filtros: editing ? (s.filtros || []).map(x => x.id === editing ? item : x) : [...(s.filtros || []), item] }));
    setOpen(false);
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Filtro</Btn>}>🔄 Troca de Filtros</SectionTitle>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🔄" text="Nenhuma troca de filtro registrada." />
        ) : (
          <Table
            headers={["Data", "Máquina", "Tipo Filtro", "Marca/Código", "Horímetro", "Próxima Troca", "Responsável", "Ações"]}
            rows={items.map(m => (
              <tr key={m.id}>
                <Td>{formatDate(m.data)}</Td>
                <Td><strong>{m.maquina || "—"}</strong></Td>
                <Td><Badge color={m.tipoFiltro === "Óleo" ? "gold" : m.tipoFiltro === "Ar" ? "blue" : m.tipoFiltro === "Combustível" ? "green" : "default"}>{m.tipoFiltro || "—"}</Badge></Td>
                <Td>{m.marcaCodigo || "—"}</Td>
                <Td>{m.horimetro || "—"}</Td>
                <Td>{m.proximaTroca ? formatDate(m.proximaTroca) : "—"}</Td>
                <Td>{m.responsavel || "—"}</Td>
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
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Troca de Filtro`} width={600}>
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
          <Field label="Tipo de Filtro">
            <Select value={form.tipoFiltro} onChange={e => fp("tipoFiltro", e.target.value)}>
              {["Óleo", "Ar", "Combustível", "Hidráulico", "Ar Condicionado", "Separador de Água", "Outros"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Marca / Código"><Input value={form.marcaCodigo} onChange={e => fp("marcaCodigo", e.target.value)} placeholder="Ex: Mann W719/30" /></Field>
        </Row>
        <Row>
          <Field label="Horímetro Atual"><Input value={form.horimetro} onChange={e => fp("horimetro", e.target.value)} placeholder="Ex: 5200 h" /></Field>
          <Field label="Próxima Troca (Data)"><Input type="date" value={form.proximaTroca} onChange={e => fp("proximaTroca", e.target.value)} /></Field>
        </Row>
        <Field label="Responsável"><Input value={form.responsavel} onChange={e => fp("responsavel", e.target.value)} placeholder="Nome do mecânico" /></Field>
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

// ─── MANUTENÇÕES ─────────────────────────────────────────────────────────────
function Manutencoes({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.manutencoes || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ data: new Date().toISOString().split("T")[0], tipo: "Preventiva", status: "Pendente" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, manutencoes: (s.manutencoes || []).filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, manutencoes: editing ? (s.manutencoes || []).map(x => x.id === editing ? item : x) : [...(s.manutencoes || []), item] }));
    setOpen(false);
  };

  const totalPendentes = items.filter(m => m.status === "Pendente").length;
  const totalAndamento = items.filter(m => m.status === "Em Andamento").length;
  const totalConcluidas = items.filter(m => m.status === "Concluída").length;

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Nova Manutenção</Btn>}>🔧 Manutenções</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Pendentes", value: totalPendentes, color: theme.warning, icon: "⏳" },
          { label: "Em Andamento", value: totalAndamento, color: theme.info, icon: "🔧" },
          { label: "Concluídas", value: totalConcluidas, color: theme.accent, icon: "✅" },
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
          <EmptyState icon="🔧" text="Nenhuma manutenção registrada." />
        ) : (
          <Table
            headers={["Data", "Máquina", "Tipo", "Descrição", "Custo (R$)", "Status", "Responsável", "Ações"]}
            rows={items.map(m => (
              <tr key={m.id}>
                <Td>{formatDate(m.data)}</Td>
                <Td><strong>{m.maquina || "—"}</strong></Td>
                <Td><Badge color={m.tipo === "Preventiva" ? "blue" : m.tipo === "Corretiva" ? "red" : "gold"}>{m.tipo || "—"}</Badge></Td>
                <Td>{m.descricao || "—"}</Td>
                <Td><strong style={{ color: theme.gold }}>R$ {parseFloat(m.custo || 0).toFixed(2)}</strong></Td>
                <Td><Badge color={m.status === "Concluída" ? "green" : m.status === "Em Andamento" ? "blue" : "gold"}>{m.status || "Pendente"}</Badge></Td>
                <Td>{m.responsavel || "—"}</Td>
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
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Nova"} Manutenção`} width={650}>
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
          <Field label="Tipo de Manutenção">
            <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
              {["Preventiva", "Corretiva", "Preditiva"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => fp("status", e.target.value)}>
              {["Pendente", "Em Andamento", "Concluída", "Cancelada"].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Descrição do Serviço"><Input value={form.descricao} onChange={e => fp("descricao", e.target.value)} placeholder="Ex: Troca de correia, revisão geral..." /></Field>
        <Row>
          <Field label="Custo (R$)"><Input type="number" step="0.01" value={form.custo} onChange={e => fp("custo", e.target.value)} placeholder="0.00" /></Field>
          <Field label="Responsável/Oficina"><Input value={form.responsavel} onChange={e => fp("responsavel", e.target.value)} placeholder="Nome do mecânico ou oficina" /></Field>
        </Row>
        <Row>
          <Field label="Horímetro Atual"><Input value={form.horimetro} onChange={e => fp("horimetro", e.target.value)} placeholder="Ex: 5200 h" /></Field>
          <Field label="Previsão de Conclusão"><Input type="date" value={form.previsaoConclusao} onChange={e => fp("previsaoConclusao", e.target.value)} /></Field>
        </Row>
        <Field label="Peças Utilizadas"><Input value={form.pecasUtilizadas} onChange={e => fp("pecasUtilizadas", e.target.value)} placeholder="Ex: Correia dentada, filtro de óleo" /></Field>
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

// ─── IMPLEMENTOS ─────────────────────────────────────────────────────────────
function Implementos({ state, setState }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const items = state.implementos || [];

  const fp = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ status: "Disponível", tipo: "Grade" }); setEditing(null); setOpen(true); };
  const openEdit = i => { setForm({ ...i }); setEditing(i.id); setOpen(true); };
  const del = id => setState(s => ({ ...s, implementos: (s.implementos || []).filter(x => x.id !== id) }));
  const save = () => {
    const item = { ...form, id: editing || uid() };
    setState(s => ({ ...s, implementos: editing ? (s.implementos || []).map(x => x.id === editing ? item : x) : [...(s.implementos || []), item] }));
    setOpen(false);
  };

  return (
    <div>
      <SectionTitle action={<Btn onClick={openNew}>+ Novo Implemento</Btn>}>🔩 Implementos</SectionTitle>
      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🔩" text="Nenhum implemento cadastrado." />
        ) : (
          <Table
            headers={["Identificação", "Tipo", "Marca/Modelo", "Largura", "Ano", "Patrimônio", "Status", "Ações"]}
            rows={items.map(m => (
              <tr key={m.id}>
                <Td><strong>{m.nome || "—"}</strong></Td>
                <Td>{m.tipo || "—"}</Td>
                <Td>{m.marcaModelo || "—"}</Td>
                <Td>{m.largura ? `${m.largura} m` : "—"}</Td>
                <Td>{m.ano || "—"}</Td>
                <Td>{m.patrimonio || "—"}</Td>
                <Td><Badge color={m.status === "Disponível" ? "green" : m.status === "Em Uso" ? "blue" : "red"}>{m.status || "Disponível"}</Badge></Td>
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
      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? "Editar" : "Novo"} Implemento`} width={600}>
        <Row>
          <Field label="Identificação/Nome"><Input value={form.nome} onChange={e => fp("nome", e.target.value)} placeholder="Ex: Grade Aradora 16 discos" /></Field>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={e => fp("tipo", e.target.value)}>
              {["Grade", "Plantadeira", "Pulverizador", "Colhedora", "Roçadeira", "Subsolador", "Carreta", "Distribuidor", "Plaina", "Outros"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Marca/Modelo"><Input value={form.marcaModelo} onChange={e => fp("marcaModelo", e.target.value)} placeholder="Ex: Baldan CRSG" /></Field>
          <Field label="Largura de Trabalho (m)"><Input type="number" step="0.1" value={form.largura} onChange={e => fp("largura", e.target.value)} placeholder="0.0" /></Field>
        </Row>
        <Row>
          <Field label="Ano de Fabricação"><Input type="number" value={form.ano} onChange={e => fp("ano", e.target.value)} placeholder="2020" /></Field>
          <Field label="Patrimônio"><Input value={form.patrimonio} onChange={e => fp("patrimonio", e.target.value)} placeholder="Código patrimônio" /></Field>
        </Row>
        <Row>
          <Field label="Status">
            <Select value={form.status} onChange={e => fp("status", e.target.value)}>
              {["Disponível", "Em Uso", "Manutenção", "Inativo"].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Máquina Acoplada">
            <Select value={form.maquinaAcoplada} onChange={e => fp("maquinaAcoplada", e.target.value)}>
              <option value="">Nenhuma</option>
              {(state.maquinas || []).map(m => <option key={m.id}>{m.nome} ({m.tipo})</option>)}
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

// ─── MÁQUINAS E EQUIPAMENTOS (DEPARTAMENTO) ──────────────────────────────────
function MaquinasEquipamentos({ state, setState, usuario, initialAba }) {
  const allAbas = [
    { id: "maquinas", label: "🚜 Máquinas", icon: "🚜" },
    { id: "implementos", label: "🔩 Implementos", icon: "🔩" },
    { id: "abastecimento", label: "⛽ Abastecimento", icon: "⛽" },
    { id: "trocasOleo", label: "🛢️ Trocas de Óleo", icon: "🛢️" },
    { id: "filtros", label: "🔄 Filtros", icon: "🔄" },
    { id: "manutencoes", label: "🔧 Manutenções", icon: "🔧" },
    { id: "relatorioCombustivel", label: "📈 Rel. Consumo", icon: "📈" },
  ];
  const abas = allAbas.filter(a => temAcessoSubmodulo(usuario, "maquinasEquipamentos", a.id));
  const [aba, setAba] = useState(() => getBaseAba(initialAba, abas) || (abas[0]?.id || "maquinas"));
  useEffect(() => { if (initialAba) { const id = initialAba.split("|")[0]; if (abas.some(a => a.id === id)) setAba(id); } }, [initialAba]);

  const renderContent = () => {
    switch (aba) {
      case "maquinas": return <Maquinas state={state} setState={setState} />;
      case "implementos": return <Implementos state={state} setState={setState} />;
      case "abastecimento": return <Abastecimento state={state} setState={setState} />;
      case "trocasOleo": return <TrocasOleo state={state} setState={setState} />;
      case "filtros": return <Filtros state={state} setState={setState} />;
      case "manutencoes": return <Manutencoes state={state} setState={setState} />;
      case "relatorioCombustivel": return <RelatorioCombustivel state={state} />;
      default: return <Maquinas state={state} setState={setState} />;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", paddingBottom: 8 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            background: aba === a.id ? `${theme.accent}22` : "transparent",
            border: aba === a.id ? `1px solid ${theme.accent}44` : `1px solid ${theme.border}`,
            color: aba === a.id ? theme.accentLight : theme.muted,
            fontFamily: "inherit", fontSize: 13, fontWeight: aba === a.id ? 600 : 400,
            transition: "all .2s", display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

// ─── ALMOXARIFADO (DEPARTAMENTO) ─────────────────────────────────────────────
function AlmoxarifadoDept({ state, setState, usuario, initialAba }) {
  const pecasBaixo = (state.pecas || []).filter(p => { const q = parseFloat(p.quantidade) || 0, m = parseFloat(p.estoqueMinimo) || 0; return m > 0 && q <= m; });

  const allAbas = [
    { id: "pecas", label: "🔧 Peças", icon: "🔧" },
    { id: "movimentacaoPecas", label: "📦 Movimentação", icon: "📦" },
    { id: "historico", label: "📜 Histórico", icon: "📜" },
    { id: "estoquePecas", label: "📊 Estoque", icon: "📊" },
    { id: "consumo", label: "📋 Consumo", icon: "📋" },
    { id: "etiquetas", label: "🏷️ Etiquetas", icon: "🏷️" },
    { id: "inventario", label: "📝 Inventário", icon: "📝" },
    { id: "graficos", label: "📈 Gráficos", icon: "📈" },
    { id: "requisicoes", label: "🛒 Requisições", icon: "🛒" },
  ];
  const abas = allAbas.filter(a => temAcessoSubmodulo(usuario, "almoxarifado", a.id));
  const [aba, setAba] = useState(() => getBaseAba(initialAba, abas) || (abas[0]?.id || "pecas"));
  useEffect(() => { if (initialAba) { const id = initialAba.split("|")[0]; if (abas.some(a => a.id === id)) setAba(id); } }, [initialAba]);

  const renderContent = () => {
    switch (aba) {
      case "pecas": return <Pecas state={state} setState={setState} />;
      case "movimentacaoPecas": return <MovimentacaoPecas state={state} setState={setState} />;
      case "historico": return <HistoricoMovimentacoes state={state} />;
      case "estoquePecas": return <EstoquePecas state={state} />;
      case "consumo": return <RelatorioConsumo state={state} />;
      case "etiquetas": return <EtiquetasPecas state={state} />;
      case "inventario": return <InventarioEstoque state={state} setState={setState} />;
      case "graficos": return <GraficosMovimentacao state={state} />;
      case "requisicoes": return <RequisicoesCompra state={state} setState={setState} />;
      default: return <Pecas state={state} setState={setState} />;
    }
  };

  return (
    <div>
      {pecasBaixo.length > 0 && (
        <div style={{ background: `${theme.warning}15`, border: `1px solid ${theme.warning}33`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: theme.warning }}>{pecasBaixo.length} peça(s) com estoque baixo/zerado</span>
            <span style={{ color: theme.muted, fontSize: 12, marginLeft: 8 }}>— Verifique a aba Estoque ou gere uma Requisição automática</span>
          </div>
          <Btn size="sm" variant="gold" onClick={() => setAba("requisicoes")}>🛒 Requisições</Btn>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", paddingBottom: 8 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
            background: aba === a.id ? `${theme.accent}22` : "transparent",
            border: aba === a.id ? `1px solid ${theme.accent}44` : `1px solid ${theme.border}`,
            color: aba === a.id ? theme.accentLight : theme.muted,
            fontFamily: "inherit", fontSize: 12, fontWeight: aba === a.id ? 600 : 400,
            transition: "all .2s", display: "flex", alignItems: "center", gap: 4
          }}>
            <span style={{ fontSize: 13 }}>{a.icon}</span> {a.label.replace(/^[^\s]+\s/, "")}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

// ─── CADASTROS (DEPARTAMENTO) ────────────────────────────────────────────────
function SafraCadastro({ state, setState }) {
   const ss = (updates) => setState(prev => ({ ...prev, ...(typeof updates === "function" ? updates(prev) : updates) }));
   const safras = state.safras || [];
   const [modal, setModal] = useState(false);
   const [editIdx, setEditIdx] = useState(null);
   const emptyForm = { nome: "", anoInicio: "", anoFim: "", status: "Planejada", obs: "" };
   const [form, setForm] = useState({ ...emptyForm });
   const fp = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const statusOpcoes = ["Planejada", "Em Andamento", "Concluída"];

    // Auto-finalizar safras cujo ano fim já passou OU cujo ano fim é o ano atual e já passou de junho
    useEffect(() => {
      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth();
      const updated = safras.map(s => {
        const anoFim = parseInt(s.anoFim);
        // Migra status antigo "Finalizada" para "Concluída"
        let currentStatus = s.status === "Finalizada" ? "Concluída" : s.status;
        if (currentStatus !== "Concluída" && currentStatus !== "Cancelada" && s.anoFim) {
          if (anoFim < anoAtual || (anoFim === anoAtual && mesAtual >= 6)) {
            return { ...s, status: "Concluída" };
          }
        }
        if (currentStatus !== s.status) return { ...s, status: currentStatus };
        return s;
      });
      const changed = updated.some((s, i) => s.status !== safras[i]?.status);
      if (changed) ss({ safras: updated });
    }, []);

   const openNew = () => { setForm({ ...emptyForm }); setEditIdx(null); setModal(true); };
   const openEdit = (i) => { setForm({ ...safras[i] }); setEditIdx(i); setModal(true); };
    const salvar = () => {
      if (!form.nome || !form.anoInicio || !form.anoFim) { alert("Preencha Nome, Ano Início e Ano Fim."); return; }
      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth();
      const anoFim = parseInt(form.anoFim);
      const anoIni = parseInt(form.anoInicio);
      let statusFinal = form.status;
      if (anoFim < anoAtual || (anoFim === anoAtual && mesAtual >= 6)) {
        statusFinal = "Concluída";
      } else if (anoIni <= anoAtual && statusFinal === "Planejada") {
        statusFinal = "Em Andamento";
      }
      const updated = [...safras];
      if (editIdx !== null) { updated[editIdx] = { ...form, status: statusFinal }; }
      else { updated.push({ ...form, status: statusFinal, id: Date.now() }); }
      ss({ safras: updated });
      setModal(false);
      setForm({ ...emptyForm });
      setEditIdx(null);
    };

    // Exportar backup individual de uma safra (JSON com dados vinculados)
    const exportarBackupSafra = (s) => {
      const safraKey = `${s.anoInicio}/${s.anoFim}`;
      const dados = {
        safra: s,
        exportadoEm: new Date().toISOString(),
        romaneiosEntrada: (state.romaneiosEntrada || []).filter(r => r.safra === safraKey),
        romaneiosSaida: (state.romaneiosSaida || []).filter(r => r.safra === safraKey),
        pluviometro: (state.pluviometro || []).filter(p => p.safra === safraKey),
        vendasMilho: (state.vendasMilho || []).filter(v => v.safra === safraKey),
      };
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `backup_safra_${s.nome.replace(/\s/g,"_")}.json`; a.click();
      URL.revokeObjectURL(url);
    };

    const exportarSafras = () => {
      const linhas = [["Nome", "Ano Início", "Ano Fim", "Status", "Observações"]];
      safras.forEach(s => linhas.push([s.nome, s.anoInicio, s.anoFim, s.status, s.obs || ""]));
      const csv = linhas.map(r => r.map(c => `"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "safras_agrigest.csv"; a.click();
      URL.revokeObjectURL(url);
    };

   const getStatusStyle = (status) => {
     if (status === "Planejada") return { bg: `${theme.accent}18`, border: `${theme.accent}44`, color: theme.accent, icon: "📋" };
     if (status === "Em Andamento") return { bg: `${theme.gold}18`, border: `${theme.gold}44`, color: theme.gold, icon: "🌱" };
     if (status === "Concluída") return { bg: "#22c55e18", border: "#22c55e44", color: "#22c55e", icon: "✅" };
     return { bg: "#ef444418", border: "#ef444444", color: "#ef4444", icon: "❌" };
   };

   return (
     <div>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
         <SectionTitle>📅 Cadastro de Ano Safra</SectionTitle>
          <div style={{ display: "flex", gap: 8 }}>
            {safras.length > 0 && <Btn variant="ghost" onClick={exportarSafras}>📥 Exportar CSV</Btn>}
            <Btn onClick={openNew}>+ Novo Ano Safra</Btn>
          </div>
       </div>

       {/* Info: safras são permanentes */}
       <div style={{ background: `${theme.info}0a`, border: `1px solid ${theme.info}33`, borderRadius: 10, padding: "10px 16px", marginBottom: 18 }}>
         <p style={{ fontSize: 12, color: theme.info, margin: 0 }}>ℹ️ <strong>Histórico permanente:</strong> As safras nunca são removidas do sistema, mantendo um histórico completo. Mesmo após concluída, os dados de grãos e relatórios permanecem editáveis. Cadastros, máquinas e almoxarifado são compartilhados entre todas as safras. Use "💾" para exportar backup da safra.</p>
       </div>

       {safras.length === 0 ? (
         <div style={{ textAlign: "center", padding: 50, color: theme.muted, background: `${theme.card}`, borderRadius: 16, border: `1px dashed ${theme.border}` }}>
           <div style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${theme.accent}22, ${theme.gold}22)`, borderRadius: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 14 }}>📅</div>
           <p style={{ fontSize: 16, fontWeight: 600, color: theme.text, marginBottom: 4 }}>Nenhum ano safra cadastrado</p>
           <p style={{ fontSize: 13, marginBottom: 18 }}>Cadastre seu primeiro ano safra para começar</p>
           <Btn onClick={openNew} style={{ marginTop: 4 }}>Cadastrar Primeiro Ano Safra</Btn>
         </div>
       ) : (
         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
           {safras.map((s, i) => {
             const st = getStatusStyle(s.status);
             return (
               <div key={s.id || i} style={{
                 background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}`,
                 overflow: "hidden", transition: "all .2s", position: "relative"
               }}>
                 <div style={{ height: 4, background: `linear-gradient(90deg, ${st.color}, ${st.color}88)` }} />
                 <div style={{ padding: "18px 20px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                     <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                       <div style={{ width: 42, height: 42, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{st.icon}</div>
                       <div>
                         <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, lineHeight: 1.2 }}>{s.nome}</div>
                         <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Período: {s.anoInicio} — {s.anoFim}</div>
                       </div>
                     </div>
                     <div style={{ display: "flex", gap: 4 }}>
                       <Btn size="sm" variant="ghost" onClick={() => openEdit(i)} title="Editar">✏️</Btn>
                       <Btn size="sm" variant="ghost" onClick={() => exportarBackupSafra(s)} title="Exportar Backup">💾</Btn>
                     </div>
                   </div>
                   <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                     <Badge color={s.status === "Planejada" ? "blue" : s.status === "Em Andamento" ? "gold" : s.status === "Concluída" ? "green" : "red"}>{s.status}</Badge>
                     {s.obs && <span style={{ fontSize: 11, color: theme.muted, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>💬 {s.obs}</span>}
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       )}
       {modal && (
         <Modal open={modal} title={editIdx !== null ? "Editar Ano Safra" : "Novo Ano Safra"} onClose={() => setModal(false)}>
           <div style={{ marginBottom: 12, padding: "12px 16px", background: `linear-gradient(135deg, ${theme.accent}0d, ${theme.gold}0d)`, borderRadius: 12, border: `1px solid ${theme.accent}22` }}>
             <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>📌 O status é gerenciado automaticamente: muda para <strong>"Em Andamento"</strong> ao iniciar o ano e para <strong>"Concluída"</strong> quando o período encerrar. Mesmo concluída, dados de grãos e relatórios continuam editáveis.</p>
           </div>
           <Row>
             <Field label="Nome do Ano Safra *">
               <Input value={form.nome} onChange={e => fp("nome", e.target.value)} placeholder="Ex: Safra 2025/2026" />
             </Field>
           </Row>
           <Row>
             <Field label="Ano Início *">
               <Input type="number" value={form.anoInicio} onChange={e => fp("anoInicio", e.target.value)} placeholder="2025" />
             </Field>
             <Field label="Ano Fim *">
               <Input type="number" value={form.anoFim} onChange={e => fp("anoFim", e.target.value)} placeholder="2026" />
             </Field>
           </Row>
           <Row>
             <Field label="Status">
               <Select value={form.status} onChange={e => fp("status", e.target.value)}>
                 {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
               </Select>
             </Field>
           </Row>
           <Row>
             <Field label="Observações">
               <Input value={form.obs} onChange={e => fp("obs", e.target.value)} placeholder="Notas adicionais..." />
             </Field>
           </Row>
           <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
             <Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn>
             <Btn onClick={salvar}>💾 Salvar</Btn>
           </div>
         </Modal>
       )}
     </div>
   );
 }

function CadastrosDept({ state, setState, usuario, initialAba }) {
  const crudPages = {
    clientes: { title: "Cliente", icon: "👥", stateKey: "clientes", fields: [{ key: "nome", label: "Nome / Razão Social", table: true }, { key: "cpfCnpj", label: "CPF / CNPJ", table: true }, { key: "contato", label: "Telefone", table: true }, { key: "email", label: "E-mail", table: true }, { key: "cidade", label: "Cidade", table: true }, { key: "estado", label: "UF", table: true }] },
    transportadoras: { title: "Transportadora", icon: "🚛", stateKey: "transportadoras", fields: [{ key: "nome", label: "Razão Social", table: true }, { key: "cnpj", label: "CNPJ", table: true }, { key: "contato", label: "Contato", table: true }, { key: "cidade", label: "Cidade", table: true }, { key: "estado", label: "UF", table: true }] },
    fornecedores: { title: "Fornecedor", icon: "🏭", stateKey: "fornecedores", fields: [{ key: "nome", label: "Nome", table: true }, { key: "cnpj", label: "CNPJ", table: true }, { key: "segmento", label: "Segmento", table: true }, { key: "contato", label: "Contato", table: true }] },
    caminhoes: { title: "Caminhão", icon: "🚜", stateKey: "caminhoes", fields: [{ key: "placa", label: "Placa", table: true }, { key: "uf", label: "UF", table: true }, { key: "arquivo", label: "Documento (Opcional)", type: "file", optional: true }] },
    motoristas: { title: "Motorista", icon: "👷", stateKey: "motoristas", fields: [{ key: "nome", label: "Nome Completo", table: true }, { key: "cnh", label: "CNH", table: true }, { key: "arquivo", label: "Arquivo CNH (Opcional)", type: "file", optional: true }] },
  };

  const allAbas = [
    { id: "fazenda", label: "🏡 Fazenda", icon: "🏡" },
    { id: "safras", label: "📅 Ano Safra", icon: "📅" },
    { id: "clientes", label: "👥 Clientes", icon: "👥" },
    { id: "transportadoras", label: "🚛 Transportadoras", icon: "🚛" },
    { id: "fornecedores", label: "🏭 Fornecedores", icon: "🏭" },
    { id: "caminhoes", label: "🚜 Caminhões", icon: "🚜" },
    { id: "motoristas", label: "👷 Motoristas", icon: "👷" },
  ];
  const abas = allAbas.filter(a => temAcessoSubmodulo(usuario, "cadastros", a.id));
  const [aba, setAba] = useState(() => getBaseAba(initialAba, abas) || (abas[0]?.id || "clientes"));
  useEffect(() => { if (initialAba) { const id = initialAba.split("|")[0]; if (abas.some(a => a.id === id)) setAba(id); } }, [initialAba]);

  const renderContent = () => {
    if (aba === "fazenda") return <Fazenda state={state} setState={setState} />;
    if (aba === "safras") return <SafraCadastro state={state} setState={setState} />;
    return <CrudPage key={aba} {...crudPages[aba]} state={state} setState={setState} />;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap", paddingBottom: 8 }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "8px 20px", borderRadius: 8, cursor: "pointer",
            background: aba === a.id ? `${theme.accent}22` : "transparent",
            border: aba === a.id ? `1px solid ${theme.accent}44` : `1px solid ${theme.border}`,
            color: aba === a.id ? theme.accentLight : theme.muted,
            fontFamily: "inherit", fontSize: 13, fontWeight: aba === a.id ? 600 : 400,
            transition: "all .2s", display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
// ─── UPDATE MANAGER (Electron + fallback Web) ────────────────────────────────
// ─── UPDATE MANAGER (100% via navegador) ─────────────────────────────────────
// Aplica novos bundles do AgriGest direto pelo navegador, usando IndexedDB +
// Service Worker (public/sw.js). Funciona tanto no preview quanto no app
// Electron — sem precisar reinstalar nada.
const UPDATE_DB = "agrigest-updates";
const UPDATE_STORE = "bundles";
const UPDATE_ACTIVE = "active_bundle";
const UPDATE_HIST_KEY = "agrigest_update_hist";

function openUpdateDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(UPDATE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(UPDATE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await openUpdateDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPDATE_STORE, "readonly");
    const r = tx.objectStore(UPDATE_STORE).get(key);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}
async function idbSet(key, val) {
  const db = await openUpdateDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPDATE_STORE, "readwrite");
    tx.objectStore(UPDATE_STORE).put(val, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDel(key) {
  const db = await openUpdateDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(UPDATE_STORE, "readwrite");
    tx.objectStore(UPDATE_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

function UpdateManager() {
  const [hist, setHist] = useState([]);
  const [arquivo, setArquivo] = useState(null);
  const [notas, setNotas] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [bundleAtivo, setBundleAtivo] = useState(null);
  const fileInputRef = useRef(null);
  const swSuportado = typeof navigator !== "undefined" && "serviceWorker" in navigator;

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(UPDATE_HIST_KEY) || "[]");
      setHist(h);
    } catch {}
    idbGet(UPDATE_ACTIVE).then((b) => setBundleAtivo(b || null)).catch(() => {});
  }, []);

  // Lê um arquivo .js (texto) ou .zip (rejeita por enquanto, pede .js puro do dist).
  const lerArquivoTexto = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      filename: file.name,
      code: String(reader.result || ""),
      size: file.size,
    });
    reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo"));
    reader.readAsText(file);
  });

  const escolherArquivo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const nome = file.name.toLowerCase();
    const ehJsx = nome.endsWith(".jsx");
    const ehJs = nome.endsWith(".js");
    if (!ehJsx && !ehJs) {
      alert("⚠️ Envie um arquivo .jsx (componente AgriGest.jsx) ou .js (bundle compilado do dist/assets/).");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("❌ Arquivo maior que 50MB. Verifique se é o bundle correto.");
      return;
    }
    try {
      const f = await lerArquivoTexto(file);
      f.tipo = ehJsx ? "jsx" : "js";
      setArquivo(f);
    } catch (err) {
      alert("❌ Erro ao ler arquivo: " + (err?.message || err));
    }
  };

  // Carrega Babel Standalone sob demanda para transpilar .jsx no navegador
  const carregarBabel = () => new Promise((resolve, reject) => {
    if (window.Babel) return resolve(window.Babel);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@babel/standalone@7.24.7/babel.min.js";
    s.onload = () => resolve(window.Babel);
    s.onerror = () => reject(new Error("Falha ao baixar Babel (verifique sua conexão)"));
    document.head.appendChild(s);
  });

  // Transpila o .jsx do componente AgriGest em um módulo executável que
  // substitui apenas a função/componente exportada, preservando o resto do app
  // (React, hooks, sub-componentes auxiliares já carregados).
  const transpilarJsx = async (codigoJsx) => {
    const Babel = await carregarBabel();
    // Remove imports/exports do arquivo (já temos React global do bundle principal)
    let limpo = codigoJsx
      .replace(/^\s*import[^;]+;?\s*$/gm, "")
      .replace(/^\s*export\s+default\s+/gm, "window.__AGRIGEST_NEXT__ = ")
      .replace(/^\s*export\s+/gm, "");
    const out = Babel.transform(limpo, {
      presets: [["react", { runtime: "classic" }]],
      filename: "AgriGest.jsx",
    });
    return out.code;
  };

  const aplicar = async () => {
    if (!arquivo) return alert("Selecione um arquivo .jsx ou .js de atualização primeiro.");
    if (!swSuportado) return alert("❌ Seu navegador não suporta Service Worker. Use um navegador moderno (Chrome, Edge, Firefox).");
    if (!window.confirm(`Aplicar atualização "${arquivo.filename}"?\n\n• Seus dados serão PRESERVADOS (campos novos são adicionados sem apagar os existentes).\n• Apenas o código da interface será substituído.\n• A página recarregará automaticamente.`)) return;

    setCarregando(true);
    try {
      let codigoFinal = arquivo.code;
      // Se for .jsx, transpila no navegador antes de salvar
      if (arquivo.tipo === "jsx") {
        try {
          codigoFinal = await transpilarJsx(arquivo.code);
        } catch (err) {
          setCarregando(false);
          return alert("❌ Erro ao transpilar JSX: " + (err?.message || err) + "\n\nDica: verifique se o arquivo é o AgriGest.jsx completo, sem erros de sintaxe.");
        }
      }
      // 1. Grava bundle ativo no IndexedDB
      await idbSet(UPDATE_ACTIVE, {
        code: codigoFinal,
        filename: arquivo.filename,
        tipo: arquivo.tipo,
        size: arquivo.size,
        applied_at: new Date().toISOString(),
      });

      // 2. Histórico
      const novo = {
        id: Date.now(),
        version: arquivo.filename,
        applied_at: new Date().toISOString(),
        notes: notas || "",
        size: arquivo.size,
      };
      const atualizado = [novo, ...hist].slice(0, 50);
      setHist(atualizado);
      localStorage.setItem(UPDATE_HIST_KEY, JSON.stringify(atualizado));

      // 3. Garante que o SW esteja ativo
      if (navigator.serviceWorker?.controller == null) {
        try { await navigator.serviceWorker.register("/sw.js"); } catch {}
      }

      alert("✅ Atualização aplicada! A página será recarregada agora.");
      setTimeout(() => window.location.reload(), 300);
    } catch (err) {
      setCarregando(false);
      alert("❌ Erro inesperado: " + (err?.message || err));
    }
  };

  const reverter = async () => {
    if (!bundleAtivo) return alert("Nenhum bundle customizado ativo.");
    if (!window.confirm("Reverter para a versão original instalada? A página recarregará.")) return;
    await idbDel(UPDATE_ACTIVE);
    setBundleAtivo(null);
    alert("✅ Revertido. Recarregando...");
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div>
      <SectionTitle>🔄 Sistema de Atualização</SectionTitle>

      <Card style={{ background: theme.success + "22", borderColor: theme.success, marginBottom: 16 }}>
        <p style={{ color: theme.text, margin: 0, fontSize: 13 }}>
          ✅ Atualizações são aplicadas <strong>direto pelo navegador</strong>, sem reinstalar nada.
          Basta enviar o arquivo <code>.js</code> da nova versão (gerado por <code>npm run build</code>,
          em <code>dist/assets/index-XXXX.js</code>).
        </p>
      </Card>

      {bundleAtivo && (
        <Card style={{ background: theme.gold + "22", borderColor: theme.gold, marginBottom: 16 }}>
          <div style={{ color: theme.text, fontSize: 13 }}>
            <strong>📦 Bundle customizado ativo:</strong> {bundleAtivo.filename}
            {" · "}{(bundleAtivo.size / 1024).toFixed(1)} KB
            {" · aplicado em "}{new Date(bundleAtivo.applied_at).toLocaleString("pt-BR")}
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn onClick={reverter} variant="secondary">↩️ Reverter para versão original</Btn>
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".jsx,.js"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 6 }}>📦 Aplicar nova versão</div>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
            Envie o <code>AgriGest.jsx</code> (recomendado) ou um bundle <code>.js</code> compilado.
            <strong> Seus dados são preservados automaticamente</strong> — campos novos no schema são criados,
            campos antigos continuam intactos.
          </div>
          <div style={{ marginBottom: 8 }}>
            <Btn onClick={escolherArquivo} variant="primary" style={{ width: "100%" }}>
              📂 Escolher arquivo (.jsx ou .js)
            </Btn>
          </div>
          {arquivo && (
            <div style={{ background: theme.surface, padding: 10, borderRadius: 6, fontSize: 12, color: theme.text, marginBottom: 8 }}>
              <div><strong>Arquivo:</strong> {arquivo.filename}</div>
              <div><strong>Tamanho:</strong> {(arquivo.size / 1024).toFixed(1)} KB</div>
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <Input placeholder="Notas da versão (opcional)" value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
          <Btn onClick={aplicar} variant="gold" disabled={!arquivo || carregando} style={{ width: "100%" }}>
            {carregando ? "Aplicando..." : "✅ Aplicar e recarregar"}
          </Btn>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 6 }}>ℹ️ Como funciona</div>
          <ol style={{ fontSize: 12, color: theme.muted, paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Arquivos <code>.jsx</code> são transpilados no navegador (Babel Standalone).</li>
            <li>O código resultante é gravado no IndexedDB e servido pelo Service Worker.</li>
            <li>Seus dados (banco local em <code>agrigest_data</code>) ficam intactos — eles vivem em outro storage.</li>
            <li>Para preservar dados ao adicionar campos novos, use o padrão de migração no <code>initState()</code>:
              <code style={{ display: "block", marginTop: 4, padding: 4, background: theme.surface, fontSize: 11 }}>
                if (!parsed.novoCampo) parsed.novoCampo = [];
              </code>
            </li>
            <li>Use “Reverter” se algo der errado para voltar à versão original.</li>
          </ol>
        </Card>
      </div>

      <SectionTitle>📜 Histórico de atualizações</SectionTitle>
      {hist.length === 0 ? (
        <p style={{ color: theme.muted, fontSize: 13 }}>Nenhuma atualização aplicada ainda.</p>
      ) : (
        <Table
          headers={["Versão", "Aplicada em", "Tamanho", "Notas"]}
          rows={hist.map(h => (
            <tr key={h.id}>
              <Td>{h.version}</Td>
              <Td>{new Date(h.applied_at).toLocaleString("pt-BR")}</Td>
              <Td>{h.size ? (h.size / 1024).toFixed(1) + " KB" : "—"}</Td>
              <Td>{h.notes || "—"}</Td>
            </tr>
          ))}
        />
      )}
    </div>
  );
}

// ─── IMPORTAR RECEBIMENTOS (PLANILHA) ─────────────────────────────────────────
function ImportarRecebimentos({ state, setState, safraAtiva }) {
  const [linhas, setLinhas] = useState([]);
  const [erros, setErros] = useState([]);
  const [arquivo, setArquivo] = useState("");
  const [textoColado, setTextoColado] = useState("");
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Cabeçalhos esperados (case-insensitive, normaliza acentos)
  const COLUNAS = [
    { keys: ["data"], campo: "data", obrigatorio: true },
    { keys: ["grao", "grão", "produto", "cultura"], campo: "grao", obrigatorio: true },
    { keys: ["talhao", "talhão"], campo: "talhao", obrigatorio: false },
    { keys: ["anosafra", "ano safra", "safra"], campo: "safra", obrigatorio: false },
    { keys: ["placa"], campo: "placa", obrigatorio: false },
    { keys: ["motorista"], campo: "motorista", obrigatorio: false },
    { keys: ["transportadora"], campo: "transportadora", obrigatorio: false },
    { keys: ["pesobruto", "peso bruto"], campo: "pesoBruto", obrigatorio: true },
    { keys: ["pesotara", "peso tara", "tara"], campo: "pesoTara", obrigatorio: true },
    { keys: ["pesoliquido", "peso liquido", "peso líquido", "liquido", "líquido"], campo: "pesoLiquido", obrigatorio: false },
    { keys: ["classificacao", "classificação", "class"], campo: "classificacao", obrigatorio: false },
    { keys: ["umidade"], campo: "umidade", obrigatorio: false },
    { keys: ["impureza"], campo: "impureza", obrigatorio: false },
    { keys: ["avariado", "avariados"], campo: "avariado", obrigatorio: false },
  ];

  const norm = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const detectarSep = (linha) => {
    const c = (linha.match(/;/g) || []).length;
    const t = (linha.match(/\t/g) || []).length;
    const v = (linha.match(/,/g) || []).length;
    if (t >= c && t >= v) return "\t";
    if (c >= v) return ";";
    return ",";
  };

  const parseCSV = (texto) => {
    const linhasTxt = texto.split(/\r?\n/).filter(l => l.trim());
    if (linhasTxt.length < 2) return { header: [], rows: [] };
    const sep = detectarSep(linhasTxt[0]);
    const split = (linha) => {
      const out = []; let atual = ""; let dentroAspas = false;
      for (let i = 0; i < linha.length; i++) {
        const c = linha[i];
        if (c === '"') { dentroAspas = !dentroAspas; continue; }
        if (c === sep && !dentroAspas) { out.push(atual); atual = ""; continue; }
        atual += c;
      }
      out.push(atual);
      return out.map(s => s.trim());
    };
    const header = split(linhasTxt[0]).map(norm);
    const rows = linhasTxt.slice(1).map(l => split(l));
    return { header, rows };
  };

  const parseDataBR = (s) => {
    if (!s) return new Date().toISOString().split("T")[0];
    const v = String(s).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
      const dia = m[1].padStart(2, "0");
      const mes = m[2].padStart(2, "0");
      let ano = m[3]; if (ano.length === 2) ano = "20" + ano;
      return `${ano}-${mes}-${dia}`;
    }
    return new Date().toISOString().split("T")[0];
  };

  const parseNum = (s) => {
    if (s === null || s === undefined || s === "") return 0;
    const v = String(s).replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, "");
    return parseFloat(v) || 0;
  };

  const processar = (texto) => {
    setErros([]); setResultado(null);
    const { header, rows } = parseCSV(texto);
    if (header.length === 0) { setErros(["Não foi possível ler a planilha. Verifique o formato."]); setLinhas([]); return; }

    // Mapear colunas
    const mapa = {};
    COLUNAS.forEach(col => {
      const idx = header.findIndex(h => col.keys.includes(h));
      if (idx >= 0) mapa[col.campo] = idx;
    });

    const errosLocais = [];
    COLUNAS.filter(c => c.obrigatorio).forEach(c => {
      if (mapa[c.campo] === undefined) errosLocais.push(`Coluna obrigatória ausente: ${c.keys[0]}`);
    });

    if (errosLocais.length) { setErros(errosLocais); setLinhas([]); return; }

    const parsed = rows.map((r, i) => {
      const obj = { _linha: i + 2 };
      Object.entries(mapa).forEach(([campo, idx]) => { obj[campo] = (r[idx] || "").trim(); });
      obj.data = parseDataBR(obj.data);
      obj.pesoBruto = parseNum(obj.pesoBruto);
      obj.pesoTara = parseNum(obj.pesoTara);
      obj.pesoLiquido = obj.pesoLiquido ? parseNum(obj.pesoLiquido) : Math.max(0, obj.pesoBruto - obj.pesoTara);
      obj.umidade = obj.umidade ? parseNum(obj.umidade) : "";
      obj.impureza = obj.impureza ? parseNum(obj.impureza) : "";
      obj.avariado = obj.avariado ? parseNum(obj.avariado) : "";
      return obj;
    }).filter(o => o.grao || o.pesoBruto > 0);

    setLinhas(parsed);
  };

  const lerArquivo = (file) => {
    if (!file) return;
    setArquivo(file.name);
    const reader = new FileReader();
    reader.onload = (e) => { const txt = e.target.result; setTextoColado(txt); processar(txt); };
    reader.readAsText(file, "UTF-8");
  };

  const zerarRomaneiosEntrada = () => {
    const total = (state.romaneiosEntrada || []).length;
    if (total === 0) {
      alert("Não há romaneios de entrada para apagar.");
      return;
    }
    const msg = `⚠️ ATENÇÃO!\n\nEsta ação irá:\n• Apagar TODOS os ${total} romaneios de entrada (recebimentos)\n• Esvaziar a lixeira de recebimentos\n• Resetar a numeração para 1\n\nEsta operação NÃO pode ser desfeita!\n\nDeseja continuar?`;
    if (!window.confirm(msg)) return;
    const confirmacao = window.prompt(`Para confirmar, digite EXATAMENTE: ZERAR`);
    if (confirmacao !== "ZERAR") {
      alert("Operação cancelada.");
      return;
    }
    setState(s => ({
      ...s,
      romaneiosEntrada: [],
      romaneiosEntradaLixeira: [],
      romaneioCounter: 1,
    }));
    setLinhas([]); setTextoColado(""); setArquivo(""); setResultado(null); setErros([]);
    alert(`✅ ${total} romaneio(s) de entrada apagado(s) e numeração resetada para 1.`);
  };

  const importar = () => {
    if (!linhas.length) { alert("Nada para importar."); return; }
    if (!window.confirm(`Importar ${linhas.length} recebimento(s)? Serão criados romaneios de entrada automaticamente.`)) return;
    setProcessando(true);

    setState(s => {
      let counter = s.romaneioCounter || 1;
      const novosRomaneios = linhas.map(l => {
        const liq = l.pesoLiquido || Math.max(0, l.pesoBruto - l.pesoTara);
        const params = s.classificacaoRecepcaoParams?.[l.grao] || s.classificacaoParams?.[l.grao] || {};
        const umRes = calcDescUmidade(l.umidade, params.umRef, params.umDesc, params.umDescPesado);
        const dUm = umRes.desconto;
        const dImp = calcDesc(l.impureza, params.impRef, params.impDesc);
        const dAv = calcDesc(l.avariado, params.avRef, params.avDesc);
        const totalDesc = (parseFloat(dUm) + parseFloat(dImp) + parseFloat(dAv)).toFixed(2);
        const pesoFinal = Math.max(0, liq * (1 - parseFloat(totalDesc) / 100)).toFixed(0);
        const numero = padNum(counter++);
        return {
          id: uid(),
          numero,
          tipo: "Entrada",
          data: l.data,
          grao: l.grao,
          talhao: l.talhao || "",
          safra: safraAtiva || l.safra || (safrasOpcoes[1] || ""),
          placa: l.placa || "",
          motorista: l.motorista || "",
          transportadora: l.transportadora || "",
          pesoBruto: l.pesoBruto,
          pesoTara: l.pesoTara,
          umidade: l.umidade || "",
          impureza: l.impureza || "",
          avariado: l.avariado || "",
          obs: l.classificacao ? `Classificação: ${l.classificacao}` : "",
          classificacao: l.classificacao || "",
          liq,
          pesoFinal,
          dUm, dImp, dAv,
          totalDesc,
          faixaUmidade: umRes.faixa,
          importado: true,
        };
      });
      return {
        ...s,
        romaneiosEntrada: [...(s.romaneiosEntrada || []), ...novosRomaneios],
        romaneioCounter: counter,
      };
    });

    setResultado({ qtd: linhas.length });
    setLinhas([]); setTextoColado(""); setArquivo(""); setProcessando(false);
  };

  const baixarModelo = () => {
    const csv = "data;grao;talhao;ano safra;placa;motorista;transportadora;peso bruto;peso tara;peso liquido;classificacao\n" +
                "15/03/2025;Soja;Talhão A;2024/2025;ABC1D23;João Silva;Transp X;45000;15000;30000;Tipo 1\n" +
                "15/03/2025;Milho;Talhão B;2024/2025;XYZ9K88;Maria Souza;Transp Y;38000;14000;24000;Tipo 2\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modelo_recebimentos.csv";
    a.click();
  };

  return (
    <div>
      <SectionTitle>📊 Importar Recebimentos (Planilha)</SectionTitle>

      {safraAtiva && (
        <div style={{ marginBottom: 12, padding: "10px 14px", background: `${theme.gold}12`, border: `1px solid ${theme.gold}44`, borderRadius: 8, fontSize: 12, color: theme.gold, fontWeight: 600 }}>
          🌾 Todos os recebimentos importados serão atribuídos à safra <strong>{safraAtiva}</strong> (a coluna "ano safra" da planilha será ignorada para garantir consistência).
        </div>
      )}

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: theme.muted, marginBottom: 12 }}>
          Importe uma planilha CSV/TSV com os recebimentos. Cada linha gerará automaticamente um <strong>romaneio de entrada</strong>.
        </p>
        <div style={{ background: `${theme.info}11`, border: `1px solid ${theme.info}44`, padding: 12, borderRadius: 8, fontSize: 12, color: theme.text, marginBottom: 12 }}>
          <strong>Colunas aceitas:</strong> data, grão, talhão, ano safra, placa, motorista, transportadora, peso bruto, peso tara, peso líquido, classificação, umidade, impureza, avariado.
          <br /><strong>Obrigatórias:</strong> data, grão, peso bruto, peso tara.
          <br />Separador: vírgula, ponto-e-vírgula ou tab. Datas em DD/MM/AAAA ou AAAA-MM-DD.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <Btn onClick={baixarModelo}>⬇️ Baixar Modelo CSV</Btn>
          <label style={{ display: "inline-block" }}>
            <input type="file" accept=".csv,.tsv,.txt" onChange={(e) => lerArquivo(e.target.files?.[0])} style={{ display: "none" }} />
            <span style={{ display: "inline-block", padding: "10px 16px", background: theme.accent, color: "#fff", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>📁 Selecionar Arquivo</span>
          </label>
          {arquivo && <span style={{ fontSize: 12, color: theme.muted, alignSelf: "center" }}>📎 {arquivo}</span>}
        </div>

        <div style={{ marginTop: 8, padding: 12, background: `${theme.danger}10`, border: `1px solid ${theme.danger}44`, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: theme.text }}>
            <strong style={{ color: theme.danger }}>⚠️ Zona de perigo:</strong> apagar todos os recebimentos cadastrados ({(state.romaneiosEntrada || []).length}) e resetar a numeração para <strong>1</strong>.
          </div>
          <Btn variant="danger" onClick={zerarRomaneiosEntrada}>🗑️ Zerar Recebimentos</Btn>
        </div>

        <Field label="Ou cole os dados aqui (CSV/TSV)">
          <textarea
            rows={6}
            value={textoColado}
            onChange={(e) => setTextoColado(e.target.value)}
            placeholder={"data;grao;talhao;ano safra;placa;motorista;transportadora;peso bruto;peso tara;peso liquido;classificacao\n15/03/2025;Soja;Talhão A;2024/2025;ABC1D23;João;Transp X;45000;15000;30000;Tipo 1"}
            style={{ fontFamily: "monospace", fontSize: 12, width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${theme.border || "#334155"}`, background: theme.cardBg || theme.bg, color: theme.text, minHeight: 120, resize: "vertical" }}
          />
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Btn onClick={() => processar(textoColado)} disabled={!textoColado.trim()}>🔍 Pré-visualizar</Btn>
          <Btn onClick={() => { setTextoColado(""); setLinhas([]); setErros([]); setArquivo(""); setResultado(null); }} variant="ghost">🧹 Limpar</Btn>
        </div>
      </Card>

      {erros.length > 0 && (
        <Card style={{ padding: 16, marginBottom: 16, background: `${theme.danger || "#dc2626"}11`, border: `1px solid ${theme.danger || "#dc2626"}55` }}>
          <strong style={{ color: theme.danger || "#dc2626" }}>⚠️ Erros encontrados:</strong>
          <ul style={{ margin: "8px 0 0 20px", fontSize: 13 }}>{erros.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </Card>
      )}

      {resultado && (
        <Card style={{ padding: 16, marginBottom: 16, background: `${theme.accent}11`, border: `1px solid ${theme.accent}55` }}>
          ✅ <strong>{resultado.qtd}</strong> recebimento(s) importado(s) com sucesso! Os romaneios de entrada foram criados.
        </Card>
      )}

      {linhas.length > 0 && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong>👁️ Pré-visualização ({linhas.length} linhas)</strong>
            <Btn onClick={importar} disabled={processando}>✅ Importar {linhas.length} Recebimento(s)</Btn>
          </div>
          <div style={{ overflowX: "auto" }}>
            <Table headers={["#", "Data", "Grão", "Talhão", "Safra", "Placa", "Motorista", "Transp.", "Bruto", "Tara", "Líquido", "Class."]} rows={
              linhas.slice(0, 50).map((l, i) => (
                <tr key={i}>
                  <Td>{l._linha}</Td><Td>{l.data}</Td><Td>{l.grao}</Td><Td>{l.talhao}</Td><Td>{l.safra}</Td>
                  <Td>{l.placa}</Td><Td>{l.motorista}</Td><Td>{l.transportadora}</Td>
                  <Td>{l.pesoBruto}</Td><Td>{l.pesoTara}</Td><Td><strong>{l.pesoLiquido}</strong></Td><Td>{l.classificacao}</Td>
                </tr>
              ))
            } />
            {linhas.length > 50 && <p style={{ fontSize: 12, color: theme.muted, marginTop: 8 }}>Exibindo primeiras 50 de {linhas.length} linhas. Todas serão importadas.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [fazendaSelecionada, setFazendaSelecionada] = useState(null);
  const [anoSafra, setAnoSafra] = useState(null);
  const [active, setActiveRaw] = useState("dashboard");
  const [pendingSubAba, setPendingSubAba] = useState(null);
  // setActive aceita tanto um id de departamento (ex: "graosDept") quanto um
  // id de "página" do dashboard (ex: "contratos") — neste caso navega para o
  // departamento correspondente já abrindo a sub-aba.
  const setActive = (page) => {
    const sub = PAGE_TO_SUBMODULO[page];
    if (sub && sub.includes(".")) {
      const [dept, subId] = sub.split(".");
      if (page === "fazenda") { setPendingSubAba(null); setActiveRaw("fazenda"); return; }
      // Token único para forçar o useEffect mesmo navegando para o mesmo dept
      setPendingSubAba(subId + "|" + Date.now());
      setActiveRaw(dept);
      return;
    }
    setPendingSubAba(null);
    setActiveRaw(page);
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const [state, setState] = useState(initState());
  const [toast, setToast] = useState("");
  const [skipSelector, setSkipSelector] = useState(false);

  // Carregamento inicial do SQLite (Electron). Substitui o state se houver dados gravados.
  useEffect(() => {
    if (typeof window !== "undefined" && window.agrigest?.isElectron) {
      window.agrigest.db.get(STORAGE_KEY).then((value) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            const fixos = USUARIOS_FIXOS.map(u => ({ ...u, modulos: u.modulos || [], isFixo: true }));
            const locais = (parsed.usuarios || []).filter(u => !fixos.some(f => f.login === u.login));
            parsed.usuarios = [...fixos, ...locais];
            setState(parsed);
          } catch (e) { console.warn("SQLite load falhou:", e); }
        }
      }).catch(() => {});
    }
  }, []);

  // Persiste dados gerais e usuários locais (localStorage + SQLite quando disponível)
  useEffect(() => {
    try {
      const usuariosLocais = (state.usuarios || []).filter(u => !u.isFixo);
      const dadosParaSalvar = { ...state, usuarios: usuariosLocais };
      const json = JSON.stringify(dadosParaSalvar);
      localStorage.setItem(STORAGE_KEY, json);
      if (typeof window !== "undefined" && window.agrigest?.isElectron) {
        window.agrigest.db.set(STORAGE_KEY, json).catch(() => {});
      }
    } catch (e) {}
  }, [state]);

  const setStateAndSave = (updater) => { setState(updater); setToast("✓ Dados salvos!"); setTimeout(() => setToast(""), 2000); };
  const clearData = () => {
    if (window.confirm("Apagar TODOS os dados da fazenda? Esta ação não pode ser desfeita.\n\nAtenção: os usuários fixos no projeto não serão afetados, mas usuários criados localmente serão apagados.")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(initState());
      setUsuarioLogado(null);
      setLoggedIn(false);
      setFazendaSelecionada(null);
      setAnoSafra(null);
    }
  };
  const handleLogin = (user) => { setUsuarioLogado(user); setLoggedIn(true); setFazendaSelecionada(null); setAnoSafra(null); setSkipSelector(false); };
  const handleLogout = () => { setUsuarioLogado(null); setLoggedIn(false); setFazendaSelecionada(null); setAnoSafra(null); setSkipSelector(false); };

  const handleSelectFazenda = (fazendaId, safra) => {
    const faz = (state.fazendas || []).find(f => f.id === fazendaId)
      || (state.fazenda?.id === fazendaId ? state.fazenda : null)
      || { id: fazendaId, nome: "Fazenda", graos: [] };
    setFazendaSelecionada(faz);
    setAnoSafra(safra || "");
    setState(s => ({ ...s, fazenda: faz }));
    setActive("dashboard");
  };

  const handleTrocarFazenda = () => {
    setFazendaSelecionada(null);
    setAnoSafra(null);
    setSkipSelector(false);
    setActive("dashboard");
  };

   const handleNovaFazenda = () => {
     const novaFazenda = {
       id: uid(), nome: "", produtor: "", cpfCnpj: "", ie: "",
       cep: "", endereco: "", numero: "", bairro: "", cidade: "",
       estado: "", graos: [], logo: null
     };
     setState(s => ({
       ...s,
       fazenda: novaFazenda,
       fazendas: [...(s.fazendas || []), novaFazenda]
     }));
     setFazendaSelecionada(novaFazenda);
     setAnoSafra(safrasOpcoes[1] || safrasOpcoes[0] || "");
     setSkipSelector(true);
     // Use setTimeout to ensure state updates are committed before navigating
     setTimeout(() => setActive("fazenda"), 0);
   };

  const usuariosAtivos = state.usuarios || USUARIOS_FIXOS;
  if (!loggedIn) return <Login onLogin={handleLogin} usuarios={usuariosAtivos} />;

  // Tela de seleção de fazenda e ano safra
  if (!fazendaSelecionada && !skipSelector) {
    return <FazendaSelector fazendas={state.fazendas || []} onSelect={handleSelectFazenda} onNovaFazenda={handleNovaFazenda} />;
  }

  const crudPages = {
    insumos: { title: "Insumo", icon: "🧪", stateKey: "insumos", fields: [{ key: "nome", label: "Nome", table: true }, { key: "unidade", label: "Unidade", type: "select", options: ["kg","L","un","sc","t"], table: true }, { key: "categoria", label: "Categoria", type: "select", options: ["Fertilizante","Defensivo","Semente","Combustível","Outros"], table: true }, { key: "fornecedor", label: "Fornecedor", table: true }] },
    recebimentoInsumos: { title: "Recebimento de Insumo", icon: "📥", stateKey: "recebimentoInsumos", fields: [{ key: "produto", label: "Produto", table: true }, { key: "nf", label: "Nº NF", table: true }, { key: "recebidoPor", label: "Recebido Por", table: true }, { key: "data", label: "Data", type: "date", table: true }, { key: "fotoNF", label: "Foto da NF (Opcional)", type: "file", optional: true }, { key: "fotoProduto", label: "Foto do Produto (Opcional)", type: "file", optional: true }] },
  };

  const ss = setStateAndSave;
  const temAcesso = (pageId) => {
    if (pageId === "dashboard") return true;
    if (pageId === "fazenda")   return true; // sempre acessível
    // Páginas/submódulos restritos a admin
    const subForPage = PAGE_TO_SUBMODULO[pageId];
    if (subForPage && SUBMODULOS_ADMIN_ONLY.has(subForPage)) return usuarioLogado?.role === "admin";
    if (usuarioLogado?.role === "admin") return true;
    const modulos = usuarioLogado?.modulos || [];
    if (["usuarios", "lixeira", "importarRecebimentos", "importarTalhoes", "backup", "update", "expedicao"].includes(pageId)) return false;
    if (modulos.length === 0) return true; // sem módulos configurados = libera tudo

    // 1) Match direto (departamento, ex: "graosDept", "financas")
    if (modulos.includes(pageId)) return true;

    // 2) Página vinda do Dashboard (ex: "contratos") -> resolve para "dept.sub"
    const sub = PAGE_TO_SUBMODULO[pageId];
    if (sub) {
      if (modulos.includes(sub)) return true;
      if (sub.includes(".")) {
        const [dept] = sub.split(".");
        // Tem o departamento inteiro liberado
        if (modulos.includes(dept)) return true;
      }
    }

    // 3) Prefixo "dept." -> usuário tem qualquer submódulo deste dept
    if (modulos.some(m => m.startsWith(pageId + "."))) return true;

    return false;
  };

  const page = () => {
    if (!temAcesso(active)) return <div style={{ textAlign: "center", padding: "60px 20px", color: theme.muted }}><div style={{ fontSize: 54, marginBottom: 16 }}>🔒</div><h2 style={{ color: theme.text, fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Acesso Restrito</h2><p style={{ fontSize: 14 }}>Você não tem permissão para acessar este módulo.</p></div>;
    if (crudPages[active]) return <CrudPage key={active} {...crudPages[active]} state={state} setState={ss} />;
    switch (active) {
      case "dashboard":          return <Dashboard state={state} setActive={setActive} usuario={usuarioLogado} safraAtiva={anoSafra} />;
      case "fazenda":            return <Fazenda state={state} setState={ss} />;
      case "graosDept":          return <GraosDept state={state} setState={ss} usuario={usuarioLogado} initialAba={pendingSubAba} safraAtiva={anoSafra} />;
      case "relatoriosDept": return <RelatoriosDept state={state} setState={ss} usuario={usuarioLogado} initialAba={pendingSubAba} />;
      case "insumosDept": return <InsumosDept state={state} setState={ss} usuario={usuarioLogado} initialAba={pendingSubAba} />;
      case "usuarios": return <Usuarios state={state} setState={ss} />;
      case "lixeira": return <Lixeira state={state} setState={ss} />;
      case "backup": return <BackupManager state={state} setState={ss} />;
      case "update": return <UpdateManager />;
      case "importarRecebimentos": return <ImportarRecebimentos state={state} setState={ss} safraAtiva={anoSafra} />;
      case "importarTalhoes": return <ImportarTalhoes state={state} setState={ss} />;
      case "maquinasEquipamentos": return <MaquinasEquipamentos state={state} setState={ss} usuario={usuarioLogado} initialAba={pendingSubAba} />;
      case "almoxarifado": return <AlmoxarifadoDept state={state} setState={ss} usuario={usuarioLogado} initialAba={pendingSubAba} />;
      case "cadastros": return <CadastrosDept state={state} setState={ss} usuario={usuarioLogado} initialAba={pendingSubAba} />;
      case "financas": return <Financas state={state} setState={ss} usuario={usuarioLogado} initialAba={pendingSubAba} />;
      case "expedicao": return <Expedicao state={state} setState={ss} safraAtiva={anoSafra} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: theme.bg, color: theme.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", overflow: "hidden" }}>
      <ResponsiveStyles />
      <Sidebar active={active} setActive={setActive} fazenda={state.fazenda} usuario={usuarioLogado} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : 28 }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: isMobile ? 8 : 12, marginBottom: isMobile ? 12 : 20, flexWrap: "wrap" }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(true)} style={{
              background: `${theme.accent}18`, border: `1px solid ${theme.accent}44`, borderRadius: 8,
              padding: "8px 12px", cursor: "pointer", color: theme.accentLight, fontSize: 18, lineHeight: 1, marginRight: "auto",
            }}>☰</button>
          )}
          {/* Indicador da fazenda e safra selecionada */}
          {fazendaSelecionada && anoSafra && !isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: "auto" }}>
              <div style={{ background: `${theme.accent}18`, border: `1px solid ${theme.accent}44`, borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>🏡</span>
                <span style={{ color: theme.accentLight, fontSize: 12, fontWeight: 600 }}>{fazendaSelecionada.nome || "Nova Fazenda"}</span>
                <span style={{ color: theme.muted, fontSize: 11 }}>|</span>
                <span style={{ color: theme.gold, fontSize: 12, fontWeight: 600 }}>Safra {anoSafra}</span>
              </div>
              <button onClick={handleTrocarFazenda} style={{ background: `${theme.info}18`, color: theme.info, border: `1px solid ${theme.info}33`, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>🔄 Trocar</button>
            </div>
          )}
          {/* Mobile: compact fazenda indicator */}
          {fazendaSelecionada && anoSafra && isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
              <span style={{ color: theme.accentLight, fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🏡 {fazendaSelecionada.nome || "Fazenda"} · {anoSafra}</span>
            </div>
          )}
          {toast && <span style={{ background: `${theme.accent}22`, color: theme.accentLight, border: `1px solid ${theme.accent}44`, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{toast}</span>}
          {!isMobile && <span style={{ color: theme.muted, fontSize: 11 }}>💾 Auto-save</span>}
          <button onClick={handleLogout} style={{ background: `${theme.danger}18`, color: theme.danger, border: `1px solid ${theme.danger}33`, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>{isMobile ? "🚪" : "🚪 Sair"}</button>
          {!isMobile && <button onClick={clearData} style={{ background: `${theme.warning}18`, color: theme.warning, border: `1px solid ${theme.warning}33`, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }}>🗑️ Limpar Dados</button>}
        </div>
        <div style={{ maxWidth: 1200 }}>{page()}</div>
      </main>
    </div>
  );
}
