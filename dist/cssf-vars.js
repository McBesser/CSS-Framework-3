class CSSFVars {
    constructor() {
        this.foundVars = new Set();
        this.styleElement = null;
        this.debounceTimeout = null;
        this.isInitialized = false;
        this.debug = false; // Debug-Modus standardmäßig deaktiviert
        this.corsBlockedSheets = [];
    }

    /**
     * Debug-Modus aktivieren/deaktivieren
     * Verwendung: window.cssfVars.setDebug(true)
     */
    setDebug(enabled) {
        this.debug = enabled;
        this.log(`Debug-Modus ${enabled ? 'aktiviert' : 'deaktiviert'}`);
        if (enabled) {
            console.log('CSSF-Vars Debug-Modus:');
            console.log('  - setDebug(false) - Debug deaktivieren');
            console.log('  - scanAllCSS() - Manuellen Scan starten');
            console.log('  - foundVars - Zeigt gefundene Variablen');
            console.log('  - corsBlockedSheets - Zeigt CORS-blockierte Stylesheets');
        }
    }

    log(...args) {
        if (this.debug) {
            console.log('CSSF-Vars [DEBUG]:', ...args);
        }
    }

    warn(...args) {
        console.warn('CSSF-Vars:', ...args);
    }

    error(...args) {
        console.error('CSSF-Vars:', ...args);
    }

    async init() {
        if (this.isInitialized) return;
        try {
            this.log('Initialisierung gestartet');
            this.log('📦 CSSF-Vars geladen');
            this.log('   Debug-Modus: window.cssfVars.setDebug(true)');
            this.log('   Manueller Scan: window.cssfVars.scanAllCSS()');
            this.log('   Gefundene Vars: window.cssfVars.foundVars');
            
            this.getOrCreateStyleElement();
            
            // Wait for all stylesheets to load before initial scan
            await this.waitForStylesheets();
            
            // Perform initial scan after stylesheets are loaded
            this.scanAllCSS();
            
            // Setup observer for future changes
            this.setupMutationObserver();
            this.isInitialized = true;
            this.log('Initialisierung abgeschlossen');
        } catch (e) {
            this.error('Fehler bei der Initialisierung:', e);
        }
    }

    async waitForStylesheets() {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        const promises = [];

        this.log(`Warte auf ${links.length} Stylesheets`);

        links.forEach(link => {
            if (!link.sheet) {
                promises.push(
                    new Promise((resolve) => {
                        link.addEventListener('load', () => {
                            this.log(`Stylesheet geladen: ${link.href}`);
                            resolve();
                        }, { once: true });
                        link.addEventListener('error', () => {
                            this.warn(`Stylesheet konnte nicht geladen werden: ${link.href}`);
                            resolve();
                        }, { once: true });
                    })
                );
            }
        });

        if (promises.length > 0) {
            await Promise.all(promises);
            // Small delay to ensure CSS is fully parsed
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    getOrCreateStyleElement() {
        this.styleElement = document.getElementById('cssf-vars');
        if (!this.styleElement) {
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'cssf-vars';
            document.head.appendChild(this.styleElement);
            this.log('Style-Element erstellt');
        }
        return this.styleElement;
    }

    setupMutationObserver() {
        this.log('MutationObserver wird eingerichtet');
        const observer = new MutationObserver((mutations) => {
            let needsScan = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;

                        if (node.tagName === 'LINK' && node.rel === 'stylesheet') {
                            node.addEventListener('load', () => this.scanAllCSS(), { once: true });
                            node.addEventListener('error', () => this.warn(`Stylesheet konnte nicht geladen werden: ${node.href}`), { once: true });
                        }
                        else if (node.tagName === 'STYLE') {
                            needsScan = true;
                        }
                        else if (node.hasAttribute && (node.hasAttribute('style') || node.hasAttribute('class'))) {
                            needsScan = true;
                        }
                    }
                }
                else if (mutation.type === 'attributes') {
                    needsScan = true;
                }
            }

            if (needsScan) {
                clearTimeout(this.debounceTimeout);
                this.debounceTimeout = setTimeout(() => this.scanAllCSS(), 50);
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    scanAllCSS() {
        this.log('Starte CSS-Scan');
        // Reset found vars for fresh scan
        this.foundVars.clear();
        this.corsBlockedSheets = [];
        
        // Scan all stylesheets
        for (const sheet of document.styleSheets) {
            try {
                if (sheet.ownerNode && sheet.ownerNode.id === 'cssf-vars') {
                    continue;
                }
                if (sheet.cssRules) {
                    this.log(`Scanne Stylesheet: ${sheet.href || 'inline'}`);
                    this.findVarsInRules(sheet.cssRules);
                }
            } catch (e) {
                if (e.name === 'SecurityError') {
                    const sheetInfo = {
                        href: sheet.href,
                        ownerNode: sheet.ownerNode
                    };
                    this.corsBlockedSheets.push(sheetInfo);
                    
                    this.warn(
                        'CORS-Fehler - Stylesheet kann nicht gescannt werden:',
                        sheet.href || sheet.ownerNode,
                        '\n💡 Lösung: Verwende einen lokalen Webserver statt file://'
                    );
                } else {
                    this.warn('Konnte nicht auf Stylesheet zugreifen:', sheet.href, e);
                }
            }
        }

        // Scan inline styles
        const inlineElements = document.querySelectorAll('[style]');
        this.log(`Scanne ${inlineElements.length} Elemente mit inline styles`);
        inlineElements.forEach(el => {
            this.extractVarsFromString(el.style.cssText);
        });

        // Update stylesheet and output
        this.updateStylesheet();
        
        this.log('✅ Scan abgeschlossen.');
        this.log('   Gefundene Variablen:', Array.from(this.foundVars));
        if (this.corsBlockedSheets.length > 0) {
            this.log(`   ⚠️ ${this.corsBlockedSheets.length} Stylesheet(s) wegen CORS blockiert.`);
        }
    }

    findVarsInRules(rules) {
        if (!rules) return;
        for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
                this.extractVarsFromString(rule.style.cssText);
            } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
                this.findVarsInRules(rule.cssRules);
            }
        }
    }

    extractVarsFromString(cssText) {
        // Updated regex to handle fallback values: var(--name, fallback)
        const varUsageRegex = /var\(--(size-n?\d+(\.\d+)?|clamp-\d+-size-n?\d+(\.\d+)?)(?:,.*?)?\)/g;
        let match;
        while ((match = varUsageRegex.exec(cssText)) !== null) {
            this.log(`Variable gefunden: ${match[1]}`);
            this.foundVars.add(match[1]);
        }
    }

    generateVarDefinition(varName) {
        const clampMatch = varName.match(/^clamp-(\d+)-size-(n?)(\d+(\.\d+)?)$/);
        if (clampMatch) {
            const [, viewport, negative, valueStr] = clampMatch;
            const value = parseFloat(valueStr) * (negative ? -1 : 1);
            const remValue = value / 16;

            // The logic uses a fixed minimum of 1rem and grows towards the size specified in the class name.
            // It assumes a fluid range starting from a 0px viewport width.
            const minRem = 1.0;
            const maxRem = remValue;
            const minVw = 0;
            const maxVw = parseFloat(viewport);
            
            if (maxRem < minRem) {
                this.warn(`For --${varName}, the target size (${maxRem.toFixed(2)}rem) is smaller than the minimum size (${minRem.toFixed(2)}rem). This may lead to unexpected behavior.`);
            }

            const clampFn = this.createClampFunction(minRem, maxRem, minVw, maxVw);
            return `--${varName}: ${clampFn};`;
        }

        const sizeMatch = varName.match(/^size-(n?)(\d+(\.\d+)?)$/);
        if (sizeMatch) {
            const [, negative, valueStr] = sizeMatch;
            const value = parseFloat(valueStr);
            const remValue = value / 16;
            return `--${varName}: ${negative ? '-' : ''}${remValue}rem;`;
        }

        return null;
    }

    createClampFunction(minRem, maxRem, minVw, maxVw) {
        // This function's logic is updated to match the createClampFunction from cssf.js as requested.
        if (maxVw <= minVw) {
            return `clamp(${minRem.toFixed(4)}rem, ${((minRem + maxRem) / 2).toFixed(4)}rem, ${maxRem.toFixed(4)}rem)`;
        }
        
        const minPx = minRem * 16;
        const maxPx = maxRem * 16;
        // The logic from cssf.js assumes the viewport range starts at 0, so we use maxVw as the total width.
        const viewportWidth = maxVw;

        // Logic adapted from cssf.js's createClampFunction
        const vwPercent = (maxPx - minPx) / viewportWidth * 100;
        const baseVw = minPx / viewportWidth * 100;
        
        // In cssf.js, these two are added together to form a single vw-based value.
        const preferredValue = `${(baseVw + vwPercent).toFixed(4)}vw`;
        
        return `clamp(${minRem.toFixed(4)}rem, ${preferredValue}, ${maxRem.toFixed(4)}rem)`;
    }

    updateStylesheet() {
        const outputEl = document.getElementById('cssf-vars-output');

        if (this.foundVars.size === 0) {
            this.styleElement.textContent = '';
            if (outputEl) outputEl.textContent = 'HINWEIS: <style id="cssf-vars"> ist leer. Keine zu generierenden Variablen gefunden.';
            this.log('Keine Variablen gefunden');
            return;
        }

        const definitions = [...this.foundVars]
            .map(varName => {
                const def = this.generateVarDefinition(varName);
                this.log(`Generiere Definition für ${varName}: ${def}`);
                return def;
            })
            .filter(Boolean)
            .sort();

        this.log('Alle Definitionen:', definitions);

        if (definitions.length > 0) {
            const cssText = `:root {\n  ${definitions.join('\n  ')}\n}`;
            this.styleElement.textContent = cssText;
            if (outputEl) outputEl.textContent = cssText;
            this.log('Stylesheet aktualisiert');
        } else {
            this.styleElement.textContent = '';
            if (outputEl) outputEl.textContent = 'HINWEIS: Variablen wurden gefunden, aber es konnten keine CSS-Definitionen erstellt werden.';
            this.log('Keine Definitionen generiert für:', Array.from(this.foundVars));
        }
    }
}

// Expose instance to window for manual debugging
window.cssfVars = new CSSFVars();

// Use DOMContentLoaded or immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.cssfVars.init());
} else {
    window.cssfVars.init();
}