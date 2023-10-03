import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function seeInvisibility(args) {
	if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const mutName = "MidiSRD - seeInvisibility";
    if (args[0] === "on") {
    	const {range} = token.document.sight;
		if (!range) return ui.notifications.error("Configure Vision on the Token before using MidiSRD - seeInvisibility");
    	const detectionModes = duplicate(token.document.detectionModes)
    	detectionModes.push({id: 'seeInvisibility', enabled: true, range});
    	if (MidiSRDHelpers._hasMutation(token,mutName)) await warpgate.revert(token.document,mutName);
    	await warpgate.mutate(token.document, {token:{detectionModes}},{},{name:mutName});
    }
    if (args[0] === "off") await warpgate.revert(token.document,mutName);
}