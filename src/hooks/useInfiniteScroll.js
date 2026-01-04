import { useEffect, useCallback } from 'react';

/**
 * Generic infinite scroll hook.
 * `enabled` allows attaching the listener only after the first page is loaded
 * (or any other custom condition).
 */
const useInfiniteScroll = (
    callback,
    hasMore,
    loading,
    containerRef = null,
    enabled = true
) => {
    const handleScroll = useCallback(() => {
        if (!enabled || loading || !hasMore) return;

        const scrollContainer = containerRef?.current || window;
        
        let scrollTop, scrollHeight, clientHeight;

        if (scrollContainer === window || !scrollContainer) {
            // Window scroll
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
        } else {
            // Element scroll
            scrollTop = scrollContainer.scrollTop;
            scrollHeight = scrollContainer.scrollHeight;
            clientHeight = scrollContainer.clientHeight;
        }

        // Trigger when user is near the bottom (within 200px)
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            callback();
        }
    }, [callback, hasMore, loading, containerRef, enabled]);

    useEffect(() => {
        if (!enabled) return;

        const scrollContainer = containerRef?.current || window;
        
        if (!scrollContainer) return;
        
        if (scrollContainer === window) {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        } else {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll, containerRef, enabled]);
};

export default useInfiniteScroll;


