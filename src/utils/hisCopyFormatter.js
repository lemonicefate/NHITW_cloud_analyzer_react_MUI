export function addDays(yyyymmdd, days) {
  const [y, m, d] = yyyymmdd.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}

export function formatMedicationLine(med, group) {
  const days = parseInt(med.days, 10);
  const endDate = addDays(group.date, days - 1);
  return `${med.name}(${med.ingredient}) ${med.perDosage}# ${med.frequency} ${med.days}days ${group.date} - ${endDate} (${group.hosp})`;
}

export function formatMedicationLines(groupedMedications, isSelected) {
  const lines = [];
  groupedMedications.forEach((group, gIdx) => {
    group.medications.forEach((med, mIdx) => {
      if (!isSelected || isSelected(gIdx, mIdx)) {
        lines.push(formatMedicationLine(med, group));
      }
    });
  });
  return lines.join('\n');
}
