import gsap from 'gsap';

/**
 * PILAR 2 — copiado de `landing/src/scripts/pillar2.ts`.
 *
 * Los cuatro tiempos del "constructor de tableros", la geometría en porcentajes
 * y los tiempos son los de allá, sin tocar. Sólo cambia el montaje: recibe su
 * raíz por parámetro y devuelve una limpieza, porque acá la maqueta se monta y
 * se desmonta cada vez que el bucle pasa por el Pilar 2.
 */

/**
 * Pilar 2 (Metrics) — a looping "dashboard builder": a design-software cursor selects widgets
 * (a small floating toolbar pops up over them, Illustrator-style), grabs their bottom-right corner
 * handle to resize, and swaps two widgets' positions (they trade places, then trade back to close
 * the loop). Self-running (GSAP timeline, repeat: -1) so it never depends on ScrollTrigger.
 */
export function initPillar2( root: HTMLElement ): () => void {
  const cursor = root.querySelector<HTMLElement>( '[data-pilar2-cursor]' );
  const toolbar = root.querySelector<HTMLElement>( '[data-pilar2-toolbar]' );
  const widget = ( n: number ) => root.querySelector<HTMLElement>( `[data-w="${n}"]` );
  const w1 = widget( 1 );
  const w2 = widget( 2 );
  const w3 = widget( 3 );
  const w4 = widget( 4 );
  if ( !cursor || !toolbar || !w1 || !w2 || !w3 || !w4 ) return () => {};

  const handle = ( w: HTMLElement ) => w.querySelector<HTMLElement>( '.p2-handle' );
  const tool = ( name: string ) => toolbar.querySelector<HTMLElement>( `[data-tool="${name}"]` );

  // Live geometry, expressed as percentages of the container box (resolution independent).
  const pct = ( clientX: number, clientY: number ) => {
    const c = root.getBoundingClientRect();
    return { x: (( clientX - c.left ) / c.width ) * 100, y: (( clientY - c.top ) / c.height ) * 100 };
  };
  const corner = ( w: HTMLElement ) => {
    const r = w.getBoundingClientRect();
    return pct( r.right, r.bottom );
  };
  const center = ( w: HTMLElement ) => {
    const r = w.getBoundingClientRect();
    return pct( r.left + r.width / 2, r.top + r.height / 2 );
  };
  const topCenter = ( w: HTMLElement ) => {
    const r = w.getBoundingClientRect();
    return pct( r.left + r.width / 2, r.top );
  };
  const dxTo = ( from: HTMLElement, to: HTMLElement ) =>
    to.getBoundingClientRect().left - from.getBoundingClientRect().left;

  // Bottom row (w3/w4) home centers, from the fixed inline layout — used as ride destinations
  // (a rect can only tell us where a widget IS at tween-start, not where it will land).
  const ROW_Y = 72; // top:52% + height:40%/2
  const W4_HOME = { x: 84.5, y: ROW_Y }; // KPI:   left 74% + w 21%/2

  // Scale widgets from their top-left so a bottom-right corner drag grows toward the handle.
  gsap.set([ w1, w2, w3, w4 ], { transformOrigin: '0% 0%', boxShadow: '0 0 0 0px rgba(153,195,200,0)' });
  // Anchor the cursor SVG by its pointer tip (~21% x, ~12% y of its own 20px box).
  gsap.set( cursor, { xPercent: -21, yPercent: -12, left: '24%', top: '24%' });
  gsap.set( toolbar, { xPercent: -50, yPercent: -95 });

  const RING = '0 0 0 1.5px rgba(153,195,200,0.9)';
  const NORING = '0 0 0 0px rgba(153,195,200,0)';

  const setActiveTool = ( name: 'resize' | 'move' ) => () => {
    tool( 'resize' )?.classList.toggle( 'p2-tool--active', name === 'resize' );
    tool( 'move' )?.classList.toggle( 'p2-tool--active', name === 'move' );
  };

  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' }, delay: 0.4 });

  // ═══ Beat 1 — resize the line chart (w2): grab its bottom-right corner, drag it taller ═══
  tl.call( setActiveTool( 'resize' ))
    .to( cursor, { left: () => `${corner( w2 ).x }%`, top: () => `${corner( w2 ).y }%`, duration: 0.75 })
    .set( toolbar, { left: () => `${topCenter( w2 ).x }%`, top: () => `${topCenter( w2 ).y }%` }, '<' )
    .to( toolbar, { autoAlpha: 1, duration: 0.25 }, '-=0.3' )
    .to( w2, { boxShadow: RING, duration: 0.2 }, '<' )
    .to( handle( w2 ), { autoAlpha: 1, scale: 1.35, duration: 0.18 })
    .to( w2, { scaleY: 1.16, duration: 0.55 })
    .to( cursor, { top: '+=6.1', duration: 0.55 }, '<' ) // follow the growing bottom edge
    .to( handle( w2 ), { autoAlpha: 0, scale: 1, duration: 0.15 })
    .to( w2, { scaleY: 1, duration: 0.5 })
    .to( cursor, { top: '-=6.1', duration: 0.5 }, '<' )
    .to( toolbar, { autoAlpha: 0, duration: 0.2 }, '-=0.3' )
    .to( w2, { boxShadow: NORING, duration: 0.2 }, '<' )
    .to({}, { duration: 0.25 });

  // ═══ Beat 2 — swap the donut (w3) and the KPI tile (w4): pick one up, they trade places ═══
  tl.call( setActiveTool( 'move' ))
    .to( cursor, { left: () => `${center( w3 ).x }%`, top: () => `${center( w3 ).y }%`, duration: 0.7 })
    .set( toolbar, { left: () => `${topCenter( w3 ).x }%`, top: () => `${topCenter( w3 ).y }%` }, '<' )
    .to( toolbar, { autoAlpha: 1, duration: 0.25 }, '-=0.3' )
    .to( w3, { boxShadow: RING, duration: 0.2 }, '<' )
    .to({}, { duration: 0.18 })
    .to( toolbar, { autoAlpha: 0, duration: 0.2 }) // toolbar tucks away for the drag
    .set( w3, { zIndex: 5 }, '<' )
    .to( w3, { scale: 1.06, filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.5))', duration: 0.22 }, '<' )
    .to( w3, { x: () => dxTo( w3, w4 ), duration: 0.8 })
    .to( w4, { x: () => dxTo( w4, w3 ), duration: 0.8 }, '<' )
    .to( cursor, { left: `${W4_HOME.x }%`, top: `${W4_HOME.y }%`, duration: 0.8 }, '<' )
    .to( w3, { scale: 1, filter: 'drop-shadow(0 0px 0px rgba(0,0,0,0))', duration: 0.22 })
    .to( w3, { boxShadow: NORING, duration: 0.2 }, '<' )
    .set( w3, { zIndex: 1 })
    .to({}, { duration: 0.3 });

  // ═══ Beat 3 — resize the bar chart (w1): grab its corner, drag it wider ═══
  tl.call( setActiveTool( 'resize' ))
    .to( cursor, { left: () => `${corner( w1 ).x }%`, top: () => `${corner( w1 ).y }%`, duration: 0.75 })
    .set( toolbar, { left: () => `${topCenter( w1 ).x }%`, top: () => `${topCenter( w1 ).y }%` }, '<' )
    .to( toolbar, { autoAlpha: 1, duration: 0.25 }, '-=0.3' )
    .to( w1, { boxShadow: RING, duration: 0.2 }, '<' )
    .to( handle( w1 ), { autoAlpha: 1, scale: 1.35, duration: 0.18 })
    .to( w1, { scaleX: 1.07, duration: 0.55 })
    .to( cursor, { left: '+=2.9', duration: 0.55 }, '<' ) // follow the growing right edge
    .to( handle( w1 ), { autoAlpha: 0, scale: 1, duration: 0.15 })
    .to( w1, { scaleX: 1, duration: 0.5 })
    .to( cursor, { left: '-=2.9', duration: 0.5 }, '<' )
    .to( toolbar, { autoAlpha: 0, duration: 0.2 }, '-=0.3' )
    .to( w1, { boxShadow: NORING, duration: 0.2 }, '<' )
    .to({}, { duration: 0.25 });

  // ═══ Beat 4 — swap them back (closes the loop): grab the KPI tile, trade places again ═══
  tl.call( setActiveTool( 'move' ))
    .to( cursor, { left: () => `${center( w4 ).x }%`, top: () => `${center( w4 ).y }%`, duration: 0.75 })
    .set( toolbar, { left: () => `${topCenter( w4 ).x }%`, top: () => `${topCenter( w4 ).y }%` }, '<' )
    .to( toolbar, { autoAlpha: 1, duration: 0.25 }, '-=0.3' )
    .to( w4, { boxShadow: RING, duration: 0.2 }, '<' )
    .to({}, { duration: 0.18 })
    .to( toolbar, { autoAlpha: 0, duration: 0.2 })
    .set( w4, { zIndex: 5 }, '<' )
    .to( w4, { scale: 1.06, filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.5))', duration: 0.22 }, '<' )
    .to( w4, { x: 0, duration: 0.8 })
    .to( w3, { x: 0, duration: 0.8 }, '<' )
    .to( cursor, { left: `${W4_HOME.x }%`, top: `${W4_HOME.y }%`, duration: 0.8 }, '<' )
    .to( w4, { scale: 1, filter: 'drop-shadow(0 0px 0px rgba(0,0,0,0))', duration: 0.22 })
    .to( w4, { boxShadow: NORING, duration: 0.2 }, '<' )
    .set( w4, { zIndex: 1 })
    .to({}, { duration: 0.3 });

  // ═══ Return the cursor to the corner, everything back at identity — seamless loop ═══
  tl.to( cursor, { left: '24%', top: '24%', duration: 0.8 }).to({}, { duration: 0.4 });

  return () => {
    tl.kill();
    gsap.killTweensOf( root.querySelectorAll( '*' ));
  };
}
