import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function laughter(args) { //check do it an doOverTimeEffect if damaged save and macroname
    const saveDC = args[1];
    const saveAbility = args[2];
    if(args[0] === "onUpdateActor") {
        console.log(args)
        const {originItem, targetActor, options:{dhp}} = args[args.length -1] ?? {};
        console.log(originItem)
        if (dhp >= "0") return;
        const flavor = `${CONFIG.DND5E.abilities[saveAbility]} DC:${saveDC} ${originItem?.name || ""}`
        const saveRoll = (await targetActor.rollAbilitySave(saveAbility , { flavor, fastForward: true, advantage: true })).total;
        if (saveRoll < saveDC) return;
        await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: targetActor.uuid, effects:[targetActor.effects.find(eff=>eff.label===originItem.name).id]})
    }
    else {
        const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
        if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
        if (args[0] === "on") {
            const item = actor.items.getName("Hideous Laughter");
            const effectData = {
                changes: [
                {
                    "key": "flags.dae.onUpdateTarget",
                    "value": "Hideous Laughter,ItemMacro.Item.QeFDfEnbSaTpk7Ag,system.attributes.hp.value, @attributes.spelldc, wis",
                    "mode": 0,
                    "priority": 20
                },
                {
                    "key": "macro.CE",
                    "value": "Prone",
                    "mode": 0,
                    "priority": 20
                },
                {
                    "key": "macro.CE",
                    "value": "Incapacitated",
                    "mode": 0,
                    "priority": 20
                },
                {
                    "key": "flags.midi-qol.OverTime",
                    "value": "turn=end,saveDC=@attributes.spelldc,saveAbility=wis,saveMagic=true",
                    "mode": 5,
                    "priority": 20
                },
                {
                    "key": "macro.itemMacro",
                    "value": "",
                    "mode": 0,
                    "priority": 20
                }
                ]
            }
            const effect = duplicate(actor.effects.find(eff=>eff.label === "Hideous Laughter"));
            effect.changes = mergeObject(effect.changes, effectData.changes)
            await MidiQOL.socket().executeAsGM("updateEffects", {actorUuid:actor.uuid, effects:[{"_id":effect.id, changes:effect.changes}]});
        }
        if (args[0] === "off") await MidiSRDHelpers._addDfred("Prone", actor)
    }
}