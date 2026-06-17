/**
 * Maps merchant dashboard latest transactions resource payload
 * to a stable frontend shape used by the table component.
 */
export class MerchantDashboardLatestTransactionModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.id = raw.id ?? null;
        this.status = raw.status ?? null;
        this.amount = Number(raw.amount ?? 0);
        this.created_at = raw.created_at ?? null;

        // Normalize terminal identity from whichever field backend sends.
        const terminalId =
            raw.terminal_id ??
            raw.terminalId ??
            raw.terminal_uuid ??
            raw.terminal?.id ??
            null;

        const terminalName =
            raw.terminal_name ??
            raw.terminal?.name ??
            raw.terminal?.terminal_name ??
            null;

        const terminalSerial =
            raw.terminal_serial_number ??
            raw.serial_number ??
            raw.terminal?.serial_number ??
            null;

        this.terminal_id = terminalId;
        this.terminal_name = terminalName;
        this.terminal = {
            ...(raw.terminal || {}),
            id: terminalId,
            name: terminalName,
            serial_number: terminalSerial,
        };
    }

    static fromApiResponse(apiData) {
        return new MerchantDashboardLatestTransactionModel(apiData);
    }

    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            return [];
        }
        return apiDataArray.map((item) => new MerchantDashboardLatestTransactionModel(item));
    }
}

export default MerchantDashboardLatestTransactionModel;
