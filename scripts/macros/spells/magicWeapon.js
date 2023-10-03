import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function magicWeapon(args) { //warpgate it = Shillelagh as an example
    //DAE Item Macro Execute, arguments = @item.level
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const DAEItem = lArgs.efData.flags.dae.itemData

    let weapons = actor.itemTypes.weapon
    let weapon_content = ``;

    function value_limit(val, min, max) {
        return val < min ? min : (val > max ? max : val);
    };
    //Filter for weapons
    for (let weapon of weapons) {
        weapon_content += `<label class="radio-label">
            <input type="radio" name="weapon" value="${weapon.id}">
            <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
            ${weapon.name}
        </label>`;
    }

    /**
     * Select for weapon and apply bonus based on spell level
     */
    if (args[0] === "on") {
        let content = `
            <form class="magicWeapon">
            <div class="form-group" id="weapons">
                ${weapon_content}
            </div>
            </form>
            `;

        new Dialog({
            content,
            buttons:
            {
                Ok:
                {
                    label: `Ok`,
                    callback: async (html) => {
                        let itemId = $("input[type='radio'][name='weapon']:checked").val();
                        let weaponItem = actor.items.get(itemId);
                        let copy_item = duplicate(weaponItem);
                        let spellLevel = Math.floor(DAEItem.system.level / 2);
                        let bonus = value_limit(spellLevel, 1, 3);
                        let wpDamage = copy_item.system.damage.parts[0][0];
                        let verDamage = copy_item.system.damage.versatile;
                        await DAE.setFlag(actor, `magicWeapon`, {
                            damage: weaponItem.system.attackBonus,
                            weapon: itemId,
                            weaponDmg: wpDamage,
                            verDmg: verDamage,
                            mgc: copy_item.system.properties.mgc
                        }
                        );
                        if (copy_item.system.attackBonus === "") copy_item.system.attackBonus = "0"
                        copy_item.system.attackBonus = `${parseInt(copy_item.system.attackBonus) + bonus}`;
                        copy_item.system.damage.parts[0][0] = (wpDamage + " + " + bonus);
                        copy_item.system.properties.mgc = true
                        if (verDamage !== "" && verDamage !== null) copy_item.system.damage.versatile = (verDamage + " + " + bonus);
                        await actor.updateEmbeddedDocuments("Item", [copy_item]);
                    }
                },
                Cancel:
                {
                    label: `Cancel`
                }
            }
        }).render(true);
    }

    //Revert weapon and unset flag.
    if (args[0] === "off") {
        let { damage, weapon, weaponDmg, verDmg, mgc } = DAE.getFlag(actor, 'magicWeapon');
        let weaponItem = actor.items.get(weapon);
        let copy_item = duplicate(weaponItem);
        copy_item.system.attackBonus = damage;
        copy_item.system.damage.parts[0][0] = weaponDmg;
        copy_item.system.properties.mgc = mgc
        if (verDmg !== "" && verDmg !== null) copy_item.system.damage.versatile = verDmg;
        await actor.updateEmbeddedDocuments("Item", [copy_item]);
        await DAE.unsetFlag(actor, `magicWeapon`);
    }
}