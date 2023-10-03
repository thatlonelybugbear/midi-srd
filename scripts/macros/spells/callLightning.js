import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function callLightning(args, texture) {
    //DAE Macro no arguments passed
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    const {castData} = lArgs.efData.flags["midi-qol"]
   // const saveData = DAEitem.system.save
    /**
     * Create Call Lightning Bolt item in inventory
     */
    if (args[0] === "on") {
        let templateData = {
            t: "circle",
            user: game.user.id,
            distance: 60,
            direction: 0,
            x: 0,
            y: 0,
            texture: texture || "",
            flags: { "midi-srd": { CallLighting: { ActorId: actor.id } } },
            fillColor: game.user.color
        }
        MidiSRDHelpers._createTemplate(templateData, actor)

        await actor.createEmbeddedDocuments("Item",
            [{
                "name": "Call Lightning - bolt",
                "type": "spell",
                "system": {
                    "description": {
                        "value": "<p><span style=\"color: #191813; font-size: 13px;\">A bolt of lightning flashes down from the cloud to that point. Each creature within 5 feet of that point must make a Dexterity saving throw. A creature takes 3d10 lightning damage on a failed save, or half as much damage on a successful one.</span></p>"
                    },
                    "activation": {
                        "type": "action"
                    },
                    "target": {
                        "value": 5,
                        "units": "ft",
                        "type": "radius"
                    },
                    "ability": "",
                    "actionType": "save",
                    "damage": {
                        "parts": [
                            [
                                `${castData.castLevel}d10`,
                                "lightning"
                            ]
                        ],
                    },
                    "save": {
                        "ability": "dex",
                        "dc": actor.system.attributes.spelldc,
                        "scaling": "spell"
                    },
                    "level": 0,
                    "school": "con",
                    "preparation": {
                        "mode": "atwill",
                        "prepared": true
                    },
                },
                "flags": { "midi-srd": { "CallLighting": { "ActorId": actor.id } } },
                "img": "icons/magic/lightning/bolt-forked-large-blue-yellow.webp",
            }]
        );
    }

    // Delete Flame Blade
    if (args[0] === "off") {
        MidiSRDHelpers._deleteItems("CallLighting", actor)
        MidiSRDHelpers._deleteTemplates("CallLighting", actor)
    }
}