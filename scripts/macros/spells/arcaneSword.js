import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function arcaneSword(args, texture) { //check
    //DAE Macro Execute, Effect Value = "Macro Name" @target
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");

    let casterToken = canvas.tokens.get(lArgs.tokenId) || token;
    const DAEitem = lArgs.efData?.flags.dae.itemData ?? args[0].item;
    const saveData = DAEitem?.system.save ?? "";
    /**
     * Create Arcane Sword item in inventory
     */
    if (args[0].tag === "OnUse") {
        let image = DAEitem.img;
        let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
            t: "circle",
            user: game.user.id,
            x: casterToken.x + canvas.grid.size / 2,
            y: casterToken.y + canvas.grid.size / 2,
            direction: 0,
            distance: 60,
            borderColor: "#FF0000",
            flags: { "midi-srd": { ArcaneSwordRange: { ActorId: actor.id } } }
            //fillColor: "#FF3366",
        }]);
        range.then(result => {
            let templateData = {
                t: "rect",
                user: game.user.id,
                distance: 7,
                direction: 45,
                texture: texture || "",
                x: 0,
                y: 0,
                flags: { "midi-srd": { ArcaneSword: { ActorId: actor.id } } },
                fillColor: game.user.color
            }
            Hooks.once("createMeasuredTemplate",() => {
                MidiSRDHelpers._deleteTemplates("ArcaneSwordRange", actor);
            })
            MidiSRDHelpers._createTemplate(templateData, actor)
        })
        await actor.createEmbeddedDocuments("Item",
            [{
                "name": "Summoned Arcane Sword",
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
                        "type": "creature"
                    },
                    "range": {
                        "value": 5,
                        "long": null,
                        "units": ""
                    },
                    "ability": DAEitem.system.ability,
                    "actionType": "msak",
                    "attackBonus": "0",
                    "chatFlavor": "",
                    "critical": null,
                    "damage": {
                        "parts": [
                            [
                                `3d10`,
                                "force"
                            ]
                        ],
                        "versatile": ""
                    },
                    "weaponType": "simpleM",
                    "proficient": true,
                },
                "flags": {
                    "midi-srd": {
                        "ArcaneSword": {
                            "ActorId": actor.id
                        }
                    }
                },
                "img": image,
            }]
        );
        ui.notifications.notify("Arcane Sword created in your inventory")
    }

    // Delete Arcane Sword
    if (args[0] === "off") {
        MidiSRDHelpers._deleteItems("ArcaneSword", actor)
        MidiSRDHelpers._deleteTemplates("ArcaneSword", actor)
    }
}