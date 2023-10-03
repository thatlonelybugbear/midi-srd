import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function invisibility(args) { //check done
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const mutName = "invisibilityMidiSRD";
    const tokenDoc = token.document;
    if (args[0] === "on") {
        if (MidiSRDHelpers._hasMutation(tokenDoc,mutName)) await warpgate.revert(tokenDoc,mutName);
        await ChatMessage.create({ content: `${token.name} turns invisible`, whisper: [game.user] });
        await warpgate.mutate(tokenDoc,{token:{"hidden": true }},{},{name:mutName});
    }
    if (args[0] === "off") {
        await ChatMessage.create({ content: `${token.name} re-appears`, whisper: [game.user] });
        await await warpgate.revert(tokenDoc,mutName);
    }
}