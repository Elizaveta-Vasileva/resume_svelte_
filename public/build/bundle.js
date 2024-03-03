
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Header.svelte generated by Svelte v3.59.2 */

    const file$a = "src\\Header.svelte";

    function create_fragment$a(ctx) {
    	let header;
    	let ul;
    	let li0;
    	let a0;
    	let svg0;
    	let g0;
    	let path0;
    	let t0;
    	let li1;
    	let a1;
    	let svg1;
    	let g1;
    	let path1;
    	let t1;
    	let div;
    	let h1;
    	let t3;
    	let p;

    	const block = {
    		c: function create() {
    			header = element("header");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			svg0 = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			t0 = space();
    			li1 = element("li");
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			g1 = svg_element("g");
    			path1 = svg_element("path");
    			t1 = space();
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Elizaveta VASILEVA";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Data Science and Business Analytics student";
    			attr_dev(path0, "d", "M218.123122,218.127392 L180.191928,218.127392 L180.191928,158.724263 C180.191928,144.559023 179.939053,126.323993 160.463756,126.323993 C140.707926,126.323993 137.685284,141.757585 137.685284,157.692986 L137.685284,218.123441 L99.7540894,218.123441 L99.7540894,95.9665207 L136.168036,95.9665207 L136.168036,112.660562 L136.677736,112.660562 C144.102746,99.9650027 157.908637,92.3824528 172.605689,92.9280076 C211.050535,92.9280076 218.138927,118.216023 218.138927,151.114151 L218.123122,218.127392 Z M56.9550587,79.2685282 C44.7981969,79.2707099 34.9413443,69.4171797 34.9391618,57.260052 C34.93698,45.1029244 44.7902948,35.2458562 56.9471566,35.2436736 C69.1040185,35.2414916 78.9608713,45.0950217 78.963054,57.2521493 C78.9641017,63.090208 76.6459976,68.6895714 72.5186979,72.8184433 C68.3913982,76.9473153 62.7929898,79.26748 56.9550587,79.2685282 M75.9206558,218.127392 L37.94995,218.127392 L37.94995,95.9665207 L75.9206558,95.9665207 L75.9206558,218.127392 Z M237.033403,0.0182577091 L18.8895249,0.0182577091 C8.57959469,-0.0980923971 0.124827038,8.16056231 -0.001,18.4706066 L-0.001,237.524091 C0.120519052,247.839103 8.57460631,256.105934 18.8895249,255.9977 L237.033403,255.9977 C247.368728,256.125818 255.855922,247.859464 255.999,237.524091 L255.999,18.4548016 C255.851624,8.12438979 247.363742,-0.133792868 237.033403,0.000790807055");
    			add_location(path0, file$a, 13, 28, 613);
    			add_location(g0, file$a, 12, 24, 580);
    			attr_dev(svg0, "class", "w-5 h-5 fill-current");
    			attr_dev(svg0, "role", "img");
    			attr_dev(svg0, "viewBox", "0 0 256 256");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$a, 10, 20, 427);
    			attr_dev(a0, "href", "https://www.linkedin.com/in/elizaveta-vasileva/");
    			attr_dev(a0, "class", "bg-blue-600 p-2 font-semibold text-white inline-flex items-center space-x-2 rounded");
    			attr_dev(a0, "target", "”_blank”");
    			add_location(a0, file$a, 7, 16, 197);
    			add_location(li0, file$a, 6, 12, 175);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "clip-rule", "evenodd");
    			attr_dev(path1, "d", "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z");
    			attr_dev(path1, "fill", "currentColor");
    			add_location(path1, file$a, 29, 28, 2725);
    			attr_dev(g1, "fill", "none");
    			add_location(g1, file$a, 28, 24, 2680);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg1, "aria-hidden", "true");
    			attr_dev(svg1, "role", "img");
    			attr_dev(svg1, "class", "w-5");
    			attr_dev(svg1, "preserveAspectRatio", "xMidYMid meet");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file$a, 25, 20, 2423);
    			attr_dev(a1, "href", "https://github.com/Elizaveta-Vasileva");
    			attr_dev(a1, "class", "bg-gray-700 p-2 font-medium text-white inline-flex items-center space-x-2 rounded");
    			attr_dev(a1, "target", "”_blank”");
    			add_location(a1, file$a, 22, 16, 2205);
    			add_location(li1, file$a, 20, 12, 2150);
    			attr_dev(ul, "class", "flex flex-wrap justify-end gap-2");
    			add_location(ul, file$a, 4, 8, 85);
    			attr_dev(h1, "class", "text-7xl font-extrabold");
    			add_location(h1, file$a, 40, 16, 3757);
    			attr_dev(p, "class", "text-xl mt-5");
    			add_location(p, file$a, 41, 16, 3834);
    			attr_dev(div, "class", "flex justify-between items-right");
    			add_location(div, file$a, 39, 12, 3693);
    			add_location(header, file$a, 2, 4, 37);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, g0);
    			append_dev(g0, path0);
    			append_dev(ul, t0);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, g1);
    			append_dev(g1, path1);
    			append_dev(header, t1);
    			append_dev(header, div);
    			append_dev(div, h1);
    			append_dev(div, t3);
    			append_dev(div, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\ContactInfo.svelte generated by Svelte v3.59.2 */

    const file$9 = "src\\ContactInfo.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let ul;
    	let li0;
    	let strong0;
    	let t1;
    	let a0;
    	let t3;
    	let li1;
    	let strong1;
    	let t5;
    	let a1;
    	let t7;
    	let li2;
    	let strong2;
    	let span;

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			strong0 = element("strong");
    			strong0.textContent = "Phone";
    			t1 = space();
    			a0 = element("a");
    			a0.textContent = "+33 6 62 82 79 87";
    			t3 = space();
    			li1 = element("li");
    			strong1 = element("strong");
    			strong1.textContent = "E-mail";
    			t5 = space();
    			a1 = element("a");
    			a1.textContent = "elivaa1405@gmail.com";
    			t7 = space();
    			li2 = element("li");
    			strong2 = element("strong");
    			strong2.textContent = "Location";
    			span = element("span");
    			span.textContent = "Paris,\r\n                    France";
    			attr_dev(strong0, "class", "mr-1");
    			add_location(strong0, file$9, 5, 34, 130);
    			attr_dev(a0, "href", "tel:+821023456789");
    			attr_dev(a0, "class", "block");
    			add_location(a0, file$9, 6, 16, 184);
    			attr_dev(li0, "class", "px-2 mt-1");
    			add_location(li0, file$9, 5, 12, 108);
    			attr_dev(strong1, "class", "mr-1");
    			add_location(strong1, file$9, 8, 34, 302);
    			attr_dev(a1, "href", "mailto:");
    			attr_dev(a1, "class", "block");
    			add_location(a1, file$9, 9, 16, 357);
    			attr_dev(li1, "class", "px-2 mt-1");
    			add_location(li1, file$9, 8, 12, 280);
    			attr_dev(strong2, "class", "mr-1");
    			add_location(strong2, file$9, 11, 34, 468);
    			attr_dev(span, "class", "block");
    			add_location(span, file$9, 11, 72, 506);
    			attr_dev(li2, "class", "px-2 mt-1");
    			add_location(li2, file$9, 11, 12, 446);
    			attr_dev(ul, "class", "mt-2 mb-10");
    			add_location(ul, file$9, 4, 8, 71);
    			attr_dev(div, "class", "w-2/6");
    			add_location(div, file$9, 2, 4, 8);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, strong0);
    			append_dev(li0, t1);
    			append_dev(li0, a0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, strong1);
    			append_dev(li1, t5);
    			append_dev(li1, a1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, strong2);
    			append_dev(li2, span);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ContactInfo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ContactInfo> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ContactInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactInfo",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\CodingLanguages.svelte generated by Svelte v3.59.2 */

    const file$8 = "src\\CodingLanguages.svelte";

    function create_fragment$8(ctx) {
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;
    	let t7;
    	let li4;
    	let t9;
    	let li5;
    	let t11;
    	let li6;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "HTML";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "CSS";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "Python";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "SQL";
    			t7 = space();
    			li4 = element("li");
    			li4.textContent = "C++";
    			t9 = space();
    			li5 = element("li");
    			li5.textContent = "Tableau";
    			t11 = space();
    			li6 = element("li");
    			li6.textContent = "Figma";
    			attr_dev(li0, "class", "px-2 mt-1");
    			add_location(li0, file$8, 1, 4, 29);
    			attr_dev(li1, "class", "px-2 mt-1");
    			add_location(li1, file$8, 2, 4, 66);
    			attr_dev(li2, "class", "px-2 mt-1");
    			add_location(li2, file$8, 3, 4, 102);
    			attr_dev(li3, "class", "px-2 mt-1");
    			add_location(li3, file$8, 4, 4, 141);
    			attr_dev(li4, "class", "px-2 mt-1");
    			add_location(li4, file$8, 5, 4, 177);
    			attr_dev(li5, "class", "px-2 mt-1");
    			add_location(li5, file$8, 6, 4, 213);
    			attr_dev(li6, "class", "px-2 mt-1");
    			add_location(li6, file$8, 7, 4, 253);
    			attr_dev(ul, "class", "mt-2 mb-10");
    			add_location(ul, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(ul, t7);
    			append_dev(ul, li4);
    			append_dev(ul, t9);
    			append_dev(ul, li5);
    			append_dev(ul, t11);
    			append_dev(ul, li6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CodingLanguages', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CodingLanguages> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CodingLanguages extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CodingLanguages",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Languages.svelte generated by Svelte v3.59.2 */

    const file$7 = "src\\Languages.svelte";

    function create_fragment$7(ctx) {
    	let ul0;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;
    	let t7;
    	let strong;
    	let t9;
    	let ul1;
    	let li4;
    	let t11;
    	let li5;
    	let t13;
    	let li6;

    	const block = {
    		c: function create() {
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Russian - native";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "English - advanced";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "French - advanced";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "French - elementary";
    			t7 = space();
    			strong = element("strong");
    			strong.textContent = "Microsoft Office";
    			t9 = space();
    			ul1 = element("ul");
    			li4 = element("li");
    			li4.textContent = "Excel";
    			t11 = space();
    			li5 = element("li");
    			li5.textContent = "Word";
    			t13 = space();
    			li6 = element("li");
    			li6.textContent = "PowerPoint";
    			attr_dev(li0, "class", "px-2 mt-1");
    			add_location(li0, file$7, 1, 20, 61);
    			attr_dev(li1, "class", "px-2 mt-1");
    			add_location(li1, file$7, 2, 20, 127);
    			attr_dev(li2, "class", "px-2 mt-1");
    			add_location(li2, file$7, 3, 20, 195);
    			attr_dev(li3, "class", "px-2 mt-1");
    			add_location(li3, file$7, 4, 20, 262);
    			attr_dev(ul0, "class", "mt-2 mb-10");
    			add_location(ul0, file$7, 0, 16, 16);
    			attr_dev(strong, "class", "text-xl font-medium");
    			add_location(strong, file$7, 7, 16, 405);
    			attr_dev(li4, "class", "px-2 mt-1");
    			add_location(li4, file$7, 9, 20, 529);
    			attr_dev(li5, "class", "px-2 mt-1");
    			add_location(li5, file$7, 10, 20, 583);
    			attr_dev(li6, "class", "px-2 mt-1");
    			add_location(li6, file$7, 11, 20, 636);
    			attr_dev(ul1, "class", "mt-2 mb-10");
    			add_location(ul1, file$7, 8, 16, 484);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(ul0, t1);
    			append_dev(ul0, li1);
    			append_dev(ul0, t3);
    			append_dev(ul0, li2);
    			append_dev(ul0, t5);
    			append_dev(ul0, li3);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, strong, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, li4);
    			append_dev(ul1, t11);
    			append_dev(ul1, li5);
    			append_dev(ul1, t13);
    			append_dev(ul1, li6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(strong);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(ul1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Languages', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Languages> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Languages extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Languages",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Hobbies.svelte generated by Svelte v3.59.2 */

    const file$6 = "src\\Hobbies.svelte";

    function create_fragment$6(ctx) {
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Drawing";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Travel";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "Literature";
    			attr_dev(li0, "class", "px-2 mt-1");
    			add_location(li0, file$6, 2, 20, 57);
    			attr_dev(li1, "class", "px-2 mt-1");
    			add_location(li1, file$6, 3, 20, 113);
    			attr_dev(li2, "class", "px-2 mt-1");
    			add_location(li2, file$6, 4, 20, 168);
    			attr_dev(ul, "class", "mt-2");
    			add_location(ul, file$6, 1, 16, 18);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hobbies', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hobbies> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Hobbies extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hobbies",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Objective.svelte generated by Svelte v3.59.2 */

    const file$5 = "src\\Objective.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let section;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			section = element("section");
    			p = element("p");
    			p.textContent = "Goal-oriented, high achiever, I have a logical mind while maintaining a curious and creative spirit. Great team player with strong\r\n            sense of ownership and a tendency to lead projects. I am at ease in multicultural environments. Looking for a challenging role to\r\n            grow fast and acquire new competences and skills during the 4-month internship.";
    			attr_dev(p, "class", "mt-4 text-xs");
    			add_location(p, file$5, 4, 8, 88);
    			add_location(section, file$5, 2, 4, 42);
    			attr_dev(div, "class", "w-4/6");
    			add_location(div, file$5, 1, 1, 17);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, section);
    			append_dev(section, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Objective', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Objective> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Objective extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Objective",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Education.svelte generated by Svelte v3.59.2 */

    const file$4 = "src\\Education.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let ul;
    	let li0;
    	let p0;
    	let strong0;
    	let t1;
    	let t2;
    	let p1;
    	let t4;
    	let li1;
    	let p2;
    	let strong1;
    	let t6;
    	let t7;
    	let p3;

    	const block = {
    		c: function create() {
    			section = element("section");
    			ul = element("ul");
    			li0 = element("li");
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "ESSEC&CentraleSupelec, Master in Data Sciences and Business Analytics ";
    			t1 = text("2023-2025");
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Relevant Courses: Data bases, Probabilities & Statistics, Python, Algorithms & Complexity";
    			t4 = space();
    			li1 = element("li");
    			p2 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "IESEG School of Management, Bachelor in International Business";
    			t6 = text("2020-2023");
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Relevant Courses: Advanced Quantitative Methods, Financial Engineering, Strategy, Corporate Finance";
    			attr_dev(strong0, "class", "text-base");
    			add_location(strong0, file$4, 4, 51, 136);
    			attr_dev(p0, "class", "flex justify-between text-sm");
    			add_location(p0, file$4, 4, 11, 96);
    			attr_dev(p1, "class", "flex justify-between text-sm");
    			add_location(p1, file$4, 5, 11, 267);
    			attr_dev(li0, "class", "pt-2");
    			add_location(li0, file$4, 3, 7, 66);
    			attr_dev(strong1, "class", "text-base");
    			add_location(strong1, file$4, 8, 51, 494);
    			attr_dev(p2, "class", "flex justify-between text-sm");
    			add_location(p2, file$4, 8, 11, 454);
    			attr_dev(p3, "class", "flex justify-between text-sm");
    			add_location(p3, file$4, 9, 11, 617);
    			attr_dev(li1, "class", "pt-2");
    			add_location(li1, file$4, 7, 7, 424);
    			attr_dev(ul, "class", "mt-2");
    			add_location(ul, file$4, 2, 3, 40);
    			add_location(section, file$4, 1, 3, 26);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			append_dev(li0, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, t1);
    			append_dev(li0, t2);
    			append_dev(li0, p1);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, p2);
    			append_dev(p2, strong1);
    			append_dev(p2, t6);
    			append_dev(li1, t7);
    			append_dev(li1, p3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Education', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Education> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Education extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Education",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Experience.svelte generated by Svelte v3.59.2 */

    const file$3 = "src\\Experience.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let ul;
    	let li0;
    	let p0;
    	let strong0;
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let small0;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let li1;
    	let p4;
    	let strong1;
    	let t11;
    	let t12;
    	let p5;
    	let t13;
    	let small1;
    	let t15;
    	let p6;
    	let t17;
    	let p7;
    	let t19;
    	let p8;
    	let t21;
    	let li2;
    	let p9;
    	let strong2;
    	let t23;
    	let t24;
    	let p10;
    	let t25;
    	let small2;
    	let t27;
    	let p11;
    	let t29;
    	let p12;
    	let t31;
    	let p13;

    	const block = {
    		c: function create() {
    			section = element("section");
    			ul = element("ul");
    			li0 = element("li");
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "IESEG Finance";
    			t1 = text("2021-2022");
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Events&Sponsors Manager");
    			small0 = element("small");
    			small0.textContent = "Paris";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "• Organized conferences and events, prospected the speakers from such companies, as EY, Coinhouse, CFA etc.";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "• Attracted sponsors and partnerships for association from Clearwater";
    			t9 = space();
    			li1 = element("li");
    			p4 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Glamour Apartments";
    			t11 = text("June 2022 - August 2022");
    			t12 = space();
    			p5 = element("p");
    			t13 = text("Real Estate Agent");
    			small1 = element("small");
    			small1.textContent = "Paris";
    			t15 = space();
    			p6 = element("p");
    			p6.textContent = "• Managed the rented properties";
    			t17 = space();
    			p7 = element("p");
    			p7.textContent = "• Followed-up clients and made contracts for a total sum of 3000€";
    			t19 = space();
    			p8 = element("p");
    			p8.textContent = "• Organized the CRM system of about 4000 apartments";
    			t21 = space();
    			li2 = element("li");
    			p9 = element("p");
    			strong2 = element("strong");
    			strong2.textContent = "Lisan Finance";
    			t23 = text("June 2021 - August 2021");
    			t24 = space();
    			p10 = element("p");
    			t25 = text("Junior Consultant Intern");
    			small2 = element("small");
    			small2.textContent = "Paris";
    			t27 = space();
    			p11 = element("p");
    			p11.textContent = "• Assisted and supported the senior consultants in the performance of Due Diligences";
    			t29 = space();
    			p12 = element("p");
    			p12.textContent = "• Monthly updated and followed Financial Reports of the international clients";
    			t31 = space();
    			p13 = element("p");
    			p13.textContent = "• Uniformized and organized Accounting Books";
    			attr_dev(strong0, "class", "text-base");
    			add_location(strong0, file$3, 5, 49, 135);
    			attr_dev(p0, "class", "flex justify-between text-sm");
    			add_location(p0, file$3, 5, 9, 95);
    			add_location(small0, file$3, 6, 74, 272);
    			attr_dev(p1, "class", "flex justify-between text-base");
    			add_location(p1, file$3, 6, 9, 207);
    			attr_dev(p2, "class", "text-justify text-xs");
    			add_location(p2, file$3, 7, 9, 307);
    			attr_dev(p3, "class", "text-justify text-xs");
    			add_location(p3, file$3, 9, 9, 475);
    			attr_dev(li0, "class", "pt-2");
    			add_location(li0, file$3, 4, 5, 67);
    			attr_dev(strong1, "class", "text-base");
    			add_location(strong1, file$3, 13, 49, 679);
    			attr_dev(p4, "class", "flex justify-between text-sm");
    			add_location(p4, file$3, 13, 9, 639);
    			add_location(small1, file$3, 14, 68, 829);
    			attr_dev(p5, "class", "flex justify-between text-base");
    			add_location(p5, file$3, 14, 9, 770);
    			attr_dev(p6, "class", "text-justify text-xs");
    			add_location(p6, file$3, 15, 9, 864);
    			attr_dev(p7, "class", "text-justify text-xs");
    			add_location(p7, file$3, 17, 9, 954);
    			attr_dev(p8, "class", "text-justify text-xs");
    			add_location(p8, file$3, 19, 9, 1078);
    			attr_dev(li1, "class", "pt-2");
    			add_location(li1, file$3, 12, 5, 611);
    			attr_dev(strong2, "class", "text-base");
    			add_location(strong2, file$3, 24, 49, 1265);
    			attr_dev(p9, "class", "flex justify-between text-sm");
    			add_location(p9, file$3, 24, 9, 1225);
    			add_location(small2, file$3, 25, 75, 1417);
    			attr_dev(p10, "class", "flex justify-between text-base");
    			add_location(p10, file$3, 25, 9, 1351);
    			attr_dev(p11, "class", "text-justify text-xs");
    			add_location(p11, file$3, 26, 9, 1452);
    			attr_dev(p12, "class", "text-justify text-xs");
    			add_location(p12, file$3, 28, 9, 1594);
    			attr_dev(p13, "class", "text-justify text-xs");
    			add_location(p13, file$3, 30, 9, 1729);
    			attr_dev(li2, "class", "pt-2");
    			add_location(li2, file$3, 23, 5, 1197);
    			attr_dev(ul, "class", "mt-2");
    			add_location(ul, file$3, 3, 1, 43);
    			add_location(section, file$3, 1, 1, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			append_dev(li0, p0);
    			append_dev(p0, strong0);
    			append_dev(p0, t1);
    			append_dev(li0, t2);
    			append_dev(li0, p1);
    			append_dev(p1, t3);
    			append_dev(p1, small0);
    			append_dev(li0, t5);
    			append_dev(li0, p2);
    			append_dev(li0, t7);
    			append_dev(li0, p3);
    			append_dev(ul, t9);
    			append_dev(ul, li1);
    			append_dev(li1, p4);
    			append_dev(p4, strong1);
    			append_dev(p4, t11);
    			append_dev(li1, t12);
    			append_dev(li1, p5);
    			append_dev(p5, t13);
    			append_dev(p5, small1);
    			append_dev(li1, t15);
    			append_dev(li1, p6);
    			append_dev(li1, t17);
    			append_dev(li1, p7);
    			append_dev(li1, t19);
    			append_dev(li1, p8);
    			append_dev(ul, t21);
    			append_dev(ul, li2);
    			append_dev(li2, p9);
    			append_dev(p9, strong2);
    			append_dev(p9, t23);
    			append_dev(li2, t24);
    			append_dev(li2, p10);
    			append_dev(p10, t25);
    			append_dev(p10, small2);
    			append_dev(li2, t27);
    			append_dev(li2, p11);
    			append_dev(li2, t29);
    			append_dev(li2, p12);
    			append_dev(li2, t31);
    			append_dev(li2, p13);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Experience', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Experience> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Experience extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Experience",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Projects.svelte generated by Svelte v3.59.2 */

    const file$2 = "src\\Projects.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let ul;
    	let li0;
    	let div0;
    	let strong0;
    	let t1;
    	let p0;
    	let t3;
    	let li1;
    	let div1;
    	let strong1;
    	let t5;
    	let p1;
    	let t7;
    	let li2;
    	let div2;
    	let strong2;
    	let t9;
    	let p2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			ul = element("ul");
    			li0 = element("li");
    			div0 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Colombus Consulting";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "• In 2022 conducted the consulting team project \"The way sustainable business model transformation require corporate\r\n                culture to evolve\" for Colombus Consulting";
    			t3 = space();
    			li1 = element("li");
    			div1 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "Metlife";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "• In 2019 participated in team competition, organized by Metlife for working on the investment portfolio: creating diversified\r\n                portfolio with bonds, stocks and loans";
    			t7 = space();
    			li2 = element("li");
    			div2 = element("div");
    			strong2 = element("strong");
    			strong2.textContent = "Boeing";
    			t9 = space();
    			p2 = element("p");
    			p2.textContent = "• In 2018 participated in team competition, organized by Boeing for developing a business plan: the sales strategy for the\r\n                airline";
    			add_location(strong0, file$2, 5, 16, 153);
    			attr_dev(div0, "class", "flex justify-between my-1");
    			add_location(div0, file$2, 4, 12, 96);
    			attr_dev(p0, "class", "text-xs");
    			add_location(p0, file$2, 9, 12, 253);
    			attr_dev(li0, "class", "py-2");
    			add_location(li0, file$2, 3, 8, 65);
    			add_location(strong1, file$2, 15, 16, 583);
    			attr_dev(div1, "class", "flex justify-between my-1");
    			add_location(div1, file$2, 14, 12, 526);
    			attr_dev(p1, "class", "text-xs");
    			add_location(p1, file$2, 19, 12, 671);
    			attr_dev(li1, "class", "py-2");
    			add_location(li1, file$2, 13, 8, 495);
    			add_location(strong2, file$2, 26, 16, 1025);
    			attr_dev(div2, "class", "flex justify-between my-1");
    			add_location(div2, file$2, 25, 12, 968);
    			attr_dev(p2, "class", "text-xs");
    			add_location(p2, file$2, 30, 12, 1112);
    			attr_dev(li2, "class", "py-2");
    			add_location(li2, file$2, 24, 8, 937);
    			attr_dev(ul, "class", "mt-1");
    			add_location(ul, file$2, 2, 4, 38);
    			add_location(section, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			append_dev(li0, div0);
    			append_dev(div0, strong0);
    			append_dev(li0, t1);
    			append_dev(li0, p0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, div1);
    			append_dev(div1, strong1);
    			append_dev(li1, t5);
    			append_dev(li1, p1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, div2);
    			append_dev(div2, strong2);
    			append_dev(li2, t9);
    			append_dev(li2, p2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Projects', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Toggle.svelte generated by Svelte v3.59.2 */

    const file$1 = "src\\Toggle.svelte";

    function create_fragment$1(ctx) {
    	let label;
    	let input;
    	let t;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t = space();
    			span = element("span");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-pcr4c2");
    			add_location(input, file$1, 9, 4, 147);
    			attr_dev(span, "class", "slider svelte-pcr4c2");
    			add_location(span, file$1, 10, 4, 199);
    			attr_dev(label, "class", "switch svelte-pcr4c2");
    			add_location(label, file$1, 8, 2, 119);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			append_dev(label, t);
    			append_dev(label, span);

    			if (!mounted) {
    				dispose = listen_dev(
    					input,
    					"change",
    					function () {
    						if (is_function(/*toggleMode*/ ctx[0])) /*toggleMode*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Toggle', slots, []);
    	const darkMode = false;
    	let { toggleMode } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (toggleMode === undefined && !('toggleMode' in $$props || $$self.$$.bound[$$self.$$.props['toggleMode']])) {
    			console.warn("<Toggle> was created without expected prop 'toggleMode'");
    		}
    	});

    	const writable_props = ['toggleMode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toggle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('toggleMode' in $$props) $$invalidate(0, toggleMode = $$props.toggleMode);
    	};

    	$$self.$capture_state = () => ({ darkMode, toggleMode });

    	$$self.$inject_state = $$props => {
    		if ('toggleMode' in $$props) $$invalidate(0, toggleMode = $$props.toggleMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toggleMode, darkMode];
    }

    class Toggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { darkMode: 1, toggleMode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggle",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get darkMode() {
    		return this.$$.ctx[1];
    	}

    	set darkMode(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleMode() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleMode(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let link0;
    	let t0;
    	let main;
    	let head;
    	let meta0;
    	let t1;
    	let meta1;
    	let t2;
    	let meta2;
    	let t3;
    	let title;
    	let t5;
    	let link1;
    	let t6;
    	let body;
    	let div4;
    	let header;
    	let t7;
    	let div3;
    	let div0;
    	let section0;
    	let h20;
    	let t9;
    	let contactinfo;
    	let t10;
    	let section1;
    	let h21;
    	let t12;
    	let codinglanguages;
    	let t13;
    	let section2;
    	let h22;
    	let t15;
    	let languages;
    	let t16;
    	let section3;
    	let h23;
    	let t18;
    	let hobbies;
    	let t19;
    	let div2;
    	let section4;
    	let h24;
    	let t21;
    	let objective;
    	let t22;
    	let section5;
    	let h25;
    	let t24;
    	let education;
    	let t25;
    	let section6;
    	let h26;
    	let t27;
    	let experience;
    	let t28;
    	let section7;
    	let h27;
    	let t30;
    	let projects;
    	let t31;
    	let div1;
    	let toggle;
    	let current;
    	header = new Header({ $$inline: true });
    	contactinfo = new ContactInfo({ $$inline: true });
    	codinglanguages = new CodingLanguages({ $$inline: true });
    	languages = new Languages({ $$inline: true });
    	hobbies = new Hobbies({ $$inline: true });
    	objective = new Objective({ $$inline: true });
    	education = new Education({ $$inline: true });
    	experience = new Experience({ $$inline: true });
    	projects = new Projects({ $$inline: true });

    	toggle = new Toggle({
    			props: {
    				darkMode: /*darkMode*/ ctx[0],
    				toggleMode: /*toggleMode*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			t0 = space();
    			main = element("main");
    			head = element("head");
    			meta0 = element("meta");
    			t1 = space();
    			meta1 = element("meta");
    			t2 = space();
    			meta2 = element("meta");
    			t3 = space();
    			title = element("title");
    			title.textContent = "CV Vasileva Elizaveta";
    			t5 = space();
    			link1 = element("link");
    			t6 = space();
    			body = element("body");
    			div4 = element("div");
    			create_component(header.$$.fragment);
    			t7 = space();
    			div3 = element("div");
    			div0 = element("div");
    			section0 = element("section");
    			h20 = element("h2");
    			h20.textContent = "Contact Information";
    			t9 = space();
    			create_component(contactinfo.$$.fragment);
    			t10 = space();
    			section1 = element("section");
    			h21 = element("h2");
    			h21.textContent = "Coding Languages";
    			t12 = space();
    			create_component(codinglanguages.$$.fragment);
    			t13 = space();
    			section2 = element("section");
    			h22 = element("h2");
    			h22.textContent = "Languages";
    			t15 = space();
    			create_component(languages.$$.fragment);
    			t16 = space();
    			section3 = element("section");
    			h23 = element("h2");
    			h23.textContent = "Hobbies";
    			t18 = space();
    			create_component(hobbies.$$.fragment);
    			t19 = space();
    			div2 = element("div");
    			section4 = element("section");
    			h24 = element("h2");
    			h24.textContent = "Objective";
    			t21 = space();
    			create_component(objective.$$.fragment);
    			t22 = space();
    			section5 = element("section");
    			h25 = element("h2");
    			h25.textContent = "Education";
    			t24 = space();
    			create_component(education.$$.fragment);
    			t25 = space();
    			section6 = element("section");
    			h26 = element("h2");
    			h26.textContent = "Experience";
    			t27 = space();
    			create_component(experience.$$.fragment);
    			t28 = space();
    			section7 = element("section");
    			h27 = element("h2");
    			h27.textContent = "Projects";
    			t30 = space();
    			create_component(projects.$$.fragment);
    			t31 = space();
    			div1 = element("div");
    			create_component(toggle.$$.fragment);
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "href", "global.css");
    			add_location(link0, file, 22, 0, 683);
    			attr_dev(meta0, "charset", "UTF-8");
    			add_location(meta0, file, 26, 2, 771);
    			attr_dev(meta1, "http-equiv", "X-UA-Compatible");
    			attr_dev(meta1, "content", "IE=edge");
    			add_location(meta1, file, 27, 2, 796);
    			attr_dev(meta2, "name", "viewport");
    			attr_dev(meta2, "content", "width=device-width, initial-scale=1.0");
    			add_location(meta2, file, 28, 2, 852);
    			add_location(title, file, 29, 2, 925);
    			attr_dev(link1, "href", "https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css");
    			attr_dev(link1, "rel", "stylesheet");
    			add_location(link1, file, 30, 2, 964);
    			add_location(head, file, 25, 1, 762);
    			add_location(h20, file, 40, 6, 1296);
    			attr_dev(section0, "id", "contact");
    			add_location(section0, file, 39, 5, 1267);
    			add_location(h21, file, 45, 6, 1410);
    			attr_dev(section1, "id", "coding-languages");
    			add_location(section1, file, 44, 5, 1372);
    			add_location(h22, file, 50, 6, 1518);
    			attr_dev(section2, "id", "languages");
    			add_location(section2, file, 49, 5, 1487);
    			add_location(h23, file, 55, 6, 1611);
    			attr_dev(section3, "id", "hobbies");
    			add_location(section3, file, 54, 5, 1582);
    			attr_dev(div0, "class", "w-2/6");
    			add_location(div0, file, 38, 4, 1242);
    			add_location(h24, file, 62, 6, 1734);
    			attr_dev(section4, "id", "objective");
    			add_location(section4, file, 61, 5, 1703);
    			add_location(h25, file, 67, 6, 1829);
    			attr_dev(section5, "id", "education");
    			add_location(section5, file, 66, 5, 1798);
    			add_location(h26, file, 72, 6, 1925);
    			attr_dev(section6, "id", "experience");
    			add_location(section6, file, 71, 5, 1893);
    			add_location(h27, file, 77, 6, 2021);
    			attr_dev(section7, "id", "projects");
    			add_location(section7, file, 76, 5, 1991);
    			attr_dev(div1, "class", "mode-toggle");
    			add_location(div1, file, 81, 5, 2080);
    			attr_dev(div2, "class", "w-4/6");
    			add_location(div2, file, 60, 4, 1678);
    			attr_dev(div3, "class", "flex");
    			add_location(div3, file, 37, 3, 1219);
    			attr_dev(div4, "class", "border border-gray-300 rounded-sm shadow-lg py-10 px-10 w-4/5 mt-10 mb-10");
    			add_location(div4, file, 34, 2, 1113);
    			attr_dev(body, "class", "flex justify-center content-center svelte-1ss75oc");
    			add_location(body, file, 33, 1, 1061);
    			attr_dev(main, "class", "flex gap-x-10 mt-10");
    			add_location(main, file, 24, 0, 726);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, head);
    			append_dev(head, meta0);
    			append_dev(head, t1);
    			append_dev(head, meta1);
    			append_dev(head, t2);
    			append_dev(head, meta2);
    			append_dev(head, t3);
    			append_dev(head, title);
    			append_dev(head, t5);
    			append_dev(head, link1);
    			append_dev(main, t6);
    			append_dev(main, body);
    			append_dev(body, div4);
    			mount_component(header, div4, null);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, section0);
    			append_dev(section0, h20);
    			append_dev(section0, t9);
    			mount_component(contactinfo, section0, null);
    			append_dev(div0, t10);
    			append_dev(div0, section1);
    			append_dev(section1, h21);
    			append_dev(section1, t12);
    			mount_component(codinglanguages, section1, null);
    			append_dev(div0, t13);
    			append_dev(div0, section2);
    			append_dev(section2, h22);
    			append_dev(section2, t15);
    			mount_component(languages, section2, null);
    			append_dev(div0, t16);
    			append_dev(div0, section3);
    			append_dev(section3, h23);
    			append_dev(section3, t18);
    			mount_component(hobbies, section3, null);
    			append_dev(div3, t19);
    			append_dev(div3, div2);
    			append_dev(div2, section4);
    			append_dev(section4, h24);
    			append_dev(section4, t21);
    			mount_component(objective, section4, null);
    			append_dev(div2, t22);
    			append_dev(div2, section5);
    			append_dev(section5, h25);
    			append_dev(section5, t24);
    			mount_component(education, section5, null);
    			append_dev(div2, t25);
    			append_dev(div2, section6);
    			append_dev(section6, h26);
    			append_dev(section6, t27);
    			mount_component(experience, section6, null);
    			append_dev(div2, t28);
    			append_dev(div2, section7);
    			append_dev(section7, h27);
    			append_dev(section7, t30);
    			mount_component(projects, section7, null);
    			append_dev(div2, t31);
    			append_dev(div2, div1);
    			mount_component(toggle, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const toggle_changes = {};
    			if (dirty & /*darkMode*/ 1) toggle_changes.darkMode = /*darkMode*/ ctx[0];
    			toggle.$set(toggle_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(contactinfo.$$.fragment, local);
    			transition_in(codinglanguages.$$.fragment, local);
    			transition_in(languages.$$.fragment, local);
    			transition_in(hobbies.$$.fragment, local);
    			transition_in(objective.$$.fragment, local);
    			transition_in(education.$$.fragment, local);
    			transition_in(experience.$$.fragment, local);
    			transition_in(projects.$$.fragment, local);
    			transition_in(toggle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(contactinfo.$$.fragment, local);
    			transition_out(codinglanguages.$$.fragment, local);
    			transition_out(languages.$$.fragment, local);
    			transition_out(hobbies.$$.fragment, local);
    			transition_out(objective.$$.fragment, local);
    			transition_out(education.$$.fragment, local);
    			transition_out(experience.$$.fragment, local);
    			transition_out(projects.$$.fragment, local);
    			transition_out(toggle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(contactinfo);
    			destroy_component(codinglanguages);
    			destroy_component(languages);
    			destroy_component(hobbies);
    			destroy_component(objective);
    			destroy_component(education);
    			destroy_component(experience);
    			destroy_component(projects);
    			destroy_component(toggle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let darkMode = false;

    	function toggleMode() {
    		$$invalidate(0, darkMode = !darkMode);

    		// Apply dark mode class to :root element
    		document.documentElement.classList.toggle('dark-mode', darkMode);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		ContactInfo,
    		CodingLanguages,
    		Languages,
    		Hobbies,
    		Objective,
    		Education,
    		Experience,
    		Projects,
    		Toggle,
    		darkMode,
    		toggleMode
    	});

    	$$self.$inject_state = $$props => {
    		if ('darkMode' in $$props) $$invalidate(0, darkMode = $$props.darkMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [darkMode, toggleMode];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: "world",
      },
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
