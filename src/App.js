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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from "@mui/material";

/* ---------- Paleta de colores ---------- */
const COLORS = {
  totalBg: "#e0e0e0",
  pendientesBg: "#fff59d",
  llegoBg: "#81c784",
  noLlegoBg: "#e57373",
  pendientesText: "#000000",
  llegoText: "#ffffff",
  noLlegoText: "#ffffff"
};

/* ---------- Helpers de fecha ---------- */
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

/* ---------- Horarios ---------- */
const horariosArcelor = [
  { label: "6:00am a 8:00am", inicio: 6, fin: 8 },
  { label: "8:00am a 10:00am", inicio: 8, fin: 10 },
  { label: "10:00am a 12:00pm", inicio: 10, fin: 12 },
  { label: "12:00pm a 2:00pm", inicio: 12, fin: 14 },
  { label: "2:00pm a 4:00pm", inicio: 14, fin: 16 },
  { label: "4:00pm a 6:00pm", inicio: 16, fin: 18 }
];

/* ---------- Valores iniciales para líneas y unidades ---------- */
const INITIAL_LINEAS_TELEFONOS = {
  "AUTO LINEAS PERALES SA DE CV": "8180118971",
  "JUAN MANUEL VALDES AGUILAR": "8661019151",
  "LOURDES DE ROCIO SALAZAR RODRIGUEZ": "8661359355",
  "TRANSPORTES RAMOS DEL NORESTE": "8181200896",
  "RS-MA MATERIALS SA DE CV": "8118092949",
  "JUAN BERNARDO SALDAÑA DE LA ROSA": "8211225603",
  "JOSE ANGEL ZACARIAS SANCHEZ": "8187075009",
  "DX XPRESS SA DE CV": "8183096615",
  "ANGEL MARIO RODRIGUEZ PEDRAZA": "8212116936",
  "OSCAR VILLANUEVA RAMOS": "8117997206",
  "RAFAEL FERNANDO SALDAÑA SALDAÑA": "8211181151",
  "MONICA PATRICIA ALVAREZ VILLARRUEL": "8666424871",
  "XOCHITL YANETH AGUIRRE GUERRA": "8261260247",
  "AUTOLINEAS MRD SA DE CV": "8661701305",
  "MXG CARRIER SA DE CV": "8121474120",
  "AUTO FLETES TRT SA DE CV": "8119889214",
  "NORMA ANGELICA VIZCARRA JIMENEZ": "8110122302",
  "AUTO EXPRESS AGUIRRE SA DE CV": "8661239826",
  "TRANSPORTES ALEDQUI SA DE CV": "8135990348",
  "TRANSERVICIOS LOGISTICOS DEL NORTE SA DE CV (TLN)": "8124224662"
};

const INITIAL_LINEAS_UNIDADES = {
  "AUTO LINEAS PERALES SA DE CV": 25,
  "JUAN MANUEL VALDES AGUILAR": 13,
  "LOURDES DE ROCIO SALAZAR RODRIGUEZ": 12,
  "TRANSPORTES RAMOS DEL NORESTE": 21,
  "RS-MA MATERIALS SA DE CV": 11,
  "JUAN BERNARDO SALDAÑA DE LA ROSA": 6,
  "JOSE ANGEL ZACARIAS SANCHEZ": 11,
  "DX XPRESS SA DE CV": 13,
  "ANGEL MARIO RODRIGUEZ PEDRAZA": 8,
  "OSCAR VILLANUEVA RAMOS": 10,
  "RAFAEL FERNANDO SALDAÑA SALDAÑA": 10,
  "MONICA PATRICIA ALVAREZ VILLARRUEL": 3,
  "XOCHITL YANETH AGUIRRE GUERRA": 4,
  "AUTOLINEAS MRD SA DE CV": 5,
  "MXG CARRIER SA DE CV": 1,
  "AUTO FLETES TRT SA DE CV": 1,
  "NORMA ANGELICA VIZCARRA JIMENEZ": 2,
  "AUTO EXPRESS AGUIRRE SA DE CV": 3,
  "TRANSPORTES ALEDQUI SA DE CV": 1,
  "TRANSERVICIOS LOGISTICOS DEL NORTE SA DE CV (TLN)": 2
};

/* ---------- Helpers folios ---------- */
const getYYYYMM = (isoDateStr) => {
  const d = isoDateStr ? parseLocalDate(isoDateStr) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}${mm}`;
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

/* ---------- Componente principal ---------- */
export default function App() {
  const [tab, setTab] = useState(0);

  /* TITSA rows (inicia vacío) */
  const [titsaRows, setTitsaRows] = useState([]);
  const [titsaSearch, setTitsaSearch] = useState("");
  const [showHistorial, setShowHistorial] = useState(false);
  const todayISO = new Date().toLocaleDateString("en-CA");
  const [mainFecha, setMainFecha] = useState(todayISO);

  const [selectedHora, setSelectedHora] = useState(null);
  const [selectedEstado, setSelectedEstado] = useState(null);

  /* Fecha para generación */
  const [fechaGeneracion, setFechaGeneracion] = useState(todayISO);

  /* Roles and auth */
  const ROLES = ["Administrador", "Control de accesos"];
  const [userRole, setUserRole] = useState("Control de accesos");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const ADMIN_PASSWORD = "1234";

  /* Dialog LLEGÓ */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTargetId, setDialogTargetId] = useState(null);
  const [dialogEco, setDialogEco] = useState("");

  /* Lines state (phones + units) and generated folios per line (assigned by repartition) */
  const [lineasTelefonosState, setLineasTelefonosState] = useState(() => ({ ...INITIAL_LINEAS_TELEFONOS }));
  const [lineasUnidadesState, setLineasUnidadesState] = useState(() => ({ ...INITIAL_LINEAS_UNIDADES }));
  const [lineFoliosState, setLineFoliosState] = useState(() => {
    const map = {};
    Object.keys(INITIAL_LINEAS_TELEFONOS).forEach((l) => (map[l] = []));
    return map;
  });

  /* Admin add/edit UI */
  const [nuevaLineaNombre, setNuevaLineaNombre] = useState("");
  const [nuevaLineaTelefono, setNuevaLineaTelefono] = useState("");
  const [nuevaLineaUnidades, setNuevaLineaUnidades] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLineaOriginalName, setEditLineaOriginalName] = useState("");
  const [editLineaNombre, setEditLineaNombre] = useState("");
  const [editLineaTelefono, setEditLineaTelefono] = useState("");
  const [editLineaUnidades, setEditLineaUnidades] = useState(0);

  /* Send preview dialog (per-line) */
  const [sendPreviewOpen, setSendPreviewOpen] = useState(false);
  const [sendPreviewLine, setSendPreviewLine] = useState("");
  const [sendPreviewTel, setSendPreviewTel] = useState("");
  const [sendPreviewMessage, setSendPreviewMessage] = useState("");

  /* Per-row manual inputs (cantidad y horario) */
  const [manualCounts, setManualCounts] = useState({});
  const [manualHorarios, setManualHorarios] = useState({});

  const idCounterRef = useRef(Date.now());
  const sendBufferRef = useRef({});

  /* Initialize localStorage sequence for current month */
  useEffect(() => {
    const yyyymm = getYYYYMM(new Date().toLocaleDateString("en-CA"));
    const key = storageKeyForMonth(yyyymm);
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "0");
    }
  }, []);

  /* ---------- Totales y conteos basados en la tabla (TITSA) ---------- */
  const totalCountForDay = useMemo(() => {
    return titsaRows.filter((r) => (mainFecha ? r.fecha === mainFecha : true)).length;
  }, [titsaRows, mainFecha]);

  const pendientesCount = useMemo(() => {
    return titsaRows.filter((r) => r.fecha === mainFecha && r.estado === "Pendiente").length;
  }, [titsaRows, mainFecha]);

  const llegadosCount = useMemo(() => {
    return titsaRows.filter((r) => r.fecha === mainFecha && r.estado === "Llegó").length;
  }, [titsaRows, mainFecha]);

  const noLlegadosCount = useMemo(() => {
    return titsaRows.filter((r) => r.fecha === mainFecha && r.estado === "No llegó").length;
  }, [titsaRows, mainFecha]);

  /* Conteo por horario basado en la tabla (muestra entre paréntesis) */
  const horarioCounts = useMemo(() => {
    return horariosArcelor.map((h) =>
      titsaRows.filter((r) => r.fecha === mainFecha && r.horaProgramada === h.label).length
    );
  }, [titsaRows, mainFecha]);

  /* Filters for TITSA table */
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
        const re = /(\d{1,2}):(\d{2})\s*(am|pm)/i;
        const m = hp.match(re);
        if (!m) return false;
        let hour = parseInt(m[1], 10);
        const ampm = m[3].toLowerCase();
        if (ampm === "pm" && hour !== 12) hour += 12;
        if (ampm === "am" && hour === 12) hour = 0;
        if (!(hour >= selectedHora.inicio && hour < selectedHora.fin)) return false;
      }

      if (selectedEstado && selectedEstado !== "Total") {
        if (r.estado !== selectedEstado) return false;
      }

      return true;
    });
  }, [titsaRows, titsaSearch, showHistorial, mainFecha, selectedHora, selectedEstado]);

  /* Toggle estado and hora */
  const toggleEstadoFilter = (estado) => {
    if (estado === "Total") {
      setSelectedEstado((s) => (s === "Total" ? null : "Total"));
      return;
    }
    setSelectedEstado((s) => (s === estado ? null : estado));
  };
  const toggleHoraFilter = (h) => {
    setSelectedHora((prev) => (prev?.label === h.label ? null : h));
  };

  /* Role change with auth */
  const handleRoleChange = (newRole) => {
    if (newRole === "Administrador") {
      setAuthPassword("");
      setAuthDialogOpen(true);
    } else {
      setUserRole(newRole);
    }
  };
  const handleAuthConfirm = () => {
    if (authPassword === ADMIN_PASSWORD) {
      setUserRole("Administrador");
      setAuthDialogOpen(false);
      setAuthPassword("");
    } else {
      alert("Contraseña incorrecta. Se mantiene en Control de accesos.");
      setUserRole("Control de accesos");
      setAuthDialogOpen(false);
      setAuthPassword("");
    }
  };
  const handleAuthCancel = () => {
    setAuthDialogOpen(false);
    setAuthPassword("");
    setUserRole("Control de accesos");
  };

  const canGenerate = userRole === "Administrador";
  const canChangeEstado = userRole === "Administrador" || userRole === "Control de accesos";

  /* Dialog LLEGÓ handlers */
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
    setDialogOpen(false);
    setDialogTargetId(null);
    setDialogEco("");
    // limpiar búsqueda para desfiltrar
    setTitsaSearch("");
  };
  const handleMarcarNoLlego = (id) => {
    setTitsaRows((prev) => prev.map((r) => (r.id === id ? { ...r, estado: "No llegó" } : r)));
    // limpiar búsqueda para desfiltrar
    setTitsaSearch("");
  };

  /* Contact dialog (bulk) */
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedRemitente, setSelectedRemitente] = useState("Alan Bustos");
  const [otroRemitenteTelefono, setOtroRemitenteTelefono] = useState("");
  const [pendingMessagesByLine, setPendingMessagesByLine] = useState({});
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
    Object.entries(pendingMessagesByLine).forEach(([linea, mensaje]) => {
      const telefonoLinea = (lineasTelefonosState[linea] || "").replace(/\D/g, "");
      if (!telefonoLinea) return;
      const mensajeFinal = `${mensaje}`;
      const url = `https://wa.me/52${telefonoLinea}?text=${encodeURIComponent(mensajeFinal)}`;
      window.open(url, "_blank");
    });
    setPendingMessagesByLine({});
    setContactDialogOpen(false);
  };

  /* ---------- Generar distribución automática (reparte 210 folios respetando topes) ----------
     - Updates lineFoliosState only (refreshes assignments).
     - Does NOT add records to titsaRows.
  */
  const handleGenerarAutomaticos = () => {
    if (!canGenerate) {
      alert("Solo Administrador puede generar folios automáticos.");
      return;
    }
    if (!fechaGeneracion) {
      alert("Selecciona una fecha válida.");
      return;
    }
    if (!window.confirm("¿Desea repartir los 210 folios entre las líneas respetando el tope de unidades?")) return;

    const lines = Object.keys(lineasTelefonosState);
    if (lines.length === 0) {
      alert("No hay líneas configuradas.");
      return;
    }

    const TOTAL_POR_DIA = 210;
    const HORARIOS_COUNT = horariosArcelor.length;
    const TOTAL_POR_HORARIO = Math.floor(TOTAL_POR_DIA / HORARIOS_COUNT); // 35

    const assignedTotals = {};
    lines.forEach((l) => (assignedTotals[l] = 0));
    const newLineFolios = {};
    lines.forEach((l) => (newLineFolios[l] = []));

    horariosArcelor.forEach(() => {
      let foliosToAssign = TOTAL_POR_HORARIO;

      const remainingCap = {};
      let totalRemaining = 0;
      lines.forEach((l) => {
        const cap = lineasUnidadesState[l] || 0;
        const rem = Math.max(0, cap - assignedTotals[l]);
        remainingCap[l] = rem;
        totalRemaining += rem;
      });

      if (totalRemaining <= 0) return;

      const provisional = {};
      let allocated = 0;
      lines.forEach((l) => {
        if (remainingCap[l] <= 0) {
          provisional[l] = 0;
          return;
        }
        const share = Math.floor((remainingCap[l] / totalRemaining) * foliosToAssign);
        const take = Math.min(share, remainingCap[l]);
        provisional[l] = take;
        allocated += take;
      });

      let remainder = foliosToAssign - allocated;
      if (remainder > 0) {
        const sortable = lines.filter((l) => remainingCap[l] > provisional[l]).sort((a, b) => remainingCap[b] - remainingCap[a]);
        let idx = 0;
        while (remainder > 0 && sortable.length > 0) {
          const l = sortable[idx % sortable.length];
          if (provisional[l] < remainingCap[l]) {
            provisional[l] += 1;
            remainder -= 1;
          }
          idx += 1;
          if (idx > sortable.length * 5) break;
        }
      }

      lines.forEach((linea) => {
        const count = provisional[linea] || 0;
        if (!count || count <= 0) return;
        const folios = getNextFolios(count, fechaGeneracion);
        newLineFolios[linea] = [...newLineFolios[linea], ...folios];
        assignedTotals[linea] += count;
      });
    });

    // Replace previous assignments (refresh)
    setLineFoliosState(() => {
      const merged = {};
      Object.keys(lineasTelefonosState).forEach((l) => {
        merged[l] = newLineFolios[l] || [];
      });
      return merged;
    });

    alert("Distribución completada. Revisa 'Citas generadas' por línea. Usa 'Enviar citas' por línea para mandar los mensajes.");
  };

  /* ---------- Preparar y enviar por línea ----------
     - Uses assigned folios (lineFoliosState) or manualCount override.
     - On confirm: creates titsaRows entries and clears assigned folios for that line.
  */
  const handlePrepareSendForLine = (linea) => {
    const tel = (lineasTelefonosState[linea] || "").replace(/\D/g, "");
    if (!tel) {
      alert("No hay teléfono configurado para esta línea.");
      return;
    }

    const assigned = (lineFoliosState[linea] || []).slice();
    const manualCount = Number(manualCounts[linea] || 0);

    let foliosToSend = [];
    if (manualCount > 0) {
      foliosToSend = getNextFolios(manualCount, fechaGeneracion);
    } else if (assigned.length > 0) {
      foliosToSend = assigned.slice();
    } else {
      const unidades = lineasUnidadesState[linea] || 0;
      if (unidades <= 0) {
        alert("La línea no tiene unidades configuradas.");
        return;
      }
      foliosToSend = getNextFolios(unidades, fechaGeneracion);
    }

    // Build message: include date, line name, "Citas asignadas" and list folios grouped by horario evenly (no "Otros")
    let mensaje = `📅 Fecha: ${formatDisplayDate(fechaGeneracion)}\n🚚 Línea de transporte: ${linea}\n\n`;
    mensaje += `Citas asignadas:\n\n`;

    const count = foliosToSend.length;
    const base = Math.floor(count / horariosArcelor.length);
    let remainder = count - base * horariosArcelor.length;
    let idx = 0;

    horariosArcelor.forEach((h) => {
      const take = base + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      const slice = foliosToSend.slice(idx, idx + take);
      if (slice.length > 0) {
        mensaje += `🕒 ${h.label}\n`;
        slice.forEach((f) => (mensaje += `- ${f}\n`));
        mensaje += `\n`;
      }
      idx += take;
    });

    mensaje += `👉 Favor de presentarse en patio con todo el equipo completo de sujeción de rollo y 🦺 EPP completo.`;

    // preview
    setSendPreviewLine(linea);
    setSendPreviewTel(tel);
    setSendPreviewMessage(mensaje);
    setSendPreviewOpen(true);

    // store foliosToSend in buffer for confirm
    sendBufferRef.current[linea] = foliosToSend;
  };

  const handleConfirmSendPreview = () => {
    const linea = sendPreviewLine;
    const tel = sendPreviewTel;
    const foliosToSend = sendBufferRef.current[linea] || [];

    if (!foliosToSend || foliosToSend.length === 0) {
      alert("No hay folios para enviar.");
      setSendPreviewOpen(false);
      return;
    }

    // Create titsaRows entries for each folio and assign horarios:
    const manualHorario = manualHorarios[linea] || "";
    const nuevosRegistros = [];
    const count = foliosToSend.length;

    if (manualHorario) {
      foliosToSend.forEach((f) => {
        idCounterRef.current += 1;
        nuevosRegistros.push({
          id: idCounterRef.current,
          fecha: fechaGeneracion,
          folio: f,
          horaProgramada: manualHorario,
          linea,
          estado: "Pendiente",
          eco: "",
          fechaHoraLlegada: ""
        });
      });
    } else {
      const base = Math.floor(count / horariosArcelor.length) || 1;
      let remainder = count - base * horariosArcelor.length;
      let idx = 0;
      horariosArcelor.forEach((h) => {
        const take = base + (remainder > 0 ? 1 : 0);
        remainder = Math.max(0, remainder - 1);
        const slice = foliosToSend.slice(idx, idx + take);
        slice.forEach((f) => {
          idCounterRef.current += 1;
          nuevosRegistros.push({
            id: idCounterRef.current,
            fecha: fechaGeneracion,
            folio: f,
            horaProgramada: h.label,
            linea,
            estado: "Pendiente",
            eco: "",
            fechaHoraLlegada: ""
          });
        });
        idx += take;
      });
    }

    // Add to titsaRows (these are the actual records)
    setTitsaRows((prev) => [...prev, ...nuevosRegistros]);

    // Clear assigned folios for that line (so repartition will refresh next time)
    setLineFoliosState((prev) => {
      const copy = { ...prev };
      copy[linea] = [];
      return copy;
    });

    // Clear manual inputs for that line
    setManualCounts((prev) => {
      const copy = { ...prev };
      delete copy[linea];
      return copy;
    });
    setManualHorarios((prev) => {
      const copy = { ...prev };
      delete copy[linea];
      return copy;
    });

    // Clear send buffer
    delete sendBufferRef.current[linea];

    // Open WhatsApp with the preview message
    const url = `https://wa.me/52${tel}?text=${encodeURIComponent(sendPreviewMessage)}`;
    window.open(url, "_blank");

    setSendPreviewOpen(false);
    setSendPreviewLine("");
    setSendPreviewTel("");
    setSendPreviewMessage("");
  };

  /* ---------- Admin: agregar / eliminar / modificar líneas ---------- */
  const handleAgregarLinea = () => {
    if (userRole !== "Administrador") {
      alert("Solo Administrador puede agregar líneas.");
      return;
    }
    const nombre = (nuevaLineaNombre || "").trim();
    const telefono = (nuevaLineaTelefono || "").replace(/\D/g, "");
    const unidades = Number(nuevaLineaUnidades);

    if (!nombre) {
      alert("Ingresa el nombre de la línea.");
      return;
    }
    if (!telefono || telefono.length < 7) {
      alert("Ingresa un teléfono válido (solo dígitos).");
      return;
    }
    if (!unidades || unidades <= 0) {
      alert("Ingresa un número de unidades válido (> 0).");
      return;
    }

    setLineasTelefonosState((prev) => ({ ...prev, [nombre]: telefono }));
    setLineasUnidadesState((prev) => ({ ...prev, [nombre]: unidades }));
    setLineFoliosState((prev) => ({ ...prev, [nombre]: [] }));

    setNuevaLineaNombre("");
    setNuevaLineaTelefono("");
    setNuevaLineaUnidades("");
  };

  const handleEliminarLinea = (linea) => {
    if (userRole !== "Administrador") {
      alert("Solo Administrador puede eliminar líneas.");
      return;
    }
    if (!window.confirm(`¿Estás seguro que deseas eliminar la línea "${linea}"? Esta acción no se puede deshacer.`)) return;

    setLineasTelefonosState((prev) => {
      const copy = { ...prev };
      delete copy[linea];
      return copy;
    });
    setLineasUnidadesState((prev) => {
      const copy = { ...prev };
      delete copy[linea];
      return copy;
    });
    setLineFoliosState((prev) => {
      const copy = { ...prev };
      delete copy[linea];
      return copy;
    });

    setTitsaRows((prev) => prev.filter((r) => r.linea !== linea));
  };

  const openEditLineaDialog = (linea) => {
    if (userRole !== "Administrador") {
      alert("Solo Administrador puede modificar líneas.");
      return;
    }
    setEditLineaOriginalName(linea);
    setEditLineaNombre(linea);
    setEditLineaTelefono(lineasTelefonosState[linea] || "");
    setEditLineaUnidades(lineasUnidadesState[linea] ?? 0);
    setEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditLineaOriginalName("");
    setEditLineaNombre("");
    setEditLineaTelefono("");
    setEditLineaUnidades(0);
  };

  const handleEditConfirm = () => {
    const nombreNuevo = (editLineaNombre || "").trim();
    const telefonoNuevo = (editLineaTelefono || "").replace(/\D/g, "");
    const unidadesNuevo = Number(editLineaUnidades);

    if (!nombreNuevo) {
      alert("El nombre de la línea no puede estar vacío.");
      return;
    }
    if (!telefonoNuevo || telefonoNuevo.length < 7) {
      alert("Ingresa un teléfono válido (solo dígitos).");
      return;
    }
    if (isNaN(unidadesNuevo) || unidadesNuevo < 0) {
      alert("Ingresa un número de unidades válido (>= 0).");
      return;
    }

    if (!window.confirm(`Confirmar cambios para la línea "${editLineaOriginalName}"?`)) return;

    setLineasTelefonosState((prev) => {
      const copy = { ...prev };
      if (nombreNuevo !== editLineaOriginalName) {
        copy[nombreNuevo] = telefonoNuevo;
        delete copy[editLineaOriginalName];
      } else {
        copy[nombreNuevo] = telefonoNuevo;
      }
      return copy;
    });

    setLineasUnidadesState((prev) => {
      const copy = { ...prev };
      if (nombreNuevo !== editLineaOriginalName) {
        copy[nombreNuevo] = unidadesNuevo;
        delete copy[editLineaOriginalName];
      } else {
        copy[nombreNuevo] = unidadesNuevo;
      }
      return copy;
    });

    setLineFoliosState((prev) => {
      const copy = { ...prev };
      if (nombreNuevo !== editLineaOriginalName) {
        copy[nombreNuevo] = copy[editLineaOriginalName] || [];
        delete copy[editLineaOriginalName];
      }
      return copy;
    });

    setTitsaRows((prev) => prev.map((r) => (r.linea === editLineaOriginalName ? { ...r, linea: nombreNuevo } : r)));

    handleEditCancel();
  };

  /* ---------- Per-row manual inputs handlers ---------- */
  const handleManualCountChange = (linea, value) => {
    const v = value === "" ? "" : Math.max(0, Math.floor(Number(value) || 0));
    setManualCounts((prev) => ({ ...prev, [linea]: v }));
  };
  const handleManualHorarioChange = (linea, value) => {
    setManualHorarios((prev) => ({ ...prev, [linea]: value }));
  };

  /* ---------- Export helpers (Agrupar folios por línea + horario en una sola celda) ---------- */
  const buildExportData = () => {
    // Build rows grouped by fecha (use fechaGeneracion) -> linea -> horario -> folios array
    const rows = [];
    const fechaKey = fechaGeneracion || mainFecha;

    Object.keys(lineasTelefonosState).forEach((linea) => {
      // collect folios from titsaRows for this line and selected fecha
      const folios = titsaRows.filter((r) => r.linea === linea && r.fecha === fechaKey);
      if (folios.length === 0) return;

      // group by horario
      const horariosMap = {};
      folios.forEach((f) => {
        const h = f.horaProgramada || "";
        if (!horariosMap[h]) horariosMap[h] = [];
        horariosMap[h].push(f.folio);
      });

      Object.keys(horariosMap).forEach((horario) => {
        rows.push({
          fecha: formatDisplayDate(fechaKey),
          linea,
          horario,
          folios: horariosMap[horario] // array of folios (will join later)
        });
      });
    });

    return rows;
  };

  const handleExportExcel = () => {
    if (userRole !== "Administrador") {
      alert("Solo Administrador puede exportar.");
      return;
    }
    const rowsToExport = buildExportData();
    if (rowsToExport.length === 0) {
      alert("No hay folios generados para exportar en la fecha seleccionada.");
      return;
    }
    import("xlsx").then((XLSX) => {
      const sheetData = rowsToExport.map((r) => ({
        Fecha: r.fecha,
        Línea: r.linea,
        Horario: r.horario,
        Folios: r.folios.join(", ")
      }));
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Citas");
      XLSX.writeFile(wb, `citas_${(fechaGeneracion || mainFecha).replace(/-/g, "")}.xlsx`);
    }).catch((err) => {
      console.error(err);
      alert("Error al exportar Excel.");
    });
  };

  const handleExportPDF = () => {
    if (userRole !== "Administrador") {
      alert("Solo Administrador puede exportar.");
      return;
    }
    const rowsToExport = buildExportData();
    if (rowsToExport.length === 0) {
      alert("No hay folios generados para exportar en la fecha seleccionada.");
      return;
    }
    import("jspdf").then((jsPDF) => {
      import("jspdf-autotable").then(() => {
        const doc = new jsPDF.default();
        const head = [["Fecha", "Línea", "Horario", "Folios"]];
        const body = rowsToExport.map((r) => [r.fecha, r.linea, r.horario, r.folios.join(", ")]);
        doc.autoTable({ head, body, styles: { fontSize: 9 } });
        doc.save(`citas_${(fechaGeneracion || mainFecha).replace(/-/g, "")}.pdf`);
      });
    }).catch((err) => {
      console.error(err);
      alert("Error al exportar PDF.");
    });
  };

  /* ---------- Render ---------- */
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
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
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

            <Grid item xs={8} md={3}>
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
          <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
            {horariosArcelor.map((h, idx) => (
              <Button
                key={h.label}
                variant={selectedHora?.label === h.label ? "contained" : "outlined"}
                color={selectedHora?.label === h.label ? "primary" : "inherit"}
                size="small"
                onClick={() => toggleHoraFilter(h)}
              >
                {`${h.label} (${horarioCounts[idx] || 0})`}
              </Button>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Última hora para ingresar unidades 06:00pm
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

      {/* -------------------- Arcelormittal (GENERACIÓN + Gestión de líneas + Export) -------------------- */}
      {tab === 1 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.totalBg }}>
                  <Typography variant="subtitle2">Total (día)</Typography>
                  <Typography variant="h6">{totalCountForDay}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.pendientesBg, color: COLORS.pendientesText }}>
                  <Typography variant="subtitle2">Pendientes</Typography>
                  <Typography variant="h6">{pendientesCount}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.llegoBg, color: COLORS.llegoText }}>
                  <Typography variant="subtitle2">Llegados</Typography>
                  <Typography variant="h6">{llegadosCount}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: COLORS.noLlegoBg, color: COLORS.noLlegoText }}>
                  <Typography variant="subtitle2">No Llegados</Typography>
                  <Typography variant="h6">{noLlegadosCount}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4} sx={{ textAlign: "right" }}>
                {userRole === "Administrador" && (
                  <Box sx={{ display: "inline-flex", gap: 1 }}>
                    <Button variant="contained" color="secondary" onClick={handleExportExcel}>Exportar Excel</Button>
                    <Button variant="contained" color="secondary" onClick={handleExportPDF}>Exportar PDF</Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={4} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Folios automáticos (repartir 210)</Typography>

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
                Repartir folios entre líneas (210)
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Folios manuales</Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                El botón de "Repartir folios" asigna internamente las citas a cada línea respetando su tope de unidades.
                No se crean registros en la tabla hasta que uses "Enviar citas" por línea. Usa "Citas manuales" para generar una cantidad específica antes de enviar.
              </Typography>
            </Grid>
          </Grid>

          {/* ---------- Gestión de líneas (solo Administrador) ---------- */}
          {userRole === "Administrador" && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Gestión de líneas transportistas</Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Nombre de la línea"
                    value={nuevaLineaNombre}
                    onChange={(e) => setNuevaLineaNombre(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Teléfono (solo dígitos)"
                    value={nuevaLineaTelefono}
                    onChange={(e) => setNuevaLineaTelefono(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="Unidades"
                    type="number"
                    value={nuevaLineaUnidades}
                    onChange={(e) => setNuevaLineaUnidades(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button variant="contained" onClick={handleAgregarLinea} fullWidth>Agregar línea</Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Líneas actuales</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Línea transportista</strong></TableCell>
                        <TableCell><strong>Acciones</strong></TableCell>
                        <TableCell><strong>Citas manuales</strong></TableCell>
                        <TableCell><strong>Horario</strong></TableCell>
                        <TableCell><strong>Citas generadas</strong></TableCell>
                        <TableCell align="center"><strong>Enviar</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(lineasTelefonosState).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No hay líneas registradas.</TableCell>
                        </TableRow>
                      )}
                      {Object.keys(lineasTelefonosState).map((linea) => {
                        const assignedCount = (lineFoliosState[linea] || []).length;
                        const manualCount = Number(manualCounts[linea] || 0);
                        const displayGenerated = assignedCount + (manualCount > 0 ? manualCount : 0);
                        return (
                          <TableRow key={linea}>
                            <TableCell>
                              <Typography variant="body2"><strong>{linea}</strong></Typography>
                              <Typography variant="caption" color="text.secondary">
                                Tel: {lineasTelefonosState[linea]} — Unidades: {lineasUnidadesState[linea] ?? 0}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Button size="small" variant="outlined" onClick={() => openEditLineaDialog(linea)}>Modificar</Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => handleEliminarLinea(linea)}>Eliminar</Button>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={manualCounts[linea] ?? ""}
                                onChange={(e) => handleManualCountChange(linea, e.target.value)}
                                placeholder="Cantidad"
                              />
                            </TableCell>

                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={manualHorarios[linea] ?? ""}
                                  onChange={(e) => handleManualHorarioChange(linea, e.target.value)}
                                  displayEmpty
                                >
                                  <MenuItem value="">Selecciona horario</MenuItem>
                                  {horariosArcelor.map((h) => (
                                    <MenuItem key={h.label} value={h.label}>{h.label}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>

                            <TableCell>
                              {displayGenerated}
                            </TableCell>

                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handlePrepareSendForLine(linea)}
                              >
                                Enviar citas
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ---------- Edit dialog ---------- */}
      <Dialog open={editDialogOpen} onClose={handleEditCancel}>
        <DialogTitle>Modificar línea transportista</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Edita nombre, teléfono o unidades. Confirma para aplicar los cambios.
          </Typography>
          <TextField
            label="Nombre de la línea"
            value={editLineaNombre}
            onChange={(e) => setEditLineaNombre(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            label="Teléfono (solo dígitos)"
            value={editLineaTelefono}
            onChange={(e) => setEditLineaTelefono(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            label="Unidades"
            type="number"
            value={editLineaUnidades}
            onChange={(e) => setEditLineaUnidades(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditConfirm}>Confirmar cambios</Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Send preview dialog ---------- */}
      <Dialog open={sendPreviewOpen} onClose={() => setSendPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar envío por WhatsApp</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>{sendPreviewMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendPreviewOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmSendPreview}>Enviar ahora</Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Contact dialog ---------- */}
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
              Se enviará un mensaje individual a cada línea transportista con su bloque de folios.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleContactDialogCancel}>Cancelar</Button>
          <Button variant="contained" onClick={handleContactDialogSend}>Enviar</Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Auth dialog ---------- */}
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