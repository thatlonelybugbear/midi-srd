//MidiMacros.summonWaterElemental(args);
export async function summonWaterElemental(args) {
	if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
	const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
	if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
	if (!game.actors.getName("Generic Actor for MidiSRD")) await MidiSRDHelpers._createActor({ name: "Generic Actor for MidiSRD", type: "npc" });
	const flagName = "Summon Water Elemental";
	const sceneId = game.scenes.active.id;
	if (args[0] === "on") {
		const pack = game.packs.get("dnd5e.monsters")
		const indexId = pack.index.getName("Water Elemental")._id;
		const actorData = await pack.getDocument(indexId);
		const protoDoc = await actorData.getTokenDocument();
		const updates = {
			token: protoDoc,
			actor: compendium.toObject()
		}
		const spawnedId = await warpgate.spawn("Generic Actor for MidiSRD", updates, {}, { controllingActor: effectActor });
		await DAE.setFlag(effectActor,flagName,spawnedId[0])
	}
	if (args[0] === "off") {
		const spawnedId = DAE.getFlag(effectActor,flagName);
		await warpgate.dismiss(spawnedId,sceneId);
		await DAE.unsetFlag(effectActor,flagName);
	}	
}
