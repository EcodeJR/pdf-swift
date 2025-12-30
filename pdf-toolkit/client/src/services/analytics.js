import ReactGA from 'react-ga4';

const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics 4
 */
export const initGA = () => {
    if (MEASUREMENT_ID) {
        ReactGA.initialize(MEASUREMENT_ID);
        console.log('GA4 Initialized with ID:', MEASUREMENT_ID);
    } else {
        console.warn('GA4 Measurement ID not found in environment variables.');
    }
};

/**
 * Log a page view
 * @param {string} path - The path to track
 */
export const logPageView = (path) => {
    if (MEASUREMENT_ID) {
        ReactGA.send({ hitType: "pageview", page: path });
    }
};

/**
 * Log a custom event
 * @param {string} category - Event category (e.g., 'Tool Usage')
 * @param {string} action - Event action (e.g., 'Convert PDF')
 * @param {string} label - Event label (optional)
 * @param {number} value - Event value (optional)
 */
export const logEvent = (category, action, label, value) => {
    if (MEASUREMENT_ID) {
        ReactGA.event({
            category,
            action,
            label,
            value
        });
    }
};

export default {
    initGA,
    logPageView,
    logEvent
};
