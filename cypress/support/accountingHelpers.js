/**
 * Helpers for admin accounting report E2E specs (P&L, balance sheet UI).
 */

export function roundMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}

export function unwrapAdminReportPayload(response) {
    return response.body?.data ?? response.body ?? {};
}

/**
 * @param {object} profitLossPayload - API data from GET profit-loss
 */
export function buildProfitLossSnapshot(profitLossPayload, label = 'snapshot') {
    const data = profitLossPayload?.data ?? profitLossPayload ?? {};
    const sections = data.sections ?? {};

    return {
        label,
        filter: data.filter ?? {},
        incomeTotal: roundMoney(sections.income?.total),
        cogsTotal: roundMoney(sections.costs_of_goods_sold?.total),
        expensesTotal: roundMoney(sections.expenses?.total),
        grossProfit: roundMoney(data.gross_profit),
        netProfit: roundMoney(data.net_profit),
        sections,
    };
}

export function assertProfitLossDelta(before, after, { netProfit = 0, grossProfit, incomeTotal }, context = '') {
    const label = context ? `[${context}] ` : '';
    const tolerance = 0.01;

    if (netProfit !== undefined) {
        expect(
            after.netProfit - before.netProfit,
            `${label}net profit delta`
        ).to.be.closeTo(netProfit, tolerance);
    }

    if (grossProfit !== undefined) {
        expect(
            after.grossProfit - before.grossProfit,
            `${label}gross profit delta`
        ).to.be.closeTo(grossProfit, tolerance);
    }

    if (incomeTotal !== undefined) {
        expect(
            after.incomeTotal - before.incomeTotal,
            `${label}income total delta`
        ).to.be.closeTo(incomeTotal, tolerance);
    }
}
