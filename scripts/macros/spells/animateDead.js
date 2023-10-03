import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function animateDead(args,config) {
    //config = { texture:{zombie:"image path",skeleton:"image path"}, hp:Number to be added to the normal HP of the animated undead. , extra:1}
    if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Please enable the Warp Gate module");
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const { texture, hp, extra=0 } = config;
    const repeat = 1 + (lArgs.spellLevel - 3) * 2 + extra;
    const item = args.item;
    if (actor.sheet._state === 2) {
        game.actorSheetState = true;
        actor.sheet.close();
    }
    const buttonData = {
        buttons: [{
            label: 'Zombie',
            value: {
                token: { name: "Zombie" },
                actor: { name: "Zombie" },
            }
        }, {
            label: 'Skeleton',
            value: {
                actor: { name: "Skeleton" },
                token: { name: "Skeleton" },
            }
        }
        ], title: 'Which type of Undead?'
    };
    for (let i = 0; i < repeat; i++) {
        const dialog = await warpgate.buttonDialog(buttonData);
        if (!game.actors.getName(dialog.actor.name)) {
            const pack = game.packs.get('dnd5e.monsters');
            const index = pack.index.getName(dialog.actor.name);
            const compendium = await pack.getDocument(index._id);
            await MidiSRDHelpers._createActor(duplicate(compendium));
        }
        const summonedActor = game.actors.getName(dialog.actor.name);
        const data = await summonedActor.getTokenDocument();
        let updates={};
        if (!!config?.texture[dialog.actor.name]) updates = {token:{'texture.src': config.texture[dialog.actor.name]}};
        if (!!config?.hp) {
            let { value, max } = summonedActor.system.attributes.hp;
            value = value + Number(config.hp);
            max = max + Number(config.hp);
            updates = foundry.utils.mergeObject(updates,{actor:{'system.attributes.hp.max':max,'system.attributes.hp.value':value}})
        }
        const { height, width } = summonedActor.prototypeToken;
        const snap = height%2 ? -1 : 1;
        const location = await MidiSRDHelpers._warpgateCrosshairs(token,item.system.range.value,item.name,summonedActor.img,{height,width},snap);
        if (!location) return;
        const options = { controllingActor: actor };
        await warpgate.spawnAt(location, data, updates, {}, options);
    }
    if (game.actorSheetState) {
        actor.sheet.render(true);
        game.actorSheetState = false;
    }   
}   