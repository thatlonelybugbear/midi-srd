import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs';
export async function unseenServant(args, texture) { //done -check
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    if (!game.actors.getName("Generic Actor for MidiSRD")) await MidiSRDHelpers._createActor({ name: "Generic Actor for MidiSRD", type: "npc" });
    texture = texture || lArgs.item.img
    let updates = {
        token: {
            "name": "Unseen Servant", "img": texture
        },
        actor: {
            "name": "Unseen Servant",
            "system.attributes": { "ac.value": 10, "hp.value": 1 },
            "system.abilities.str.value" : 2
        }
    }
    let { x, y } = await MidiSRDHelpers._warpgateCrosshairs(token, 60, "Unseen Servant", texture, {}, -1)

    await warpgate.spawnAt({ x, y }, "Generic Actor for MidiSRD", updates, { controllingActor: actor },);

}