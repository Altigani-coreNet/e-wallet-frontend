import React, { useEffect, useMemo, useRef, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import useAuthStore from '../../stores/authStore';
import { AUTH_SERVICE_BASE } from '../../utils/constants';
import { apiClient, getToken } from '../../utils/api';

window.Pusher = Pusher;

const toNotificationItem = (payload, channelType = 'public') => {
    const nowIso = new Date().toISOString();
    const sentAt = payload?.sent_at || nowIso;
    const title = payload?.title || 'Notification';
    const body = payload?.message || payload?.body || '';
    const image = payload?.meta?.image || payload?.image || '';
    const topic = payload?.meta?.topic || payload?.topic || null;

    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        serverId: null,
        title,
        body,
        image,
        readAt: null,
        channelType,
        topic,
        createdAt: sentAt,
        raw: payload,
    };
};

const timeAgo = (value) => {
    const date = new Date(value);
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return `${Math.max(diffSeconds, 1)}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

/**
 * Pusher/Reverb only allow: [-a-zA-Z0-9_=@,.;] per channel name (pusher-php-server validate_channel).
 * Spaces, slashes, colons, etc. cause PusherException "Invalid channel name" on /broadcasting/auth.
 */
const sanitizePusherChannelSegment = (value) => {
    const s = String(value)
        .replace(/[^-a-zA-Z0-9_=@,.;]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    return s || null;
};

const normalizeGroups = (user) => {
    if (!user) return [];

    const groupNames = new Set();
    const candidates = [
        user.groups,
        user.user_groups,
        user.group_names,
        user.roles,
    ];

    candidates.forEach((source) => {
        if (!Array.isArray(source)) return;
        source.forEach((entry) => {
            if (typeof entry === 'string' && entry.trim()) {
                groupNames.add(entry.trim());
            }
            if (entry && typeof entry === 'object' && typeof entry.name === 'string' && entry.name.trim()) {
                groupNames.add(entry.name.trim());
            }
        });
    });

    return Array.from(groupNames);
};

const WS_LOG_PREFIX = '[WS][NotificationMenu]';

const logWs = (message, data = null) => {
    // Use warn so logs show even when DevTools "Default levels" hides Info/Verbose
    if (data !== null) {
        console.warn(`${WS_LOG_PREFIX} ${message}`, data);
    } else {
        console.warn(`${WS_LOG_PREFIX} ${message}`);
    }
};

const logWsError = (message, data = null) => {
    if (data !== null) {
        console.error(`${WS_LOG_PREFIX} ${message}`, data);
    } else {
        console.error(`${WS_LOG_PREFIX} ${message}`);
    }
};

/** Pusher is often created only after the first channel subscription — bind after subscribe + retry. */
const attachPusherConnectionLogs = (echo, wsConfig, isSecure, cleanupRef) => {
    let bound = false;
    const tryBind = (attempt) => {
        if (bound) return;
        const pusher = echo?.connector?.pusher;
        const connection = pusher?.connection;
        if (!connection) {
            if (attempt < 8) {
                setTimeout(() => tryBind(attempt + 1), 150 * (attempt + 1));
            } else {
                logWsError('Pusher connection not available after retries', {
                    connectorKeys: echo?.connector ? Object.keys(echo.connector) : [],
                    hint: 'Echo may use a different connector; try window.__notificationEcho in console.',
                });
            }
            return;
        }

        bound = true;

        const logConnected = () => {
            logWs('CONNECTED — WebSocket is up', {
                ...wsConfig,
                socketId: pusher?.socket_id ?? null,
                transports: isSecure ? ['wss'] : ['ws'],
            });
        };
        const logDisconnected = () => {
            logWsError('DISCONNECTED', wsConfig);
        };
        const logError = (err) => {
            logWsError('CONNECTION ERROR', {
                problem:
                    'Reverb running? VITE_REVERB_* matches .env? Port open? For private channels: /api/broadcasting/auth must return 200 with Bearer token.',
                detail: err,
                ...wsConfig,
            });
        };
        const logStateChange = (states) => {
            const { previous, current } = states || {};
            if (current === 'failed' || current === 'unavailable') {
                logWsError(`STATE ${previous} → ${current}`, {
                    hint:
                        current === 'unavailable'
                            ? 'Cannot reach ws host:port (firewall, wrong VITE_REVERB_HOST/PORT).'
                            : 'Handshake/auth failed — check Reverb + Laravel logs.',
                    ...wsConfig,
                });
            } else {
                logWs(`state ${previous} → ${current}`, wsConfig);
            }
        };

        connection.bind('connected', logConnected);
        connection.bind('disconnected', logDisconnected);
        connection.bind('error', logError);
        connection.bind('state_change', logStateChange);

        cleanupRef.current = () => {
            connection.unbind('connected', logConnected);
            connection.unbind('disconnected', logDisconnected);
            connection.unbind('error', logError);
            connection.unbind('state_change', logStateChange);
        };

        logWs('connection listeners attached', { state: connection.state, ...wsConfig });
    };

    tryBind(0);
};

const subscribePrivate = (echo, channelName, eventName, handler, onSubscribed, onSubError) => {
    const channel = echo.private(channelName);
    if (typeof channel.subscribed === 'function') {
        channel.subscribed(() => {
            logWs(`channel subscribed: private-${channelName}`);
            onSubscribed?.();
        });
    }
    if (typeof channel.error === 'function') {
        channel.error((status) => {
            logWsError(`channel subscription error: private-${channelName}`, {
                status,
                hint: status === 403 ? 'Broadcast auth failed — check auth:api token and routes/channels.php' : 'See Network tab for /broadcasting/auth',
            });
            onSubError?.(status);
        });
    }
    channel.listen(eventName, handler);
};

const NotificationMenu = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingFeed, setLoadingFeed] = useState(false);
    /** Dev/test: last payload from public channel `banners_updates` (full banner list snapshot). */
    const [bannersWsTest, setBannersWsTest] = useState({ count: null, receivedAt: null });
    const echoRef = useRef(null);
    const audioRef = useRef(null);
    const wsConnectionUnbindRef = useRef(null);

    useEffect(() => {
        logWs('component mounted — you should see this in the console on any page that renders the bell');
        return () => logWs('component unmounted');
    }, []);

    const mapApiNotification = (item = {}) => ({
        id: `api-${item.id}`,
        serverId: item.id,
        title: item.title || 'Notification',
        body: item.description || '',
        image: item.image || '',
        readAt: item.read_at || null,
        channelType: item.target_type || 'public',
        topic: item.topic || null,
        createdAt: item.sent_at || item.created_at || new Date().toISOString(),
        raw: item,
    });

    const unread = useMemo(
        () => notifications.filter((n) => !n.readAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        [notifications],
    );
    const alerts = useMemo(
        () => notifications.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        [notifications],
    );
    const updates = useMemo(
        () => alerts.filter((n) => n.topic === 'service_updates'),
        [alerts],
    );
    const logs = useMemo(
        () => alerts.filter((n) => n.topic === 'logs'),
        [alerts],
    );

    const fetchUnreadCount = async () => {
        try {
            const response = await apiClient.get(`${AUTH_SERVICE_BASE}/notifications/unread-count`);
            const count = Number(response?.data?.data ?? 0);
            setUnreadCount(Number.isNaN(count) ? 0 : count);
        } catch {
            setUnreadCount(0);
        }
    };

    const fetchNotificationFeed = async () => {
        setLoadingFeed(true);
        try {
            const response = await apiClient.get(`${AUTH_SERVICE_BASE}/notifications`, {
                params: { per_page: 6, page: 1 },
            });
            const rows = response?.data?.data?.data || [];
            setNotifications(rows.map(mapApiNotification));
        } catch {
            setNotifications([]);
        } finally {
            setLoadingFeed(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchNotificationFeed();
        fetchUnreadCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        if (!user) {
            logWs('Echo skipped: no user in store (not logged in or layout without session)');
            return undefined;
        }
        const token = getToken();
        if (!token) {
            logWsError('Echo skipped: no Bearer token — WebSocket + private channels need auth');
            return undefined;
        }

        const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || 'auth-service-key';
        const reverbHost = import.meta.env.VITE_REVERB_HOST || '127.0.0.1';
        const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8079);
        const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
        const isSecure = reverbScheme === 'https';

        const authServiceOrigin = import.meta.env.VITE_AUTH_SERVICE_URL?.replace(/^['"]|['"]$/g, '')?.replace(
            /\/$/,
            '',
        );
        const broadcastingAuthUrl = `${AUTH_SERVICE_BASE}/api/broadcasting/auth`;

        const wsConfig = {
            host: reverbHost,
            port: reverbPort,
            scheme: reverbScheme,
            authEndpoint: broadcastingAuthUrl,
        };

        logWs('starting Echo (Reverb)', { ...wsConfig, key: reverbKey, userId: user?.id });

        const echo = new Echo({
            broadcaster: 'reverb',
            key: reverbKey,
            cluster: '',
            wsHost: reverbHost,
            wsPort: reverbPort,
            wssPort: reverbPort,
            forceTLS: isSecure,
            // Self-hosted Reverb: do not phone home to pusher.com stats (can break or delay connect)
            enableStats: false,
            enabledTransports: isSecure ? ['ws', 'wss'] : ['ws'],
            authEndpoint: wsConfig.authEndpoint,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        });

        echoRef.current = echo;
        if (typeof window !== 'undefined') {
            window.__notificationEcho = echo;
        }

        const pushIncoming = (payload, channelType) => {
            setNotifications((prev) => [toNotificationItem(payload, channelType), ...prev].slice(0, 25));
            setUnreadCount((prev) => prev + 1);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
            }
        };

        subscribePrivate(
            echo,
            'public-notifications',
            '.notification.public',
            (event) => pushIncoming(event, 'public'),
        );

        const uid = user?.id != null ? sanitizePusherChannelSegment(user.id) : null;
        if (uid) {
            subscribePrivate(
                echo,
                `user-notifications.${uid}`,
                '.notification.user',
                (event) => pushIncoming(event, 'user'),
            );
        }

        const merchantId = user?.merchant_id || user?.merchant?.id;
        const safeMerchantId = merchantId != null ? sanitizePusherChannelSegment(merchantId) : null;
        if (safeMerchantId) {
            subscribePrivate(
                echo,
                `merchant-notifications.${safeMerchantId}`,
                '.notification.merchant',
                (event) => pushIncoming(event, 'merchant'),
            );
        }

        const groups = normalizeGroups(user);
        groups.forEach((groupName) => {
            const safeGroup = sanitizePusherChannelSegment(groupName);
            if (!safeGroup) return;
            subscribePrivate(
                echo,
                `group-notifications.${safeGroup}`,
                '.notification.group',
                (event) => pushIncoming(event, 'group'),
            );
        });

        // Public channel — no /broadcasting/auth (same snapshot shape as GET /advertisements data).
        const bannersChannel = echo.channel('banners_updates');
        bannersChannel.listen('.banners.updated', (payload) => {
            const list = Array.isArray(payload?.data) ? payload.data : [];
            logWs('banners_updates — banners.updated', { success: payload?.success, count: list.length, data: list });
            if (typeof window !== 'undefined') {
                window.__lastBannersWsPayload = payload;
            }
            setBannersWsTest({
                count: list.length,
                receivedAt: new Date().toISOString(),
            });
        });

        attachPusherConnectionLogs(echo, wsConfig, isSecure, wsConnectionUnbindRef);

        return () => {
            echo.leave('banners_updates');
            setBannersWsTest({ count: null, receivedAt: null });
            wsConnectionUnbindRef.current?.();
            wsConnectionUnbindRef.current = null;
            if (echoRef.current) {
                echoRef.current.disconnect();
                echoRef.current = null;
            }
            if (typeof window !== 'undefined') {
                delete window.__notificationEcho;
            }
        };
    }, [user?.id]);

    const markOneAsRead = async (notification) => {
        if (!notification || notification.readAt) return;

        const markAt = new Date().toISOString();
        setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, readAt: markAt } : item)));
        setUnreadCount((prev) => Math.max(prev - 1, 0));

        if (!notification.serverId) return;

        try {
            await apiClient.post(`${AUTH_SERVICE_BASE}/notifications/${notification.serverId}/mark-as-read`);
        } catch {
            // Keep optimistic UI to avoid flicker; next fetch will reconcile.
        }
    };

    const markAllAsRead = async (event) => {
        event.preventDefault();
        const targetItems = unread.filter((item) => item.serverId);
        const markAt = new Date().toISOString();
        setNotifications((prev) => prev.map((item) => (item.readAt ? item : { ...item, readAt: markAt })));
        setUnreadCount(0);

        await Promise.allSettled(
            targetItems.map((item) => apiClient.post(`${AUTH_SERVICE_BASE}/notifications/${item.serverId}/mark-as-read`)),
        );
    };

    const deleteAll = async (event) => {
        event.preventDefault();
        const targetItems = notifications.filter((item) => item.serverId);
        setNotifications([]);
        setUnreadCount(0);

        await Promise.allSettled(
            targetItems.map((item) => apiClient.delete(`${AUTH_SERVICE_BASE}/notifications/${item.serverId}`)),
        );
    };

    const getItemStyle = (channelType) => {
        if (channelType === 'group') {
            return {
                symbolClass: 'bg-light-warning',
                iconClass: 'ki-duotone ki-briefcase fs-2 text-warning',
            };
        }
        if (channelType === 'user') {
            return {
                symbolClass: 'bg-light-danger',
                iconClass: 'ki-duotone ki-information fs-2 text-danger',
            };
        }
        if (channelType === 'merchant') {
            return {
                symbolClass: 'bg-light-success',
                iconClass: 'ki-duotone ki-abstract-12 fs-2 text-success',
            };
        }
        return {
            symbolClass: 'bg-light-primary',
            iconClass: 'ki-duotone ki-abstract-28 fs-2 text-primary',
        };
    };

    const getRowBackground = (notification) => (notification.readAt ? '#ffffff' : '#f5f8fa');

    return (
        <div className="app-navbar-item ms-1 ms-md-4">
            <audio ref={audioRef} src="/mixkit-bell-notification-933.wav" preload="auto" />
            <div
                className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px show menu-dropdown position-relative"
                data-kt-menu-trigger="{default: 'click', lg: 'hover'}"
                data-kt-menu-attach="parent"
                data-kt-menu-placement="bottom-end"
                id="kt_menu_item_wow"
            >
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge badge-circle badge-danger">
                        {unreadCount}
                    </span>
                )}
                <i className="ki-duotone ki-notification-status fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                </i>
            </div>

            <div className="menu menu-sub menu-sub-dropdown menu-column w-350px w-lg-375px" data-kt-menu="true" id="kt_menu_notifications">
                <div
                    className="d-flex flex-column bgi-no-repeat rounded-top"
                    style={{ backgroundImage: "url('/assets/media/misc/menu-header-bg.jpg')" }}
                >
                    <h3 className="text-white fw-semibold px-9 mt-10 mb-2">
                        Notifications
                        <span className="fs-8 opacity-75 ps-3">{notifications.length} reports</span>
                    </h3>
                    <div className="fs-8 text-white opacity-90 px-9 mb-6 lh-sm">
                        <span className="opacity-75">Banners (WS test)</span>
                        {bannersWsTest.receivedAt != null ? (
                            <>
                                {' '}
                                · {bannersWsTest.count} items ·{' '}
                                {new Date(bannersWsTest.receivedAt).toLocaleTimeString()}
                            </>
                        ) : (
                            <span className="opacity-75"> · waiting for banners_updates…</span>
                        )}
                    </div>
                    <ul className="nav nav-line-tabs nav-line-tabs-2x nav-stretch fw-semibold px-9" role="tablist">
                        <li className="nav-item" role="presentation">
                            <a
                                className="nav-link text-white opacity-75 opacity-state-100 pb-4 active"
                                data-bs-toggle="tab"
                                href="#kt_topbar_notifications_1"
                                role="tab"
                                aria-selected="true"
                            >
                                Alerts
                            </a>
                        </li>
                        <li className="nav-item" role="presentation">
                            <a
                                className="nav-link text-white opacity-75 opacity-state-100 pb-4"
                                data-bs-toggle="tab"
                                href="#kt_topbar_notifications_2"
                                role="tab"
                                aria-selected="false"
                            >
                                Updates
                            </a>
                        </li>
                        <li className="nav-item" role="presentation">
                            <a
                                className="nav-link text-white opacity-75 opacity-state-100 pb-4"
                                data-bs-toggle="tab"
                                href="#kt_topbar_notifications_3"
                                role="tab"
                                aria-selected="false"
                            >
                                Logs
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="tab-content">
                    <div className="tab-pane fade active show" id="kt_topbar_notifications_1" role="tabpanel">
                        <div className="scroll-y mh-325px my-5 px-8">
                            {!loadingFeed && alerts.length === 0 && (
                                <div className="d-flex flex-column align-items-center justify-content-center text-center py-10">
                                    <i className="bi bi-bell-slash fs-2x text-gray-400 mb-3"></i>
                                    <div className="fs-6 fw-bold text-gray-700 mb-1">No new notifications</div>
                                    <div className="fs-7 text-gray-500">It is empty right now.</div>
                                </div>
                            )}
                            {loadingFeed && (
                                <div className="d-flex flex-column align-items-center justify-content-center text-center py-10">
                                    <span className="spinner-border text-primary mb-3"></span>
                                    <div className="fs-7 text-gray-500">Loading notifications...</div>
                                </div>
                            )}
                            {alerts.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="d-flex flex-stack py-4 px-3 rounded mb-2"
                                    onClick={() => markOneAsRead(notification)}
                                    style={{ cursor: 'pointer', backgroundColor: getRowBackground(notification) }}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="symbol symbol-35px me-4">
                                            {notification.image ? (
                                                <img src={notification.image} alt="notification" />
                                            ) : (
                                                <span className={`symbol-label ${getItemStyle(notification.channelType).symbolClass}`}>
                                                    <i className={getItemStyle(notification.channelType).iconClass}>
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                </span>
                                            )}
                                        </div>
                                        <div className="mb-0 me-2">
                                            <a href="#" className="fs-6 text-gray-800 text-hover-primary fw-bold">
                                                {notification.title}
                                            </a>
                                            <div className="text-gray-500 fs-7">
                                                {notification.body.length > 38
                                                    ? `${notification.body.slice(0, 38)}...`
                                                    : notification.body}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="badge badge-light fs-8">{timeAgo(notification.createdAt)}</span>
                                </div>
                            ))}
                        </div>

                        {alerts.length > 0 && (
                            <div className="py-3 text-center border-top">
                                <a href="#" className="btn btn-color-gray-600 btn-active-color-primary me-3" onClick={markAllAsRead}>
                                    Mark all as read
                                </a>
                                <a href="#" className="btn btn-color-gray-600 btn-active-color-primary" onClick={deleteAll}>
                                    Delete all
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="tab-pane fade" id="kt_topbar_notifications_2" role="tabpanel">
                        <div className="d-flex flex-column px-9">
                            {updates.length === 0 && (
                                <div className="d-flex flex-column align-items-center justify-content-center text-center py-10">
                                    <i className="bi bi-inbox fs-2x text-gray-400 mb-3"></i>
                                    <div className="fs-6 fw-bold text-gray-700 mb-1">No updates</div>
                                    <div className="fs-7 text-gray-500">Service update notifications will appear here.</div>
                                </div>
                            )}
                            {updates.slice(0, 12).map((notification) => (
                                <div
                                    key={notification.id}
                                    className="d-flex flex-stack py-4 px-3 rounded mb-2"
                                    onClick={() => markOneAsRead(notification)}
                                    style={{ cursor: 'pointer', backgroundColor: getRowBackground(notification) }}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="symbol symbol-35px me-4">
                                            {notification.image ? (
                                                <img src={notification.image} alt="notification" />
                                            ) : (
                                                <span className={`symbol-label ${getItemStyle(notification.channelType).symbolClass}`}>
                                                    <i className={getItemStyle(notification.channelType).iconClass}>
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                </span>
                                            )}
                                        </div>
                                        <div className="mb-0 me-2">
                                            <a href="#" className="fs-6 text-gray-800 text-hover-primary fw-bold">
                                                {notification.title}
                                            </a>
                                            <div className="text-gray-500 fs-7">
                                                {notification.body.length > 38
                                                    ? `${notification.body.slice(0, 38)}...`
                                                    : notification.body}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="badge badge-light fs-8">{timeAgo(notification.createdAt)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="tab-pane fade" id="kt_topbar_notifications_3" role="tabpanel">
                        <div className="scroll-y mh-325px my-5 px-8">
                            {logs.length === 0 && (
                                <div className="d-flex flex-column align-items-center justify-content-center text-center py-10">
                                    <i className="ki-duotone ki-document fs-2x text-gray-400 mb-3"></i>
                                    <div className="fs-6 fw-bold text-gray-700 mb-1">No logs yet</div>
                                    <div className="fs-7 text-gray-500">Realtime logs will appear here.</div>
                                </div>
                            )}
                            {logs.slice(0, 12).map((notification) => {
                                const code = notification.channelType === 'user' ? '500 ERR' : notification.channelType === 'group' ? '300 WRN' : '200 OK';
                                const codeClass = notification.channelType === 'user'
                                    ? 'badge-light-danger'
                                    : notification.channelType === 'group'
                                        ? 'badge-light-warning'
                                        : 'badge-light-success';
                                return (
                                    <div
                                        key={`log-${notification.id}`}
                                        className="d-flex flex-stack py-4 px-3 rounded mb-2"
                                        onClick={() => markOneAsRead(notification)}
                                        style={{ cursor: 'pointer', backgroundColor: getRowBackground(notification) }}
                                    >
                                        <div className="d-flex align-items-center me-2">
                                            <span className={`w-70px badge ${codeClass} me-4`}>{code}</span>
                                            <a href="#" className="text-gray-800 text-hover-primary fw-semibold">{notification.title}</a>
                                        </div>
                                        <span className="badge badge-light fs-8">{timeAgo(notification.createdAt)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationMenu;
