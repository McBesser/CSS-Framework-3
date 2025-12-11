
if (typeof window.CSSF === 'undefined') {

class CSSF {
    constructor() {
        this.processedClasses = new Set();
        
        // Performance & Safety enhancements
        this.styleSheetContent = {
            root: [],
            base: new Map(), // selector -> { properties: [], isImportant: true }
            atRules: new Map(), // atRule string (media/container) -> Map(selector -> { properties: [], isImportant: true })
            keyframes: new Map(), // name -> css string
            fontFaces: new Set() // css strings
        };
        this.updateFrameId = null;
        this.MAX_RECURSION_DEPTH = 15;

        this.initializeConfig();
        this.setupPrefixHandlers();

        // Wait for the DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    _clampBuilder(minWidthPx, maxWidthPx, minFontSizePx, maxFontSizePx) {
        const pixelsPerRem = 16; // Assuming root font-size is 16px for consistency.

        const minFontSize = minFontSizePx / pixelsPerRem;
        const maxFontSize = maxFontSizePx / pixelsPerRem;

        const minWidth = minWidthPx / pixelsPerRem;
        const maxWidth = maxWidthPx / pixelsPerRem;

        if (maxWidth <= minWidth) {
            return `clamp(${minFontSize.toFixed(4)}rem, ${((minFontSize + maxFontSize) / 2).toFixed(4)}rem, ${maxFontSize.toFixed(4)}rem)`;
        }

        const slope = (maxFontSize - minFontSize) / (maxWidth - minWidth);
        const yAxisIntersection = -minWidth * slope + minFontSize;

        return `clamp(${minFontSize.toFixed(4)}rem, ${yAxisIntersection.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxFontSize.toFixed(4)}rem)`;
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
                w: 'width', h: 'height', maxw: 'max-width', maxh: 'max-height',
                minw: 'min-width', minh: 'min-height',
                bw: 'block-size', iw: 'inline-size', // bw = block-size (logical property)
                maxbw: 'max-block-size', maxiw: 'max-inline-size',
                minbw: 'min-block-size', miniw: 'min-inline-size',

                // Colors & Background
                bg: 'background', bgc: 'background-color', bgi: 'background-image',
                bgp: 'background-position', bgr: 'background-repeat', bgs: 'background-size',
                bga: 'background-attachment', bgo: 'background-origin', bgcl: 'background-clip',
                c: 'color', atc: 'accent-color', ctc: 'caret-color',

                // Typography
                fs: 'font-size', fstr: 'font-stretch', // fs = font-size (fstr für stretch)
                fw: 'font-weight', ff: 'font-family', fst: 'font-style',
                fv: 'font-variant', lh: 'line-height', ls: 'letter-spacing',
                ws: 'word-spacing', wb: 'word-break', ww: 'word-wrap', hy: 'hyphens',
                ta: 'text-align', td: 'text-decoration', tt: 'text-transform',
                ti: 'text-indent', ts: 'text-shadow', to: 'text-overflow',
                va: 'vertical-align', wm: 'writing-mode',
                lc: ['line-clamp', '-webkit-line-clamp'],

                // Display & Layout
                d: 'display', pos: 'position', t: 'top', r: 'right', b: 'bottom', l: 'left',
                z: 'z-index', fl: 'float', cl: 'clear', v: 'visibility', of: 'overflow',
                ofx: 'overflow-x', ofy: 'overflow-y', ofw: 'overflow-wrap',
                clip: 'clip-path', rs: 'resize', cur: 'cursor',

                // Flexbox
                f: 'flex', fd: 'flex-direction', fwrap: 'flex-wrap', // fwrap statt fw
                fflow: 'flex-flow', // fflow statt ff
                fg: 'flex-grow', fsh: 'flex-shrink', fb: 'flex-basis',
                jc: 'justify-content', ai: 'align-items', ac: 'align-content', // acont statt ac
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
                bradl: ['border-top-left-radius', 'border-bottom-left-radius'],
                bradr: ['border-top-right-radius', 'border-bottom-right-radius'],
                bradt: ['border-top-left-radius', 'border-top-right-radius'],
                bradb: ['border-bottom-left-radius', 'border-bottom-right-radius'],
                braddl: ['border-top-left-radius', 'border-bottom-right-radius'],
                braddr: ['border-top-right-radius', 'border-bottom-left-radius'],
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

            'test-color': 'cssf--val-color-1_hex-000000--val-color-2_hex-ffffff--val-color-3_hex-ffaaaa--val-color-4_hex-aaaaff--val-color-5_hex-ffffaa--val-color-6_hex-ffaaff--val-color-7_hex-aaffaa--val-color-8_hex-aaffff',
            'test-set1': 'cssf--br1_solid--color_black--px20--py10',
            'test-set2': 'cssf--br1_solid--color_white--px20--py10',
            'test-br1': 'cssf--br1_solid--color_black',
            'test-br2': 'cssf--br1_solid--color_white',
            /* -------------------------------------------------------------------------------------- */
            'teaser-lc': 'cssf--lc_§0--bo_vertical--text-overflow_ellipsis--d_-webkit-box--overflow_hidden',
            /* -------------------------------------------------------------------------------------- */
            'c-var': 'cssf--c_var-color-§0',
            'bg-var': 'cssf--bg_var-color-§0',
            'bgc-var': 'cssf--bgc_var-color-§0',
            'bc-var': 'cssf--bc_var-color-§0',
            /* -------------------------------------------------------------------------------------- */
            /* con_1200 = max-width: 1200 */
            'con': 'cssf--max-width§0px--m_auto--box-sizing_border-box--container-type_inline-size',
            /* -------------------------------------------------------------------------------------- */
            'flex-layout': 'cssf--d_flex--fd_row--fwrap_wrap--jc_start--ac_stretch--ai_stretch--container-type_inline-size',
            /* -------------------------------------------------------------------------------------- */
            'fcol20': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_5--max-width_fn-calc_100p_chr-slash_4--box-sizing_border-box',
            'fcol25': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_4--max-width_fn-calc_100p_chr-slash_4--box-sizing_border-box',
            'fcol33': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_3--max-width_fn-calc_100p_chr-slash_3--box-sizing_border-box',
            'fcol50': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_2--max-width_fn-calc_100p_chr-slash_2--box-sizing_border-box',
            'fcol66': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_3_chr-star_2--max-width_fn-calc_100p_chr-slash_2--box-sizing_border-box',
            'fcol75': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_4_chr-star_3--max-width_fn-calc_100p_chr-slash_2--box-sizing_border-box',
            /* -------------------------------------------------------------------------------------- */
            /* fcol25gx1_20 = gap 20px */
            'fcol20gx4': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_5_chr-dash§0--max-width_fn-calc_100p_chr-slash_5_chr-dash§0_chr-slash_5_chr-star_4--box-sizing_border-box',
            'fcol25gx1': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_4_chr-dash§0--max-width_fn-calc_100p_chr-slash_4_chr-dash§0_chr-slash_2_chr-star_1--box-sizing_border-box',
            'fcol25gx3': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_4_chr-dash§0--max-width_fn-calc_100p_chr-slash_4_chr-dash§0_chr-slash_4_chr-star_3--box-sizing_border-box',
            'fcol33gx2': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_3_chr-dash§0--max-width_fn-calc_100p_chr-slash_3_chr-dash§0_chr-slash_3_chr-star_2--box-sizing_border-box',
            'fcol50gx1': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_2_chr-dash§0--max-width_fn-calc_100p_chr-slash_2_chr-dash§0_chr-slash_2_chr-star_1--box-sizing_border-box',
            'fcol66gx1': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_3_chr-star_2_chr-dash§0--max-width_fn-calc_100p_chr-slash_2_chr-dash§0_chr-slash_2_chr-star_1--box-sizing_border-box',
            'fcol75gx1': 'cssf--f_1_1--flex-basis_fn-calc_100p_chr-slash_4_chr-star_3_chr-dash§0--max-width_fn-calc_100p_chr-slash_2_chr-dash§0_chr-slash_2_chr-star_1--box-sizing_border-box',
            /* -------------------------------------------------------------------------------------- */
            'fcol100': 'cssf--f_1_1_100p--box-sizing_border-box',
            'fcolauto': 'cssf--f_1_1_auto--box-sizing_border-box',
            /* -------------------------------------------------------------------------------------- */            
               'grid-layout-old': 'cssf--d_grid--grid-template-columns_tpl-grid-layout-cols-standard_var-layout-gap_var-layout-content_var-layout-outside--grid-template-rows_tpl-grid-layout-rows-standard_var-layout-gap--val-grid-layout-spacing_tpl-var_val-container-spacing_var-layout-gap--py_fn-calc_var-grid-layout-spacing_chr-slash_2--container-type_inline-size',
               'grid-layout': 'cssf--d_grid--grid-template-columns_tpl-grid-layout-cols-standard_var-layout-gap_var-layout-content_var-layout-outside--val-grid-layout-spacing_tpl-var_val-container-spacing_var-layout-gap--py_fn-calc_var-grid-layout-spacing_chr-slash_2--container-type_inline-size',
               'grid-layout-val': 'cssf--d_grid--grid-template-columns_tpl-grid-layout-cols-standard_§0_§1_§2--grid-template-rows_tpl-grid-layout-rows-standard_§0--container-type_inline-size',
               'grid-layout-main-gap': 'cssf--grid-layout-spacing_tpl-var_val-container-spacing_var-layout-gap--py_fn-calc_var-grid-layout-spacing_chr-slash_2',
               'layout-gap': 'cssf--gap_var-layout-gap',
               
               'grid-layout-cols-standard': '[full-start] minmax(§0, 1fr) [outside-start] minmax(0, calc((§2 - §1) / 2)) [content-start] min(100% - (§0 * 2), §1) [content-end] minmax(0, calc((§2 - §1) / 2)) [outside-end] minmax(§0, 1fr) [full-end]',
               'test-grid-layout-rows-standard': '[full-start] minmax(§0, 1fr) [outside-start] [content-start] [content-end] [outside-end] minmax(§0, 1fr) [full-end]',
               'grid-layout-rows-standard': 'auto',
               'clamp-size-standard': 'clamp(1rem, 1rem + calc((§0 - 1rem) / (§1 - 0rem) * 100)vw, §0)',
            /* -------------------------------------------------------------------------------------- */
            /* -------------------------------------------------------------------------------------- */
            'grid-brick-layout': 'cssf--d_grid--gtc_fn-repeat_12-1fr--gap_var-layout-gap--container-type_inline-size--ai_stretch',
            'gcolx1': 'cssf--gc_span_1',
            'gcolx2': 'cssf--gc_span_2',
            'gcolx3': 'cssf--gc_span_3',
            'gcolx4': 'cssf--gc_span_4',
            'gcolx5': 'cssf--gc_span_5',
            'gcolx6': 'cssf--gc_span_6',
            'gcolx7': 'cssf--gc_span_7',
            'gcolx8': 'cssf--gc_span_8',
            'gcolx9': 'cssf--gc_span_9',
            'gcolx10': 'cssf--gc_span_10',
            'gcolx11': 'cssf--gc_span_11',
            'gcolx12': 'cssf--gc_span_12',
            'gcol25': 'cssf--gc_span_3',
            'gcol33': 'cssf--gc_span_4',
            'gcol50': 'cssf--gc_span_6',
            'gcol66': 'cssf--gc_span_8',
            'gcol75': 'cssf--gc_span_9',
            'gcol100': 'cssf--gc_span_12',
            'growx1': 'cssf--gr_span_1',
            'growx2': 'cssf--gr_span_2',
            'growx3': 'cssf--gr_span_3',
            'growx4': 'cssf--gr_span_4',
            'growx5': 'cssf--gr_span_5',
            'growx6': 'cssf--gr_span_6',
            'growx7': 'cssf--gr_span_7',
            'growx8': 'cssf--gr_span_8',
            'growx9': 'cssf--gr_span_9',
            'growx10': 'cssf--gr_span_10',
            'growx11': 'cssf--gr_span_11',
            'growx12': 'cssf--gr_span_12',
            /* -------------------------------------------------------------------------------------- */
            'clamp-font-size': 'cssf--tpl-clamp-size-standard_font-size_var-cfs-font-size_var-cfs-width',
            'btn': 'cssf--px15--py10--cursor_pointer--brad_3pxrem_solid_var-btn-br-color',
            'hide': 'cssf--pos_absolute--h1px--w1px--of_hidden--tpl-rect_clip_1px_1px_1px_1px--ws_nowrap',
            'show': 'cssf--d_initial--pos_static--h_auto--w_auto--of_visible--clip_auto--ws_normal',
            'focus': 'cssf--tar-pc-focus',
            'before': 'cssf--tar-pe-before--content_str-',
            'after': 'cssf--tar-pe-after--content_str-',
            'overlay-background': 'cssf--pos_fixed--w100dvw--h100dvh--bg_tpl-rgba_0_0_0_50div100--z_-2',
            'overlay-foreground': 'cssf--pos_absolute--bg_tpl-rgba_255_255_255_100div100--z_-1--py40--w_fn-calc_100p_chr-plus_chr-lpar_40pxrem_chr-star_2_chr-rpar',
            'overlay-wrapper': 'cssf--pos_fixed--t50p--l50p--d_flex--transform_tpl-translate_-50p_-50p--jc_center--ai_center',
            'center': 'cssf--pos_absolute--t50p--l50p--transform_fn-translate_-50p_op-c_-50p',
            'center-x': 'cssf--pos_absolute--l50p--transform_fn-translateX_n50p',
            'center-y': 'cssf--pos_absolute--t50p--transform_fn-translateY_n50p',
               
               
               
               
               
               
               
               
               
                // msg
                msg: 'cssf--bgc_hex-§0--p10--bl_4pxrem_solid_hex-§1--mb20--d_block', 'msg-alert': 'cssf--tpl-msg_fff4e5_ffa500',
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
                translate1: 'translate(§0)', 
                translate: 'translate(§0 §1)', 
                translate2: 'translate(§0 §1)', 
                translate3: 'translate(§0 §1 §2)', 
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
                'var': 'var(§0, §1)',
                // outline-shadow_1px_black
                'outline-shadow': '-§0 0 0 §1, §0 0 0 §1, 0 -§0 0 §1, 0 §0 0 §1, -§0 -§0 0 §1, §0 -§0 0 §1, -§0 §0 0 §1, §0 §0 0 §1',
                'hyphens': 'hyphens: auto; hyphenate-limit-chars: 6 4 4; hyphenate-limit-lines: 2; hyphenate-character: "-"; word-break: normal',
                'line-clamp': 'line-clamp: §0; -webkit-line-clamp: §0; -webkit-box-orient: vertical; overflow: hidden; display: -webkit-box'
            }),
            
            customFunctions: this.createMap({
                'date-now': () => new Date().toLocaleDateString('de-DE'),
                'date-time': () => new Date().toLocaleString('de-DE'),
                timestamp: () => Date.now().toString(),
                random: () => Math.random().toString().substr(2, 6),
                year: () => new Date().getFullYear().toString(),
                month: () => (new Date().getMonth() + 1).toString(),
                day: () => new Date().getDate().toString(),
                clamp: (min, max, viewport) => {
                    const minFontSizePx = parseFloat(min);
                    const maxFontSizePx = parseFloat(max);
                    const maxWidthPx = parseFloat(viewport);
                    // Assuming a common mobile viewport as the minimum width, as it's not provided.
                    const minWidthPx = 0; // 320

                    if ([minFontSizePx, maxFontSizePx, maxWidthPx].some(isNaN)) {
                        return `clamp(${min}, ${max}, ${viewport})`;
                    }
                    
                    return this._clampBuilder(minWidthPx, maxWidthPx, minFontSizePx, maxFontSizePx);
                },
                
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
        // Defer initial processing to prevent blocking the main thread during page load.
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.processElementAndChildren(document.body));
        } else {
            setTimeout(() => this.processElementAndChildren(document.body), 100);
        }
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
           const context = this.parseClass(className);
           if (context) {
               this.storeRule(context);
               this.scheduleStyleUpdate();
           }
       } catch (error) {
           console.error(`Fehler beim Verarbeiten der Klasse ${className}:`, error);
       }
   }
   
   parseClass(className) {
       const cleanClass = className.substring(6);
       let parts = cleanClass.split('--');
       
       const noImportantIndex = parts.indexOf('ni');
       const isImportant = noImportantIndex === -1;
       if (!isImportant) {
           parts.splice(noImportantIndex, 1);
       }

       const context = {
           selector: `.${className}`,
           properties: [],
           atRule: null,
           rootRule: null,
           isImportant: isImportant,
           keyframes: null,
           fontFace: null
       };
       
       parts.forEach(part => this.processPart(part, context, className, 0));
       
       if (context.properties.length > 0 || context.rootRule || context.keyframes || context.fontFace) {
           return context;
       }
       return null;
   }

    processPart(part, context, className, depth) {
        if (depth > this.MAX_RECURSION_DEPTH) {
            console.warn(`CSSF: Max template recursion depth (${this.MAX_RECURSION_DEPTH}) exceeded for class "${className}". Aborting template expansion.`);
            return;
        }

        const processors = [
            { condition: p => p.startsWith('mq'), handler: p => context.atRule = this.handleMediaQuery(p) },
            { condition: p => p.startsWith('cq'), handler: p => context.atRule = this.handleContainerQuery(p) },
            { condition: p => p.startsWith('kf-'), handler: p => this.processKeyframesPart(p, context) },
            { condition: p => p.startsWith('fface-'), handler: p => this.processFontFacePart(p, context) },
            { condition: p => p.startsWith('tar-'), handler: p => context.selector = this.handleTargetSelector(p, className) },
            { condition: p => p.startsWith('val-'), handler: p => this.processValuePart(p, context) },
            { condition: p => p.startsWith('rval-'), handler: p => this.processRootValuePart(p, className, context) },
            { condition: p => p.startsWith('tpl-'), handler: p => this.processTemplatePart(p, context, className, depth) },
            { condition: () => true, handler: p => this.processDefaultPart(p, context) }
        ];

        const processor = processors.find(proc => proc.condition(part));
        if (processor) processor.handler(part);
    }

    handleMediaQuery(mqPart) {
        const matchNumeric = mqPart.match(/^mq(\d+)(max)?(?:-(.+))?$/);
        if (matchNumeric) {
            const widthClause = `(${matchNumeric[2] ? 'max' : 'min'}-width: ${matchNumeric[1]}px)`;
            const typeClause = matchNumeric[3] ? matchNumeric[3].replace(/_/g, ' ') : '';
            return `@media ${typeClause ? typeClause + ' and ' : ''}${widthClause}`;
        }
        
        const matchString = mqPart.match(/^mq-(.+)$/);
        if (matchString) {
            return `@media ${matchString[1].replace(/_/g, ' ')}`;
        }
        return null;
    }

    handleContainerQuery(cqPart) {
        const matchNumeric = cqPart.match(/^cq(\d+)(max)?(?:-(.+))?$/);
        if (matchNumeric) {
             const widthClause = `(${matchNumeric[2] ? 'max' : 'min'}-width: ${matchNumeric[1]}px)`;
             const nameClause = matchNumeric[3] ? matchNumeric[3].replace(/_/g, ' ') : '';
             return `@container ${nameClause ? nameClause + ' ' : ''}${widthClause}`;
        }
        
        const matchString = cqPart.match(/^cq-(.+)$/);
        if (matchString) {
            return `@container ${matchString[1].replace(/_/g, ' ')}`;
        }
        return null;
    }

    processKeyframesPart(part, context) {
        const tokens = part.split('_');
        const name = tokens[0].substring(3);
        
        let frames = new Map();
        let currentSelector = null;
        
        let i = 1;
        while(i < tokens.length) {
            const token = tokens[i];
            
            if (token === 'from' || token === 'to' || /^\d+p$/.test(token)) {
                currentSelector = token.replace('p', '%');
                if (!frames.has(currentSelector)) frames.set(currentSelector, []);
                i++;
                continue;
            }
            
            if (currentSelector) {
                const prop = token;
                i++; // move past prop
                const { value, consumed } = this.consumeValueTokens(tokens, i);
                
                if (value !== '') {
                    const cssProp = this.config.aliases.get(prop) || prop;
                    frames.get(currentSelector).push(`${cssProp}: ${value}`);
                    i += consumed;
                }
            } else {
                i++;
            }
        }
        
        let css = `@keyframes ${name} {\n`;
        for (const [sel, props] of frames) {
            css += `  ${sel} { ${props.join('; ')} }\n`;
        }
        css += `}`;
        
        context.keyframes = { name, css };
    }

    processFontFacePart(part, context) {
        const tokens = part.split('_');
        const name = tokens[0].substring(6);
        
        const props = [`font-family: "${name}"`];
        
        let i = 1;
        while(i < tokens.length) {
            const prop = tokens[i];
            i++;
            if(i >= tokens.length) break;

            const { value, consumed } = this.consumeValueTokens(tokens, i);
            const cssProp = this.config.aliases.get(prop) || prop;
            props.push(`${cssProp}: ${value}`);
            i += consumed;
        }
        
        const css = `@font-face {\n  ${props.join(';\n  ')};\n}`;
        context.fontFace = css;
    }

    consumeValueTokens(tokens, startIndex) {
        if (startIndex >= tokens.length) return { value: '', consumed: 0 };
        
        const startToken = tokens[startIndex];
        
        // Check for functions
        if (startToken.startsWith('fn-') || startToken.startsWith('cfn-')) {
            let closeIndex = -1;
            for (let j = startIndex + 1; j < tokens.length; j++) {
                if (tokens[j] === 'close') {
                    closeIndex = j;
                    break;
                }
            }
            
            if (closeIndex !== -1) {
                const chunk = tokens.slice(startIndex, closeIndex + 1).join('_');
                return { value: this.processValue(chunk), consumed: closeIndex - startIndex + 1 };
            } else {
                // Consume remaining if no close found (fallback, though strict usage requires close)
                const chunk = tokens.slice(startIndex).join('_');
                return { value: this.processValue(chunk), consumed: tokens.length - startIndex };
            }
        }
        
        // Check for templates with args
        if (startToken.startsWith('tpl-')) {
            const tplName = startToken.substring(4);
            const template = this.config.templates.get(tplName);
            if (template) {
                const matches = template.match(/§(\d+)/g);
                let maxIndex = -1;
                if (matches) {
                    matches.forEach(m => {
                        const idx = parseInt(m.substring(1));
                        if (idx > maxIndex) maxIndex = idx;
                    });
                }
                const argCount = maxIndex + 1;
                if (argCount > 0) {
                     const available = tokens.length - 1 - startIndex;
                     const consumeCount = Math.min(argCount, available);
                     const chunk = tokens.slice(startIndex, startIndex + 1 + consumeCount).join('_');
                     return { value: this.processValue(chunk), consumed: 1 + consumeCount };
                }
            }
        }

        // Default single token
        return { value: this.processValue(startToken), consumed: 1 };
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

   processTemplatePart(part, context, className, depth) {
       const [prop, ...valueParts] = part.split('_');
       const value = valueParts.join('_');
       const template = this.config.templates.get(prop.substring(4));
       
       if (!template) return;
       
       let processedTemplate = template;
       if (value) {
           const params = value.split('_');
           processedTemplate = params.reduce((result, param, index) => 
               result.replace(new RegExp(`§${index}`, 'g'), param), template);
       }
       
       if (processedTemplate.startsWith('cssf--')) {
           const cleanClass = processedTemplate.substring(6);
           const parts = cleanClass.split('--');
           
           parts.forEach(templatePart => {
               this.processPart(templatePart, context, className, depth + 1);
           });
           return;
       }
       
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
        if (Array.isArray(result.property)) {
            result.property.forEach(p => {
                context.properties.push(`${p}: ${result.value}`);
            });
        } else {
            context.properties.push(`${result.property}: ${result.value}`);
        }
    }

    buildCSSRule(selector, properties, isImportant) {
        const importantSuffix = isImportant ? ' !important' : '';
        return `${selector} {\r\n  ${properties.join(`${importantSuffix};\r\n  `)}${importantSuffix};\r\n}`;
    }

   _isSelectorInstruction(part) {
       return ['pc', 'pe', 'parent', 'self', 'next', 'child', 'all', 'tag', 'class', 'id'].includes(part);
   }

   _findNameEnd(parts, startIndex) {
       let index = startIndex;
       while (index < parts.length) {
           if (index > startIndex && this._isSelectorInstruction(parts[index])) {
               break;
           }
           index++;
       }
       return index;
   }

   handleTargetSelector(tarPart, originalClass) {
       const parts = tarPart.substring(4).split('-');
       let selector = `.${originalClass}`;
       let parentPrefix = '';

       const buildSelectorPart = (type, name) => {
           if (type === 'class') return `.${name}`;
           if (type === 'tag') return name;
           if (type === 'id') return `#${name}`;
           return '';
       };
       
       for (let i = 0; i < parts.length; i++) {
           const part = parts[i];
           
           if (part === 'pc') { // pseudo-class
               i = this.handlePseudoClass(parts, i, pseudoClass => selector += `:${pseudoClass}`);
               continue;
           }
           if (part === 'pe') { // pseudo-element
               i = this.handlePseudoElement(parts, i, pseudoElement => selector += `::${pseudoElement}`);
               continue;
           }
           if (part === 'parent') {
               i = this.handleParentSelector(parts, i, prefix => parentPrefix = prefix);
               continue;
           }
           if (part === 'self') {
               i = this.handleSelfSelector(parts, i, originalClass, newSelector => selector = newSelector);
               continue;
           }

           const combinatorMap = {
               next: ' + ',
               child: ' > ',
           };

           if (combinatorMap[part]) { // For next, child
               if (i + 2 < parts.length) {
                   const type = parts[i + 1];
                   const nameEndIndex = this._findNameEnd(parts, i + 2);
                   const name = parts.slice(i + 2, nameEndIndex).join('-');
                   selector += combinatorMap[part] + buildSelectorPart(type, name);
                   i = nameEndIndex - 1;
               }
           } else if (part === 'all') {
               selector += ' *';
           } else if (['tag', 'class', 'id'].includes(part)) { // For descendant
               if (i + 1 < parts.length) {
                   const type = part;
                   const nameEndIndex = this._findNameEnd(parts, i + 1);
                   const name = parts.slice(i + 1, nameEndIndex).join('-');
                   selector += ' ' + buildSelectorPart(type, name);
                   i = nameEndIndex - 1;
               }
           }
       }
       
       return parentPrefix + selector;
   }

   handlePseudoClass(parts, i, callback) {
       if (i + 1 < parts.length) {
           const pseudoClass = parts[++i];
           callback(pseudoClass);
       }
       return i;
   }

   handlePseudoElement(parts, i, callback) {
       if (i + 1 < parts.length) {
           const pseudoElement = parts[++i];
           callback(pseudoElement);
       }
       return i;
   }
    handleParentSelector(parts, i, callback) {
       if (i + 1 < parts.length) {
           const type = parts[++i];
           
           if (i + 1 < parts.length) {
               const nameEndIndex = this._findNameEnd(parts, i + 1);
               const selectorName = parts.slice(i + 1, nameEndIndex).join('-');
               
               const prefixMap = {
                   class: `.${selectorName} `,
                   tag: `${selectorName} `,
                   id: `#${selectorName} `
               };
               
               if (prefixMap[type]) {
                   callback(prefixMap[type]);
               }
               return nameEndIndex - 1;
           }
       }
       return i;
   }

   handleSelfSelector(parts, i, originalClass, callback) {
       if (i + 1 < parts.length) {
           const type = parts[++i];
           
           if (i + 1 < parts.length) {
               const nameEndIndex = this._findNameEnd(parts, i + 1);
               const selectorName = parts.slice(i + 1, nameEndIndex).join('-');
               
               const selectorMap = {
                   class: `.${selectorName}.${originalClass}`,
                   tag: `${selectorName}.${originalClass}`,
                   id: `#${selectorName}.${originalClass}`
               };
               
               if (selectorMap[type]) {
                   callback(selectorMap[type]);
               }
               return nameEndIndex - 1;
           }
       }
       return i;
   }

   processValue(value) {
       if (!value) return '';
       
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
        const aliasMatch = this.findAliasMatch(part);
        if (aliasMatch) return aliasMatch;
        
        const propertyMatch = this.findPropertyMatch(part);
        if (propertyMatch) return propertyMatch;
        
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
        const cssProperty = this.config.aliases.get(prop) || prop;
        
        const processedParts = [];
        let i = 0;
        let attachNext = false; // Controls if the next token attaches to the previous one without space
        
        while (i < valueParts.length) {
            const currentPart = valueParts[i];
            let val = '';
            let isGlue = false;
            let consumed = 0;
            
            // 1. Check for chrsl- (Seamless Character / No Space)
            if (currentPart.startsWith('chrsl-')) {
                const charName = currentPart.substring(6);
                val = this.config.chars.get(charName) || charName;
                isGlue = true;
                consumed = 0; 
            } 
            // 2. Check for Templates
            else if (currentPart.startsWith('tpl-')) {
                const tplName = currentPart.substring(4);
                const template = this.config.templates.get(tplName);
                if (template) {
                    const matches = template.match(/§(\d+)/g);
                    let maxIndex = -1;
                    if (matches) {
                        matches.forEach(m => {
                            const idx = parseInt(m.substring(1));
                            if (idx > maxIndex) maxIndex = idx;
                        });
                    }
                    const argCount = maxIndex + 1;
                    
                    if (argCount > 0) {
                        const availableArgs = valueParts.length - (i + 1);
                        const consumeCount = Math.min(argCount, availableArgs);
                        const args = valueParts.slice(i + 1, i + 1 + consumeCount);
                        const fullTplString = `${currentPart}_${args.join('_')}`;
                        val = this.processValue(fullTplString);
                        consumed = consumeCount;
                    } else {
                        val = this.processValue(currentPart);
                    }
                } else {
                    val = this.processValue(currentPart);
                }
            } 
            // 3. Check for Functions
            else if (currentPart.startsWith('fn-') || currentPart.startsWith('cfn-')) {
                let closeIndex = -1;
                for (let j = i + 1; j < valueParts.length; j++) {
                    if (valueParts[j] === 'close') {
                        closeIndex = j;
                        break;
                    }
                }
                
                if (closeIndex !== -1) {
                    const args = valueParts.slice(i + 1, closeIndex + 1);
                    const fullFnString = `${currentPart}_${args.join('_')}`;
                    val = this.processValue(fullFnString);
                    consumed = (closeIndex - i); 
                } else {
                    const rest = valueParts.slice(i);
                    const fullString = rest.join('_');
                    val = this.processValue(fullString);
                    consumed = valueParts.length - i - 1; 
                }
            } 
            // 4. Standard Value
            else {
                val = this.processValue(currentPart);
            }
            
            // Merging Logic: If attachNext is true (previous was glue) or current is glue
            if (processedParts.length > 0 && (attachNext || isGlue)) {
                processedParts[processedParts.length - 1] += val;
            } else {
                processedParts.push(val);
            }
            
            attachNext = isGlue;
            i += 1 + consumed;
        }
        
        return {
            property: cssProperty,
            value: processedParts.join(' ')
        };
    }

    createPropertyValue(property, processedValue) {
        return {
            property,
            value: /^-?\d+$/.test(processedValue) ? `${parseFloat(processedValue) / 16}rem` : processedValue
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
            pxrem: `${parseFloat(num) / 16}rem`,
            div10: `${parseFloat(num) / 10}`,
            div100: `${parseFloat(num) / 100}`
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
       const paramParts = params.split('_');
       
       let functionParams = [];
       let afterCloseParams = [];
       let foundClose = false;
       let attachNext = false; // glue flag

       for (let i = 0; i < paramParts.length; i++) {
           const part = paramParts[i];
           
           if (part === 'close') {
               foundClose = true;
               attachNext = false;
               continue;
           }

           let val = '';
           let isGlue = false;

           if (part.startsWith('chrsl-')) {
               const charName = part.substring(6);
               val = this.config.chars.get(charName) || charName;
               isGlue = true;
           } else {
               if (foundClose) {
                   val = this.processValue(part);
               } else {
                   val = this.processFunctionParameter(part);
               }
           }

           if (foundClose) {
               afterCloseParams.push(' ' + val);
           } else {
               if (functionParams.length > 0 && !attachNext && !isGlue) {
                   functionParams.push(' ');
               }
               functionParams.push(val);
               attachNext = isGlue;
           }
       }

       return `${fnName}(${functionParams.join('')})${afterCloseParams.join('')}`;
   }

   processFunctionParameter(param) {
       const prefixHandler = Object.entries(this.prefixHandlers)
           .find(([prefix]) => param.startsWith(prefix));
       
       if (prefixHandler) {
           return this.processValue(param);
       }
       
       const parts = param.split('-');
       const processedParts = [];
       
       for (let i = 0; i < parts.length; i++) {
           const prefixMatch = this.findPrefixMatch(parts, i);
           if (prefixMatch) {
               processedParts.push(this.processValue(`${parts[i]}-${parts[i + 1]}`));
               i++;
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

    storeRule(context) {
        if (context.rootRule) {
            if (!this.styleSheetContent.root.includes(context.rootRule)) {
                this.styleSheetContent.root.push(context.rootRule);
            }
        }
    
        if (context.keyframes) {
            this.styleSheetContent.keyframes.set(context.keyframes.name, context.keyframes.css);
        }

        if (context.fontFace) {
            this.styleSheetContent.fontFaces.add(context.fontFace);
        }

        if (context.properties.length > 0) {
            const ruleData = {
                properties: context.properties,
                isImportant: context.isImportant
            };
            if (context.atRule) {
                if (!this.styleSheetContent.atRules.has(context.atRule)) {
                    this.styleSheetContent.atRules.set(context.atRule, new Map());
                }
                this.styleSheetContent.atRules.get(context.atRule).set(context.selector, ruleData);
            } else {
                this.styleSheetContent.base.set(context.selector, ruleData);
            }
        }
    }

    scheduleStyleUpdate() {
        if (this.updateFrameId) return;
        this.updateFrameId = requestAnimationFrame(() => this.rebuildStylesheet());
    }
    
    rebuildStylesheet() {
        const styleElement = this.getOrCreateStyleElement();
        let cssChunks = [];
    
        if (this.styleSheetContent.root.length > 0) {
            cssChunks.push(...this.styleSheetContent.root);
        }
        
        if (this.styleSheetContent.fontFaces.size > 0) {
            cssChunks.push(...this.styleSheetContent.fontFaces);
        }

        if (this.styleSheetContent.keyframes.size > 0) {
            cssChunks.push(...this.styleSheetContent.keyframes.values());
        }
    
        for (const [selector, ruleData] of this.styleSheetContent.base.entries()) {
            cssChunks.push(this.buildCSSRule(selector, ruleData.properties, ruleData.isImportant));
        }
    
        const sortedAtRules = this.sortAtRules(Array.from(this.styleSheetContent.atRules.keys()));
        
        for (const atRule of sortedAtRules) {
            const rulesMap = this.styleSheetContent.atRules.get(atRule);
            const mediaRules = [];
            for (const [selector, ruleData] of rulesMap.entries()) {
                mediaRules.push(this.buildCSSRule(selector, ruleData.properties, ruleData.isImportant));
            }
            if (mediaRules.length > 0) {
                const indentedRules = mediaRules.join('\r\n').replace(/^/gm, '  ');
                cssChunks.push(`${atRule} {\r\n${indentedRules}\r\n}`);
            }
        }
        
        styleElement.textContent = cssChunks.join('\r\n\r\n');
        this.updateFrameId = null;
    }

    sortAtRules(atRules) {
        const getSortData = (rule) => {
            const isMedia = rule.startsWith('@media');
            const isContainer = rule.startsWith('@container');
            
            // Group 0: Media, Group 1: Container, Group 2: Others
            let group = 2;
            if (isMedia) group = 0;
            else if (isContainer) group = 1;

            const extractWidth = (r) => {
                const matchMin = r.match(/\(min-width:\s*(\d+)px\)/);
                if (matchMin) return parseInt(matchMin[1], 10);
                
                const matchMax = r.match(/\(max-width:\s*(\d+)px\)/);
                if (matchMax) return parseInt(matchMax[1], 10) + 100000;
                
                return Infinity;
            };

            return { group, size: extractWidth(rule) };
        };
    
        return atRules.sort((a, b) => {
            const dataA = getSortData(a);
            const dataB = getSortData(b);
            
            if (dataA.group !== dataB.group) {
                return dataA.group - dataB.group;
            }
            
            if (dataA.size !== dataB.size) {
                return dataA.size - dataB.size;
            }
            
            return a.localeCompare(b);
        });
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
        this.styleSheetContent = {
            root: [],
            base: new Map(),
            atRules: new Map(),
            keyframes: new Map(),
            fontFaces: new Set()
        };
        if (this.updateFrameId) {
            cancelAnimationFrame(this.updateFrameId);
            this.updateFrameId = null;
        }
    }
}

// Ensure the class is globally available
window.CSSF = CSSF;

// Initialisiere CSSF
window.cssf = new CSSF();

}
