// Gestore Input Unificato v3.0: Tastiera + Gamepad + Controlli Touch Essenziali (5 Personaggi)

export class InputController {
  constructor(onAnyInteraction) {
    this.keys = new Set();
    this.justPressed = new Set();
    this.onAnyInteraction = onAnyInteraction;

    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.jumpDown = false;
    this.specialDown = false;

    this.leftPressed = false;
    this.rightPressed = false;
    this.upPressed = false;
    this.downPressed = false;
    this.jumpPressed = false;
    this.specialPressed = false;
    this.assistPressed = false;
    this.interactPressed = false;
    this.confirmPressed = false;
    this.pausePressed = false;
    this.mutePressed = false;
    this.crtTogglePressed = false;
    this.switchCyclePressed = false;
    this.replayPressed = false;
    this.quickResetPressed = false;
    this.numberPressed = 0; // 1..8
    this.fullscreenPressed = false;
    this.helpPressed = false;

    this._prevGpButtons = [];
    this.bindEvents();
  }

  bindEvents() {
    // I test girano in Node senza DOM: se manca window si salta il binding.
    if (typeof window === "undefined" || !window.addEventListener) return;
    window.addEventListener("keydown", (e) => {
      if (this.onAnyInteraction) this.onAnyInteraction();
      const code = e.code;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab", "F9"].includes(code)
      ) {
        e.preventDefault();
      }
      if (!this.keys.has(code)) {
        this.justPressed.add(code);
      }
      this.keys.add(code);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.justPressed.clear();
    });

    window.addEventListener("pointerdown", () => {
      if (this.onAnyInteraction) this.onAnyInteraction();
    });

    window.addEventListener(
      "touchstart",
      () => {
        if (this.onAnyInteraction) this.onAnyInteraction();
      },
      { passive: true }
    );

    window.addEventListener(
      "touchend",
      () => {
        if (this.onAnyInteraction) this.onAnyInteraction();
      },
      { passive: true }
    );
  }

  setVirtualAction(action, isDown) {
    if (this.onAnyInteraction && isDown) this.onAnyInteraction();
    const map = {
      left: "ArrowLeft",
      right: "ArrowRight",
      up: "ArrowUp",
      down: "ArrowDown",
      jump: "Space",
      special: "KeyX",
      interact: "KeyE",
      assist: "KeyC",
      pause: "KeyP",
      switch: "KeyQ",
      replay: "KeyR",
      crt: "KeyV",
      hero1: "Digit1",
      hero2: "Digit2",
      hero3: "Digit3",
      hero4: "Digit4",
      hero5: "Digit5",
    };
    const code = map[action];
    if (!code) return;
    if (isDown) {
      if (!this.keys.has(code)) {
        this.justPressed.add(code);
      }
      this.keys.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  pulseVirtualAction(action) {
    if (this.onAnyInteraction) this.onAnyInteraction();
    const map = {
      interact: "KeyE",
      confirm: "Enter",
      jump: "Space",
      special: "KeyX",
      assist: "KeyC",
      pause: "KeyP",
      switch: "KeyQ",
      replay: "KeyR",
      crt: "KeyV",
      hero1: "Digit1",
      hero2: "Digit2",
      hero3: "Digit3",
      hero4: "Digit4",
      hero5: "Digit5",
    };
    const code = map[action];
    if (code) this.justPressed.add(code);
  }

  clearVirtualDirections() {
    this.keys.delete("ArrowLeft");
    this.keys.delete("ArrowRight");
    this.keys.delete("ArrowUp");
    this.keys.delete("ArrowDown");
  }

  poll() {
    const k = this.keys;
    const jp = this.justPressed;

    let gpLeft = false,
      gpRight = false,
      gpUp = false,
      gpDown = false,
      gpJump = false,
      gpSpec = false,
      gpJumpJust = false,
      gpSpecJust = false,
      gpAssistJust = false,
      gpIntJust = false,
      gpPauseJust = false,
      gpSwitchJust = false;

    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[0];
    if (gp) {
      const axX = gp.axes[0] || 0;
      const axY = gp.axes[1] || 0;
      gpLeft = axX < -0.4 || !!gp.buttons[14]?.pressed;
      gpRight = axX > 0.4 || !!gp.buttons[15]?.pressed;
      gpUp = axY < -0.4 || !!gp.buttons[12]?.pressed;
      gpDown = axY > 0.4 || !!gp.buttons[13]?.pressed;
      gpJump = !!gp.buttons[0]?.pressed;
      gpSpec = !!gp.buttons[2]?.pressed || !!gp.buttons[1]?.pressed;

      const curBtns = gp.buttons.map((b) => !!b.pressed);
      const was = (idx) => !!this._prevGpButtons[idx];
      if (curBtns[0] && !was(0)) gpJumpJust = true;
      if ((curBtns[2] && !was(2)) || (curBtns[1] && !was(1))) gpSpecJust = true;
      if (curBtns[5] && !was(5)) gpAssistJust = true;
      if (curBtns[3] && !was(3)) gpIntJust = true;
      if (curBtns[9] && !was(9)) gpPauseJust = true;
      if (curBtns[4] && !was(4)) gpSwitchJust = true;
      this._prevGpButtons = curBtns;
    }

    this.left = k.has("ArrowLeft") || k.has("KeyA") || gpLeft;
    this.right = k.has("ArrowRight") || k.has("KeyD") || gpRight;
    // "up" = direzione pura (angoli, vertici, corsie). Il vecchio tasto virtuale "salto" resta distinto.
    this.up = k.has("ArrowUp") || k.has("KeyW") || gpUp;
    this.down = k.has("ArrowDown") || k.has("KeyS") || gpDown;

    // NOTA: SU/W non sono più "salto": SU serve ad angolo/vertice/nota nei minigiochi.
    // Il salto resta su SPAZIO, Z e sul tasto A del gamepad.
    this.jumpDown = k.has("Space") || k.has("KeyZ") || gpJump;
    this.specialDown =
      k.has("KeyX") || k.has("KeyK") || k.has("ShiftLeft") || k.has("ShiftRight") || gpSpec;

    this.leftPressed = jp.has("ArrowLeft") || jp.has("KeyA");
    this.rightPressed = jp.has("ArrowRight") || jp.has("KeyD");
    this.upPressed = jp.has("ArrowUp") || jp.has("KeyW");
    this.downPressed = jp.has("ArrowDown") || jp.has("KeyS");

    this.jumpPressed = jp.has("Space") || jp.has("KeyZ") || gpJumpJust;
    this.specialPressed =
      jp.has("KeyX") || jp.has("KeyK") || jp.has("ShiftLeft") || jp.has("ShiftRight") || gpSpecJust;
    this.assistPressed = jp.has("KeyC") || jp.has("KeyL") || gpAssistJust;
    this.interactPressed = jp.has("KeyE") || jp.has("Enter") || jp.has("KeyF") || gpIntJust;
    this.confirmPressed = jp.has("Enter") || jp.has("Space") || jp.has("KeyE") || gpJumpJust;
    // --- SCORCIATOIE GLOBALI (una sola definizione: nessun comando senza tasto) ---
    this.pausePressed = jp.has("KeyP") || jp.has("Escape") || gpPauseJust; // P / ESC / START
    this.mutePressed = jp.has("KeyM");                                       // M
    this.crtTogglePressed = jp.has("KeyV");                                  // V
    this.switchCyclePressed = jp.has("KeyQ") || jp.has("Tab") || gpSwitchJust; // Q / TAB / LB
    this.replayPressed = jp.has("KeyR");                                     // R (Riascolta)
    this.quickResetPressed = jp.has("F9");                                   // F9
    this.fullscreenPressed = jp.has("KeyY");                                 // Y = schermo intero
    this.helpPressed = jp.has("F1") || jp.has("Slash") || jp.has("NumpadDivide"); // F1 / ?  -> guida comandi

    this.numberPressed = 0;
    for (let n = 1; n <= 8; n++) {
      if (jp.has(`Digit${n}`) || jp.has(`Numpad${n}`)) {
        this.numberPressed = n;
        break;
      }
    }

    this.justPressed.clear();
  }
}
