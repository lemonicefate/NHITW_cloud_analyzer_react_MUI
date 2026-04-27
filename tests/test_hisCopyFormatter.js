import {assert} from './lib/chai.js';

import {formatMedicationLine, addDays, formatMedicationLines} from './src/utils/hisCopyFormatter.js';

describe('utils/hisCopyFormatter', function () {
  describe('.formatMedicationLine', function () {
    it('formats a typical medication into one line', function () {
      const med = {
        name: 'Norvasc',
        ingredient: 'AMLODIPINE',
        perDosage: '1',
        frequency: 'QD',
        days: '28',
      };
      const group = {
        date: '2026/04/01',
        hosp: '台大醫院',
      };
      const expected = 'Norvasc(AMLODIPINE) 1# QD 28days 2026/04/01 - 2026/04/28 (台大醫院)';
      assert.strictEqual(formatMedicationLine(med, group), expected);
    });

    it('handles PRN frequency', function () {
      const med = {name: 'Voren', ingredient: 'DICLOFENAC', perDosage: '1', frequency: 'PRN', days: '5'};
      const group = {date: '2026/04/01', hosp: '某診所'};
      assert.strictEqual(
        formatMedicationLine(med, group),
        'Voren(DICLOFENAC) 1# PRN 5days 2026/04/01 - 2026/04/05 (某診所)'
      );
    });

    it('handles fractional dose', function () {
      const med = {name: 'Concor', ingredient: 'BISOPROLOL', perDosage: '0.5', frequency: 'QD', days: '14'};
      const group = {date: '2026/04/01', hosp: 'A'};
      assert.strictEqual(
        formatMedicationLine(med, group),
        'Concor(BISOPROLOL) 0.5# QD 14days 2026/04/01 - 2026/04/14 (A)'
      );
    });

    it('handles single-day prescription (1 day)', function () {
      const med = {name: 'Solu-Cortef', ingredient: 'HYDROCORTISONE', perDosage: '1', frequency: 'STAT', days: '1'};
      const group = {date: '2026/04/01', hosp: 'A'};
      assert.strictEqual(
        formatMedicationLine(med, group),
        'Solu-Cortef(HYDROCORTISONE) 1# STAT 1days 2026/04/01 - 2026/04/01 (A)'
      );
    });
  });

  describe('.addDays', function () {
    it('crosses month boundary', function () {
      assert.strictEqual(addDays('2026/04/30', 1), '2026/05/01');
    });

    it('crosses year boundary', function () {
      assert.strictEqual(addDays('2026/12/31', 1), '2027/01/01');
    });

    it('handles leap year Feb', function () {
      assert.strictEqual(addDays('2024/02/28', 1), '2024/02/29');
    });
  });

  describe('.formatMedicationLines', function () {
    const groups = [
      {
        date: '2026/04/01',
        hosp: 'A',
        medications: [
          {name: 'X', ingredient: 'X1', perDosage: '1', frequency: 'QD', days: '7'},
          {name: 'Y', ingredient: 'Y1', perDosage: '1', frequency: 'BID', days: '7'},
        ],
      },
      {
        date: '2026/03/15',
        hosp: 'B',
        medications: [
          {name: 'Z', ingredient: 'Z1', perDosage: '1', frequency: 'QD', days: '30'},
        ],
      },
    ];

    it('joins all lines with \\n when no predicate', function () {
      const result = formatMedicationLines(groups);
      assert.strictEqual(result.split('\n').length, 3);
    });

    it('filters by predicate', function () {
      const result = formatMedicationLines(groups, (g, m) => g === 0 && m === 0);
      assert.strictEqual(result, 'X(X1) 1# QD 7days 2026/04/01 - 2026/04/07 (A)');
    });

    it('returns empty string when nothing selected', function () {
      assert.strictEqual(formatMedicationLines(groups, () => false), '');
    });
  });
});
