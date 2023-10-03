import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs';
export async function rayOfEnfeeblement(args) { //done - check
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const mutName = "debuff str";
    const tokenDoc = token.document;
    if (args[0] === "on") {
        const findStrWeapons = (item) => item.abilityMod === "str"
        const toShortHand = (shorthand, item) => {
            const parts = item.system.damage.parts;
            for (const part of parts) {
                part[0] = `floor((${part[0]})/2)`
            }
            const versatile = item.system.damage.versatile ? `floor((${item.system.damage.versatile})/2)` : "" ;
            const formula = item.system.formula ? `floor((${item.system.formula})/2)` : "";
            shorthand[item.id] = {
                'system.damage.parts': parts,
                'system.damage.versatile': versatile,
                'system.formula': formula
            }
            return shorthand;
        }
        const weapons = actor.items.filter( findStrWeapons );
        const entries = weapons.reduce( toShortHand, {} );
        let mwak = actor.system.bonuses.mwak.damage;
        if (!!mwak) mwak = `floor((${mwak})/2)`;

        if (MidiSRDHelpers._hasMutation(tokenDoc,mutName)) await warpgate.revert(tokenDoc, mutName);
        await warpgate.mutate(tokenDoc, {actor: {"system.bonuses.mwak.damage":mwak},embedded: {Item: entries}}, {}, {name: mutName, comparisonKeys: {Item: 'id'}});
    }
    if (args[0] === "off") await warpgate.revert(tokenDoc, mutName);
}   