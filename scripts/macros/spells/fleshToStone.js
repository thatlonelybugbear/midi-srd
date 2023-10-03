import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function fleshToStone(args) {
    if (!game.modules.get("dfreds-convenient-effects")?.active) return ui.notifications.error("Please enable the DFreds CE module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const DAEItem = lArgs.efData.flags.dae.itemData
    const saveData = DAEItem.system.save
    let dc = args[1]

    if (args[0] === "on") {
        await MidiSRDHelpers._addDfred("Restrained", actor)
        await DAE.setFlag(actor, "FleshToStoneSpell", {
            successes: 0,
            failures: 1
        });
    }

    if (args[0] === "off") {
        await DAE.unsetFlag("world", "FleshToStoneSpell");
        await ChatMessage.create({ content: "Flesh to stone ends, if concentration was maintained for the entire duration,the creature is turned to stone until the effect is removed. " });
    }

    if (args[0] === "each") {
        let flag = DAE.getFlag(actor, "FleshToStoneSpell");
        if (flag.failures === 3) return;
        const flavor = `${CONFIG.DND5E.abilities[saveData.ability]} DC${dc} ${DAEItem?.name || ""}`;
        let saveRoll = (await actor.rollAbilitySave(saveData.ability, { flavor, fastForward: true })).total;

        if (saveRoll < dc) {
            if (flag.failures === 2) {
                let fleshToStoneFailures = (flag.failures + 1);
                await DAE.setFlag(actor, "FleshToStoneSpell", {
                    failures: fleshToStoneFailures
                });
                await ChatMessage.create({ content: `Flesh To Stone on ${actor.name} is complete` });
                FleshToStoneUpdate();
                return;
            }
            else {
                let fleshToStoneFailures = (flag.failures + 1);
                await DAE.setFlag(actor, "FleshToStoneSpell", {
                    failures: fleshToStoneFailures
                });
                console.log(`Flesh To Stone failures increments to ${fleshToStoneFailures}`);
            }
        }
        else if (saveRoll >= dc) {
            if (flag.successes === 2) {
                await ChatMessage.create({ content: `Flesh To Stone on ${actor.name} ends` });
                await actor.deleteEmbeddedDocuments("ActiveEffect", [lArgs.effectId]);
                await MidiSRDHelpers._addDfred("Restrained", actor)
                return;
            }
            else {
                let fleshToStoneSuccesses = (flag.successes + 1);
                await DAE.setFlag(actor, "FleshToStoneSpell", {
                    successes: fleshToStoneSuccesses
                });
                console.log(`Flesh To Stone successes to ${fleshToStoneSuccesses}`);
            }
        }
    }

    async function FleshToStoneUpdate() {
        let fleshToStone = actor.effects.get(lArgs.effectId);
        let icon = fleshToStone.icon;
        if (game.modules.get("dfreds-convenient-effects").active) icon = "modules/dfreds-convenient-effects/images/petrified.svg";
        else icon = "icons/svg/paralysis.svg"
        let label = fleshToStone.label;
        label = "Flesh to Stone - Petrified";
        let time = fleshToStone.duration.seconds
        time = 60000000
        await fleshToStone.update({ icon, label, time });
    }
}   