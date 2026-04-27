import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Stack,
  Typography,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { formatMedicationLine, formatMedicationLines } from "../../utils/hisCopyFormatter";

const keyOf = (g, m) => `${g}-${m}`;

const HisQuickCopy = ({ groupedMedications }) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [groupedMedications]);

  const totalCount = useMemo(
    () => groupedMedications.reduce((sum, g) => sum + g.medications.length, 0),
    [groupedMedications]
  );

  const selectedCount = selectedKeys.size;
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  const toggleOne = (gIdx, mIdx) => {
    const k = keyOf(gIdx, mIdx);
    const next = new Set(selectedKeys);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setSelectedKeys(next);
  };

  const toggleGroup = (gIdx) => {
    const groupKeys = groupedMedications[gIdx].medications.map((_, mIdx) =>
      keyOf(gIdx, mIdx)
    );
    const allOn = groupKeys.every((k) => selectedKeys.has(k));
    const next = new Set(selectedKeys);
    if (allOn) groupKeys.forEach((k) => next.delete(k));
    else groupKeys.forEach((k) => next.add(k));
    setSelectedKeys(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      const next = new Set();
      groupedMedications.forEach((g, gIdx) => {
        g.medications.forEach((_, mIdx) => next.add(keyOf(gIdx, mIdx)));
      });
      setSelectedKeys(next);
    }
  };

  const groupCheckState = (gIdx) => {
    const groupKeys = groupedMedications[gIdx].medications.map((_, mIdx) =>
      keyOf(gIdx, mIdx)
    );
    const onCount = groupKeys.filter((k) => selectedKeys.has(k)).length;
    return {
      checked: onCount === groupKeys.length && groupKeys.length > 0,
      indeterminate: onCount > 0 && onCount < groupKeys.length,
    };
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const lineCount = text.split("\n").length;
      setSnack({ open: true, msg: `已複製 ${lineCount} 行 (${label})`, severity: "success" });
    } catch (e) {
      setSnack({ open: true, msg: `複製失敗: ${e.message}`, severity: "error" });
    }
  };

  const handleCopySelected = () => {
    const text = formatMedicationLines(
      groupedMedications,
      (g, m) => selectedKeys.has(keyOf(g, m))
    );
    copyToClipboard(text, "選取");
  };

  const handleCopyAll = () => {
    const text = formatMedicationLines(groupedMedications);
    copyToClipboard(text, "全部");
  };

  if (groupedMedications.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">目前沒有藥物資料</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 1, flexWrap: "wrap" }}
      >
        <Checkbox
          size="small"
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleAll}
        />
        <Typography variant="body2">全選</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          size="small"
          disabled={selectedCount === 0}
          onClick={handleCopySelected}
        >
          複製選取 ({selectedCount})
        </Button>
        <Button variant="outlined" size="small" onClick={handleCopyAll}>
          複製全部 ({totalCount})
        </Button>
      </Stack>

      <Divider sx={{ mb: 1 }} />

      {groupedMedications.map((group, gIdx) => {
        const { checked, indeterminate } = groupCheckState(gIdx);
        return (
          <Box key={gIdx} sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Checkbox
                size="small"
                checked={checked}
                indeterminate={indeterminate}
                onChange={() => toggleGroup(gIdx)}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {group.date} {group.hosp} ({group.medications.length} 項)
              </Typography>
            </Stack>
            <Box sx={{ pl: 4 }}>
              {group.medications.map((med, mIdx) => {
                const k = keyOf(gIdx, mIdx);
                return (
                  <Stack
                    key={mIdx}
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                  >
                    <Checkbox
                      size="small"
                      checked={selectedKeys.has(k)}
                      onChange={() => toggleOne(gIdx, mIdx)}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    >
                      {formatMedicationLine(med, group)}
                    </Typography>
                  </Stack>
                );
              })}
            </Box>
          </Box>
        );
      })}

      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HisQuickCopy;
