export const fmtMoney = (value) => {
    const num = Number(value ?? 0);
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(num));
};
