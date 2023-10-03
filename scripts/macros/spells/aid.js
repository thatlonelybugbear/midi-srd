import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'

export async function aid(args) { //done
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const buf = (parseInt(args[1]) - 1) * 5;
    const curHP = actor.system.attributes.hp.value;
    const curMax = actor.system.attributes.hp.max;

    if (args[0] === "on") await warpgate.mutate(token.document,{actor:{"system.attributes.hp.value": Number(curHP) + Number(buf)}},{},{permanent:true})
    else if (curHP > curMax) await warpgate.mutate(token.document,{actor:{"system.attributes.hp.value": Number(curMax)}},{},{permanent:true})
}