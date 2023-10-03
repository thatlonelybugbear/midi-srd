import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function createUndead(args) { //check
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    if (!game.actors.getName("Generic Actor for MidiSRD")) await MidiSRDHelpers._createActor({ name: "Generic Actor for MidiSRD", type: "npc" });
    let spelllevel = lArgs.powerLevel
    const buttonData = {
        buttons: [{
            label: 'Ghouls',
            value: {
                token: { name: "Ghoul" },
                actor: { name: "Ghoul" },
                cycles: spelllevel - 3
            }
        },
        ], title: 'Which type of Undead?'
    };
    if (spelllevel > 7) buttonData.buttons.push({
        label: 'Wights',
        value: {
            actor: { name: "Wight" },
            token: { name: "Wight" },
            cycles: spelllevel - 6
        }
    }, {
        label: 'Ghasts',
        value: {
            actor: { name: "Ghast" },
            token: { name: "Ghast" },
            cycles: spelllevel - 6
        }
    })
    if (spelllevel > 8) buttonData.buttons.push({
        label: 'Mummies',
        value: {
            actor: { name: "Mummy" },
            token: { name: "Mummy" },
            cycles: 2
        }
    })
    let pack = game.packs.get('dnd5e.monsters')
    await pack.getIndex()
    let dialog = await warpgate.buttonDialog(buttonData);
    let index = pack.index.find(i => i.name === dialog.actor.name)
    let compendium = await pack.getDocument(index._id)

    let updates = {
        token: compendium.prototypeToken,
        actor: compendium.toObject()
    }
    await warpgate.spawn("Generic Actor for MidiSRD", updates, {}, { controllingActor: actor, duplicates: dialog.cycles });
}