import { registerRoot } from "remotion";
import { Root, AutoClip } from "./Root";

registerRoot(Root);

// Exportar AutoClip para que getCompositions() de @remotion/renderer
// pueda descubrirla durante el renderizado en lote.
export { AutoClip };
