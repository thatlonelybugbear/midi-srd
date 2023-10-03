import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'

export async function dragonWings(args) { //no need for warpgate, it's only on owned token
    const { actor } = MidiSRDhelpers._targets(args);
    const update = actor.system.attributes.movement.fly ? 0 : actor.system.attributes.movement.walk;
    await actor.update({"system.attributes.movement.fly":update})
}