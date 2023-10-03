import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function divineWord(args) {  //change the spell duration to be 1 hour? why is there an about time macro?
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");

    async function DivineWordApply(token, actor, targetHp) {
        if (targetHp <= 20) {
            await warpgate.mutate(token.document,{ "system.attributes.hp.value": 0 }, {}, {permanent:true});
        } else {
            if (targetHp <= 30) {
                if (!hasStunned) await MidiSRDHelpers._addDfred("Stunned", actor);
                /*game.Gametime.doIn({ hours: 1 }, async () => {
                    await MidiSRDHelpers._removeDfred("Stunned", actor);
                });*/
            }
            if (targetHp <= 40) {
                if (!hasBlinded) await MidiSRDHelpers._addDfred("Blinded", actor);
                /*game.Gametime.doIn({ hours: 1 }, async () => {
                    await MidiSRDHelpers._removeDfred("Blinded", actor);
                });*/
            }
            if (targetHp <= 50) {
                if (!hasDeafened) await MidiSRDHelpers._addDfred("Deafened", actor);
                /*game.Gametime.doIn({ hours: 1 }, async () => {
                    await MidiSRDHelpers._removeDfred("Deafened", actor);
                });*/
            }
        }
    }
    if (args[0] === "on") {
        DivineWordApply(token, actor, token.actor.system.attributes.hp.value)
    }
}