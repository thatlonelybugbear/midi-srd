import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs';
export async function spiritualWeapon(args, texture) { //warp
    const { actor, token, lArgs } = MidiSRDhelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const castingItem = lArgs.efData.flags.dae.itemData
    if (args[0] === "on") {
        let damage = Math.floor(args[1] / 2);
        let image = castingItem.img;
        let templateData;
        let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
            t: "circle",
            user: game.user.id,
            x: token.x + canvas.grid.size / 2,
            y: token.y + canvas.grid.size / 2,
            direction: 0,
            distance: 60,
            borderColor: "#FF0000",
            flags: { "midi-srd": { SpiritualWeaponRange: { ActorId: actor.id } } }
        }]);
        range.then(result => {
            templateData = {
                t: "rect",
                user: game.user.id,
                distance: 7,
                direction: 45,
                texture: texture || "",
                x: 0,
                y: 0,
                flags: { "midi-srd": { SpiritualWeapon: { ActorId: actor.id } } },
                fillColor: game.user.color
            }
            Hooks.once("createMeasuredTemplate",() => {
                MidiSRDhelpers._deleteTemplates("SpiritualWeaponRange", actor);
            })
            MidiSRDhelpers._createTemplate(templateData, actor)
        })
        await actor.createEmbeddedDocuments("Item",
            [{
                "name": "Summoned Spiritual Weapon",
                "type": "weapon",
                "system": {
                    "equipped": true,
                    "identified": true,
                    "activation": {
                        "type": "bonus",
                        "cost": 1
                    },
                    "target": {
                        "value": 1,
                        "type": "creature"
                    },
                    "ability": args[2],
                    "actionType": "msak",
                    "chatFlavor": "",
                    "critical": null,
                    "damage": {
                        "parts": [[`${damage}d8+@mod`, "force"]]
                    },
                    "weaponType": "simpleM",
                    "proficient": true
                },
                "flags": { "midi-srd": { "SpiritualWeapon": actor.id } },
                "img": `${image}`,
            }]
        );
        ui.notifications.notify("Weapon created in your inventory")
    }
    if (args[0] === "off") {
        MidiSRDhelpers._deleteItems("SpiritualWeapon", actor)
        MidiSRDhelpers._deleteTemplates("SpiritualWeapon", actor)
    }
}