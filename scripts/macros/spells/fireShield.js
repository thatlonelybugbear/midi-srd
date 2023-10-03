//todo:
//1. change the linked itemMacro to the item that will be in the MidiSRD Spells compendium
//2. change the ItemMacro, to get the item to roll from the MidiSRD do not use compendium to make it so the extra damage roll hits the original attacker.

//could try to expose the MidiQOL function that get the item roll and shows the card from the DamageONlyworkflow
import * as MidiSRDHelpers from '../../helpers/midi-srd-helpers.mjs'
export async function fireShield(args) {
    const { actor, token, lArgs } = MidiSRDHelpers._targets(args) ?? {};
    if(!actor || !token || !lArgs) return ui.notifications.error("Something is wrong in the macro of the Item rolled; Notify GM");
    if (args[0].tag === "OnUse") {
        new Dialog({
            title: "Warm or Cold Shield",
            buttons: {
                one: {
                    label: "Warm",
                    callback: async () => {
                        await ChatMessage.create({ content: `${actor.name} gains resistnace to cold` });
                        await actor.createEmbeddedDocuments("ActiveEffect", [{
                            "changes": [
                                {
                                    "key": "system.traits.dr.value",
                                    "value": "cold",
                                    "mode": 2,
                                },
                                {
                                    "key": "flags.midi-qol.onUseMacroName",
                                    "value": "ItemMacro.Compendium.dnd5e.spells.avD5XUtkBPQQR97c,isDamaged",
                                    "mode": 0,
                                }
                            ],
                            "duration": {
                                "startTime": game.time.worldTime,
                                "seconds": 600,
                                "startRound": game.combat?.round,
                                "startTurn": game.combat?.turn
                            },
                            "icon": "icons/magic/defensive/shield-barrier-flaming-pentagon-red.webp",
                            "label": "Warm Shield",
                            "origin": args[0].item.uuid,
                            "flags": {
                                "times-up": {
                                    "isPassive": true
                                }
                            }
                        }])
                    }
                },
                two: {
                    label: "Cold",
                    callback: async () => {
                        await ChatMessage.create({ content: `${actor.name} gains resistance to fire` });
                        await actor.createEmbeddedDocuments("ActiveEffect", [{
                            "changes": [
                                {
                                    "key": "system.traits.dr.value",
                                    "value": "fire",
                                    "mode": 2,
                                },{
                                    "key": "flags.midi-qol.onUseMacroName",
                                    "value": "ItemMacro.Compendium.dnd5e.spells.avD5XUtkBPQQR97c,isDamaged",
                                    "mode": 0,
                                }
                            ],
                            "duration": {
                                "startTime": game.time.worldTime,
                                "seconds": 600,
                                "startRound": game.combat?.round,
                                "startTurn": game.combat?.turn
                            },
                            "icon": "icons/magic/defensive/shield-barrier-flaming-pentagon-blue.webp",
                            "label": "Chill Shield",
                            "origin": args[0].item.uuid,
                            "flags": {
                                "times-up": {
                                    "isPassive": true
                                }
                            }
                        }])
                    }
                },
            }
        }).render(true);
    }
}