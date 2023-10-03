import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function eyebite(args) {  //should change to an OverTime effect with a macroName linked to a compendium ItemMacro
    if (!game.modules.get("dfreds-convenient-effects")?.active) return ui.notifications.error("Please enable the DFreds CE module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const DAEItem = lArgs.efData.flags.dae.itemData

    function EyebiteDialog() {
        new Dialog({
            title: "Eyebite options",
            content: "<p>Target a token and select the effect</p>",
            buttons: {
                one: {
                    label: "Asleep",
                    callback: async () => {
                        for (let t of game.user.targets) {
                            const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${DC} ${DAEItem?.name || ""}`;
                            let saveRoll = (await actor.rollAbilitySave("wis", { flavor, fastFoward: true })).total;
                            if (saveRoll < DC) {
                                await ChatMessage.create({ content: `${t.name} failed the save with a ${saveRoll}` });
                                await MidiSRDHelpers._addDfred("Unconscious", actor);
                            }
                            else {
                                await ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll}` });
                            }
                        }
                    }
                },
                two: {
                    label: "Panicked",
                    callback: async () => {
                        for (let t of game.user.targets) {
                            const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${DC} ${DAEItem?.name || ""}`;
                            let saveRoll = (await actor.rollAbilitySave("wis", { flavor, fastFoward: true })).total;
                            if (saveRoll < DC) {
                                await ChatMessage.create({ content: `${t.name} failed the save with a ${saveRoll}` });
                                await MidiSRDHelpers._addDfred("Frightened", actor);
                            }
                            else {
                                await ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll}` });
                            }
                        }
                    }
                },
                three: {
                    label: "Sickened",
                    callback: async () => {
                        for (let t of game.user.targets) {
                            const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${DC} ${DAEItem?.name || ""}`;
                            let saveRoll = (await actor.rollAbilitySave("wis", { flavor, fastFoward: true })).total;
                            if (saveRoll < DC) {
                                await ChatMessage.create({ content: `${t.name} failed the save with a ${saveRoll}` });
                                await MidiSRDHelpers._addDfred("Poisoned", actor);
                            }
                            else {
                                await ChatMessage.create({ content: `${t.name} passed the save with a ${saveRoll}` });
                            }
                        }
                    }
                },
            }
        }).render(true);
    }

    if (args[0] === "on") {
        EyebiteDialog();
        await ChatMessage.create({ content: `${actor.name} is under the influence of Eyebite Spell` });
    }
    //Cleanup hooks and flags.
    if (args[0] === "each") {
        EyebiteDialog();
    }
}