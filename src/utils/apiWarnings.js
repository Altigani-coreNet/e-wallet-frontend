import { toast } from 'react-toastify';

const shownWarningToastIds = new Set();

const getApiWarningMessage = (response) => {
    const data = response?.data;
    if (!data || typeof data !== 'object') {
        return null;
    }

    // Plain responses: { success: true, warning: '...' }
    if (typeof data.warning === 'string' && data.warning.trim() !== '') {
        return data.warning.trim();
    }

    // ApiResponse trait responses: { status: true, data: { ..., warning: '...' } }
    if (
        data.data &&
        typeof data.data === 'object' &&
        typeof data.data.warning === 'string' &&
        data.data.warning.trim() !== ''
    ) {
        return data.data.warning.trim();
    }

    return null;
};

export const showApiWarningToast = (response) => {
    const warningMessage = getApiWarningMessage(response);
    if (!warningMessage) {
        return;
    }

    const toastId = `api-warning:${warningMessage}`;
    if (shownWarningToastIds.has(toastId)) {
        return;
    }

    shownWarningToastIds.add(toastId);
    toast.warning(warningMessage, {
        toastId,
        onClose: () => {
            shownWarningToastIds.delete(toastId);
        },
    });
};
