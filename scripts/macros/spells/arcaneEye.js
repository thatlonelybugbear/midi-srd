import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function arcaneEye(args, texture) {
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    if (args[0] === "on") {
        if (!game.actors.getName("Generic Actor for MidiSRD")) await MidiSRDHelpers._createActor({ name: "Generic Actor for MidiSRD", type: "npc" });
        const sourceItem = await fromUuid(lArgs.origin);
        texture = texture || sourceItem.img
        let updates = {
            token: { "name": "Arcane Eye", "img": texture, "dimVision": 30, scale: 0.4, "flags": { "midi-srd": { "ArcaneEye": { "ActorId": actor.id } } } },
            actor: { "name": "Arcane Eye" }
        }
        let { x, y } = await MidiSRDHelpers._warpgateCrosshairs(token, 30, "Arcane Eye", texture, {}, -1)

        await warpgate.spawnAt({ x, y }, "Generic Actor for MidiSRD", updates, { controllingActor: actor });
    }
    if (args[0] === "off") {
        await MidiSRDHelpers._deleteTokens("ArcaneEye", actor)
    }
}