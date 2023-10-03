import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function findSteed(args) { 
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { tokenId, itemUuid } = args[args.length-1] ?? {};
    if(!tokenId) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const token = canvas.tokens.get(tokenId);
    const actor = token.actor;
    const flagName = "MidiSRD_findSteed"
    if (args[0].tag === "OnUse") {
        const effectName = "Find Steed";
        const hasEffect = MidiSRDHelpers._hasEffect(effectName,actor);
        await hasEffect?.delete();
        const item = args.item;
        if (actor.sheet._state === 2) {
            game.actorSheetState = true;
            actor.sheet.close();
        }
        const menuData = {
            inputs: [{
                label: "Fey",
                type: "radio",
                options: "group1"
            },
            {
                label: "Fiend",
                type: "radio",
                options: "group1"
            },
            {
                label: "Celestial",
                type: "radio",
                options: "group1"
            }
            ],
            buttons: [{
                label: 'Warhorse',
                value: {
                    token: { name: "Warhorse" },
                    actor: { name: "Warhorse" },
                },
            },
            {
                label: 'Pony',
                value: {
                    token: { name: "Pony" },
                    actor: { name: "Pony" },
                },
            },
            {
                label: 'Camel',
                value: {
                    token: { name: "Camel" },
                    actor: { name: "Camel" },
                },
            },
            {
                label: 'Elk',
                value: {
                    token: { name: "Elk" },
                    actor: { name: "Elk" },
                },
            },
            {
                label: 'Mastiff',
                value: {
                    token: { name: "Mastiff" },
                    actor: { name: "Mastiff" },
                },
            },
            ], title: 'What type of steed?'
        };
        const pack = game.packs.get('dnd5e.monsters')
        let dialog = await warpgate.menu(menuData);
        while (!dialog.inputs.find(i=>!!i)) dialog = await warpgate.menu(menuData);
        console.log(dialog)
        if (!game.actors.getName(dialog.buttons.actor.name)) {
            const pack = game.packs.get('dnd5e.monsters');
            const index = pack.index.getName(dialog.buttons.actor.name);
            const compendium = await pack.getDocument(index._id);
            const actorId = await MidiSRDHelpers._createActor(duplicate(compendium));
            foundry.utils.setProperty(compendium.flags,'midi-srd.findSteed',actorId);
        }
        const summonedActor = game.actors.getName(dialog.buttons.actor.name);
        const data = await summonedActor.getTokenDocument();
        const { height, width } = summonedActor.prototypeToken;
        const snap = height%2 ? -1 : 1;
        const location = await MidiSRDHelpers._warpgateCrosshairs(token,item.system.range.value,item.name,summonedActor.img,{height,width},snap);
        if (!location) return; //give back spell slot??
        const updates = {actor:{'system.details.type.value': dialog.inputs.find(i => !!i).toLowerCase()}};
        await game.actors.get(newActorId).setFlag('midi-srd','findSteed',actor.id);
        //if (!location) return await actor.effects.find(eff=>eff.label === "Find steed")?.delete();
        //const data = await game.actors.find(a=>a.flags['midi-srd']?.findSteed === actor.id).getTokenDocument();
        const options = { controllingActor: actor };
        const [spawnedId] = await warpgate.spawnAt(location, data, updates, {}, options);
        await DAE.setFlag(actor,flagName,{spawnedId,sceneId:canvas.scene.id});
        if (game.actorSheetState) {
            actor.sheet.render(true);
            game.actorSheetState = false;
        }  
    }
    if (args[0] === "off") {
        const {spawnedId,sceneId} = DAE.getFlag(actor,flagName);
        await warpgate.dismiss(spawnedId,sceneId);
        await DAE.unsetFlag(actor,flagName);
        await game.actors.find(a=>a.flags['midi-srd']?.findSteed === actor.id)?.delete();
    }
}