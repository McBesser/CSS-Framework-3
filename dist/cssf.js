class CSSF {
    constructor() {
        this.processedClasses = new Set();
        this.initializeConfig();
        this.setupPrefixHandlers();
        this.init();
    }

    initializeConfig() {
        this.config = {
            aliases: this.createMap({
                // Margin & Padding
                m: 'margin', p: 'padding', 
                mt: 'margin-top', mb: 'margin-bottom', ml: 'margin-left', mr: 'margin-right',
                mx: 'margin-inline', my: 'margin-block',
                mbs: 'margin-block-start', mbe: 'margin-block-end',
                mis: 'margin-inline-start', mie: 'margin-inline-end',
                pt: 'padding-top', pb: 'padding-bottom', pl: 'padding-left', pr: 'padding-right',
                px: 'padding-inline', py: 'padding-block',
                pbs: 'padding-block-start', pbe: 'padding-block-end',
                pis: 'padding-inline-start', pie: 'padding-inline-end',

                // Dimensions
                w: 'width', h: 'height', mw: 'max-width', mh: 'max-height',
                minw: 'min-width', minh: 'min-height',
                bw: 'block-size', iw: 'inline-size', // bw = block-size (logical property)
                mbw: 'max-block-size', miw: 'max-inline-size',
                minbw: 'min-block-size', miniw: 'min-inline-size',

                // Colors & Background
                bg: 'background', bgc: 'background-color', bgi: 'background-image',
                bgp: 'background-position', bgr: 'background-repeat', bgs: 'background-size',
                bga: 'background-attachment', bgo: 'background-origin', bgcl: 'background-clip',
                c: 'color', ac: 'accent-color', cc: 'caret-color',

                // Typography
                fs: 'font-size', fstr: 'font-stretch', // fs = font-size (fstr für stretch)
                fw: 'font-weight', ff: 'font-family', fst: 'font-style',
                fv: 'font-variant', lh: 'line-height', ls: 'letter-spacing',
                ws: 'word-spacing', wb: 'word-break', ww: 'word-wrap', hy: 'hyphens',
                ta: 'text-align', td: 'text-decoration', tt: 'text-transform',
                ti: 'text-indent', ts: 'text-shadow', to: 'text-overflow',
                va: 'vertical-align', wm: 'writing-mode',

                // Display & Layout
                d: 'display', pos: 'position', t: 'top', r: 'right', b: 'bottom', l: 'left',
                z: 'z-index', fl: 'float', cl: 'clear', v: 'visibility', ov: 'overflow',
                ovx: 'overflow-x', ovy: 'overflow-y', ovw: 'overflow-wrap',
                clip: 'clip-path', rs: 'resize', cur: 'cursor',

                // Flexbox
                flex: 'flex', fd: 'flex-direction', fwrap: 'flex-wrap', // fwrap statt fw
                fflow: 'flex-flow', // fflow statt ff
                fg: 'flex-grow', fsh: 'flex-shrink', fb: 'flex-basis',
                jc: 'justify-content', ai: 'align-items', acont: 'align-content', // acont statt ac
                as: 'align-self', ji: 'justify-items', js: 'justify-self',
                pi: 'place-items', ps: 'place-self', pc: 'place-content',
                gap: 'gap', rg: 'row-gap', cg: 'column-gap',

                // Grid
                grid: 'grid', gt: 'grid-template', gtr: 'grid-template-rows',
                gtc: 'grid-template-columns', gta: 'grid-template-areas',
                gr: 'grid-row', gc: 'grid-column', ga: 'grid-area',
                grs: 'grid-row-start', gre: 'grid-row-end',
                gcs: 'grid-column-start', gce: 'grid-column-end',
                gaf: 'grid-auto-flow', gar: 'grid-auto-rows', gac: 'grid-auto-columns',

                // Border & Outline
                bd: 'border', bt: 'border-top', br: 'border-right', bb: 'border-bottom', bl: 'border-left',
                bdw: 'border-width', // bdw statt bw (bw ist block-size)
                btw: 'border-top-width', brw: 'border-right-width',
                bbw: 'border-bottom-width', blw: 'border-left-width',
                bs: 'border-style', // bs = border-style (original)
                bts: 'border-top-style', brs: 'border-right-style',
                bbs: 'border-bottom-style', bls: 'border-left-style',
                bc: 'border-color', // bc = border-color (original)
                btc: 'border-top-color', brc: 'border-right-color',
                bbc: 'border-bottom-color', blc: 'border-left-color',
                brad: 'border-radius', // brad statt br (br ist border-right)
                brtl: 'border-top-left-radius', brtr: 'border-top-right-radius',
                brbl: 'border-bottom-left-radius', brbr: 'border-bottom-right-radius',
                bi: 'border-image', bimgsrc: 'border-image-source', // bimgsrc statt bis
                bisl: 'border-image-slice', biw: 'border-image-width', 
                bio: 'border-image-outset', bir: 'border-image-repeat',
                ol: 'outline', olw: 'outline-width', ols: 'outline-style', olc: 'outline-color',
                olo: 'outline-offset',

                // Effects & Transforms
                op: 'opacity', vis: 'visibility', bxsh: 'box-shadow', // bxsh statt bs
                filter: 'filter', backdrop: 'backdrop-filter',
                tf: 'transform', tfo: 'transform-origin', tfs: 'transform-style',
                pers: 'perspective', perso: 'perspective-origin',
                ani: 'animation', andur: 'animation-duration', // andur statt and
                anf: 'animation-fill-mode', ann: 'animation-name', 
                anr: 'animation-iteration-count', ans: 'animation-timing-function', 
                andel: 'animation-delay', // andel statt and
                andir: 'animation-direction', anps: 'animation-play-state',
                tr: 'transition', trd: 'transition-duration', trp: 'transition-property',
                trf: 'transition-timing-function', trdl: 'transition-delay',

                // Lists & Tables
                lstyle: 'list-style', // lstyle statt ls
                lst: 'list-style-type', lsp: 'list-style-position', lsi: 'list-style-image',
                tl: 'table-layout', bcol: 'border-collapse', // bcol statt bc (bc ist border-color)
                bspac: 'border-spacing', // bspac statt bs
                cs: 'caption-side', es: 'empty-cells',

                // User Interface
                app: 'appearance', us: 'user-select', pe: 'pointer-events',
                will: 'will-change', cont: 'contain', iso: 'isolation',
                mix: 'mix-blend-mode', obj: 'object-fit', objp: 'object-position',

                // Multi-column
                cols: 'columns', cspan: 'column-span', // cspan statt cols
                colc: 'column-count', colw: 'column-width', colg: 'column-gap', 
                colr: 'column-rule', colrc: 'column-rule-color', colrs: 'column-rule-style', 
                colrw: 'column-rule-width', colf: 'column-fill', cb: 'column-break',

                // CSS Variables & Functions
                var: 'var', calc: 'calc', attr: 'attr',

                // Logical Properties
                bis: 'border-inline-start', bie: 'border-inline-end',
                bbs: 'border-block-start', bbe: 'border-block-end',
                misw: 'margin-inline-start-width', miew: 'margin-inline-end-width'
            }),
            
            chars: this.createMap({
                star: '*', comma: ',', dot: '.', dash: '-', space: ' ', slash: '/', pipe: '|', 
                plus: '+', minus: '-', equal: '=', question: '?', exclamation: '!', colon: ':', 
                semicolon: ';', percent: '%', amp: '&', at: '@', hash: '#', dollar: '$', 
                caret: '^', tilde: '~', grave: '`', lpar: '(', rpar: ')', lbrace: '{', 
                rbrace: '}', lbrack: '[', rbrack: ']', lt: '<', gt: '>'
            }),
            
            templates: this.createMap({
               // cssf V2

            'test-color': 'val-color-1_hex-000000--val-color-2_hex-ffffff--val-color-3_hex-ffaaaa--val-color-4_hex-aaaaff--val-color-5_hex-ffffaa--val-color-6_hex-ffaaff--val-color-7_hex-aaffaa--val-color-8_hex-aaffff',
            'test-set1': 'br1_solid--color_black--px20--py10',
            'test-set2': 'br1_solid--color_white--px20--py10',
            'test-br1': 'br1_solid--color_black',
            'test-br2': 'br1_solid--color_white',
            /* -------------------------------------------------------------------------------------- */
            'teaser-lc': 'lc_§0--bo_vertical--text-overflow_ellipsis--d_-webkit-box--overflow_hidden',
            /* -------------------------------------------------------------------------------------- */
            'c-var': 'c_var-color-§0',
            'bg-var': 'bg_var-color-§0',
            /* -------------------------------------------------------------------------------------- */
            /* con_1200 = max-width: 1200 */
            'con': 'max-width§0px--m_auto--box-sizing_border-box--container-type_inline-size',
            /* -------------------------------------------------------------------------------------- */
            'flex-layout': 'd_flex--fd_row--fw_wrap--jc_start--ac_stretch--ai_stretch--container-type_inline-size',
            /* -------------------------------------------------------------------------------------- */
            'fcol25': 'f_1_1--flex-basis100p_cd4int--max-width100p_cd4int--box-sizing_border-box',
            'fcol33': 'f_1_1--flex-basis100p_cd3int--max-width100p_cd3int--box-sizing_border-box',
            'fcol50': 'f_1_1--flex-basis100p_cd2int--max-width100p_cd2int--box-sizing_border-box',
            'fcol66': 'f_1_1--flex-basis100p_cd3int_cm2int--max-width100p_cd2int--box-sizing_border-box',
            'fcol75': 'f_1_1--flex-basis100p_cd4int_cm3int--max-width100p_cd2int--box-sizing_border-box',
            /* -------------------------------------------------------------------------------------- */
            /* fcol25gx1_20 = gap 20px */
            'fcol25gx1': 'f_1_1--flex-basis100p_cd4int_cs§0--max-width100p_cd4int_cs§0_cd2int_cm1int--box-sizing_border-box',
            'fcol25gx3': 'f_1_1--flex-basis100p_cd4int_cs§0--max-width100p_cd4int_cs§0_cd4int_cm3int--box-sizing_border-box',
            'fcol33gx2': 'f_1_1--flex-basis100p_cd3int_cs§0--max-width100p_cd3int_cs§0_cd3int_cm2int--box-sizing_border-box',
            'fcol50gx1': 'f_1_1--flex-basis100p_cd2int_cs§0--max-width100p_cd2int_cs§0_cd2int_cm1int--box-sizing_border-box',
            'fcol66gx1': 'f_1_1--flex-basis100p_cd3int_cm2int_cs§0--max-width100p_cd2int_cs§0_cd2int_cm1int--box-sizing_border-box',
            'fcol75gx1': 'f_1_1--flex-basis100p_cd4int_cm3int_cs§0--max-width100p_cd2int_cs§0_cd2int_cm1int--box-sizing_border-box',
            /* -------------------------------------------------------------------------------------- */
            'fcol100': 'f_1_1_100p--box-sizing_border-box',
            'fcolauto': 'f_1_1_auto--box-sizing_border-box',
            /* -------------------------------------------------------------------------------------- */            
               'grid-layout': 'cssf--d_grid--grid-template-columns_tpl-grid-layout-cols-standard_var-layout-gap_var-layout-content_var-layout-outside--grid-template-rows_tpl-grid-layout-rows-standard_var-layout-gap--val-grid-layout-spacing_tpl-var_val-container-spacing_var-layout-gap--py_fn-calc_var-grid-layout-spacing_chr-slash_2--container-type_inline-size',
               'grid-layout-val': 'cssf--d_grid--grid-template-columns_tpl-grid-layout-cols-standard_§0_§1_§2--grid-template-rows_tpl-grid-layout-rows-standard_§0--container-type_inline-size',
               'grid-layout-main-gap': 'cssf--grid-layout-spacing_tpl-var_val-container-spacing_var-layout-gap--py_fn-calc_var-grid-layout-spacing_chr-slash_2',
               'layout-gap': 'cssf--gap_var-layout-gap',
               
               'grid-layout-cols-standard': '[full-start] minmax(§0, 1fr) [outside-start] minmax(0, calc((§2 - §1) / 2)) [content-start] min(100% - (§0 * 2), §1) [content-end] minmax(0, calc((§2 - §1) / 2)) [outside-end] minmax(§0, 1fr) [full-end]',
               'test-grid-layout-rows-standard': '[full-start] minmax(§0, 1fr) [outside-start] [content-start] [content-end] [outside-end] minmax(§0, 1fr) [full-end]',
               'grid-layout-rows-standard': 'auto',
               'clamp-size-standard': 'clamp(1rem, 1rem + calc((§0 - 1rem) / (§1 - 0rem) * 100)vw, §0)',
            /* -------------------------------------------------------------------------------------- */
            /* -------------------------------------------------------------------------------------- */
            'grid-brick-layout': 'cssf--d_grid--gtc_tpl-repeat_12_1fr--gap_var-layout-gap--container-type_inline-size--ai_stretch',
            'gcolx1': 'gc_span_1',
            'gcolx2': 'gc_span_2',
            'gcolx3': 'gc_span_3',
            'gcolx4': 'gc_span_4',
            'gcolx5': 'gc_span_5',
            'gcolx6': 'gc_span_6',
            'gcolx7': 'gc_span_7',
            'gcolx8': 'gc_span_8',
            'gcolx9': 'gc_span_9',
            'gcolx10': 'gc_span_10',
            'gcolx11': 'gc_span_11',
            'gcolx12': 'gc_span_12',
            'gcol25': 'gc_span_3',
            'gcol33': 'gc_span_4',
            'gcol50': 'gc_span_6',
            'gcol66': 'gc_span_8',
            'gcol75': 'gc_span_9',
            'gcol100': 'gc_span_12',
            'growx1': 'gr_span_1',
            'growx2': 'gr_span_2',
            'growx3': 'gr_span_3',
            'growx4': 'gr_span_4',
            'growx5': 'gr_span_5',
            'growx6': 'gr_span_6',
            'growx7': 'gr_span_7',
            'growx8': 'gr_span_8',
            'growx9': 'gr_span_9',
            'growx10': 'gr_span_10',
            'growx11': 'gr_span_11',
            'growx12': 'gr_span_12',
            /* -------------------------------------------------------------------------------------- */
            'clamp-font-size': 'tpl-clamp-size-standard_font-size_var-cfs-font-size_var-cfs-width',
            'btn': 'px15--py10--cursor_pointer--br3_solid_var-btn-br-color',
            'hide': 'pos_absolute--h1px--w1px--of_hidden--tpl-rect_clip_1px_1px_1px_1px--ws_nowrap',
            'show': 'd_initial--pos_static--h_auto--w_auto--of_visible--clip_auto--ws_normal',
            'focus': 'target-pseudo-class-focus',
            'before': 'target-pseudo-element-before--content_sq-str',
            'after': 'target-pseudo-element-after--content_sq-str',
            'overlay-background': 'pos_fixed--w100dvw--h100dvh--tpl-rgba_bg_0_0_0_50c--z_-2',
            'overlay-foreground': 'pos_absolute--tpl-rgba_bg_255_255_255_100c--z_-1--py40--fn-calc_w_100p_op-add_op-op_40pxrem_op-mul_2int_op-cp',
            'overlay-wrapper': 'pos_fixed--t50p--l50p--d_flex--tpl-translate_transform_-50p_-50p--jc_center--ai_center',
            'center': 'pos_absolute--t50p--l50p--fn-translate_transform_-50p_op-c_-50p',
               
               
               
               
               
               
               
               
               
                // msg
                msg: 'cssf--bgc_hex-§0--p10--bl_4pxrem_solid_hex-§1--mb20', 'msg-alert': 'cssf--tpl-msg_fff4e5_ffa500',
                'msg-info': 'cssf--tpl-msg_e7f3ff_007bff', 'msg-error': 'cssf--tpl-msg_f8d7da_d93025', 'msg-success': 'cssf--tpl-msg_d4edda_28a745',
                'sans-sarif': 'cssf--ff_sans-serif', 'sarif': 'cssf--ff_serif',
                // Color Functions
                rgb: 'rgb(§0, §1, §2)', rgba: 'rgba(§0, §1, §2, §3)',
                hsl: 'hsl(§0, §1%, §2%)', hsla: 'hsla(§0, §1%, §2%, §3)',
                
                // Gradients
                linear: 'linear-gradient(§0deg, §1, §2)', 
                radial: 'radial-gradient(§0, §1)',
                conic: 'conic-gradient(§0deg, §1, §2)',
                
                // Shadows & Effects
                shadow: '§0px §1px §2px §3', 
                inset: 'inset §0px §1px §2px §3',
                
                // Transform & Functions
                transform: 'transform(§0)', 
                calc: 'calc(§0 §1 §2)',
                
                // Centering Utilities
                center: 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)',
                'center-flex': 'display: flex; align-items: center; justify-content: center',
                'center-grid': 'display: grid; place-items: center',
                'center-margin': 'margin: 0 auto',
                
                // Flexbox Templates (Bootstrap-style)
                'flex-row': 'display: flex; flex-direction: row',
                'flex-col': 'display: flex; flex-direction: column',
                'flex-row-reverse': 'display: flex; flex-direction: row-reverse',
                'flex-col-reverse': 'display: flex; flex-direction: column-reverse',
                'flex-wrap': 'display: flex; flex-wrap: wrap',
                'flex-nowrap': 'display: flex; flex-wrap: nowrap',
                'flex-wrap-reverse': 'display: flex; flex-wrap: wrap-reverse',
                
                // Justify Content
                'justify-start': 'display: flex; justify-content: flex-start',
                'justify-end': 'display: flex; justify-content: flex-end',
                'justify-center': 'display: flex; justify-content: center',
                'justify-between': 'display: flex; justify-content: space-between',
                'justify-around': 'display: flex; justify-content: space-around',
                'justify-evenly': 'display: flex; justify-content: space-evenly',
                
                // Align Items
                'align-start': 'display: flex; align-items: flex-start',
                'align-end': 'display: flex; align-items: flex-end',
                'align-center': 'display: flex; align-items: center',
                'align-baseline': 'display: flex; align-items: baseline',
                'align-stretch': 'display: flex; align-items: stretch',
                
                // Flex Grow/Shrink
                'flex-1': 'flex: 1 1 0%',
                'flex-auto': 'flex: 1 1 auto',
                'flex-initial': 'flex: 0 1 auto',
                'flex-none': 'flex: none',
                
                // Grid Templates (Bootstrap-style)
                'grid-1': 'display: grid; grid-template-columns: repeat(1, minmax(0, 1fr))',
                'grid-2': 'display: grid; grid-template-columns: repeat(2, minmax(0, 1fr))',
                'grid-3': 'display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))',
                'grid-4': 'display: grid; grid-template-columns: repeat(4, minmax(0, 1fr))',
                'grid-5': 'display: grid; grid-template-columns: repeat(5, minmax(0, 1fr))',
                'grid-6': 'display: grid; grid-template-columns: repeat(6, minmax(0, 1fr))',
                'grid-12': 'display: grid; grid-template-columns: repeat(12, minmax(0, 1fr))',
                
                // Grid Auto
                'grid-auto-fit': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))',
                'grid-auto-fill': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))',
                
                // Grid Gap
                'grid-gap-1': 'display: grid; gap: 0.25rem',
                'grid-gap-2': 'display: grid; gap: 0.5rem',
                'grid-gap-3': 'display: grid; gap: 0.75rem',
                'grid-gap-4': 'display: grid; gap: 1rem',
                'grid-gap-5': 'display: grid; gap: 1.25rem',
                'grid-gap-6': 'display: grid; gap: 1.5rem',
                
                // Container Queries
                'container-sm': 'container-type: inline-size; container-name: sm',
                'container-md': 'container-type: inline-size; container-name: md',
                'container-lg': 'container-type: inline-size; container-name: lg',
                'container-xl': 'container-type: inline-size; container-name: xl',
                
                // Utility Templates
                hide: 'position: absolute; left: -9999px; opacity: 0; pointer-events: none',
                'hide-visual': 'clip: rect(0, 0, 0, 0); position: absolute; white-space: nowrap; width: 1px; height: 1px; overflow: hidden; border: 0; padding: 0; clip-path: inset(50%); margin: -1px',
                'full-width': 'width: 100vw; margin-left: calc(50% - 50vw)',
                'aspect-square': 'aspect-ratio: 1 / 1',
                'aspect-video': 'aspect-ratio: 16 / 9',
                'aspect-photo': 'aspect-ratio: 3 / 2',
                
                // Button & Form Templates
                'btn-reset': 'border: none; background: none; padding: 0; margin: 0; cursor: pointer',
                'input-reset': 'border: none; outline: none; background: transparent',
                'focus-ring': 'outline: 2px solid currentColor; outline-offset: 2px',
                
                // Layout Utilities
                'stack': 'display: flex; flex-direction: column; gap: 1rem',
                'cluster': 'display: flex; flex-wrap: wrap; gap: 1rem',
                'sidebar': 'display: flex; flex-wrap: wrap; gap: 1rem',
                'switcher': 'display: flex; flex-wrap: wrap; gap: 1rem',
                'cover': 'display: flex; flex-direction: column; min-height: 100vh',
                
                // Modern CSS Features
                'subgrid': 'display: subgrid',
                'container-query': 'container-type: inline-size',
                'scroll-snap-x': 'scroll-snap-type: x mandatory',
                'scroll-snap-y': 'scroll-snap-type: y mandatory',
                'scroll-smooth': 'scroll-behavior: smooth',
                
                // Misc
                'var': 'var(§0, §1)'
            }),
            
            customFunctions: this.createMap({
                'date-now': () => new Date().toLocaleDateString('de-DE'),
                'date-time': () => new Date().toLocaleString('de-DE'),
                timestamp: () => Date.now().toString(),
                random: () => Math.random().toString().substr(2, 6),
                year: () => new Date().getFullYear().toString(),
                month: () => (new Date().getMonth() + 1).toString(),
                day: () => new Date().getDate().toString(),
                clamp: this.createClampFunction(),
                
                // Additional utility functions
                'viewport-width': () => window.innerWidth + 'px',
                'viewport-height': () => window.innerHeight + 'px',
                'rem-to-px': (rem) => (parseFloat(rem) * 16) + 'px',
                'px-to-rem': (px) => (parseFloat(px) / 16) + 'rem',
                'percentage': (part, whole) => ((parseFloat(part) / parseFloat(whole)) * 100) + '%'
            })
        };
    }

    createMap = obj => new Map(Object.entries(obj));

    createClampFunction() {
        return (min, max, viewport) => {
            const [minVal, maxVal, vwVal] = [min, max, viewport].map(parseFloat);
            if ([minVal, maxVal, vwVal].some(isNaN)) return `clamp(${min}, ${max}, ${viewport})`;
            
            const [minRem, maxRem] = [minVal / 16, maxVal / 16];
            const vwPercent = (maxVal - minVal) / vwVal * 100;
            const baseVw = minVal / vwVal * 100;
            
            return `clamp(${minRem}rem, ${baseVw}vw + ${vwPercent}vw, ${maxRem}rem)`;
        };
    }

   setupPrefixHandlers() {
       this.prefixHandlers = {
           'hex-': value => `#${value.substring(4)}`,
           'var-': value => `var(--${value.substring(4)})`,
           'val-': value => `--${value.substring(4)}`,
           'rval-': value => this.handleRootValue(value),
           'tpl-': value => this.handleTemplate(value),
           'chr-': value => this.config.chars.get(value.substring(4)) || value.substring(4),
           'uni-': value => `\\${value.substring(4)}`,
           'str-': value => `"${this.processNestedPrefixes(value.substring(4))}"`,
           'group-': value => `(${value.substring(6)}),`,
           'tar-': value => this.handleTarget(value),
           'fn-': value => this.handleFunction(value),
           'cfn-': value => this.handleCustomFunction(value)
       };
   }

    init() {
        this.setupMutationObserver();
        this.processElementAndChildren(document.body);
    }

    setupMutationObserver() {
        const handleMutation = mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                this.processClassChanges(mutation.target);
            }
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processElementAndChildren(node);
                    }
                });
            }
        };

        this.observer = new MutationObserver(mutations => mutations.forEach(handleMutation));
        this.observer.observe(document.body, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['class']
        });
    }

    processElementAndChildren(element) {
        if (element.classList) this.processClassChanges(element);
        element.querySelectorAll('*').forEach(this.processClassChanges.bind(this));
    }

    processClassChanges(element) {
        if (!element.classList) return;
        
        const newClasses = [...element.classList]
            .filter(className => className.startsWith('cssf--') && !this.processedClasses.has(className));
        
        newClasses.forEach(className => {
            this.processedClasses.add(className);
            this.generateCSS(className);
        });
    }

   generateCSS(className) {
       try {
           const css = this.parseClass(className);
           if (css) this.addToStylesheet(css);
       } catch (error) {
           console.error(`Fehler beim Verarbeiten der Klasse ${className}:`, error);
       }
   }
   
   parseClass(className) {
       const cleanClass = className.substring(6);
       const parts = cleanClass.split('--');
       
       const context = {
           selector: `.${className}`,
           properties: [],
           mediaQuery: null,
           rootRule: null  // Hinzufügen
       };

       parts.forEach(part => this.processPart(part, context, className));
       
       // CSS-Regeln generieren
       let cssRules = [];
       
       // Root-Regel hinzufügen falls vorhanden
       if (context.rootRule) {
           cssRules.push(context.rootRule);
       }
       
       // Normale Regel hinzufügen falls Properties vorhanden
       if (context.properties.length > 0) {
           const rule = this.buildCSSRule(context.selector, context.properties);
           const finalRule = context.mediaQuery ? this.wrapInMediaQuery(rule, context.mediaQuery) : rule;
           cssRules.push(finalRule);
       }
       
       // Alle Regeln zurückgeben (oder null falls keine)
       return cssRules.length > 0 ? cssRules.join('\r\n\r\n') : null;
   }

    processPart(part, context, className) {
        const processors = [
            { condition: p => p.startsWith('mq'), handler: p => context.mediaQuery = this.handleMediaQuery(p) },
            { condition: p => p.startsWith('tar-'), handler: p => context.selector = this.handleTargetSelector(p, className) },
            { condition: p => p.startsWith('val-'), handler: p => this.processValuePart(p, context) },
            { condition: p => p.startsWith('rval-'), handler: p => this.processRootValuePart(p, className, context) },
            { condition: p => p.startsWith('tpl-'), handler: p => this.processTemplatePart(p, context) },
            { condition: () => true, handler: p => this.processDefaultPart(p, context) }
        ];

        const processor = processors.find(proc => proc.condition(part));
        if (processor) processor.handler(part);
    }

    processValuePart(part, context) {
        const [prop, ...valueParts] = part.split('_');
        const value = valueParts.join('_');
        context.properties.push(`--${prop.substring(4)}: ${this.processValue(value)}`);
    }

    processRootValuePart(part, className, context) {
        const [prop, ...valueParts] = part.split('_');
        const value = valueParts.join('_');
        context.rootRule = this.createRootRule(prop.substring(5), this.processValue(value), className);
    }

   processTemplatePart(part, context, className) {
       const [prop, ...valueParts] = part.split('_');
       const value = valueParts.join('_');
       const template = this.config.templates.get(prop.substring(4));
       
       if (!template) return;
       
       // 1. Platzhalterersetzung (immer ausführen)
       let processedTemplate = template;
       if (value) {
           const params = value.split('_');
           processedTemplate = params.reduce((result, param, index) => 
               result.replace(new RegExp(`§${index}`, 'g'), param), template);
       }
       
       // 2. Prüfen ob das Template eine CSSF-Klasse ist
       if (processedTemplate.startsWith('cssf--')) {
           // CSSF-Präfix entfernen und Teile extrahieren
           const cleanClass = processedTemplate.substring(6);
           const parts = cleanClass.split('--');
           
           // Jeden Teil rekursiv verarbeiten
           parts.forEach(templatePart => {
               this.processPart(templatePart, context, className);
           });
           return;
       }
       
       // Normale Template-Verarbeitung
       if (processedTemplate.includes(';')) {
           processedTemplate.split(';')
               .map(p => p.trim())
               .filter(Boolean)
               .forEach(tprop => context.properties.push(tprop));
       } else {
           const finalProcessed = this.processTemplate(processedTemplate, []);
           context.properties.push(finalProcessed);
       }
   }

    processDefaultPart(part, context) {
        const result = this.extractPropertyAndValue(part);
        context.properties.push(`${result.property}: ${result.value}`);
    }

    buildCSSRule(selector, properties) {
        return `${selector} {\r\n  ${properties.join(' !important;\r\n  ')} !important;\r\n}`;
    }

    wrapInMediaQuery(rule, mediaQuery) {
        return `${mediaQuery} {\r\n  ${rule}\r\n}`;
    }

    handleMediaQuery(mqPart) {
        const match = mqPart.match(/^mq(\d+)(max)?$/);
        return match ? `@media (${match[2] ? 'max' : 'min'}-width: ${match[1]}px)` : null;
    }

    handleTargetSelector(tarPart, originalClass) {
        const parts = tarPart.substring(4).split('-');
        let selector = `.${originalClass}`;
        let parentPrefix = '';
        
        const selectorHandlers = {
            next: () => selector += ' + ',
            child: () => selector += ' > ',
            parent: i => this.handleParentSelector(parts, i, prefix => parentPrefix = prefix),
            self: i => this.handleSelfSelector(parts, i, originalClass, newSelector => selector = newSelector),
            // class: i => this.handleClassSelector(parts, i, selector),
            // tag: i => this.handleTagSelector(parts, i, selector),
            // id: i => this.handleIdSelector(parts, i, selector),
            // pseudo: i => this.handlePseudoSelector(parts, i, selector)
        };

        for (let i = 0; i < parts.length; i++) {
            const handler = selectorHandlers[parts[i]];
            if (handler) {
                const result = handler(i);
                if (typeof result === 'number') i = result;
            } else {
               // this.handleDefaultSelectorPart(parts, i, selector);
            }
        }
        
        return parentPrefix + selector;
    }

    handleParentSelector(parts, i, callback) {
       if (i + 1 < parts.length) {
           const nextPart = parts[++i]; // i einmal erhöhen für nextPart
           
           // Prüfe ob noch ein weiterer Teil vorhanden ist für den Selektor-Namen
           if (i + 1 < parts.length) {
               const selectorName = parts[++i]; // i nochmals erhöhen für selectorName
               
               const prefixMap = {
                   class: `.${selectorName} `,
                   tag: `${selectorName} `,
                   id: `#${selectorName} `
               };
               
               if (prefixMap[nextPart]) {
                   callback(prefixMap[nextPart]);
               }
           }
       }
       return i;
   }

   handleSelfSelector(parts, i, originalClass, callback) {
       if (i + 1 < parts.length) {
           const nextPart = parts[++i]; // i einmal erhöhen für nextPart
           
           // Prüfe ob noch ein weiterer Teil vorhanden ist für den Selektor-Namen
           if (i + 1 < parts.length) {
               const selectorName = parts[++i]; // i nochmals erhöhen für selectorName
               
               const selectorMap = {
                   class: `.${selectorName}.${originalClass}`,
                   tag: `${selectorName}.${originalClass}`,
                   id: `#${selectorName}.${originalClass}`
               };
               
               if (selectorMap[nextPart]) {
                   callback(selectorMap[nextPart]);
               }
           }
       }
       return i;
   }

   processValue(value) {
       if (!value) return '';
       
       // Prüfe alle Prefixes und verwende den längsten Match
       let bestMatch = { handler: null, prefix: '' };
       
       for (const [prefix, handler] of Object.entries(this.prefixHandlers)) {
           if (value.startsWith(prefix) && prefix.length > bestMatch.prefix.length) {
               bestMatch = { handler, prefix };
           }
       }
       
       if (bestMatch.handler) {
           return bestMatch.handler(value);
       }
       
       return this.isNumericValue(value) ? this.handleNumericValue(value) : value;
   }

    isNumericValue = value => /^-?\d+/.test(value) || /^n\d+/.test(value);

    extractPropertyAndValue(part) {
        // Prüfe Alias + direkter Wert
        const aliasMatch = this.findAliasMatch(part);
        if (aliasMatch) return aliasMatch;
        
        // Prüfe CSS-Property + direkter Wert
        const propertyMatch = this.findPropertyMatch(part);
        if (propertyMatch) return propertyMatch;
        
        // Standard Underscore-Behandlung
        return this.parseStandardProperty(part);
    }

    findAliasMatch(part) {
        for (const [alias, fullProp] of this.config.aliases.entries()) {
            if (part.startsWith(alias)) {
                const valueStr = part.substring(alias.length);
                if (valueStr && this.isNumericValue(valueStr)) {
                    return this.createPropertyValue(fullProp, this.processValue(valueStr));
                }
            }
        }
        return null;
    }

    findPropertyMatch(part) {
        let bestMatch = { property: null, length: 0 };
        
        for (const [, fullProp] of this.config.aliases.entries()) {
            if (part.startsWith(fullProp)) {
                const valueStr = part.substring(fullProp.length);
                if (valueStr && this.isNumericValue(valueStr) && fullProp.length > bestMatch.length) {
                    bestMatch = { property: fullProp, length: fullProp.length };
                }
            }
        }
        
        if (bestMatch.property) {
            const valueStr = part.substring(bestMatch.length);
            return this.createPropertyValue(bestMatch.property, this.processValue(valueStr));
        }
        
        return null;
    }

   parseStandardProperty(part) {
       const [prop, ...valueParts] = part.split('_');
       const value = valueParts.join('_');
       const cssProperty = this.config.aliases.get(prop) || prop;
       
       // Prüfe zuerst, ob der gesamte Wert eine komplexe Funktion enthält die als Ganzes verarbeitet werden muss
       const hasComplexFunction = valueParts.some(part => 
           part.startsWith('fn-') || 
           part.startsWith('cfn-') || 
           part.startsWith('tpl-')
       );
       
       let processedValue;
       
       if (hasComplexFunction) {
           // Wenn komplexe Funktionen vorhanden sind, verarbeite den gesamten Wert als Ganzes
           processedValue = value ? this.processValue(value) : '';
           processedValue = processedValue.replaceAll('_', ' ');
       } else {
           // Andernfalls verarbeite jeden Teil einzeln (für pxrem, hex-, var-, etc.)
           const processedParts = valueParts.map(valuePart => this.processValue(valuePart));
           processedValue = processedParts.join(' ');
       }
       
       return {
           property: cssProperty,
           value: processedValue
       };
   }

    createPropertyValue(property, processedValue) {
        return {
            property,
            value: /^\d+$/.test(processedValue) ? `${parseFloat(processedValue) / 16}rem` : processedValue
        };
    }

    handleNumericValue(value) {
        if (value.startsWith('n')) {
            return this.processNegativeValue(value.substring(1));
        }
        
        const match = value.match(/^(-?)(\d+)(.*)$/);
        if (!match) return value;

        const [, negative, number, suffix] = match;
        const num = negative ? `-${number}` : number;
        
        const suffixMap = {
            px: `${num}px`,
            p: `${num}%`,
            pxrem: `${parseFloat(num) / 16}rem`
        };
        
        return suffixMap[suffix] || `${num}${suffix}`;
    }

    processNegativeValue(restValue) {
        const match = restValue.match(/^(\d+)(.*)$/);
        if (!match) return restValue;
        
        const [, number, suffix] = match;
        const num = `-${number}`;
        
        const suffixMap = {
            px: `${num}px`,
            p: `${num}%`,
            pxrem: `${parseFloat(num) / 16}rem`
        };
        
        return suffixMap[suffix] || `${num}${suffix}`;
    }

    processNestedPrefixes(value) {
        const handler = Object.entries(this.prefixHandlers)
            .find(([prefix]) => value.startsWith(prefix) && prefix !== 'str-');
        
        return handler ? handler[1](value) : value;
    }

   handleFunction(value) {
       const fnMatch = value.match(/^fn-([^_]+)_(.+)$/);
       if (!fnMatch) return value;

       const [, fnName, params] = fnMatch;
       
       // Splitte Parameter und verarbeite sie einzeln
       const paramParts = params.split('_');
       const { processedParams, foundClose } = this.processFunctionParams(paramParts);
       
       if (foundClose) {
           const fnPart = processedParams.filter(p => !p.startsWith(' ')).join(' ');
           const additionalParts = processedParams.filter(p => p.startsWith(' ')).join('');
           return `${fnName}(${fnPart})${additionalParts}`;
       }
       
       return `${fnName}(${processedParams.join(' ')})`;
   }

    processFunctionParams(paramParts) {
        let processedParams = [];
        let foundClose = false;
        
        paramParts.forEach(param => {
            if (param === 'close') {
                foundClose = true;
            } else if (foundClose) {
                processedParams.push(' ' + this.processValue(param));
            } else {
                processedParams.push(this.processFunctionParameter(param));
            }
        });
        
        return { processedParams, foundClose };
    }

   processFunctionParameter(param) {
       // Prüfe zuerst auf komplette Prefixes bevor gesplittet wird
       const prefixHandler = Object.entries(this.prefixHandlers)
           .find(([prefix]) => param.startsWith(prefix));
       
       if (prefixHandler) {
           // Wenn ein Prefix gefunden wird, verarbeite den gesamten Parameter als Ganzes
           return this.processValue(param);
       }
       
       // Nur wenn kein Prefix gefunden wird, dann normale Dash-zu-Komma Behandlung
       const parts = param.split('-');
       const processedParts = [];
       
       for (let i = 0; i < parts.length; i++) {
           const prefixMatch = this.findPrefixMatch(parts, i);
           if (prefixMatch) {
               processedParts.push(this.processValue(`${parts[i]}-${parts[i + 1]}`));
               i++; // Skip next part
           } else {
               processedParts.push(this.processValue(parts[i]));
           }
       }
       
       return processedParts.join(', ');
   }

    findPrefixMatch(parts, index) {
        if (index + 1 >= parts.length) return false;
        
        const prefixBase = parts[index];
        return Object.keys(this.prefixHandlers).some(prefix => 
            prefix.slice(0, -1) === prefixBase
        );
    }

    handleCustomFunction(value) {
        const cfnMatch = value.match(/^cfn-([^_]+)(?:_(.+))?$/);
        if (!cfnMatch) return value;

        const [, fnName, params] = cfnMatch;
        const customFn = this.config.customFunctions.get(fnName);
        
        if (!customFn) return value;
        if (!params) return customFn();

        const paramArray = params.split('_').map(p => this.processValue(p));
        return customFn(...paramArray);
    }

    handleTemplate(value) {
        const tplMatch = value.match(/^tpl-([^_]*)(?:_(.+))?$/);
        if (!tplMatch) return value;

        const [, templateName, params] = tplMatch;
        const template = this.config.templates.get(templateName);
        
        if (!template) return value;
        if (!params) return template;

        return this.processTemplate(template, params.split('_'));
    }

    processTemplate(template, params) {
        return params.reduce((result, param, index) => 
            result.replace(new RegExp(`§${index}`, 'g'), this.processValue(param)), template
        );
    }

    createRootRule(varName, value, className) {
        return `:root {\r\n  --${varName}: ${value}; /* ${className} */\r\n}`;
    }

    addToStylesheet(css) {
        const styleElement = this.getOrCreateStyleElement();
        styleElement.textContent += '\r\n' + css;
    }

    getOrCreateStyleElement() {
        let styleElement = document.getElementById('cssf-main');
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'cssf-main';
            document.head.appendChild(styleElement);
        }
        
        return styleElement;
    }

    getAllGeneratedCSS() {
        const styleElement = document.getElementById('cssf-main');
        return styleElement?.textContent || '';
    }

    clearGeneratedCSS() {
        const styleElement = document.getElementById('cssf-main');
        if (styleElement) styleElement.textContent = '';
        this.processedClasses.clear();
    }
}

// Initialisiere CSSF
const cssf = new CSSF();