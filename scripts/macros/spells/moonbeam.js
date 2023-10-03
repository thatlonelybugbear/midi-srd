import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function moonbeam(args) { //make it warpgate the item in and also warpgate an actor in place of the tempalte for moving aroudn the MoonBeam
    //DAE Item Macro Execute, Effect Value = @attributes.spelldc
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const DAEItem = lArgs.efData.flags.dae.itemData
    const saveData = DAEItem.system.save
    const DC = args[1]

    if (args[0] === "on") {
        let range = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [{
            t: "circle",
            user: game.user.id,
            x: token.x + canvas.grid.size / 2,
            y: token.y + canvas.grid.size / 2,
            direction: 0,
            distance: 60,
            borderColor: "#517bc9",
            flags: { "midi-srd": { MoonbeamRange: { ActorId: actor.id } } }
        }]);
        range.then(result => {
            let templateData = {
                t: "circle",
                user: game.user.id,
                distance: 5,
                direction: 0,
                x: 0,
                y: 0,
                flags: {
                    "midi-srd": { Moonbeam: { ActorId: actor.id } }
                },
                fillColor: game.user.color
            }
            Hooks.once("createMeasuredTemplate", MidiSRDHelpers._deleteTemplates("MoonbeamRange", actor));
            MidiSRDHelpers._createTemplate(templateData, actor)
        })
        let damage = DAEItem.system.level;
        await actor.createEmbeddedDocuments("Item",
            [{
                "name": "Moonbeam repeating",
                "type": "spell",
                "system": {
                    "source": "Casting Moonbeam",
                    "ability": "",
                    "description": {
                        "value": "half damage on save"
                    },
                    "actionType": "save",
                    "attackBonus": 0,
                    "damage": {
                        "parts": [[`${damage}d10`, "radiant"]],
                    },
                    "formula": "",
                    "save": {
                        "ability": "con",
                        "dc": saveData.dc,
                        "scaling": "spell"
                    },
                    "level": 0,
                    "school": "abj",
                    "preparation": {
                        "mode": "prepared",
                        "prepared": false
                    },

                },
                "flags": { "midi-srd": { "Moonbeam": { "ActorId": actor.id } } },
                "img": DAEItem.img,
                "effects": []
            }]
        );
        ;
    }
    if (args[0] === "off") {
        await MidiSRDHelpers._deleteItems("Moonbeam", actor)
        await MidiSRDHelpers._deleteTemplates("Moonbeam", actor)
    }
}