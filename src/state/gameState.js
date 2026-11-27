// Gestione Stato v3.0 — 5 Protagonisti giocabili, Fiducia, Competenze EIPASS, Salvataggi e 4 Finali

const STORAGE_KEY = "casardi_8bit_eipass_save_v3";
const AUDIO_PREF_KEY = "casardi_8bit_audio_prefs_v3";

const memoryFallback = {};
export const SafeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return memoryFallback[key] || null;
    }
  },
  set(key, val) {
    try {
      window.localStorage.setItem(key, val);
    } catch (_) {
      memoryFallback[key] = val;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (_) {
      delete memoryFallback[key];
    }
  },
};

const TRUST_DISPLAY_NAMES = {
  carlo: "Carlo",
  ranaldo: "Prof. Ranaldo",
  daniele: "Daniele",
  ruggero: "Ruggero",
  francesco: "Francesco",
};

export function createFreshState(mode = "openday") {
  return {
    mode, // 'openday' | 'campaign'
    chapterIndex: 0,
    roomIndex: 0,
    activeChar: "carlo",
    unlockedChars: ["carlo", "ranaldo"],
    hp: 5,
    maxHp: 5,
    shield: 0,
    score: 0,
    coins: 0,
    playTimeSec: 0,
    deaths: 0,
    enemiesDefeated: 0,
    assistsUsed: 0,
    subRoomsVisited: [],

    trust: {
      carlo: 62,
      ranaldo: 56,
      daniele: 56,
      ruggero: 56,
      francesco: 56,
    },
    eipassScore: 50,
    eipassAnswered: 0,
    eipassCorrect: 0,
    eipassWrong: 0,
    modulesCleared: [false, false, false, false, false, false, false],

    pegasoCollected: [],
    clearedTerminals: [],
    completedMinigames: [],
    triggeredDialogues: [],
    unlockedDoors: [],
    flags: {},
    decisionsLog: [],
    checkpoint: null,
  };
}

export class GameStateManager {
  constructor() {
    this.data = createFreshState("openday");
    this.audioPrefs = this.loadAudioPrefs();
    this.consequenceQueue = [];
  }

  pushConsequence(text, color = "#ffd147") {
    this.consequenceQueue.push({ text, color, ttl: 190 });
    if (this.consequenceQueue.length > 3) {
      this.consequenceQueue.shift();
    }
  }

  loadAudioPrefs() {
    const raw = SafeStorage.get(AUDIO_PREF_KEY);
    if (raw) {
      try {
        return { musicVol: 0.7, sfxVol: 0.85, muted: false, crt: false, followTeam: false, ...JSON.parse(raw) };
      } catch (_) {}
    }
    return { musicVol: 0.7, sfxVol: 0.85, muted: false, crt: false, followTeam: false };
  }

  saveAudioPrefs() {
    SafeStorage.set(AUDIO_PREF_KEY, JSON.stringify(this.audioPrefs));
  }

  reset(mode = "openday") {
    this.data = createFreshState(mode);
    this.consequenceQueue = [];
    return this.data;
  }

  hasSavedCampaign() {
    const raw = SafeStorage.get(STORAGE_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return parsed && parsed.mode === "campaign";
    } catch (_) {
      return false;
    }
  }

  saveCampaign() {
    if (this.data.mode !== "campaign") return;
    SafeStorage.set(STORAGE_KEY, JSON.stringify(this.data));
  }

  loadCampaign() {
    const raw = SafeStorage.get(STORAGE_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.mode === "campaign") {
        const fresh = createFreshState("campaign");
        this.data = Object.assign(fresh, parsed);
        this.data.trust = Object.assign(fresh.trust, parsed.trust || {});
        if (!Array.isArray(this.data.unlockedChars) || this.data.unlockedChars.length === 0) {
          this.data.unlockedChars = ["carlo", "ranaldo"];
        }
        return true;
      }
    } catch (_) {}
    return false;
  }

  clearSavedCampaign() {
    SafeStorage.remove(STORAGE_KEY);
  }

  unlockCharacter(charId) {
    if (!this.data.unlockedChars.includes(charId)) {
      this.data.unlockedChars.push(charId);
      const label = TRUST_DISPLAY_NAMES[charId] || charId;
      this.pushConsequence(`${label} si unisce al gruppo`, "#38e2d8");
    }
  }

  modifyTrust(charId, delta) {
    if (this.data.trust[charId] === undefined) return;
    const prev = this.data.trust[charId];
    this.data.trust[charId] = Math.max(0, Math.min(100, prev + delta));
    if (charId === "ranaldo" && this.data.trust.ranaldo >= 75 && this.data.maxHp < 6) {
      this.data.maxHp = 6;
      this.data.hp = Math.min(this.data.maxHp, this.data.hp + 1);
      this.pushConsequence("Intesa col Prof. Ranaldo: +1 Energia massima", "#4ade80");
    }
  }

  recordChoice(id, label, summary, effects = {}) {
    this.data.flags[id] = effects.flagValue !== undefined ? effects.flagValue : true;
    this.data.decisionsLog.push({ id, label, summary });

    let topChar = null;
    let topAbs = 0;
    let topDelta = 0;

    if (effects.trust) {
      for (const [cid, delta] of Object.entries(effects.trust)) {
        this.modifyTrust(cid, delta);
        if (Math.abs(delta) > topAbs) {
          topAbs = Math.abs(delta);
          topChar = cid;
          topDelta = delta;
        }
      }
    }

    if (topChar && topAbs >= 4) {
      const who = TRUST_DISPLAY_NAMES[topChar] || topChar;
      const sign = topDelta > 0 ? `+${topDelta}%` : `${topDelta}%`;
      this.pushConsequence(
        `Fiducia ${who}: ${sign}`,
        topDelta > 0 ? "#ffd147" : "#f87171"
      );
    }

    if (effects.eipassDelta) {
      this.data.eipassScore = Math.max(0, Math.min(100, this.data.eipassScore + effects.eipassDelta));
      this.pushConsequence(
        effects.eipassDelta > 0
          ? `Padronanza EIPASS +${effects.eipassDelta}%`
          : `Imprecisione digitale ${effects.eipassDelta}%`,
        effects.eipassDelta > 0 ? "#38bdf8" : "#f87171"
      );
    }
    if (effects.hpDelta) {
      if (effects.hpDelta < 0) {
        this.data.hp = Math.max(1, this.data.hp + effects.hpDelta);
      } else {
        this.data.hp = Math.min(this.data.maxHp, this.data.hp + effects.hpDelta);
      }
    }
    if (effects.shieldDelta) {
      this.data.shield = Math.max(0, Math.min(3, this.data.shield + effects.shieldDelta));
    }
    if (effects.scoreDelta) {
      this.data.score += effects.scoreDelta;
    }
    this.saveCampaign();
  }

  recordQuizOutcome(quizId, moduleIndex, isCorrect) {
    // In "clearedTerminals" finiscono SOLO le postazioni superate:
    // una risposta sbagliata non indebolisce il boss finale e non sblocca varchi.
    if (isCorrect && !this.data.clearedTerminals.includes(quizId)) {
      this.data.clearedTerminals.push(quizId);
    }
    this.data.eipassAnswered += 1;
    if (isCorrect) {
      this.data.eipassCorrect += 1;
      this.data.eipassScore = Math.min(100, this.data.eipassScore + 9);
      this.data.score += 350;
      if (moduleIndex >= 1 && moduleIndex <= 7) {
        this.data.modulesCleared[moduleIndex - 1] = true;
      }
      this.modifyTrust("ranaldo", 5);
      this.modifyTrust("daniele", 4);
      this.pushConsequence(`Modulo EIPASS ${moduleIndex} verificato (+Scudo)`, "#4ade80");
    } else {
      this.data.eipassWrong += 1;
      this.data.eipassScore = Math.max(0, this.data.eipassScore - 7);
      this.data.hp = Math.max(1, this.data.hp - 1);
      this.modifyTrust("ranaldo", -3);
      this.pushConsequence(`Errore su Modulo ${moduleIndex}: controllo da rivedere`, "#f87171");
    }
    this.saveCampaign();
  }

  collectPegaso(pegasoId) {
    if (!this.data.pegasoCollected.includes(pegasoId)) {
      this.data.pegasoCollected.push(pegasoId);
      this.data.score += 500;
      this.data.hp = Math.min(this.data.maxHp, this.data.hp + 1);
      this.pushConsequence("Recuperata una pagina d'archivio di Pegaso", "#fde047");
      this.saveCampaign();
      return true;
    }
    return false;
  }

  addBitToken(amount = 1) {
    this.data.coins += amount;
    this.data.score += 25 * amount;
    if (this.data.coins >= 25) {
      this.data.coins -= 25;
      if (this.data.hp < this.data.maxHp) {
        this.data.hp += 1;
        return "heal";
      } else {
        this.data.shield = Math.min(3, this.data.shield + 1);
        return "shield";
      }
    }
    return null;
  }

  getAverageTrust() {
    const t = this.data.trust;
    const keys = ["carlo", "ranaldo", "daniele", "ruggero", "francesco"];
    const sum = keys.reduce((acc, k) => acc + (t[k] ?? 55), 0);
    return Math.round(sum / keys.length);
  }

  computeEnding() {
    const avgTrust = this.getAverageTrust();
    const eipass = this.data.eipassScore;
    const pegasoCount = this.data.pegasoCollected.length;

    if (this.data.mode === "campaign" && pegasoCount >= 10 && avgTrust >= 72 && eipass >= 75) {
      return {
        id: "secret_golden",
        rank: "GRADO S+ • ARCHIVIO COMPLETO",
        title: "REDAZIONE PEGASO E RETE IN ORDINE",
        subtitle: "Open Day inaugurato senza un solo dato perso",
        summary:
          "Carlo, Daniele, Francesco, Ruggero e il Prof. Ranaldo hanno rimesso in sicurezza la rete della Sede Centrale e recuperato l'archivio storico di Pegaso. Quando le famiglie salgono in Aula Magna, Francesco accorda il pianoforte a coda, Daniele apre la festa con una salsa sulla pista del cortile, Ruggero e Carlo accompagnano i gruppi tra palestra e laboratori e l'Open Day inizia puntuale.",
      };
    }
    if (eipass >= 70 && avgTrust >= 64) {
      return {
        id: "heroic_lode",
        rank: "GRADO A+ • PIENA PADRONANZA",
        title: "OPEN DAY SALVO IN TEMPO UTILE",
        subtitle: "Tutti i sistemi verificati prima dell'ingresso dei visitatori",
        summary:
          "Lavorando con metodo invece di andare a tentativi, Carlo e tutto il gruppo hanno isolato le alterazioni del Sofista Digitale. Le LIM dei corridoi, il laboratorio multimediale, il catalogo della biblioteca e la presentazione in Aula Magna funzionano regolarmente quando si aprono le porte di Via d'Aragona.",
      };
    }
    if (eipass >= 50) {
      return {
        id: "standard_pass",
        aliases: ["solid_win"],
        rank: "GRADO B • SISTEMA RIPRISTINATO",
        title: "PORTE APERTE SUL FILO DEI MINUTI",
        subtitle: "Rete stabilizzata con qualche controllo da rifinire",
        summary:
          "Nonostante qualche passaggio affrettato lungo il percorso, la squadra ha fermato il blocco dell'Aula Magna prima dell'arrivo delle famiglie. Il Prof. Ranaldo e Francesco segnano gli ultimi parametri da ripassare sui moduli EIPASS, ma la giornata d'orientamento può cominciare.",
      };
    }
    return {
      id: "chaotic_pass",
      aliases: ["chaotic_comedy"],
      rank: "GRADO C • SALVATAGGIO D'EMERGENZA",
      title: "OPEN DAY SALVATO IN MODALITÀ MANUALE",
      subtitle: "Il Sofista è fermo, ma metà dei terminali resta in revisione",
      summary:
        "Troppe conferme date senza controllare mittenti e impostazioni hanno costretto il gruppo a spegnere diversi terminali per prudenza. Carlo, Ruggero e Francesco gestiscono l'accoglienza a voce insieme a Sofia e Mimmo: l'Open Day si tiene comunque, con la promessa di rimettere mano ai 7 Moduli con più calma.",
    };
  }
}
