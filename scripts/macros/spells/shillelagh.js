import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs';
export async function shillelagh(args) {  //done - check
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    // we see if the equipped weapons have base weapon set and filter on that, otherwise we just get all weapons
    const filteredWeapons = actor.items
        .filter((i) => i.type === "weapon" && (i.system.baseItem === "club" || i.system.baseItem === "quarterstaff"));
    const weapons = (filteredWeapons.length > 0)
        ? filteredWeapons
        : actor.itemTypes.weapon;

    const weapon_content = weapons.map((w) => `<option value=${w.id}>${w.name}</option>`).join("");
    const mutName = "shillelaghMidiSRD"
    if (args[0] === "on") {
        const content = `
            <div class="form-group">
            <label>Weapons : </label>
            <select name="weapons">
            ${weapon_content}
            </select>
            </div>
            `;

        new Dialog({
            title: "Choose a club or quarterstaff",
            content,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: async (html) => {
                        const itemId = html.find("[name=weapons]")[0].value;
                        const weaponItem = actor.getEmbeddedDocument("Item", itemId);
                        const parts = duplicate(weaponItem.system.damage.parts);
                        parts[0][0] = parts[0][0].replace(/1d(4|6)/g, "1d8");
                        const ability = weaponItem.system.ability;
                        const targetAbilities = actor.system.abilities;
                        const spellcastingAbility = actor.system.attributes.spellcasting;
                        const updates = {
                            embedded:{
                                Item:{
                                    [weaponItem.name]: {
                                        name: weaponItem.name + " [Shillelagh]",
                                        "system.damage.parts": parts,
                                        "system.properties":{mgc: true},
                                        "system.ability": targetAbilities[spellcastingAbility].value > targetAbilities.str.value ? spellcastingAbility : "str"
                                    }
                                }
                            }
                        }
                        if (MidiSRDHelpers._hasMutation(token,mutName)) await warpgate.revert(token.document,mutName);
                        await ChatMessage.create({
                            content: weaponItem.name + " is empowered by Shillelagh",
                        });
                        await warpgate.mutate(token.document,updates,{},{name:mutName});
                    },
                },
                Cancel: {
                    label: `Cancel`,
                },
            },
        }).render(true);
    }

    if (args[0] === "off") {
        const itemName = actor.items.find(i=>i.name.includes("[Shillelagh]")).name.split(" [Shillelagh]")[0];
        await warpgate.revert(token.document,mutName);
        await ChatMessage.create({ content: itemName + " returns to normal" });
    }
}