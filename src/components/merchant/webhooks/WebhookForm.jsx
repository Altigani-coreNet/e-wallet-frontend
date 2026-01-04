import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    getWebhookEvents, 
    createWebhook, 
    updateWebhook, 
    getWebhook 
} from '../../../services/webhooksService';
import Swal from 'sweetalert2';

const WebhookForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('selected'); // 'selected' or 'all'
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        endpoint_url: '',
        event_ids: [],
        is_active: true,
    });

    const [availableEvents, setAvailableEvents] = useState([]);
    const [selectedEventDetails, setSelectedEventDetails] = useState([]);

    useEffect(() => {
        fetchEvents();
        if (isEditMode) {
            fetchWebhook();
        }
    }, [id]);

    const fetchEvents = async () => {
        try {
            setEventsLoading(true);
            const response = await getWebhookEvents();
            console.log('Webhook Events Response:', response);
            
            // Handle response structure: { status: true, data: { categories: [...] } }
            if (response.status && response.data && response.data.categories) {
                setAvailableEvents(response.data.categories);
                console.log('Available events set:', response.data.categories);
            } else if (response.success && response.data && response.data.categories) {
                // Fallback for different response structure
                setAvailableEvents(response.data.categories);
            } else {
                console.error('Unexpected response structure:', response);
                Swal.fire('Warning', 'Unexpected response format from server', 'warning');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            Swal.fire('Error', 'Failed to load available events', 'error');
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchWebhook = async () => {
        try {
            setLoading(true);
            const response = await getWebhook(id);
            if (response.success) {
                const webhook = response.data.webhook;
                setFormData({
                    name: webhook.name,
                    description: webhook.description || '',
                    endpoint_url: webhook.endpoint_url,
                    event_ids: webhook.events.map(e => e.id),
                    is_active: webhook.is_active,
                });
                setSelectedEventDetails(webhook.events);
            }
        } catch (error) {
            console.error('Error fetching webhook:', error);
            Swal.fire('Error', 'Failed to load webhook', 'error');
            navigate('/merchant/webhooks');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const toggleEventSelection = (eventId, eventDetails) => {
        setFormData(prevState => {
            const isSelected = prevState.event_ids.includes(eventId);
            return {
                ...prevState,
                event_ids: isSelected
                    ? prevState.event_ids.filter(id => id !== eventId)
                    : [...prevState.event_ids, eventId],
            };
        });

        // Update selected event details for the "Selected events" tab
        setSelectedEventDetails(prevDetails => {
            const isSelected = prevDetails.some(e => e.id === eventId);
            return isSelected
                ? prevDetails.filter(e => e.id !== eventId)
                : [...prevDetails, eventDetails];
        });
    };

    const selectAllEvents = () => {
        const allEventIds = availableEvents.flatMap(category =>
            category.events.map(event => event.id)
        );
        setFormData({ ...formData, event_ids: allEventIds });
        
        const allEventDetails = availableEvents.flatMap(category => category.events);
        setSelectedEventDetails(allEventDetails);
    };

    const deselectAllEvents = () => {
        setFormData({ ...formData, event_ids: [] });
        setSelectedEventDetails([]);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.event_ids.length === 0) {
            Swal.fire('Error', 'Please select at least one event', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = isEditMode
                ? await updateWebhook(id, formData)
                : await createWebhook(formData);

            console.log('Webhook response:', response);

            // Check for both success and status fields
            if (response.success || response.status) {
                const message = response.data?.message || response.message || 'Webhook saved successfully';
                Swal.fire('Success', message, 'success');
                navigate('/merchant/webhooks');
            } else {
                throw new Error('Failed to save webhook');
            }
        } catch (error) {
            console.error('Error saving webhook:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save webhook';
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = (events) => {
        if (!searchQuery) return events;
        return events.filter(event =>
            event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const getAllEvents = () => {
        return availableEvents.flatMap(category => 
            category.events.map(event => ({
                ...event,
                category: category.category,
                version: category.version
            }))
        );
    };

    const getFilteredEvents = () => {
        const allEvents = getAllEvents();
        if (!searchQuery) return allEvents;
        
        return allEvents.filter(event =>
            event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const renderEventsList = () => {
        const filteredEvents = getFilteredEvents();
        
        return (
            <div className="events-selector-container p-3">
                {/* Search Bar */}
                <div className="filter-top-bar mb-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="input-group" style={{ maxWidth: '500px' }}>
                            <span className="input-group-text">
                                <i className="fas fa-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search events by name or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <small className="text-muted">{formData.event_ids.length} selected</small>
                    </div>
                </div>

                {/* Results Count */}
                <div className="results-count mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                        Showing {filteredEvents.length} of {getAllEvents().length} events
                    </small>
                </div>

                {/* Events List */}
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className="fas fa-search fs-2x mb-2"></i>
                        <p>No events found matching your criteria</p>
                    </div>
                ) : (
                    <div className="events-grid">
                        {/* Event Items */}
                        {filteredEvents.map(event => (
                            <div 
                                key={event.id} 
                                className={`event-item p-3 border rounded mb-2 ${
                                    formData.event_ids.includes(event.id) 
                                        ? 'border-primary bg-primary bg-opacity-10' 
                                        : 'border-light'
                                }`}
                            >
                                <div className="d-flex align-items-start">
                                    <div className="form-check me-3 mt-1">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`event-${event.id}`}
                                            checked={formData.event_ids.includes(event.id)}
                                            onChange={() => toggleEventSelection(event.id, event)}
                                        />
                                    </div>
                                    <label className="flex-grow-1" htmlFor={`event-${event.id}`} style={{ cursor: 'pointer' }}>
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <code className="fw-semibold">{event.name}</code>
                                            <span className="badge badge-light">{event.category}</span>
                                            <span className="badge badge-secondary">{event.version}</span>
                                        </div>
                                        <div className="text-muted small">
                                            {event.description}
                                        </div>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderSelectedEvents = () => {
        if (selectedEventDetails.length === 0) {
            return (
                <div className="text-center py-5">
                    <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No events selected</h5>
                    <p className="text-muted small">Switch to "All events" tab to select events</p>
                </div>
            );
        }

        // Group selected events by category
        const groupedEvents = selectedEventDetails.reduce((acc, event) => {
            const category = availableEvents.find(cat =>
                cat.events.some(e => e.id === event.id)
            )?.category || 'Other';

            if (!acc[category]) acc[category] = [];
            acc[category].push(event);
            return acc;
        }, {});

        return (
            <div className="selected-events-container">
                {Object.entries(groupedEvents).map(([category, events]) => (
                    <div key={category} className="category-card mb-3">
                        <div className="category-header" style={{ cursor: 'default' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <h6 className="mb-0 fw-bold text-dark">{category}</h6>
                                </div>
                                <span className="badge badge-primary">{events.length} events</span>
                            </div>
                        </div>
                        <div className="category-body">
                            <div className="d-flex flex-wrap gap-2">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="event-badge badge active"
                                        onClick={() => toggleEventSelection(event.id, event)}
                                        title={`Click to remove: ${event.description}`}
                                    >
                                        <div className="d-flex align-items-center gap-1">
                                            <code style={{ background: 'transparent', color: 'white', fontSize: '0.85rem' }}>
                                                {event.name}
                                            </code>
                                            <i className="fas fa-times ms-1" style={{ fontSize: '0.7rem' }}></i>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                <div className="alert alert-info mt-3">
                    <i className="fas fa-info-circle me-2"></i>
                    <small>Click on any event to remove it from selection</small>
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid">
            <div className="row mb-4">
                <div className="col-12">
                    <h2>{isEditMode ? 'Edit Webhook' : 'Create Webhook'}</h2>
                    <p className="text-muted">
                        Configure a webhook endpoint to receive real-time event notifications
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-8">
                        <div className="card mb-4">
                            <div className="card-body">
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">Destination name *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Payments Web Hooks"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description (optional)</label>
                                    <textarea
                                        className="form-control"
                                        id="description"
                                        name="description"
                                        rows="3"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Check The Meta Data For Payment And Update That In Our System"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="endpoint_url" className="form-label">Endpoint URL *</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        id="endpoint_url"
                                        name="endpoint_url"
                                        value={formData.endpoint_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/webhook"
                                        required
                                    />
                                </div>

                                <div className="form-check mb-3">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="is_active"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                    />
                                    <label className="form-check-label" htmlFor="is_active">
                                        Active
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Events Section */}
                        <div className="card">
                            {/* Card Header */}
                            <div className="card-header bg-white border-bottom">
                                <h5 className="mb-0 fw-bold text-dark">
                                    <i className="fas fa-bell me-2 text-primary"></i>
                                    Events to send
                                </h5>
                            </div>

                            {/* Toolbar */}
                            <div className="card-toolbar p-3 bg-light border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="badge badge-primary px-3 py-2" style={{ fontSize: '0.9rem' }}>
                                            <i className="fas fa-check-circle me-1"></i>
                                            {formData.event_ids.length} selected
                                        </span>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={selectAllEvents}
                                            >
                                                <i className="fas fa-check-double me-1"></i>
                                                Select all
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={deselectAllEvents}
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">
                                        <i className="fas fa-info-circle me-1"></i>
                                        Click on events to select/deselect them
                                    </p>
                                </div>
                            </div>

                            <div className="card-body p-0">
                                {/* Tabs */}
                                <div className="d-flex border-bottom bg-white">
                                    <button
                                        type="button"
                                        className={`btn btn-link text-decoration-none px-4 py-3 fw-semibold ${
                                            activeTab === 'selected' 
                                                ? 'border-bottom border-primary border-3 text-primary' 
                                                : 'text-muted'
                                        }`}
                                        onClick={() => setActiveTab('selected')}
                                    >
                                        <i className="fas fa-check-circle me-2"></i>
                                        Selected events
                                        <span className={`badge ms-2 ${
                                            activeTab === 'selected' ? 'badge-primary' : 'badge-secondary'
                                        }`}>
                                            {formData.event_ids.length}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn btn-link text-decoration-none px-4 py-3 fw-semibold ${
                                            activeTab === 'all' 
                                                ? 'border-bottom border-primary border-3 text-primary' 
                                                : 'text-muted'
                                        }`}
                                        onClick={() => setActiveTab('all')}
                                    >
                                        <i className="fas fa-list me-2"></i>
                                        All events
                                    </button>
                                </div>

                                {/* Events List */}
                                {eventsLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-3">Loading events...</p>
                                    </div>
                                ) : (
                                    <div className="p-3" style={{ maxHeight: '800px', overflowY: 'auto' }}>
                                        {activeTab === 'all'
                                            ? renderEventsList()
                                            : renderSelectedEvents()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>{isEditMode ? 'Update webhook' : 'Create webhook'}</>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/merchant/webhooks')}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default WebhookForm;

