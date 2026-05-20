/**
 * Maps MerchantBatchResource / MerchantBatchDetailResource API payloads to a stable frontend shape.
 */

import { getBatchStatusColor } from '../utils/batchHelpers';

const STATUS_BADGE_BY_STATUS = {
    settled: 'badge-light-success',
    pending: 'badge-light-warning',
    failed: 'badge-light-danger',
};

/**
 * Single transaction row inside MerchantBatchDetailResource.
 */
export class BatchTransactionModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.id = raw.id ?? null;
        this.transaction_id = raw.transaction_id ?? null;
        this.amount = Number(raw.amount ?? 0);
        this.status = raw.status ?? null;
        this.currency_symbol = raw.currency_symbol ?? null;
        this.terminal_id = raw.terminal_id ?? null;
        this.created_at = raw.created_at ?? null;
        this.terminal =
            typeof raw.terminal === 'object' && raw.terminal !== null ? raw.terminal : null;
    }

    static fromApiResponse(apiData) {
        return new BatchTransactionModel(apiData);
    }

    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            return [];
        }
        return apiDataArray.map((item) => new BatchTransactionModel(item));
    }

    static ensure(data) {
        if (data instanceof BatchTransactionModel) return data;
        return new BatchTransactionModel(data);
    }

    getTerminalLabel(fallback = 'N/A') {
        return (
            this.terminal?.terminal_id ||
            this.terminal?.name ||
            this.terminal_id ||
            fallback
        );
    }

    toRecord() {
        return {
            id: this.id,
            transaction_id: this.transaction_id,
            amount: this.amount,
            status: this.status,
            currency_symbol: this.currency_symbol,
            terminal_id: this.terminal_id,
            created_at: this.created_at,
        };
    }
}

/**
 * Batch list row or detail payload from SoftPos merchant batches API.
 */
export class BatchModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.id = raw.id ?? null;
        this.batch_number = raw.batch_number ?? 'N/A';
        this.merchant_id = raw.merchant_id ?? null;
        this.status = (raw.status ?? 'pending').toString().toLowerCase();
        this.status_badge_class =
            raw.status_badge_class ?? STATUS_BADGE_BY_STATUS[this.status] ?? 'badge-light-secondary';
        this.currency_symbol = raw.currency_symbol ?? '$';
        this.total_amount = Number(raw.total_amount ?? 0);
        this.transaction_count = Number(raw.transaction_count ?? 0);
        this.created_at = raw.created_at ?? null;
        this.created_at_raw = raw.created_at_raw ?? null;
        this.updated_at = raw.updated_at ?? null;
        this.settled_at = raw.settled_at ?? null;

        this.merchant =
            typeof raw.merchant === 'object' && raw.merchant !== null ? raw.merchant : null;
        this.merchant_name =
            raw.merchant_name ||
            this.merchant?.business_name ||
            this.merchant?.name ||
            null;

        this.transactions = BatchTransactionModel.fromApiResponseArray(raw.transactions);
    }

    static fromApiResponse(apiData) {
        return new BatchModel(apiData);
    }

    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            console.warn('BatchModel.fromApiResponseArray: expected array, got', typeof apiDataArray);
            return [];
        }
        return apiDataArray.map((item) => new BatchModel(item));
    }

    static ensure(data) {
        if (data instanceof BatchModel) return data;
        return new BatchModel(data);
    }

    static displayNumber(batchLike) {
        return BatchModel.ensure(batchLike).getDisplayNumber();
    }

    getDisplayNumber() {
        return this.batch_number && this.batch_number !== 'N/A'
            ? this.batch_number
            : String(this.id ?? '');
    }

    getStatusColor() {
        return getBatchStatusColor(this.status);
    }

    isSettled() {
        return this.status === 'settled';
    }

    isPending() {
        return this.status === 'pending';
    }

    isFailed() {
        return this.status === 'failed';
    }

    /** Plain object for stores/helpers that expect a plain record (e.g. formatRecordCurrency). */
    toRecord() {
        return {
            id: this.id,
            batch_number: this.batch_number,
            status: this.status,
            currency_symbol: this.currency_symbol,
            total_amount: this.total_amount,
            transaction_count: this.transaction_count,
            created_at: this.created_at,
            created_at_raw: this.created_at_raw,
            merchant_id: this.merchant_id,
            settled_at: this.settled_at,
        };
    }
}

/**
 * Statistics payload from GET /merchant/batches/statistics
 */
export class BatchStatisticsModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.total = Number(raw.total ?? 0);
        this.settled = Number(raw.settled ?? 0);
        this.pending = Number(raw.pending ?? 0);
        this.failed = Number(raw.failed ?? 0);
    }

    static fromApiResponse(apiData) {
        return new BatchStatisticsModel(apiData);
    }
}

export default BatchModel;
