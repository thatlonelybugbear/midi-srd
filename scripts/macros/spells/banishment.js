import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function banishment(args) { //done
    //DAE Macro
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");

    if (args[0] === "on") {
        await warpgate.mutate(token.document,{ token: {hidden: true} },{},{name:"Banished"}); // hide targeted token
        await ChatMessage.create({ content:"The creature was banished" });
    }
    if (args[0] === "off") {
        await warpgate.revert(token.document, "Banished"); // unhide token
        await ChatMessage.create({ content:"The creature returned from banishment" });
    }
}