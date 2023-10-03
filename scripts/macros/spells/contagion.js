import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function contagion(args) { //done
    if (args[0].tag === "OnUse") {
        const targetActor = args[0].hitTargets[0]?.actor;
        if (!targetActor) return;
        const disease = await ContagionMessage(targetActor);
        await DAE.setFlag(targetActor, "ContagionSpell", {fails: 0, successes: 0, disease})
    }
    else {
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
        const DAEItem = lArgs.efData.flags.dae.itemData
        const dc = args[1]
        if (args[0] === "on") {}
        if (args[0] === "off") {}
        if (args[0] === "each") {
            let contagion = lArgs.efData;
            if (contagion.label === "Contagion")
                Contagion()
        }

        /** 
         * Execute contagion effects, update flag counts or remove effect
         * 
         * @param {Actor5e} combatant Current combatant to test against
         * @param {Number} save Target DC for save
         */
        async function Contagion() {
            let flag = DAE.getFlag(actor, "ContagionSpell");
            const flavor = `${CONFIG.DND5E.abilities["con"]} DC${dc} ${DAEItem?.name || ""}`;
            let saveRoll = (await actor.rollAbilitySave("con", { flavor })).total;

            if (saveRoll < dc) {
                if (flag.fails === 2) {
                    await ChatMessage.create({ content: `Contagion on ${actor.name} is complete` });
                    let disease = flag.disease;
                    disease["_id"] = lArgs.effectId;
                    disease["origin"] = lArgs.origin;
                    await MidiQOL.socket().executeAsGM("updateEffects", {actorUuid:actor.uuid, updates:[disease]});
                    return DAE.unsetFlag(actor, "ContagionSpell");
                }
                else {
                    let contagionCount = (flag.fails + 1);
                    await DAE.setFlag(actor, "ContagionSpell", {
                        fails: contagionCount
                    });
                    console.log(`Failed saves Contagion increased to ${contagionCount}`);
                }
            }
            else if (saveRoll >= dc) {
                if (flag.successes === 2) {
                    await ChatMessage.create({ content: `${actor.name} manages to resist the Contagion spell ` });
                    await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid:actor.uuid, effects:[lArgs.effectId]});
                    return DAE.unsetFlag(actor, "ContagionSpell");
                }
                else {
                    let contagionCount = (flag.successes + 1);
                    await DAE.setFlag(actor, "ContagionSpell", {
                        successes: contagionCount
                    });
                    console.log(`Successful saves against Contagion increased to ${contagionCount}`);
                }
            }
        }
    }

    /**
     * Generates the GM client dialog for selecting final Effect, updates target effect with name, icon and new DAE effects.
     */
    async function ContagionMessage(target) {
        let dialog = new Promise((resolve, reject) => {
            new Dialog({
                title: "Contagion options",
                content: "<p>Select the effect</p>",
                buttons: {
                    one: {
                        label: "Blinding Sickness",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.wis",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.wis",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "modules/dfreds-convenient-effects/images/blinded.svg",
                                label: "Blinding Sickness",
                            }
                            resolve(data);
                        }
                    },
                    two: {
                        label: "Filth Fever",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.mwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.rwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.str",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.str",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "icons/magic/unholy/hand-fire-skeleton-pink.webp",
                                label: "Filth Fever",
                            }
                            resolve(data);
                        }
                    },
                    three: {
                        label: "Flesh Rot",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.cha",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "system.traits.dv.all",
                                        mode: 0,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "icons/skills/wounds/illness-disease-glowing-green.webp",
                                label: "Flesh Rot",
                            }
                            resolve(data);
                        }
                    },
                    four: {
                        label: "Mindfire",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.int",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.int",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "icons/svg/daze.svg",
                                label: "Mindfire",
                            }
                            resolve(data);
                        }
                    },
                    five: {
                        label: "Seizure",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.mwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.attack.rwak",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.dex",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.dex",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "icons/svg/paralysis.svg",
                                label: "Seizure",
                            }
                            resolve(data);
                        }
                    },
                    six: {
                        label: "Slimy Doom",
                        callback: async () => {
                            let data = {
                                changes: [
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.check.con",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                    {
                                        key: "flags.midi-qol.disadvantage.ability.save.con",
                                        mode: 5,
                                        priority: 20,
                                        value: "1",
                                    },
                                ],
                                icon: "icons/magic/acid/dissolve-vomit-green-brown.webp",
                                label: "Slimy Doom",
                            }
                            resolve(data);
                        }
                    },
                }
            }).render(true);
        })
        return dialog;  
    }
}