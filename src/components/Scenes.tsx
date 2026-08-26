import type { SceneKind } from '../lib/content'
import { AlertsViz, BillingViz, ShippingViz, StockViz } from './DeckVizzes'
import { MigrationSwitch } from './MigrationSwitch'
import { OmniPanel } from './OmniPanel'
import { RulesEngine } from './RulesEngine'
import { PillarThree } from './pillars/PillarThree'
import { PillarTwo } from './pillars/PillarTwo'

/**
 * QUÉ DIBUJA CADA FICHA.
 *
 * Ya no queda nada dibujado a mano acá: las nueve salen de la landing. Los tres
 * pilares son el puerto de `Pillar1|2|3Viz` y el resto son las maquetas del mazo
 * (`FeaturesDeck.astro`). Las versiones dibujadas a mano que hubo antes tenían el
 * gesto pero no eran ÉSAS, y al lado de la landing se notaba.
 *
 * Cada una trae su propio movimiento —script propio o keyframes propios—, así que
 * este archivo no coreografía nada: sólo dice cuál va en cada beat.
 */
const SCENES: Record<SceneKind, () => React.JSX.Element> = {
  migration: MigrationSwitch,
  rules: RulesEngine,
  metrics: PillarTwo,
  ai: PillarThree,
  channels: OmniPanel,
  stock: StockViz,
  billing: BillingViz,
  shipping: ShippingViz,
  alerts: AlertsViz,
}

export function Scene({ kind }: { kind: SceneKind }) {
  const Component = SCENES[kind]
  return <Component />
}
