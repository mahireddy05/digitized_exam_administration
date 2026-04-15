/**
 * Global Loader Script for Digitized Exam Administration
 * Shows a premium 'Luminous Aurora Orb' overlay during requests and navigation.
 */

window.Loader = {
    _isActive: false,
    _isPermanent: false,
    _showTimeout: null,
    _dismissTimeout: null,

    getLabelForUrl: function(url) {
        url = (url || "").toLowerCase();
        if (url.includes('upload') || url.includes('import')) return ["Uploading Data...", "Processing your file..."];
        if (url.includes('delete') || url.includes('remove')) return ["Deleting...", "Removing records permanently"];
        if (url.includes('update') || url.includes('edit') || url.includes('save')) return ["Updating...", "Applying changes"];
        if (url.includes('generate') || url.includes('create')) return ["Generating...", "Calculating results..."];
        if (url.includes('export') || url.includes('download')) return ["Exporting...", "Preparing your file"];
        if (url.includes('search') || url.includes('filter') || url.includes('query')) return ["Searching...", "Finding matches..."];
        if (url.includes('login') || url.includes('signin')) return ["Signing In...", "Authenticating your credentials"];
        return ["Processing...", "Handling your request"];
    },

    show: function(text = "Processing Request...", subtext = "Please wait a moment", isPermanent = false) {
        if (this._showTimeout) clearTimeout(this._showTimeout);
        if (this._dismissTimeout) clearTimeout(this._dismissTimeout);
        
        this._isPermanent = isPermanent;
        this._isActive = true;

        const textEl = document.querySelector('.loader-text');
        const subtextEl = document.querySelector('.loader-subtext');
        const dismissBtn = document.querySelector('.loader-dismiss');
        
        if (textEl) textEl.textContent = text;
        if (subtextEl) subtextEl.textContent = subtext;
        if (dismissBtn) dismissBtn.classList.remove('visible');

        this._showTimeout = setTimeout(() => {
            if (!this._isActive) return;

            const overlay = document.querySelector('.loader-overlay');
            const bar = document.querySelector('.top-progress');
            
            if (overlay) {
                overlay.style.display = 'flex';
                if (bar) {
                    bar.style.display = 'block';
                    bar.style.width = '0%';
                    setTimeout(() => { if (this._isActive) bar.style.width = '30%'; }, 100);
                    setTimeout(() => { if (this._isActive) bar.style.width = '60%'; }, 1500);
                    setTimeout(() => { if (this._isActive) bar.style.width = '85%'; }, 4000);
                }

                setTimeout(() => { if (this._isActive) overlay.style.opacity = '1'; }, 10);

                this._dismissTimeout = setTimeout(() => {
                    if (this._isActive && dismissBtn) {
                        dismissBtn.classList.add('visible');
                    }
                }, 3000);
            }
        }, 500);
    },
    
    hide: function() {
        if (this._showTimeout) clearTimeout(this._showTimeout);
        if (this._dismissTimeout) clearTimeout(this._dismissTimeout);
        this._showTimeout = null;
        this._dismissTimeout = null;
        
        this._isActive = false;
        this._isPermanent = false;

        const overlay = document.querySelector('.loader-overlay');
        const bar = document.querySelector('.top-progress');
        const dismissBtn = document.querySelector('.loader-dismiss');

        if (dismissBtn) dismissBtn.classList.remove('visible');

        if (overlay) {
            overlay.style.opacity = '0';
            if (bar) {
                bar.style.width = '100%';
                setTimeout(() => { if (!this._isActive) bar.style.display = 'none'; }, 500);
            }
            setTimeout(() => { if (!this._isActive) overlay.style.display = 'none'; }, 300);
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Handle file input changes (immediate upload detection for programmatic submit)
    document.addEventListener('change', function(e) {
        if (e.target.tagName === 'INPUT' && e.target.type === 'file') {
            const form = e.target.form;
            if (form && !form.classList.contains('no-loader')) {
                window.Loader._isActive = true;
                window.Loader._isPermanent = true;
                window.Loader.show("Uploading Data...", "Processing your file...", true);
            }
        }
    });

    // Intercept all form submissions
    document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.classList.contains('no-loader')) return;
        
        window.Loader._isActive = true;
        window.Loader._isPermanent = true;

        const action = form.getAttribute('action') || '';
        const isFileUpload = form.getAttribute('enctype') === 'multipart/form-data' || form.querySelector('input[type="file"]') !== null;
        
        let [text, subtext] = window.Loader.getLabelForUrl(action);
        
        if (isFileUpload) {
            text = "Uploading Data...";
            subtext = "Please wait while we process your file...";
        }
        
        window.Loader.show(text, subtext, true);
    });

    // Handle "Stop & Stay Here" Dismiss button
    const dismissBtn = document.querySelector('.loader-dismiss');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.Loader.hide();
        });
    }

    // Handle ESC key to dismiss loader
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && window.Loader._isActive) {
            window.Loader.hide();
        }
    });

    // Intercept jQuery AJAX
    if (typeof jQuery !== 'undefined') {
        $(document).ajaxSend(function(event, xhr, settings) {
            const url = settings ? settings.url : '';
            if (url.includes('student-id-autocomplete') || url.includes('student-autocomplete')) return;
            const [text, subtext] = window.Loader.getLabelForUrl(url);
            window.Loader.show(text, subtext, false);
        });
        $(document).ajaxComplete(function() {
            window.Loader.hide();
        });
    }

    // Intercept Fetch API
    const originalFetch = window.fetch;
    window.fetch = function() {
        const url = arguments[0];
        if (typeof url === 'string' && (url.includes('student-id-autocomplete') || url.includes('student-autocomplete'))) {
            return originalFetch.apply(this, arguments);
        }
        const [text, subtext] = window.Loader.getLabelForUrl(url);
        window.Loader.show(text, subtext, false);
        return originalFetch.apply(this, arguments).finally(() => {
            window.Loader.hide();
        });
    };

    // Show on page unload (navigation)
    window.addEventListener('beforeunload', function() {
        if (!window.Loader._isActive && !window.Loader._isPermanent) {
            window.Loader.show("Navigating...", "Preparing next page", false);
        }
    });

    // Handle back button
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            window.Loader.hide();
        }
    });
});
