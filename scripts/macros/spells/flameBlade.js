import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function flameBlade(args) { //check - should I go to MidiQL castData? is DAEItem.system.level correct?
    //warpgate it
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const DAEItem = lArgs.efData.flags.dae.itemData
    console.log(DAEItem)

    if (args[0] === "on") {
        let weaponDamge = 2 + Math.floor(DAEItem.system.level / 2);
        await actor.createEmbeddedDocuments("Item",
            [{
                "name": "Summoned Flame Blade",
                "type": "weapon",
                "system": {
                    "quantity": 1,
                    "activation": {
                        "type": "action",
                        "cost": 1,
                        "condition": ""
                    },
                    "target": {
                        "value": 1,
                        "width": null,
                        "units": "",
                        "type": "creature"
                    },
                    "range": {
                        "value": 5,
                    },
                    "ability": "",
                    "actionType": "msak",
                    "attackBonus": "",
                    "damage": {
                        "parts": [
                            [
                                `${weaponDamge}d6`,
                                "fire"
                            ]
                        ],
                    },
                    "weaponType": "simpleM",
                    "proficient": true,
                },
                "flags": {
                    "midi-srd": {
                        "FlameBlade":
                            actor.id
                    }
                },
                "img": DAEItem.img,
                "effects": []
            }]
        );
        ui.notifications.notify("A Flame Blade appears in your inventory")
    }

    // Delete Flame Blade
    if (args[0] === "off") {
        MidiSRDHelpers._deleteItems("FlameBlade", actor)
    }
}