// src/App.js
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
} from "@mui/material";

/**
 * App.js
 *
 * Funcionalidades incluidas:
 * - Gestión de folios (TITSA) con filtros por fecha, estado, horario y búsqueda.
 * - Generación automática y manual de folios para Arcelormittal.
 * - Folios consecutivos persistentes por mes en localStorage (YYYYMM + 3 dígitos).
 * - Mensajes preparados por línea y envío vía WhatsApp Web.
 * - Recuadros superiores actúan como filtros toggle en TITSA; en Arcelormittal se muestran arriba (solo visualización).
 * - El recuadro "Total (día)" refleja el total de folios creados para la fecha seleccionada.
 * - Colores diferenciados en recuadros y chips de estado (Fase 1 - Punto 2).
 */

/* ---------- Paleta de colores (puedes ajustar a identidad corporativa) ---------- */
const COLORS = {
  totalBg: "#e0e0e0", // gris neutro
  pendientesBg: "#fff59d", // amarillo claro
  llegoBg: "#81c784", // verde claro
  noLlegoBg: "#e57373", // rojo claro
  pendientesText: "#000000",
  llegoText: "#ffffff",
  noLlegoText: "#ffffff"
};

/* ---------- Helpers de fecha y parseo en hora local ---------- */
const parseLocalDate = (isoDateStr) => {
  if (!isoDateStr) return new Date();
  return new Date(`${isoDateStr}T00:00:00`);
};

const formatDisplayDate = (isoDate) => {
  if (!isoDate) return "";
  const d = typeof isoDate === "string" ? parseLocalDate(isoDate) : new Date(isoDate);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const formatDisplayDateTime = (isoDateTime) => {
  if (!isoDateTime) return "";
  const d = new Date(isoDateTime);
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
};

/* ---------- Todas las líneas transportistas ---------- */
const lineasTelefonos = {
  "AU0033 AUTO LINEAS PERALES SA DE CV": "8122028086",
  "VA2748 JUAN MANUEL VALDES AGUILAR": "8122028086",
  "SA5464 LOURDES DE ROCIO SALAZAR RODRIGUEZ": "8122028086",
  "TR6962 TRANSPORTES RAMOS DEL NORESTE": "8122028086",
  "RS0005 RS-MA MATERIALS SA DE CV": "8122028086",
  "SA5461 JUAN BERNARDO SALDAÑA DE LA ROSA": "8122028086",
  "ZA4556 JOSE ANGEL ZACARIAS SANCHEZ": "8122028086",
  "DX0002 DX XPRESS SA DE CV": "8122028086",
  "RO2943 ANGEL MARIO RODRIGUEZ PEDRAZA": "8122028086",
  "OS0010 OSCAR VILLANUEVA RAMOS": "8122028086",
  "SA5463 RAFAEL FERNANDO SALDAÑA SALDAÑA": "8122028086",
  "AL6940 MONICA PATRICIA ALVAREZ VILLARRUEL": "8122028086",
  "AG5104 XOCHITL YANETH AGUIRRE GUERRA": "8122028086",
  "AU4231 AUTOLINEAS MRD SA DE CV": "8122028086",
  "MX0002 MXG CARRIER SA DE CV": "8122028086",
  "AU4219 AUTO FLETES TRT SA DE CV": "8122028086",
  "VI1826 NORMA ANGELICA VIZCARRA JIMENEZ": "8122028086",
  "AU4235 AUTO EXPRESS AGUIRRE SA DE CV": "8122028086",
  "TR6978 TRANSPORTES ALEDQUI SA DE CV": "8122028086",
  "TR6925 TRANSERVICIOS LOGISTICOS DEL NORTE SA DE CV (TLN)": "8122028086"
};

/* Remitentes (números desde los que se "envía") */
const remitentes = {
  "Alan Bustos": "8122028086",
  "Aldo Ramirez": "8122028086",
  "Otro": ""
};

/* Datos iniciales de ejemplo */
const initialTitsaData = [
  {
    id: 1,
    fecha: "2026-08-24",
    folio: 202608001,
    horaProgramada: "6:00am a 8:00am",
    linea: "AU0033 AUTO LINEAS PERALES SA DE CV",
    estado: "Pendiente",
    eco: "",
    fechaHoraLlegada: ""
  },
  {
    id: 2,
    fecha: "2026-08-24",
    folio: 202608002,
    horaProgramada: "6:00am a 8:00am",
    linea: "VA2748 JUAN MANUEL VALDES AGUILAR",
    estado: "Pendiente",
    eco: "",
    fechaHoraLlegada: ""
  },
  {
    id: 3,
    fecha: "2026-08-24",
    folio: 202608003,
    horaProgramada: "6:00am a 8:00am",
    linea: "SA5464 LOURDES DE ROCIO SALAZAR RODRIGUEZ",
    estado: "Pendiente",
    eco: "",
    fechaHoraLlegada: ""
  }
];

const horariosArcelor = [
  { label: "6:00am a 8:00am", inicio: 6, fin: 8 },
  { label: "8:00am a 10:00am", inicio: 8, fin: 10 },
  { label: "10:00am a 12:00pm", inicio: 10, fin: 12 },
  { label: "12:00pm a 2:00pm", inicio: 12, fin: 14 },
  { label: "2:00pm a 4:00pm", inicio: 14, fin: 16 },
  { label: "4:00pm a 6:00pm", inicio: 16, fin: 18 }
];

/* ---------- Helpers para folios persistentes por mes ---------- */
const getYYYYMM = (isoDateStr) => {
  const d = isoDateStr ? parseLocalDate(isoDateStr) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}${mm}`; // e.g., "202608"
};

const storageKeyForMonth = (yyyymm) => `folioSeq_${yyyymm}`;

const getNextFolios = (count, fechaReferencia) => {
  const yyyymm = getYYYYMM(fechaReferencia);
  const key = storageKeyForMonth(yyyymm);
  const stored = localStorage.getItem(key);
  let seq = stored ? parseInt(stored, 10) : 0;
  const folios = [];
  for (let i = 0; i < count; i++) {
    seq += 1;
    const folioStr = `${yyyymm}${String(seq).padStart(3, "0")}`;
    folios.push(Number(folioStr));
  }
  localStorage.setItem(key, String(seq));
  return folios;
};

/* ---------- Helper para parsear hora desde label tipo "2:00pm a 4:00pm" ---------- */
const parseHourFromLabel = (label) => {
  if (!label) return null;
  const re = /(\d{1,2}):(\d{2})\s*(am|pm)/i;
  const m = label.match(re);
  if (!m) {
    const m2 = label.match(/^(\d{1,2})/);
    if (!m2) return null;
    return parseInt(m2[1], 10);
  }
  let hour = parseInt(m[1], 10);
  const ampm = m[3].toLowerCase();
  if (ampm === "pm" && hour !== 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  return hour;
};

/* ---------- Componente principal ---------- */
export default function App() {
  const [tab, setTab] = useState(0);

  /* TITSA */
  const [titsaRows, setTitsaRows] = useState(initialTitsaData);
  const [titsaSearch, setTitsaSearch] = useState("");
  const [showHistorial, setShowHistorial] = useState(false);
  const todayISO = new Date().toLocaleDateString("en-CA");
  const [mainFecha, setMainFecha] = useState(todayISO);

  const [selectedHora, setSelectedHora] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState(null); // null | "Pendiente" | "Llegó" | "No llegó" | "Total"

  /* Roles: Administrador y Control de accesos (equivalente a Supervisor) */
  const ROLES = ["Administrador", "Control de accesos"];
  const [userRole, setUserRole] = useState("Control de accesos");

  /* --- bloqueo administrador: diálogo de autenticación --- */
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [pendingRole, setPendingRole] = useState(null); // guarda el rol que se intenta activar

  // Contraseña fija para ejemplo. Cambia esto por verificación en backend o variable de entorno.
  const ADMIN_PASSWORD = "1234";

  /* Dialog LLEGÓ */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTargetId, setDialogTargetId] = useState(null);
  const [dialogEco, setDialogEco] = useState("");

  /* Arcelormittal (generación) */
  const [cantidadPorBloque, setCantidadPorBloque] = useState(5);
  const [fechaGeneracion, setFechaGeneracion] = useState(todayISO);
  const [selectedLinea, setSelectedLinea] = useState("");
  const [selectedRango, setSelectedRango] = useState("");

  /* Diálogo de selección de remitente */
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedRemitente, setSelectedRemitente] = useState("Alan Bustos");
  const [otroRemitenteTelefono, setOtroRemitenteTelefono] = useState("");

  const [pendingMessagesByLine, setPendingMessagesByLine] = useState({});

  const idCounterRef = useRef(Date.now());

  /* Filtrado: vista TITSA
     - Aplica: fecha (mainFecha), showHistorial, búsqueda, selectedHora, selectedEstado
  */
  const titSaFiltered = useMemo(() => {
    return titsaRows.filter((r) => {
      if (mainFecha && r.fecha !== mainFecha) return false;
      if (!showHistorial && r.estado !== "Pendiente") return false;

      if (titsaSearch) {
        const q = titsaSearch.toLowerCase();
        const matchesSearch =
          String(r.folio).toLowerCase().includes(q) ||
          (r.linea && r.linea.toLowerCase().includes(q)) ||
          (r.eco && String(r.eco).toLowerCase().includes(q)) ||
          (r.horaProgramada && r.horaProgramada.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      if (selectedHora) {
        const hp = r.horaProgramada || "";
        const hora = parseHourFromLabel(hp);
        if (hora === null) return false;
        if (!(hora >= selectedHora.inicio && hora < selectedHora.fin)) return false;
      }

      // selectedEstado === "Total" means "no estado filter"
      if (selectedEstado && selectedEstado !== "Total") {
        if (r.estado !== selectedEstado) return false;
      }

      return true;
    });
  }, [titsaRows, titsaSearch, showHistorial, mainFecha, selectedHora, selectedEstado]);

  /* Contadores: Total del día seleccionado (mainFecha) y otros contadores aplicando filtros activos */
  const totalCountForDay = useMemo(() => {
    return titsaRows.filter((r) => (mainFecha ? r.fecha === mainFecha : true)).length;
  }, [titsaRows, mainFecha]);

  const pendientesCount = titSaFiltered.filter((r) => r.estado === "Pendiente").length;
  const llegadosCount = titSaFiltered.filter((r) => r.estado === "Llegó").length;
  const noLlegadosCount = titSaFiltered.filter((r) => r.estado === "No llegó").length;

  /* Para mostrar conteos por horario en los botones (sin aplicar selectedHora ni selectedEstado),
     usamos un conjunto base que respeta fecha, búsqueda y showHistorial, pero no selectedHora ni selectedEstado.
  */
  const baseFilteredForHorarioCounts = useMemo(() => {
    return titsaRows.filter((r) => {
      if (mainFecha && r.fecha !== mainFecha) return false;
      if (!showHistorial && r.estado !== "Pendiente") return false;
      if (titsaSearch) {
        const q = titsaSearch.toLowerCase();
        return (
          String(r.folio).toLowerCase().includes(q) ||
          (r.linea && r.linea.toLowerCase().includes(q)) ||
          (r.eco && String(r.eco).toLowerCase().includes(q)) ||
          (r.horaProgramada && r.horaProgramada.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [titsaRows, titsaSearch, showHistorial, mainFecha]);

  const horarioCounts = useMemo(() => {
    const map = {};
    horariosArcelor.forEach((h) => {
      map[h.label] = 0;
    });
    baseFilteredForHorarioCounts.forEach((r) => {
      const hora = parseHourFromLabel(r.horaProgramada || "");
      if (hora === null) return;
      const found = horariosArcelor.find((h) => hora >= h.inicio && hora < h.fin);
      if (found) map[found.label] = (map[found.label] || 0) + 1;
    });
    return map;
  }, [baseFilteredForHorarioCounts]);

  /* Dialog handlers LLEGÓ */
  const openLlegoDialog = (id) => {
    setDialogTargetId(id);
    setDialogEco("");
    setDialogOpen(true);
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    setDialogTargetId(null);
    setDialogEco("");
  };

  const handleDialogAccept = () => {
    if (!dialogEco || !dialogTargetId) {
      alert("Escribe el No eco que llegó antes de aceptar.");
      return;
    }
    const nowISO = new Date().toISOString();
    setTitsaRows((prev) =>
      prev.map((r) =>
        r.id === dialogTargetId
          ? { ...r, estado: "Llegó", eco: dialogEco, fechaHoraLlegada: nowISO }
          : r
      )
    );
    setTitsaSearch("");
    setDialogOpen(false);
    setDialogTargetId(null);
    setDialogEco("");
  };

  const handleMarcarNoLlego = (id) => {
    setTitsaRows((prev) => prev.map((r) => (r.id === id ? { ...r, estado: "No llegó" } : r)));
  };

  /* Diálogo de remitente/destinatarios */
  const openContactDialogWithMessages = (messagesByLine) => {
    setPendingMessagesByLine(messagesByLine || {});
    setSelectedRemitente("Alan Bustos");
    setOtroRemitenteTelefono("");
    setContactDialogOpen(true);
  };

  const handleContactDialogCancel = () => {
    setContactDialogOpen(false);
    setPendingMessagesByLine({});
  };

  const handleContactDialogSend = () => {
    const remitenteTelefono =
      selectedRemitente === "Otro" ? (otroRemitenteTelefono || "").replace(/\D/g, "") : remitentes[selectedRemitente];

    Object.entries(pendingMessagesByLine).forEach(([linea, mensaje]) => {
      const telefonoLinea = (lineasTelefonos[linea] || "").replace(/\D/g, "");
      if (!telefonoLinea) return;
      const mensajeFinal = `${mensaje}\n\nEnviado desde: ${remitenteTelefono || selectedRemitente}`;
      const url = `https://wa.me/52${telefonoLinea}?text=${encodeURIComponent(mensajeFinal)}`;
      window.open(url, "_blank");
    });

    setPendingMessagesByLine({});
    setContactDialogOpen(false);
  };

  /* Generar automáticos */
  const handleGenerarAutomaticos = () => {
    if (!fechaGeneracion) {
      alert("Selecciona una fecha válida.");
      return;
    }
    if (!window.confirm("¿Desea generar los folios automáticos?")) return;

    const lines = Object.keys(lineasTelefonos);
    if (lines.length === 0) {
      alert("No hay líneas configuradas.");
      return;
    }

    const nuevosRegistros = [];
    const messagesByLine = {};

    lines.forEach((l) => {
      messagesByLine[l] = `📅 Fecha: ${formatDisplayDate(fechaGeneracion)}\n\n`;
    });

    horariosArcelor.forEach((horarioObj) => {
      const totalPorHorario = 35;
      const baseCount = Math.floor(totalPorHorario / lines.length);
      const remainder = totalPorHorario % lines.length;
      const counts = lines.map((_, idx) => baseCount + (idx < remainder ? 1 : 0));

      lines.forEach((linea, idx) => {
        const count = counts[idx];
        if (!count || count <= 0) return;

        const folios = getNextFolios(count, fechaGeneracion);

        messagesByLine[linea] += `🕒 ${horarioObj.label}\n`;
        folios.forEach((f) => {
          messagesByLine[linea] += `- ${f}\n`;
          idCounterRef.current += 1;
          nuevosRegistros.push({
            id: idCounterRef.current,
            fecha: fechaGeneracion,
            folio: f,
            horaProgramada: horarioObj.label,
            linea,
            estado: "Pendiente",
            eco: "",
            fechaHoraLlegada: ""
          });
        });
        messagesByLine[linea] += `\n`;
      });
    });

    Object.keys(messagesByLine).forEach((l) => {
      messagesByLine[l] += `👉 Favor de presentarse en patio con todo el equipo completo de sujeción de rollo y 🦺 EPP completo.\n\n⚠️ Este mensaje es automático, favor de no responderlo ⚠️`;
    });

    setTitsaRows((prev) => [...prev, ...nuevosRegistros]);

    openContactDialogWithMessages(messagesByLine);
  };

  /* Generar manuales */
  const handleGenerarManuales = () => {
    if (!fechaGeneracion || !selectedLinea || !selectedRango || !cantidadPorBloque || Number(cantidadPorBloque) <= 0) {
      alert("Completa todos los campos antes de enviar.");
      return;
    }
    if (!window.confirm("¿Desea generar los folios manuales?")) return;

    const count = Number(cantidadPorBloque);
    const folios = getNextFolios(count, fechaGeneracion);

    const nuevosRegistros = [];
    let mensaje = `📅 Fecha: ${formatDisplayDate(fechaGeneracion)}\n🕒 Horario: ${selectedRango}\n🚚 Línea de transporte: ${selectedLinea}\n📦 Folios asignados:\n`;
    folios.forEach((f) => {
      mensaje += `- ${f}\n`;
      idCounterRef.current += 1;
      nuevosRegistros.push({
        id: idCounterRef.current,
        fecha: fechaGeneracion,
        folio: f,
        horaProgramada: selectedRango,
        linea: selectedLinea,
        estado: "Pendiente",
        eco: "",
        fechaHoraLlegada: ""
      });
    });
    mensaje += `\n👉 Favor de presentarse en patio con todo el equipo completo de sujeción de rollo y 🦺 EPP completo.\n\n⚠️ Este mensaje es automático, favor de no responderlo ⚠️`;

    setTitsaRows((prev) => [...prev, ...nuevosRegistros]);

    const messagesByLine = {
      [selectedLinea]: mensaje
    };

    openContactDialogWithMessages(messagesByLine);
  };

  /* Inicializar localStorage para el mes actual si no existe */
  useEffect(() => {
    const yyyymm = getYYYYMM(new Date().toLocaleDateString("en-CA"));
    const key = storageKeyForMonth(yyyymm);
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "0");
    }
  }, []);

  /* Toggle estado desde recuadros
     - "Total" representa explícitamente "no filtro" en la lógica de filtrado.
     - selectedEstado === "Total" => UI muestra seleccionado; filtrado no aplica estado.
  */
  const toggleEstadoFilter = (estado) => {
    if (estado === "Total") {
      setSelectedEstado((s) => (s === "Total" ? null : "Total"));
      return;
    }
    setSelectedEstado((s) => (s === estado ? null : estado));
  };

  /* Toggle horario */
  const toggleHoraFilter = (h) => {
    setSelectedHora((prev) => (prev?.label === h.label ? null : h));
  };

  /* --- manejo de cambio de rol con autenticación para Administrador --- */
  const handleRoleChange = (newRole) => {
    if (newRole === "Administrador") {
      // abrir diálogo de autenticación sin cambiar el rol actual todavía
      setPendingRole("Administrador");
      setAuthPassword("");
      setAuthDialogOpen(true);
    } else {
      // cambiar directamente a Control de accesos
      setUserRole(newRole);
      setPendingRole(null);
    }
  };

  const handleAuthConfirm = () => {
    if (authPassword === ADMIN_PASSWORD) {
      setUserRole("Administrador");
      setAuthDialogOpen(false);
      setAuthPassword("");
      setPendingRole(null);
    } else {
      alert("Contraseña incorrecta. Se mantiene en Control de accesos.");
      setUserRole("Control de accesos");
      setAuthDialogOpen(false);
      setAuthPassword("");
      setPendingRole(null);
    }
  };

  const handleAuthCancel = () => {
    setAuthDialogOpen(false);
    setAuthPassword("");
    setPendingRole(null);
    // mantener rol actual o forzar Control de accesos
    setUserRole("Control de accesos");
  };

  /* Helper: whether current role can generate folios */
  const canGenerate = userRole === "Administrador";
  /* Helper: whether current role can change estado (Llegó / No llegó) */
  const canChangeEstado = userRole === "Administrador" || userRole === "Control de accesos";

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>Control Interno de Folios</Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 0 }}>
            <Tab label="TITSA" />
            <Tab label="Arcelormittal" />
          </Tabs>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="select-role-label">Rol de usuario</InputLabel>
            <Select
              labelId="select-role-label"
              value={userRole}
              label="Rol de usuario"
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* -------------------- TITSA -------------------- */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
            <Grid item xs={6} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: selectedEstado === "Total" ? "primary.main" : COLORS.totalBg,
                  color: selectedEstado === "Total" ? "#fff" : "inherit"
                }}
                onClick={() => toggleEstadoFilter("Total")}
              >
                <Typography variant="subtitle2">Total (día)</Typography>
                <Typography variant="h6">{totalCountForDay}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: selectedEstado === "Pendiente" ? "primary.main" : COLORS.pendientesBg,
                  color: selectedEstado === "Pendiente" ? "#fff" : COLORS.pendientesText
                }}
                onClick={() => toggleEstadoFilter("Pendiente")}
              >
                <Typography variant="subtitle2">Pendientes</Typography>
                <Typography variant="h6">{pendientesCount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: selectedEstado === "Llegó" ? "primary.main" : COLORS.llegoBg,
                  color: selectedEstado === "Llegó" ? "#fff" : COLORS.llegoText
                }}
                onClick={() => toggleEstadoFilter("Llegó")}
              >
                <Typography variant="subtitle2">Llegados</Typography>
                <Typography variant="h6">{llegadosCount}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={2}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: selectedEstado === "No llegó" ? "primary.main" : COLORS.noLlegoBg,
                  color: selectedEstado === "No llegó" ? "#fff" : COLORS.noLlegoText
                }}
                onClick={() => toggleEstadoFilter("No llegó")}
              >
                <Typography variant="subtitle2">No Llegados</Typography>
                <Typography variant="h6">{noLlegadosCount}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={8} md={2}>
              <TextField
                label="Fecha"
                type="date"
                value={mainFecha}
                onChange={(e) => setMainFecha(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Grid>

            <Grid item xs={4} md={1}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => setShowHistorial((s) => !s)}
              >
                {showHistorial ? "Ver solo pendientes" : "Ver todos"}
              </Button>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Horarios de Entrada</Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
            {horariosArcelor.map((h) => (
              <Button
                key={h.label}
                variant={selectedHora?.label === h.label ? "contained" : "outlined"}
                color={selectedHora?.label === h.label ? "primary" : "inherit"}
                size="small"
                onClick={() => toggleHoraFilter(h)}
              >
                {h.label} {`(${horarioCounts[h.label] || 0})`}
              </Button>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Última hora de entrada 6:00 PM
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                label="Buscar Folio"
                value={titsaSearch}
                onChange={(e) => setTitsaSearch(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Folio</TableCell>
                  <TableCell>Hora Programada</TableCell>
                  <TableCell>Línea Transporte</TableCell>
                  <TableCell>Eco</TableCell>
                  <TableCell>Fecha y Hora de llegada</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {titSaFiltered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No hay registros</TableCell>
                  </TableRow>
                )}
                {titSaFiltered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDisplayDate(row.fecha)}</TableCell>
                    <TableCell>{row.folio}</TableCell>
                    <TableCell>{row.horaProgramada || "-"}</TableCell>
                    <TableCell>{row.linea}</TableCell>
                    <TableCell>{row.eco || "-"}</TableCell>
                    <TableCell>{row.fechaHoraLlegada ? formatDisplayDateTime(row.fechaHoraLlegada) : "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.estado}
                        sx={{
                          bgcolor:
                            row.estado === "Llegó"
                              ? COLORS.llegoBg
                              : row.estado === "No llegó"
                              ? COLORS.noLlegoBg
                              : COLORS.pendientesBg,
                          color: row.estado === "Pendiente" ? COLORS.pendientesText : "#ffffff"
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {canChangeEstado && row.estado === "Pendiente" && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              variant="contained"
                              onClick={() => openLlegoDialog(row.id)}
                            >
                              LLEGÓ
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="contained"
                              onClick={() => handleMarcarNoLlego(row.id)}
                            >
                              NO LLEGÓ
                            </Button>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={dialogOpen} onClose={handleDialogCancel}>
            <DialogTitle>Escribe el No eco que llegó</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="No eco"
                fullWidth
                value={dialogEco}
                onChange={(e) => setDialogEco(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogCancel}>Cancelar</Button>
              <Button onClick={handleDialogAccept} variant="contained">Aceptar</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* -------------------- Arcelormittal (GENERACIÓN) -------------------- */}
      {tab === 1 && (
        <Box>
          {/* Recuadros de visualización en Arcelormittal (arriba) */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.totalBg }}>
                  <Typography variant="subtitle2">Total (día)</Typography>
                  <Typography variant="h6">{titsaRows.filter(r => (fechaGeneracion ? r.fecha === fechaGeneracion : true)).length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.pendientesBg, color: COLORS.pendientesText }}>
                  <Typography variant="subtitle2">Pendientes</Typography>
                  <Typography variant="h6">{titsaRows.filter(r => r.fecha === fechaGeneracion && r.estado === "Pendiente").length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.llegoBg, color: COLORS.llegoText }}>
                  <Typography variant="subtitle2">Llegados</Typography>
                  <Typography variant="h6">{titsaRows.filter(r => r.fecha === fechaGeneracion && r.estado === "Llegó").length}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.noLlegoBg, color: COLORS.noLlegoText }}>
                  <Typography variant="subtitle2">No Llegados</Typography>
                  <Typography variant="h6">{titsaRows.filter(r => r.fecha === fechaGeneracion && r.estado === "No llegó").length}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={4} sx={{ mb: 2 }}>
            {/* Lado izquierdo: Folios automáticos */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Folios automáticos</Typography>

              <TextField
                label="Fecha"
                type="date"
                value={fechaGeneracion}
                onChange={(e) => setFechaGeneracion(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerarAutomaticos}
                disabled={!canGenerate}
              >
                Generar folios automáticos y preparar envío
              </Button>
            </Grid>

            {/* Lado derecho: Folios manuales */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Folios manuales</Typography>

              <FormControl fullWidth sx={{ mb: 2 }} size="small">
                <InputLabel id="select-linea-label">Línea de transporte</InputLabel>
                <Select
                  labelId="select-linea-label"
                  value={selectedLinea}
                  label="Línea de transporte"
                  onChange={(e) => setSelectedLinea(e.target.value)}
                >
                  <MenuItem value="">Selecciona una línea</MenuItem>
                  {Object.keys(lineasTelefonos).map((l) => (
                    <MenuItem key={l} value={l}>{l}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Horario"
                select
                value={selectedRango}
                onChange={(e) => setSelectedRango(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
              >
                <MenuItem value="">Selecciona un horario</MenuItem>
                {horariosArcelor.map((h) => (
                  <MenuItem key={h.label} value={h.label}>{h.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Cantidad de folios"
                type="number"
                value={cantidadPorBloque}
                onChange={(e) => setCantidadPorBloque(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
              />

              <TextField
                label="Fecha"
                type="date"
                value={fechaGeneracion}
                onChange={(e) => setFechaGeneracion(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ mb: 2 }}
                size="small"
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerarManuales}
                disabled={!canGenerate}
              >
                Generar folios manuales y preparar envío
              </Button>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Después de confirmar, selecciona desde qué número se enviará (remitente). El destinatario será el teléfono de la línea transportista. Si eliges "Otro", ingresa el número desde el que enviarás.
          </Typography>
        </Box>
      )}

      {/* -------------------- Diálogo de selección de remitente -------------------- */}
      <Dialog open={contactDialogOpen} onClose={handleContactDialogCancel}>
        <DialogTitle>Selecciona el remitente (desde qué número enviar)</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="select-remitente-label">Remitente</InputLabel>
            <Select
              labelId="select-remitente-label"
              value={selectedRemitente}
              label="Remitente"
              onChange={(e) => setSelectedRemitente(e.target.value)}
            >
              <MenuItem value="Alan Bustos">Alan Bustos</MenuItem>
              <MenuItem value="Aldo Ramirez">Aldo Ramirez</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </Select>
          </FormControl>

          {selectedRemitente === "Otro" && (
            <TextField
              label="Número del remitente (sin espacios ni +)"
              value={otroRemitenteTelefono}
              onChange={(e) => setOtroRemitenteTelefono(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            />
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Se enviará un mensaje individual a cada línea transportista con su bloque de folios. El remitente seleccionado se mostrará en el texto del mensaje.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleContactDialogCancel}>Cancelar</Button>
          <Button variant="contained" onClick={handleContactDialogSend}>Enviar</Button>
        </DialogActions>
      </Dialog>

      {/* -------------------- Diálogo de autenticación para Administrador -------------------- */}
      <Dialog open={authDialogOpen} onClose={handleAuthCancel}>
        <DialogTitle>Autenticación requerida</DialogTitle>
        <DialogContent>
          <TextField
            label="Contraseña de administrador"
            type="password"
            fullWidth
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            autoFocus
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Ingresa la contraseña para activar el rol Administrador.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAuthCancel}>Cancelar</Button>
          <Button variant="contained" onClick={handleAuthConfirm}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}