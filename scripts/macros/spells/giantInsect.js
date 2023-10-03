import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function giantInsect(args) { //check -done?
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    if (args[0] === "on") {
        if (!game.actors.getName("Generic Actor for MidiSRD")) await MidiSRDHelpers._createActor({ name: "Generic Actor for MidiSRD", type: "npc" });
        const buttonData = {
            buttons: [{
                label: 'Centipedes',
                value: {
                    token: { name: "Giant Centipede" },
                    actor: { name: "Giant Centipede" },
                    cycles: 10
                }
            },
            {
                label: 'Spiders',
                value: {
                    token: { name: "Giant Spider" },
                    actor: { name: "Giant Spider" },
                    cycles: 3
                }
            }, {
                label: 'Wasps',
                value: {
                    token: { name: "Giant Wasp" },
                    actor: { name: "Giant Wasp" },
                    cycles: 5
                }
            }, {
                label: 'Scorpion',
                value: {
                    token: { name: "Giant Scorpion" },
                    actor: { name: "Giant Scorpion" },
                    cycles: 1
                }
            },
            ], title: 'Which type of insect?'
        };
        let pack = game.packs.get('dnd5e.monsters')
        await pack.getIndex()
        let dialog = await warpgate.buttonDialog(buttonData);
        let index = pack.index.find(i => i.name === dialog.actor.name)
        let compendium = await pack.getDocument(index._id)

        let updates = {
            token: compendium.prototypeToken,
            actor: compendium.toObject()
        }
        updates.token.flags["midi-srd"] = { "GiantInsect": { ActorId: actor.id } }
        await warpgate.spawn("Generic Actor for MidiSRD", updates, {}, { controllingActor: actor, duplicates: dialog.cycles });
    }
    if (args[0] === "off") {
        MidiSRDHelpers._deleteTokens("GiantInsect", actor)
    }
}