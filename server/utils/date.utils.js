// utils/date.utils.js
exports.getMonthDateRange = (year, month) => { // month est base 0 (0=Jan, 11=Dec)
  const startDate = new Date(year, month, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Jour 0 du mois suivant = dernier jour du mois actuel
  return { startDate, endDate };
};

exports.getPastMonthsDateRanges = (numberOfMonths) => {
  const ranges = [];
  const now = new Date();
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
    const { startDate, endDate } = exports.getMonthDateRange(date.getFullYear(), date.getMonth());
    ranges.push({
      label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      start: startDate,
      end: endDate,
    });
  }
  return ranges;
};