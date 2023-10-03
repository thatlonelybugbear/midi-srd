export async function discipleOfLife(args) { //check
    const { spellLevel, item } = args[0] ?? {};
    if (!spellLevel || !item) return ui.notifications.error("MidiSRD - discipleOfLife: Something is wrong in the macro of the Item rolled; Notify GM");
    if (args[0].spellLevel > 0 && args[0].item?.system.damage.parts.some(v=>v[1].includes("healing"))) {
        return {damageRoll: `(2+${spellLevel})[healing]`, flavor:"Disciple of Life bonus healing"}
    }   
}