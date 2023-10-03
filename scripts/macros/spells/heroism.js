import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function heroism(args) { //done
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const mod = args[1];
    const currentTemp = actor.system.attributes.hp.temp;

    if (args[0] === "on") {
        await ChatMessage.create({ content: `Heroism is applied to ${actor.name}` });
    }
    if (args[0] === "off") {
        await ChatMessage.create({ content: `Heroism ends for ${actor.name}` });
    }
    if (args[0] === "each" && mod > currentTemp) {
        await warpgate.mutate(token.document,{"system.attributes.hp.temp": mod },{},{permanent:true});
        await ChatMessage.create({ content: "Heroism revitalises " + actor.name })
    } 
}