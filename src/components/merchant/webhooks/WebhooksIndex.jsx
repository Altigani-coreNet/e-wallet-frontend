import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getWebhooks, deleteWebhook, toggleWebhook } from '../../../services/webhooksService';
import Swal from 'sweetalert2';

const WebhooksIndex = () => {
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            setLoading(true);
            const response = await getWebhooks();
            console.log('Webhooks response:', response);
            
            // Handle both response.status and response.success
            if (response.status || response.success) {
                setWebhooks(response.data?.webhooks || []);
            }
        } catch (error) {
            console.error('Error fetching webhooks:', error);
            Swal.fire('Error', 'Failed to load webhooks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            const response = await toggleWebhook(id);
            if (response.status || response.success) {
                const message = response.data?.message || response.message || 'Webhook status updated';
                Swal.fire('Success', message, 'success');
                fetchWebhooks();
            }
        } catch (error) {
            console.error('Error toggling webhook:', error);
            Swal.fire('Error', 'Failed to toggle webhook status', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the webhook endpoint and all its logs.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await deleteWebhook(id);
                if (response.status || response.success) {
                    const message = response.data?.message || response.message || 'Webhook deleted';
                    Swal.fire('Deleted!', message, 'success');
                    fetchWebhooks();
                }
            } catch (error) {
                console.error('Error deleting webhook:', error);
                Swal.fire('Error', 'Failed to delete webhook', 'error');
            }
        }
    };

    const getStatusBadge = (is_active) => {
        return is_active ? (
            <span className="badge badge-success">Active</span>
        ) : (
            <span className="badge badge-secondary">Inactive</span>
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Page Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">Webhooks</h2>
                            <p className="text-muted">
                                Manage webhook endpoints to receive real-time notifications about events in your account
                            </p>
                        </div>
                        <Link to="/merchant/webhooks/create" className="btn btn-primary">
                            <i className="fas fa-plus me-2"></i>
                            Add Endpoint
                        </Link>
                    </div>
                </div>
            </div>

            {/* Webhooks List */}
            {webhooks.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <i className="fas fa-webhook fa-3x text-muted mb-3"></i>
                        <h4>No webhooks configured</h4>
                        <p className="text-muted mb-4">
                            Create your first webhook endpoint to start receiving real-time event notifications
                        </p>
                        <Link to="/merchant/webhooks/create" className="btn btn-primary">
                            <i className="fas fa-plus me-2"></i>
                            Add Endpoint
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="col-12 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center mb-2">
                                                <h5 className="mb-0 me-3">{webhook.name}</h5>
                                                {getStatusBadge(webhook.is_active)}
                                            </div>
                                            <p className="text-muted mb-2">{webhook.description || 'No description provided'}</p>
                                            <div className="mb-3">
                                                <small className="text-muted">Endpoint URL:</small>
                                                <div className="d-flex align-items-center">
                                                    <code className="bg-light px-2 py-1 rounded">{webhook.endpoint_url}</code>
                                                    <button
                                                        className="btn btn-sm btn-link"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(webhook.endpoint_url);
                                                            Swal.fire({
                                                                icon: 'success',
                                                                title: 'Copied!',
                                                                text: 'Endpoint URL copied to clipboard',
                                                                timer: 1500,
                                                                showConfirmButton: false
                                                            });
                                                        }}
                                                    >
                                                        <i className="fas fa-copy"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-3">
                                                <div>
                                                    <small className="text-muted">Subscribed Events:</small>
                                                    <br />
                                                    <span className="badge badge-info">{webhook.events_count} events</span>
                                                </div>
                                                <div>
                                                    <small className="text-muted">Success:</small>
                                                    <br />
                                                    <span className="text-success fw-bold">{webhook.success_count}</span>
                                                </div>
                                                <div>
                                                    <small className="text-muted">Failed:</small>
                                                    <br />
                                                    <span className="text-danger fw-bold">{webhook.failure_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <Link
                                                to={`/merchant/webhooks/${webhook.id}`}
                                                className="btn btn-sm btn-info"
                                                title="View Details"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </Link>
                                            <Link
                                                to={`/merchant/webhooks/${webhook.id}/edit`}
                                                className="btn btn-sm btn-primary"
                                                title="Edit"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </Link>
                                            <button
                                                onClick={() => handleToggle(webhook.id)}
                                                className={`btn btn-sm ${webhook.is_active ? 'btn-warning' : 'btn-success'}`}
                                                title={webhook.is_active ? 'Disable' : 'Enable'}
                                            >
                                                <i className={`fas fa-${webhook.is_active ? 'pause' : 'play'}`}></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(webhook.id)}
                                                className="btn btn-sm btn-danger"
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WebhooksIndex;

