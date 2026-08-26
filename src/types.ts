export type Entry = {
  id: string
  label: string
  color: string
  /**
   * Cuántas chances tiene este premio, en porcentaje.
   *
   * NO tiene nada que ver con el tamaño del gajo: la rueda dibuja siete gajos
   * iguales y el ganador se sortea con estos pesos. O sea que lo que se ve NO
   * son las chances reales — decisión tomada a propósito para que las etiquetas
   * entren grandes y los porcentajes se puedan tocar sin redibujar nada.
   */
  weight: number
}
