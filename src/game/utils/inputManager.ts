/**
 * Gestor de entrada centralizado (teclado + pedales táctiles).
 *
 * Los listeners de teclado sólo se instalan mientras hay una partida montada
 * (`attach()` / `detach()` con recuento de referencias). Antes se registraban al
 * crear el singleton y nunca se quitaban, así que las flechas y la barra
 * espaciadora seguían capturadas en el resto de la app tras salir del juego.
 */
export class InputManager {
    private static instance: InputManager;

    private touchAccelerating = false;
    private touchBraking = false;
    private restartPressed = false;
    private listenerCount = 0;
    private attached = false;

    public isDebugMode = false;

    private keysPressed = new Set<string>();

    private constructor() {
        // Los listeners se instalan en attach(), no aquí.
    }

    public static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    /** Empieza a escuchar el teclado. Idempotente por recuento de referencias. */
    public attach() {
        this.listenerCount++;
        if (this.attached || typeof window === 'undefined') return;

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.handleBlur);
        document.addEventListener('visibilitychange', this.handleBlur);
        this.attached = true;
    }

    /** Deja de escuchar cuando ya no queda ninguna partida montada. */
    public detach() {
        this.listenerCount = Math.max(0, this.listenerCount - 1);
        if (this.listenerCount > 0 || !this.attached || typeof window === 'undefined') return;

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.handleBlur);
        document.removeEventListener('visibilitychange', this.handleBlur);
        this.attached = false;
        this.reset();
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        // No robar el teclado si el foco está en un campo de texto
        const target = e.target as HTMLElement | null;
        if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
            return;
        }

        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }

        this.keysPressed.add(e.code.toLowerCase());

        if (e.code === 'KeyR') {
            this.restartPressed = true;
        }
        if (e.code === 'KeyB') {
            this.isDebugMode = !this.isDebugMode;
        }
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keysPressed.delete(e.code.toLowerCase());
    };

    private handleBlur = () => {
        this.reset();
    };

    private reset() {
        this.keysPressed.clear();
        this.touchAccelerating = false;
        this.touchBraking = false;
    }

    // --- Entrada táctil ---
    public setAccelerating(active: boolean) {
        this.touchAccelerating = active;
    }

    public setBraking(active: boolean) {
        this.touchBraking = active;
    }

    public triggerRestart() {
        this.restartPressed = true;
    }

    public releaseAll() {
        this.reset();
    }

    // --- Consultas ---
    public get isAccelerating(): boolean {
        return (
            this.touchAccelerating ||
            this.keysPressed.has('keyd') ||
            this.keysPressed.has('arrowright') ||
            this.keysPressed.has('arrowup') ||
            this.keysPressed.has('space')
        );
    }

    public get isBraking(): boolean {
        return (
            this.touchBraking ||
            this.keysPressed.has('keya') ||
            this.keysPressed.has('arrowleft') ||
            this.keysPressed.has('arrowdown')
        );
    }

    public consumeRestart(): boolean {
        if (this.restartPressed) {
            this.restartPressed = false;
            return true;
        }
        return false;
    }
}
