import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <i className="ki-duotone ki-warning-2 fs-2hx text-warning mb-4">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <h3 className="text-warning">Something went wrong</h3>
                        <p className="text-muted">Please try refreshing the page.</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

